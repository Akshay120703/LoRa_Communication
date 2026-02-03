// simulationEngine.js
// Very lightweight, browser-only time stepping for packet transmissions.
// Attached to window.LoRaSim (so it works under file:// without ES module imports).

(function () {
  window.LoRaSim = window.LoRaSim || {};

  const { Packet, linkSuccessProbability } = window.LoRaSim.networkModel;
  const { findPathToGateway, starPathToGateway } = window.LoRaSim.meshLogic;

  class SimulationEngine {
    constructor(state) {
      this.state = state;
      this.timeMs = 0;
      this.events = []; // { at, type, data }
      // Optional callback to let the UI animate packets.
      // onPacketResult({ packet, success, latency, hops, path, links })
      this.onPacketResult = null;
    }

    schedule(atMs, type, data) {
      this.events.push({ at: atMs, type, data });
      this.events.sort((a, b) => a.at - b.at);
    }

  // Called regularly from requestAnimationFrame or setInterval.
    step(deltaMs) {
      this.timeMs += deltaMs;
      while (this.events.length && this.events[0].at <= this.timeMs) {
        const ev = this.events.shift();
        this.handleEvent(ev);
      }
    }

    handleEvent(ev) {
      if (ev.type === "sendPacket") {
        this.sendPacket(ev.data.fromNode);
      }
    }

    sendPacket(fromNode) {
      const packetId = this.state.nextPacketId++;
      const packet = new Packet({
        id: packetId,
        from: fromNode,
        to: null,
        createdAt: this.timeMs,
        hops: []
      });

      const pathInfo =
        this.state.params.topology === "mesh"
          ? findPathToGateway(this.state, fromNode)
          : starPathToGateway(this.state, fromNode);

      const { path, links } = pathInfo;
      if (links.length === 0) {
        // Cannot reach gateway.
        this.state.stats.packetsSent += 1;
        return;
      }

      this.state.stats.packetsSent += 1;

      let success = true;
      let hops = 0;

      for (const link of links) {
        hops++;
        const p = linkSuccessProbability(link);
        if (Math.random() > p) {
          success = false;
          link.lastFailureAt = this.timeMs;
          break;
        }
      }

      const airtimeMs = hops * this.state.params.symbolDurationMs * 4; // 4 symbols per hop (simple)
      const latency = airtimeMs;

      if (success) {
        this.state.stats.packetsDelivered += 1;
        this.state.stats.totalHops += hops;
        this.state.stats.totalLatency += latency;
      }

      packet.hops = path;
      const result = { packet, success, latency, hops, path, links };

      if (typeof this.onPacketResult === "function") {
        try {
          this.onPacketResult(result);
        } catch (_) {
          // UI errors should not break the simulation loop.
        }
      }

      return result;
    }
  }

  window.LoRaSim.simulationEngine = { SimulationEngine };
})();
