// main-simulator.js
// Slider-based conceptual network simulator: no RF formulas, just
// simple relationships between inputs and outcomes.
// Uses window.LoRaSim "modules" so the site works under file://.

(function () {
  const { wireSliderValueText } = window.LoRaSim.uiControls;
  const { drawBarChart } = window.LoRaSim.chartUtils;

  const sfSlider = document.getElementById("simSfSlider");
  const bwSlider = document.getElementById("simBwSlider");
  const intervalSlider = document.getElementById("simIntervalSlider");
  const noiseSlider = document.getElementById("simNoiseSlider");
  const nodesSlider = document.getElementById("simNodesSlider");
  const meshDepthSlider = document.getElementById("simMeshDepthSlider");

  const outSuccessRate = document.getElementById("outSuccessRate");
  const outLatency = document.getElementById("outLatency");
  const outThroughput = document.getElementById("outThroughput");
  const outEnergy = document.getElementById("outEnergy");
  const explanationEl = document.getElementById("simExplanation");

  const tradeoffCanvas = document.getElementById("simTradeoffChart");
  if (!tradeoffCanvas) return;
  tradeoffCanvas.width = 900;
  tradeoffCanvas.height = 320;
  const tradeoffCtx = tradeoffCanvas.getContext("2d");
  if (!tradeoffCtx) return;

  wireSliderValueText();

  function computeOutcomes() {
  const sf = Number(sfSlider.value);
  const bw = Number(bwSlider.value); // 1 (narrow) .. 5 (wide)
  const interval = Number(intervalSlider.value); // seconds
  const noise = Number(noiseSlider.value) / 100; // 0..1
  const nodes = Number(nodesSlider.value);
  const depth = Number(meshDepthSlider.value);

  // Base "signal strength" idea: higher SF and lower noise help, but more nodes
  // and more hops make life harder.
  const rangeBoost = (sf - 7) * 0.12; // each SF step adds reach
  const bwPenalty = (bw - 3) * 0.06; // very wide BW is faster but less robust
  const noisePenalty = noise * 0.7;
  const crowdingPenalty = Math.max(0, (nodes - 50) / 150);
  const depthBoost = (depth - 1) * 0.05; // mesh gives more paths
  const depthPenalty = (depth - 1) * 0.03; // but also more hops -> more chances to fail

  let success = 0.85 + rangeBoost - bwPenalty - noisePenalty - crowdingPenalty + depthBoost - depthPenalty;
  success = clamp(success, 0.1, 0.99);

  // Latency: slower SF, more hops, and busy networks increase delay.
  const baseSymbolMs = 40 + (sf - 7) * 25 - (bw - 3) * 8; // wider BW shrinks symbols a bit
  const hops = 1 + depth * 0.7;
  let latencyMs = baseSymbolMs * hops * (1 + noise * 1.2) * (1 + nodes / 200);
  latencyMs = clamp(latencyMs, 50, 5000);

  // Throughput: how many useful bits per second get through on average.
  const perNodeRate = (16 / interval) * (1 + (bw - 3) * 0.3); // bytes/s approximate
  let throughputKbps = (perNodeRate * nodes * success * 8) / 1000;
  throughputKbps = clamp(throughputKbps, 0.01, 50);

  // Energy: relative cost per delivered packet. Slow SF and high depth mean more airtime.
  const airtimeFactor = (baseSymbolMs / 40) * hops;
  const retriesFactor = 1 / success;
  let energyCost = airtimeFactor * retriesFactor;
  energyCost = clamp(energyCost, 0.5, 20);

  return { success, latencyMs, throughputKbps, energyCost };
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function updateUI(changedId) {
  const { success, latencyMs, throughputKbps, energyCost } = computeOutcomes();

  outSuccessRate.textContent = `${(success * 100).toFixed(0)}%`;
  outLatency.textContent = `${latencyMs.toFixed(0)} ms`;
  outThroughput.textContent = `${throughputKbps.toFixed(2)} kbps`;
  outEnergy.textContent = `x ${energyCost.toFixed(1)}`;

  drawBarChart(
    tradeoffCtx,
    ["Success", "Latency", "Throughput", "Energy"],
    [
      success * 100,
      // lower latency is better; invert and scale
      100 - Math.min(100, (latencyMs / 2000) * 100),
      (throughputKbps / 50) * 100,
      // energy: lower is better; invert
      100 - Math.min(100, (energyCost / 20) * 100)
    ],
    {
      maxY: 100,
      colors: ["#22c55e", "#38bdf8", "#eab308", "#f97373"]
    }
  );

  updateExplanationText(changedId, { success, latencyMs, throughputKbps, energyCost });
  }

  function updateExplanationText(changedId, metrics) {
  const sf = Number(sfSlider.value);
  const bw = Number(bwSlider.value);
  const interval = Number(intervalSlider.value);
  const noise = Number(noiseSlider.value) / 100;
  const nodes = Number(nodesSlider.value);
  const depth = Number(meshDepthSlider.value);

  let text = "";

  switch (changedId) {
    case "simSfSlider":
      text = `You set SF to ${sf}. Speaking "slower" makes each symbol longer, so latency grew, \
but the radio can hear weaker signals, so packet success improved. This is why long‑range LoRa links \
feel slow but reliable.`;
      break;
    case "simBwSlider":
      text = `Bandwidth is now at level ${bw}. A wider pipe lets you send bits faster (higher throughput), \
but each bit is a little harder to hear in noise, so reliability can drop slightly. Narrow pipes are slower \
but more robust.`;
      break;
    case "simIntervalSlider":
      text = `Sensors now send a packet every ${interval} seconds. Slower intervals mean fewer packets on air, \
so collisions are rarer and energy per hour drops, but the data feels less "live". Fast intervals feel snappier \
but crowd the network.`;
      break;
    case "simNoiseSlider":
      text = `Noise level is ${Math.round(noise * 100)}%. More noise is like turning up static on a radio: \
packet success falls and latency rises because more retries are needed. LoRa combats this with higher SF, \
but that trades away speed.`;
      break;
    case "simNodesSlider":
      text = `There are now ${nodes} nodes. More nodes share the same air time, so even with small packets \
the network can feel busier. Success rate falls a bit and latency rises as nodes politely take turns.`;
      break;
    case "simMeshDepthSlider":
      text = `Mesh depth is ${depth} hops. More hops mean farther reach and more alternate paths, \
so success can improve in tricky spots—but each hop adds delay, and every relay must also spend energy \
forwarding your packet.`;
      break;
    default:
      text = `These numbers are based on gentle rules, not RF equations. Try moving one slider at a time \
and watch how reliability, latency, throughput and energy pull against each other—this is the heart of \
LoRa-style design.`;
  }

  explanationEl.textContent = text;
  }

  [
    sfSlider,
    bwSlider,
    intervalSlider,
    noiseSlider,
    nodesSlider,
    meshDepthSlider
  ].forEach((slider) => {
    slider.addEventListener("input", () => updateUI(slider.id));
  });

  // Initial render
  updateUI(null);
})();

