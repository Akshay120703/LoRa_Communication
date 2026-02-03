// networkModel.js
// Basic conceptual model of a LoRa-style network.
// No RF math – just simple relationships that are easy to read and tweak.
//
// IMPORTANT: This project must work as a static site even when opened via file://
// (double-clicking index.html). ES module imports are often blocked in that mode.
// So we attach our "modules" to a single global namespace: window.LoRaSim.

(function () {
  window.LoRaSim = window.LoRaSim || {};

  class Node {
    constructor(id, x, y, type = "end-device") {
      this.id = id;
      this.x = x;
      this.y = y;
      this.type = type; // "end-device" | "relay" | "gateway"
      this.battery = 1.0; // relative 0..1
    }
  }

  class Link {
    constructor(a, b, quality) {
      // a and b are Node instances
      this.a = a;
      this.b = b;
      this.quality = quality; // 0..1, derived from distance / SF / noise
      this.lastFailureAt = -Infinity;
    }
  }

  class Packet {
    constructor({ id, from, to, createdAt, hops = [] }) {
      this.id = id;
      this.from = from;
      this.to = to;
      this.createdAt = createdAt;
      this.hops = hops;
    }
  }

  class NetworkState {
    constructor() {
      this.nodes = [];
      this.links = [];
      this.nextPacketId = 1;
      this.stats = {
        packetsSent: 0,
        packetsDelivered: 0,
        totalHops: 0,
        totalLatency: 0
      };
      // Global parameters used in the simple formulas
      this.params = {
        sf: 9,
        symbolDurationMs: 80,
        noise: 0.25,
        topology: "mesh" // or "star"
      };
    }

    resetStats() {
      this.stats = {
        packetsSent: 0,
        packetsDelivered: 0,
        totalHops: 0,
        totalLatency: 0
      };
    }
  }

  // Helper to build a random-ish network in a square area.
  function createRandomNetwork({ numNodes, width, height }) {
    const state = new NetworkState();

    // Gateway sits near the center top.
    const gw = new Node("GW", width / 2, height * 0.15, "gateway");
    state.nodes.push(gw);

    for (let i = 0; i < numNodes; i++) {
      const angle = (i / Math.max(1, numNodes)) * Math.PI * 2;
      const radius =
        Math.min(width, height) * 0.35 + (Math.random() - 0.5) * 40;
      const x = width / 2 + radius * Math.cos(angle);
      const y = height / 2 + radius * Math.sin(angle);
      const type = i % 4 === 0 ? "relay" : "end-device";
      state.nodes.push(new Node(`N${i + 1}`, x, y, type));
    }

    return state;
  }

  // Very simple link quality model:
  // - Closer nodes have higher quality.
  // - Higher SF improves quality.
  // - More noise reduces quality.
  function recomputeLinks(state) {
    const nodes = state.nodes;
    const links = [];
    const maxDist = 320; // "radio" range in canvas units

    const sfFactor = (state.params.sf - 6) / 6; // SF7..12 -> about 0.16..1.0
    const noiseFactor = 1 - state.params.noise; // 1 at no noise, 0 at lots of noise

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > maxDist) continue;

        const distFactor = 1 - d / maxDist; // 1 close, 0 at range edge
        let quality = distFactor * 0.6 + sfFactor * 0.3 + noiseFactor * 0.1;
        quality = Math.max(0, Math.min(1, quality));
        links.push(new Link(a, b, quality));
      }
    }

    state.links = links;
  }

  // Probability a packet makes it across a link, based on its quality value.
  function linkSuccessProbability(link) {
    // Simple nonlinear curve: low quality drops sharply.
    const q = link.quality;
    return q * q;
  }

  window.LoRaSim.networkModel = {
    Node,
    Link,
    Packet,
    NetworkState,
    createRandomNetwork,
    recomputeLinks,
    linkSuccessProbability
  };
})();

