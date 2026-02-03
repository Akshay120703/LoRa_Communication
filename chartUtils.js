// chartUtils.js
// Tiny, transparent helpers to draw simple charts using plain canvas 2D.
// These are intentionally minimal so the logic is easy to read and explain.
// Attached to window.LoRaSim (so it works under file:// without ES module imports).

(function () {
  window.LoRaSim = window.LoRaSim || {};

  function drawLineChart(ctx, dataSeries, options = {}) {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);

  const padding = 24;
  const plotW = width - padding * 2;
  const plotH = height - padding * 2;

  if (!dataSeries.length || dataSeries.every((v) => v == null)) return;

  const xs = dataSeries.map((_, i) => i);
  const ys = dataSeries.map((v) => (v == null ? 0 : v));

  const minY = options.minY !== undefined ? options.minY : Math.min(...ys, 0);
  const maxY = options.maxY !== undefined ? options.maxY : Math.max(...ys, 1);
  const rangeY = maxY - minY || 1;

  // Axes
  ctx.strokeStyle = "rgba(148,163,184,0.7)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.stroke();

  // Line
  ctx.beginPath();
  dataSeries.forEach((v, i) => {
    const x = padding + (xs[i] / Math.max(1, xs.length - 1)) * plotW;
    const yNorm = (v == null ? 0 : v - minY) / rangeY;
    const y = height - padding - yNorm * plotH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = options.color || "#38bdf8";
  ctx.lineWidth = 2;
  ctx.stroke();
  }

  function drawBarChart(ctx, labels, values, options = {}) {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);

  const padding = 28;
  const plotW = width - padding * 2;
  const plotH = height - padding * 2;

  if (!values.length) return;

  const maxY = options.maxY !== undefined ? options.maxY : Math.max(...values, 1);
  const rangeY = maxY || 1;

  // Axis
  ctx.strokeStyle = "rgba(148,163,184,0.7)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();

  const barCount = values.length;
  const gap = 8;
  const barWidth = (plotW - gap * (barCount - 1)) / barCount;

  values.forEach((v, i) => {
    const x = padding + i * (barWidth + gap);
    const hNorm = v / rangeY;
    const h = hNorm * plotH;
    const y = height - padding - h;

    const color = (options.colors && options.colors[i]) || "#38bdf8";
    ctx.fillStyle = color;
    ctx.fillRect(x, y, barWidth, h);

    ctx.fillStyle = "rgba(209,213,219,0.9)";
    ctx.font = "10px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(
      labels[i],
      x + barWidth / 2,
      height - padding + 14
    );
  });
  }

  window.LoRaSim.chartUtils = {
    drawLineChart,
    drawBarChart
  };
})();
