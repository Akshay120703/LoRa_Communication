// visualization.js
// Canvas rendering helpers for the mesh network.
// The "packets" array can be used to draw animated packet dots.
// Attached to window.LoRaSim (so it works under file:// without ES module imports).

(function () {
  window.LoRaSim = window.LoRaSim || {};

  function drawNetwork(ctx, state, { nowMs, packets = [] }) {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);

  ctx.save();
  ctx.translate(0.5, 0.5);

  drawLinks(ctx, state, nowMs);
  drawNodes(ctx, state);
  drawPackets(ctx, packets, nowMs);

  ctx.restore();
  }

function drawLinks(ctx, state, nowMs) {
  for (const link of state.links) {
    let color = "rgba(34,197,94,0.4)"; // strong
    if (link.quality < 0.35) color = "rgba(250,204,21,0.55)";

    // Briefly tint red on recent failure.
    if (nowMs - link.lastFailureAt < 1500) {
      const t = 1 - (nowMs - link.lastFailureAt) / 1500;
      const alpha = 0.3 + 0.7 * t;
      color = `rgba(248,113,113,${alpha.toFixed(2)})`;
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(link.a.x, link.a.y);
    ctx.lineTo(link.b.x, link.b.y);
    ctx.stroke();
  }
}

function drawNodes(ctx, state) {
  for (const node of state.nodes) {
    let radius = 7;
    let fill = "#38bdf8"; // end device
    if (node.type === "relay") {
      fill = "#a855f7";
      radius = 8;
    } else if (node.type === "gateway") {
      fill = "#22c55e";
      radius = 10;
    }

    ctx.beginPath();
    ctx.fillStyle = fill;
    ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "10px system-ui";
    ctx.fillStyle = "rgba(229,231,235,0.85)";
    ctx.textAlign = "center";
    ctx.fillText(node.id, node.x, node.y - radius - 2);
  }
}

// Draw small moving dots that represent packets travelling along paths.
// Each packet entry: { path: [nodes], createdAt, durationMs, success }
function drawPackets(ctx, packets, nowMs) {
  for (const p of packets) {
    const elapsed = nowMs - p.createdAt;
    if (elapsed < 0 || p.durationMs <= 0) continue;

    const t = Math.min(1, elapsed / p.durationMs);
    const hops = Math.max(1, p.path.length - 1);
    const totalSegments = hops;
    const segFloat = t * totalSegments;
    const segIndex = Math.min(totalSegments - 1, Math.floor(segFloat));
    const segT = segFloat - segIndex;

    const from = p.path[segIndex];
    const to = p.path[segIndex + 1] ? p.path[segIndex + 1] : from;
    const x = from.x + (to.x - from.x) * segT;
    const y = from.y + (to.y - from.y) * segT;

    ctx.beginPath();
    ctx.fillStyle = p.success ? "#facc15" : "#f97373";
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

  window.LoRaSim.visualization = { drawNetwork };
})();