// main-home.js
// Bootstraps the mesh architecture view.
// Uses window.LoRaSim "modules" so the site works under file://.

(function () {
  if (!window.LoRaSim) {
    console.error("LoRaSim namespace missing: scripts may not have loaded in order.");
    return;
  }
  const { createRandomNetwork, recomputeLinks } = window.LoRaSim.networkModel;
  const { SimulationEngine } = window.LoRaSim.simulationEngine;
  const { wireSliderValueText, wireInfoPanels } = window.LoRaSim.uiControls;
  const { drawNetwork } = window.LoRaSim.visualization;

  const canvas = document.getElementById("networkCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const state = createRandomNetwork({
    numNodes: 12,
    width: canvas.width,
    height: canvas.height
  });

  const engine = new SimulationEngine(state);
  const activePackets = [];

  const numNodesSlider = document.getElementById("numNodesSlider");
  const sfSlider = document.getElementById("sfSlider");
  const symbolDurationSlider = document.getElementById("symbolDurationSlider");
  const noiseSlider = document.getElementById("noiseSlider");
  const topologySelect = document.getElementById("topologySelect");

  const addNodeBtn = document.getElementById("addNodeBtn");
  const removeNodeBtn = document.getElementById("removeNodeBtn");
  const resetNetworkBtn = document.getElementById("resetNetworkBtn");

  const statPacketsSent = document.getElementById("statPacketsSent");
  const statPacketsDelivered = document.getElementById("statPacketsDelivered");
  const statAvgHops = document.getElementById("statAvgHops");
  const statAvgLatency = document.getElementById("statAvgLatency");

  const requiredEls = [
    numNodesSlider,
    sfSlider,
    symbolDurationSlider,
    noiseSlider,
    topologySelect,
    addNodeBtn,
    removeNodeBtn,
    resetNetworkBtn,
    statPacketsSent,
    statPacketsDelivered,
    statAvgHops,
    statAvgLatency
  ];
  if (requiredEls.some((el) => !el)) {
    console.error("Home UI missing required elements; check index.html IDs.");
    return;
  }

  wireSliderValueText();
  wireInfoPanels();

  function applyParamsFromUI() {
    state.params.sf = Number(sfSlider.value);
    state.params.symbolDurationMs = Number(symbolDurationSlider.value);
    state.params.noise = Number(noiseSlider.value) / 100;
    state.params.topology = topologySelect.value;
    recomputeLinks(state);
  }

  applyParamsFromUI();

// Create / destroy nodes while keeping gateway in place.
  let nextNodeNum =
    Math.max(
      1,
      ...state.nodes
        .filter((n) => n.type !== "gateway")
        .map((n) => Number(String(n.id).replace(/[^\d]/g, "")) || 0)
    ) + 1;

  function syncNodeCount(targetCount) {
  const canvasW = canvas.width;
  const canvasH = canvas.height;
  const gateway = state.nodes.find((n) => n.type === "gateway");
  const others = state.nodes.filter((n) => n.type !== "gateway");

  const current = others.length;
  // Slider reflects "end devices + relays" (gateway is extra).
  const needed = Math.max(1, targetCount);

  if (needed > current) {
    for (let i = current; i < needed; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.min(canvasW, canvasH) * (0.25 + Math.random() * 0.3);
      const x = canvasW / 2 + radius * Math.cos(angle);
      const y = canvasH / 2 + radius * Math.sin(angle);
      const type = Math.random() < 0.25 ? "relay" : "end-device";
      const id = `N${nextNodeNum++}`;
      state.nodes.push({
        id,
        x,
        y,
        type,
        battery: 1.0
      });
    }
  } else if (needed < current) {
    const toKeep = others.slice(0, needed);
    state.nodes = [gateway, ...toKeep];
  }

    recomputeLinks(state);
  }

  numNodesSlider.addEventListener("input", () => {
    syncNodeCount(Number(numNodesSlider.value));
  });

  sfSlider.addEventListener("input", applyParamsFromUI);
  symbolDurationSlider.addEventListener("input", applyParamsFromUI);
  noiseSlider.addEventListener("input", applyParamsFromUI);
  topologySelect.addEventListener("change", applyParamsFromUI);

  addNodeBtn.addEventListener("click", () => {
    numNodesSlider.value = Number(numNodesSlider.value) + 1;
    numNodesSlider.dispatchEvent(new Event("input"));
  });

  removeNodeBtn.addEventListener("click", () => {
    numNodesSlider.value = Math.max(1, Number(numNodesSlider.value) - 1);
    numNodesSlider.dispatchEvent(new Event("input"));
  });

  resetNetworkBtn.addEventListener("click", () => {
  const count = Number(numNodesSlider.value);
  const fresh = createRandomNetwork({
    numNodes: count,
    width: canvas.width,
    height: canvas.height
  });
  // Copy into existing state object so references stay valid.
  state.nodes = fresh.nodes;
  state.links = fresh.links;
  state.resetStats();
  applyParamsFromUI();
  });

// Capture packet results so we can animate them on the canvas.
  engine.onPacketResult = ({ success, latency, hops, path }) => {
  const totalDuration =
    typeof latency === "number" && latency > 0
      ? latency
      : Math.max(1, hops) * state.params.symbolDurationMs * 4;

  activePackets.push({
    path,
    createdAt: engine.timeMs,
    durationMs: totalDuration,
    success
  });
  };

// Periodically schedule packets from random end devices.
  function scheduleRandomTraffic() {
  const endDevices = state.nodes.filter((n) => n.type !== "gateway");
  if (!endDevices.length) return;
  const node = endDevices[Math.floor(Math.random() * endDevices.length)];

  engine.schedule(engine.timeMs + 200 + Math.random() * 800, "sendPacket", {
    fromNode: node
  });
  }

  let lastTimestamp = performance.now();

  function loop(now) {
  const delta = now - lastTimestamp;
  lastTimestamp = now;

  engine.step(delta);

  // Occasionally schedule new traffic
  if (Math.random() < 0.06) {
    scheduleRandomTraffic();
  }

  // Drop packets that finished their journey a while ago.
  const lifetime = 1.5; // seconds after arrival
  for (let i = activePackets.length - 1; i >= 0; i--) {
    const p = activePackets[i];
    const age = (engine.timeMs - p.createdAt - p.durationMs) / 1000;
    if (age > lifetime) {
      activePackets.splice(i, 1);
    }
  }

  drawNetwork(ctx, state, { nowMs: engine.timeMs, packets: activePackets });
  updateStatsUI();

    requestAnimationFrame(loop);
  }

  function updateStatsUI() {
  const s = state.stats;
  statPacketsSent.textContent = s.packetsSent;
  statPacketsDelivered.textContent = s.packetsDelivered;

  const delivered = s.packetsDelivered || 1;
  const avgHops = s.totalHops / delivered;
  const avgLatency = s.totalLatency / delivered;

  statAvgHops.textContent = avgHops.toFixed(1);
  statAvgLatency.textContent = isFinite(avgLatency) ? avgLatency.toFixed(0) : "0";
  }

  requestAnimationFrame(loop);
})();

