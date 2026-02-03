// main-dashboard.js
// Simulated IoT dashboard: sensors send values with latency & packet loss
// based on simple LoRa-style rules (symbol duration, hops, noise).
// Uses window.LoRaSim "modules" so the site works under file://.

(function () {
  const { wireSliderValueText } = window.LoRaSim.uiControls;
  const { drawLineChart, drawBarChart } = window.LoRaSim.chartUtils;

  const sensorListEl = document.getElementById("sensorList");
  const addSensorBtn = document.getElementById("addSensorBtn");
  if (!sensorListEl || !addSensorBtn) return;

  const symbolDurationSlider = document.getElementById("dashSymbolDurationSlider");
  const noiseSlider = document.getElementById("dashNoiseSlider");
  const meshDepthSlider = document.getElementById("dashMeshDepthSlider");

  const sensorChartCanvas = document.getElementById("sensorChart");
  const packetLossCanvas = document.getElementById("packetLossChart");
  const latencyCanvas = document.getElementById("latencyChart");
  if (!sensorChartCanvas || !packetLossCanvas || !latencyCanvas) return;

  // Give canvases real pixel sizes so drawings look crisp.
  // CSS controls how big they look on screen.
  console.log('Initializing dashboard canvases...');
  
  sensorChartCanvas.width = 900;
  sensorChartCanvas.height = 320;
  packetLossCanvas.width = 420;
  packetLossCanvas.height = 220;
  latencyCanvas.width = 420;
  latencyCanvas.height = 220;
  
  console.log('Canvas sizes set:', {
    sensorChart: [sensorChartCanvas.width, sensorChartCanvas.height],
    packetLoss: [packetLossCanvas.width, packetLossCanvas.height],
    latency: [latencyCanvas.width, latencyCanvas.height]
  });

  const sensorChartCtx = sensorChartCanvas.getContext("2d");
  const packetLossCtx = packetLossCanvas.getContext("2d");
  const latencyCtx = latencyCanvas.getContext("2d");
  
  if (!sensorChartCtx || !packetLossCtx || !latencyCtx) {
    console.error('Failed to get canvas contexts!');
    return;
  }
  
  console.log('Canvas contexts initialized successfully');

  wireSliderValueText();

  let sensors = [];
  let nextSensorId = 1;
  let timeSeconds = 0;

  function createSensor() {
  const id = nextSensorId++;
  const interval = 5 + Math.floor(Math.random() * 20); // seconds
  const payload = 8 + Math.floor(Math.random() * 24); // bytes

  const sensor = {
    id,
    name: `Sensor ${id}`,
    interval,
    payload,
    reliabilityScore: 1,
    lastSentAt: 0,
    values: [], // recent sensor values
    lossHistory: [], // rolling packet loss ratio
    latencySamples: [] // recent latencies
  };

  const seedCount = 12;
  for (let i = 0; i < seedCount; i++) {
    const t = i;
    const base = 20 + 5 * Math.sin(t / 15 + id);
    const lost = Math.random() < 0.15;
    if (lost) {
      sensor.values.push(null);
    } else {
      const v = base + (Math.random() - 0.5) * 2;
      sensor.values.push(v);
      const latencyMs = (1 + Math.floor(Math.random() * 3)) * (80 + Math.random() * 60);
      sensor.latencySamples.push(latencyMs);
    }
    const total = sensor.values.length || 1;
    const lostCount = sensor.values.filter((v) => v == null).length;
    sensor.lossHistory.push(lostCount / total);
  }
  sensor.reliabilityScore = 1 - (sensor.values.filter((v) => v == null).length / sensor.values.length);

  return sensor;
  }

  function addSensor() {
  sensors.push(createSensor());
  renderSensorList();
  }

  function renderSensorList() {
  sensorListEl.innerHTML = "";
  sensors.forEach((s) => {
    const li = document.createElement("li");
    const latest = s.values.length ? s.values[s.values.length - 1] : "–";

    li.innerHTML = `
      <div><strong>${s.name}</strong> — latest value: ${typeof latest === "number" ? latest.toFixed(1) : latest}</div>
      <div class="sensor-meta">
        <span>Every ${s.interval}s • ${s.payload} bytes</span>
        <span>Reliability: ${(s.reliabilityScore * 100).toFixed(0)}%</span>
      </div>
    `;
    sensorListEl.appendChild(li);
  });
  }

  addSensorBtn.addEventListener("click", () => {
    addSensor();
  });

  // Seed a few sensors.
  for (let i = 0; i < 4; i++) addSensor();

  function simulateTick(deltaSec) {
  timeSeconds += deltaSec;

  const symbolMs = Number(symbolDurationSlider.value);
  const noise = Number(noiseSlider.value) / 100;
  const maxHops = Number(meshDepthSlider.value);

  sensors.forEach((s) => {
    if (timeSeconds - s.lastSentAt >= s.interval) {
      s.lastSentAt = timeSeconds;

      // Generate a "physical" value – simple wavy signal + random noise.
      const base = 20 + 5 * Math.sin(timeSeconds / 15 + s.id);
      const value = base + (Math.random() - 0.5) * 2;

      // Simple model: more hops and more noise make success less likely.
      const hops = 1 + Math.floor(Math.random() * maxHops);
      const baseSuccess = 0.95 - 0.08 * (hops - 1) - 0.4 * noise;
      const successProb = clamp(baseSuccess, 0.05, 0.99);

      const success = Math.random() < successProb;
      const latencyMs = hops * symbolMs * (3 + noise * 4); // more noise → extra retries

      if (success) {
        s.values.push(value);
        s.latencySamples.push(latencyMs);
      } else {
        s.values.push(null); // null means missed reading
      }

      if (s.values.length > 60) s.values.shift();
      if (s.latencySamples.length > 100) s.latencySamples.shift();

      const lostCount = s.values.filter((v) => v == null).length;
      const total = s.values.length || 1;
      const lossRatio = lostCount / total;
      s.reliabilityScore = 1 - lossRatio;
      s.lossHistory.push(lossRatio);
      if (s.lossHistory.length > 60) s.lossHistory.shift();
    }
  });
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function renderCharts() {
    console.log('Rendering charts with', sensors.length, 'sensors');
    
    // Main sensor values: show latest sensor's history
    const active = sensors[0];
    if (active) {
      const values = active.values.map((v) => (v == null ? null : v));
      const cleaned = values.map((v) => (v == null ? (values.length ? values[0] : 0) : v));
      const min = Math.min(...cleaned);
      const max = Math.max(...cleaned);
      
      try {
        drawLineChart(sensorChartCtx, values, { minY: min - 2, maxY: max + 2 });
        console.log('Sensor chart rendered successfully');
      } catch (error) {
        console.error('Error rendering sensor chart:', error);
      }
    } else {
      sensorChartCtx.clearRect(0, 0, sensorChartCanvas.width, sensorChartCanvas.height);
      console.log('No active sensors, cleared sensor chart');
    }

    // Packet loss over time: average across sensors
    const combinedLoss = [];
    const maxLen = Math.max(...sensors.map((s) => s.lossHistory.length), 0);
    for (let i = 0; i < maxLen; i++) {
      let sum = 0;
      let count = 0;
      sensors.forEach((s) => {
        if (i < s.lossHistory.length) {
          sum += s.lossHistory[i];
          count++;
        }
      });
      combinedLoss.push(count ? sum / count : 0);
    }
    
    try {
      drawLineChart(
        packetLossCtx,
        combinedLoss.map((r) => r * 100),
        { minY: 0, maxY: 100, color: "#f97373" }
      );
      console.log('Packet loss chart rendered successfully');
    } catch (error) {
      console.error('Error rendering packet loss chart:', error);
    }

    // Latency distribution: simple 4 buckets
    const buckets = [0, 0, 0, 0];
    let totalSamples = 0;
    sensors.forEach((s) => {
      s.latencySamples.forEach((ms) => {
        totalSamples++;
        if (ms < 200) buckets[0] += 1;
        else if (ms < 400) buckets[1] += 1;
        else if (ms < 800) buckets[2] += 1;
        else buckets[3] += 1;
      });
    });
    const bucketValues = buckets.map((b) => (totalSamples ? (b / totalSamples) * 100 : 0));
    
    try {
      drawBarChart(
        latencyCtx,
        ["<200", "200-400", "400-800", ">800"],
        bucketValues,
        {
          maxY: 100,
          colors: ["#22c55e", "#eab308", "#fb923c", "#f97373"]
        }
      );
      console.log('Latency chart rendered successfully');
    } catch (error) {
      console.error('Error rendering latency chart:', error);
    }
  }

  let lastFrameTime = performance.now();
  function loop(now) {
  const deltaMs = now - lastFrameTime;
  lastFrameTime = now;

  simulateTick(deltaMs / 1000);
  renderSensorList();
  renderCharts();

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();

