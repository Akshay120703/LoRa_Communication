// meshLogic.js
// Simple routing and relaying rules for mesh vs star topologies.
// Attached to window.LoRaSim (so it works under file:// without ES module imports).

// Build adjacency from links, weighted by "cost" (here we just use 1 / quality).
function buildGraph(state) {
  const graph = new Map();
  state.nodes.forEach((n) => graph.set(n.id, []));

  for (const link of state.links) {
    const cost = 1 / Math.max(0.15, link.quality); // weaker links "cost" more
    graph.get(link.a.id).push({ to: link.b, cost, link });
    graph.get(link.b.id).push({ to: link.a, cost, link });
  }
  return graph;
}

function findGateway(state) {
  return state.nodes.find((n) => n.type === "gateway");
}

// Very small Dijkstra variant for path finding.
function findPathToGateway(state, fromNode) {
  const gw = findGateway(state);
  if (!gw || fromNode.id === gw.id) return { path: [fromNode], links: [] };

  const graph = buildGraph(state);
  const dist = new Map();
  const prev = new Map();

  state.nodes.forEach((n) => dist.set(n.id, Infinity));
  dist.set(fromNode.id, 0);

  const unvisited = new Set(state.nodes.map((n) => n.id));

  while (unvisited.size > 0) {
    let currentId = null;
    let best = Infinity;
    for (const id of unvisited) {
      const d = dist.get(id);
      if (d < best) {
        best = d;
        currentId = id;
      }
    }
    if (currentId == null || currentId === gw.id) break;
    unvisited.delete(currentId);

    const neighbors = graph.get(currentId) || [];
    for (const { to, cost } of neighbors) {
      if (!unvisited.has(to.id)) continue;
      const alt = dist.get(currentId) + cost;
      if (alt < dist.get(to.id)) {
        dist.set(to.id, alt);
        prev.set(to.id, currentId);
      }
    }
  }

  const pathNodes = [];
  let cur = gw.id;
  if (!isFinite(dist.get(gw.id))) {
    // unreachable – just stay at node
    return { path: [fromNode], links: [] };
  }

  while (cur != null) {
    const node = state.nodes.find((n) => n.id === cur);
    if (!node) break;
    pathNodes.unshift(node);
    cur = prev.get(cur);
  }

  // Ensure it starts at fromNode
  if (pathNodes[0].id !== fromNode.id) {
    pathNodes.unshift(fromNode);
  }

  const links = [];
  for (let i = 0; i < pathNodes.length - 1; i++) {
    const a = pathNodes[i];
    const b = pathNodes[i + 1];
    const link = state.links.find(
      (l) => (l.a.id === a.id && l.b.id === b.id) || (l.a.id === b.id && l.b.id === a.id)
    );
    if (link) links.push(link);
  }

  return { path: pathNodes, links };
}

// For star topology, every node must talk directly to gateway or fails.
function starPathToGateway(state, fromNode) {
  const gw = findGateway(state);
  if (!gw) return { path: [fromNode], links: [] };
  if (fromNode.id === gw.id) return { path: [gw], links: [] };

  const link = state.links.find(
    (l) =>
      (l.a.id === fromNode.id && l.b.id === gw.id) ||
      (l.b.id === fromNode.id && l.a.id === gw.id)
  );
  if (!link) {
    return { path: [fromNode], links: [] };
  }
  return { path: [fromNode, gw], links: [link] };
}

(function () {
  window.LoRaSim = window.LoRaSim || {};
  window.LoRaSim.meshLogic = {
    findPathToGateway,
    starPathToGateway
  };
})();
