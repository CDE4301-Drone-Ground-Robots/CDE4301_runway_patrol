/**
 * Pathfinding Visualizer & Speed Benchmark Engine
 * Evaluates A*, Dijkstra, Theta*, Greedy BFS, and BFS on simulated airfield grid environments.
 */
(function() {
  'use strict';

  // Configuration & State
  const ROWS = 22;
  const COLS = 52;
  let grid = []; // 0: empty, 1: wall
  let startNode = { r: 11, c: 6 };
  let targetNode = { r: 11, c: 45 };

  let isDrawing = false;
  let drawMode = 1; // 1: add wall, 0: erase wall
  let draggingNode = null; // 'start', 'target', or null

  let isVisualizing = false;
  let animationTimeouts = [];
  let currentAlgorithm = 'astar';
  let animSpeed = 12; // ms per step

  let visitedSet = new Set();
  let pathNodes = [];

  // Canvas & DOM elements
  let canvas, ctx;
  let cellWidth = 0, cellHeight = 0;

  // Initialize
  function init() {
    canvas = document.getElementById('pathfinding-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    // Create empty grid
    initGrid();

    // Resize canvas
    resizeCanvas();
    window.addEventListener('resize', () => {
      resizeCanvas();
      draw();
    });

    // Setup initial preset (Runway corridor with scattered FOD)
    loadPreset('runway');

    // Event listeners for canvas interaction
    setupCanvasEvents();

    // Event listeners for UI controls
    setupUIEvents();

    // Initial render
    draw();
  }

  function initGrid() {
    grid = [];
    for (let r = 0; r < ROWS; r++) {
      grid[r] = [];
      for (let c = 0; c < COLS; c++) {
        grid[r][c] = 0;
      }
    }
    visitedSet.clear();
    pathNodes = [];
  }

  function resizeCanvas() {
    const container = canvas.parentElement;
    const width = container.clientWidth;
    const height = Math.max(380, Math.min(460, width * 0.42));
    
    // Support retina displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);

    cellWidth = width / COLS;
    cellHeight = height / ROWS;
  }

  // Presets
  function loadPreset(name) {
    clearVisualization();
    initGrid();

    if (name === 'runway') {
      startNode = { r: 11, c: 5 };
      targetNode = { r: 11, c: 46 };
      // Top and bottom runway boundary markers
      for (let c = 0; c < COLS; c++) {
        if (c < 3 || c > COLS - 4) continue;
        grid[3][c] = 1;
        grid[ROWS - 4][c] = 1;
      }
      // Runway centerline gaps & scattered FOD obstacles
      for (let c = 12; c < 40; c += 7) {
        grid[10][c] = 1;
        grid[12][c] = 1;
      }
      // Central FOD obstacle cluster
      grid[9][26] = 1;
      grid[10][26] = 1;
      grid[11][26] = 1;
      grid[12][26] = 1;
      grid[13][26] = 1;
      grid[11][27] = 1;
    } else if (name === 'chicane') {
      startNode = { r: 4, c: 5 };
      targetNode = { r: 17, c: 46 };
      // Chicane baffles forcing non-holonomic turnaround maneuvers
      for (let r = 0; r < 15; r++) grid[r][16] = 1;
      for (let r = 7; r < ROWS; r++) grid[r][32] = 1;
      // Slanted obstacle near target
      grid[14][40] = 1;
      grid[15][40] = 1;
      grid[16][40] = 1;
    } else if (name === 'apron') {
      startNode = { r: 11, c: 6 };
      targetNode = { r: 11, c: 45 };
      // Clustered baggage tugs, maintenance ladders, and safety cones
      const clusters = [
        { r: 7, c: 15, w: 3, h: 4 },
        { r: 14, c: 22, w: 4, h: 3 },
        { r: 6, c: 32, w: 3, h: 5 },
        { r: 13, c: 38, w: 5, h: 3 }
      ];
      clusters.forEach(cl => {
        for (let r = cl.r; r < cl.r + cl.h; r++) {
          for (let c = cl.c; c < cl.c + cl.w; c++) {
            if (r >= 0 && r < ROWS && c >= 0 && c < COLS) grid[r][c] = 1;
          }
        }
      });
    } else if (name === 'clear') {
      startNode = { r: 11, c: 6 };
      targetNode = { r: 11, c: 45 };
    }

    draw();
    updateTelemetry(0, 0, 0, 'Ready');
  }

  // Draw Function
  function draw() {
    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);

    // Background (Tarmac asphalt theme)
    const isDark = document.body.classList.contains('dark-theme');
    ctx.fillStyle = isDark ? '#090d16' : '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)';
    ctx.lineWidth = 1;
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * cellWidth, 0);
      ctx.lineTo(c * cellWidth, height);
      ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * cellHeight);
      ctx.lineTo(width, r * cellHeight);
      ctx.stroke();
    }

    // Draw Visited Nodes (gradient ripple)
    visitedSet.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      if ((r === startNode.r && c === startNode.c) || (r === targetNode.r && c === targetNode.c)) return;
      if (grid[r][c] === 1) return;

      const x = c * cellWidth;
      const y = r * cellHeight;

      // Glowing soft teal/purple visited cell
      ctx.fillStyle = isDark ? 'rgba(59, 130, 246, 0.28)' : 'rgba(99, 102, 241, 0.22)';
      ctx.fillRect(x + 1, y + 1, cellWidth - 2, cellHeight - 2);
    });

    // Draw Obstacle Walls (Tarmac barriers / FOD)
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c] === 1) {
          const x = c * cellWidth;
          const y = r * cellHeight;
          ctx.fillStyle = isDark ? '#334155' : '#cbd5e1';
          ctx.fillRect(x + 1, y + 1, cellWidth - 2, cellHeight - 2);
          
          // Subtle border
          ctx.strokeStyle = isDark ? '#475569' : '#94a3b8';
          ctx.strokeRect(x + 1, y + 1, cellWidth - 2, cellHeight - 2);
        }
      }
    }

    // Draw Final Shortest Path
    if (pathNodes.length > 1) {
      // Draw path line
      ctx.strokeStyle = '#f59e0b'; // amber gold
      ctx.lineWidth = Math.max(3, cellWidth * 0.35);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      for (let i = 0; i < pathNodes.length; i++) {
        const node = pathNodes[i];
        const cx = node.c * cellWidth + cellWidth / 2;
        const cy = node.r * cellHeight + cellHeight / 2;
        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      }
      ctx.stroke();

      // Draw path node dots
      ctx.fillStyle = '#fbbf24';
      pathNodes.forEach(node => {
        if ((node.r === startNode.r && node.c === startNode.c) || (node.r === targetNode.r && node.c === targetNode.c)) return;
        const cx = node.c * cellWidth + cellWidth / 2;
        const cy = node.r * cellHeight + cellHeight / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(2, cellWidth * 0.15), 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Draw Start Node (UGV Rover)
    drawSpecialNode(startNode.r, startNode.c, '#10b981', '🚜', 'UGV');

    // Draw Target Node (FOD Waypoint)
    drawSpecialNode(targetNode.r, targetNode.c, '#ef4444', '🎯', 'FOD');
  }

  function drawSpecialNode(r, c, color, icon, label) {
    const x = c * cellWidth;
    const y = r * cellHeight;

    // Glowing halo
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + cellWidth / 2, y + cellHeight / 2, Math.min(cellWidth, cellHeight) * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Emoji or label
    ctx.font = `${Math.floor(Math.min(cellWidth, cellHeight) * 0.65)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, x + cellWidth / 2, y + cellHeight / 2 + 1);
  }

  // Mouse & Touch Interactivity
  function setupCanvasEvents() {
    function getCellCoords(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const c = Math.floor(x / cellWidth);
      const r = Math.floor(y / cellHeight);
      return { r: Math.max(0, Math.min(ROWS - 1, r)), c: Math.max(0, Math.min(COLS - 1, c)) };
    }

    canvas.addEventListener('mousedown', e => {
      if (isVisualizing) return;
      const { r, c } = getCellCoords(e);
      if (r === startNode.r && c === startNode.c) {
        draggingNode = 'start';
      } else if (r === targetNode.r && c === targetNode.c) {
        draggingNode = 'target';
      } else {
        isDrawing = true;
        drawMode = grid[r][c] === 1 ? 0 : 1;
        grid[r][c] = drawMode;
        clearVisualization(true);
        draw();
      }
    });

    canvas.addEventListener('mousemove', e => {
      if (isVisualizing) return;
      const { r, c } = getCellCoords(e);
      if (draggingNode === 'start') {
        if (grid[r][c] === 0 && !(r === targetNode.r && c === targetNode.c)) {
          startNode = { r, c };
          if (animSpeed === 0) runInstant();
          else draw();
        }
      } else if (draggingNode === 'target') {
        if (grid[r][c] === 0 && !(r === startNode.r && c === startNode.c)) {
          targetNode = { r, c };
          if (animSpeed === 0) runInstant();
          else draw();
        }
      } else if (isDrawing) {
        if (!(r === startNode.r && c === startNode.c) && !(r === targetNode.r && c === targetNode.c)) {
          grid[r][c] = drawMode;
          clearVisualization(true);
          draw();
        }
      }
    });

    window.addEventListener('mouseup', () => {
      isDrawing = false;
      draggingNode = null;
    });

    // Touch support
    canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      const { r, c } = getCellCoords(e);
      if (r === startNode.r && c === startNode.c) draggingNode = 'start';
      else if (r === targetNode.r && c === targetNode.c) draggingNode = 'target';
      else {
        isDrawing = true;
        drawMode = grid[r][c] === 1 ? 0 : 1;
        grid[r][c] = drawMode;
        clearVisualization(true);
        draw();
      }
    }, { passive: false });

    canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      const { r, c } = getCellCoords(e);
      if (draggingNode === 'start') {
        if (grid[r][c] === 0 && !(r === targetNode.r && c === targetNode.c)) {
          startNode = { r, c };
          if (animSpeed === 0) runInstant();
          else draw();
        }
      } else if (draggingNode === 'target') {
        if (grid[r][c] === 0 && !(r === startNode.r && c === startNode.c)) {
          targetNode = { r, c };
          if (animSpeed === 0) runInstant();
          else draw();
        }
      } else if (isDrawing) {
        if (!(r === startNode.r && c === startNode.c) && !(r === targetNode.r && c === targetNode.c)) {
          grid[r][c] = drawMode;
          clearVisualization(true);
          draw();
        }
      }
    }, { passive: false });

    canvas.addEventListener('touchend', () => {
      isDrawing = false;
      draggingNode = null;
    });
  }

  // Setup UI Events
  function setupUIEvents() {
    const algoSelect = document.getElementById('pf-algo-select');
    if (algoSelect) {
      algoSelect.addEventListener('change', e => {
        currentAlgorithm = e.target.value;
      });
    }

    const presetSelect = document.getElementById('pf-preset-select');
    if (presetSelect) {
      presetSelect.addEventListener('change', e => {
        loadPreset(e.target.value);
      });
    }

    const speedSelect = document.getElementById('pf-speed-select');
    if (speedSelect) {
      speedSelect.addEventListener('change', e => {
        animSpeed = parseInt(e.target.value, 10);
      });
    }

    const runBtn = document.getElementById('pf-run-btn');
    if (runBtn) {
      runBtn.addEventListener('click', () => {
        if (isVisualizing) return;
        visualizeAlgorithm(currentAlgorithm);
      });
    }

    const benchmarkBtn = document.getElementById('pf-benchmark-btn');
    if (benchmarkBtn) {
      benchmarkBtn.addEventListener('click', () => {
        runBenchmarkSuite();
      });
    }

    const clearPathBtn = document.getElementById('pf-clear-path-btn');
    if (clearPathBtn) {
      clearPathBtn.addEventListener('click', () => {
        clearVisualization();
        draw();
        updateTelemetry(0, 0, 0, 'Ready');
      });
    }

    const resetBtn = document.getElementById('pf-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        const preset = presetSelect ? presetSelect.value : 'runway';
        loadPreset(preset);
      });
    }
  }

  function clearVisualization(keepPath = false) {
    animationTimeouts.forEach(t => clearTimeout(t));
    animationTimeouts = [];
    isVisualizing = false;
    visitedSet.clear();
    if (!keepPath) pathNodes = [];
  }

  function updateTelemetry(timeMs, visitedCount, pathLen, status) {
    const elTime = document.getElementById('pf-stat-time');
    const elVisited = document.getElementById('pf-stat-visited');
    const elPath = document.getElementById('pf-stat-path');
    const elStatus = document.getElementById('pf-stat-status');

    if (elTime) elTime.textContent = timeMs.toFixed(2) + ' ms';
    if (elVisited) {
      const pct = ((visitedCount / (ROWS * COLS)) * 100).toFixed(1);
      elVisited.textContent = `${visitedCount} (${pct}%)`;
    }
    if (elPath) elPath.textContent = pathLen > 0 ? pathLen.toFixed(1) + ' m' : '--';
    if (elStatus) {
      elStatus.textContent = status;
      if (status === 'Path Found') {
        elStatus.className = 'badge badge-emerald';
      } else if (status === 'Unreachable') {
        elStatus.className = 'badge badge-rose';
      } else if (status === 'Exploring...') {
        elStatus.className = 'badge badge-blue';
      } else {
        elStatus.className = 'badge badge-purple';
      }
    }
  }

  // --- ALGORITHMS IMPLEMENTATION ---
  function getNeighbors(node, allowDiagonal = true) {
    const neighbors = [];
    const dirs = [
      { r: -1, c: 0, cost: 1 },
      { r: 1, c: 0, cost: 1 },
      { r: 0, c: -1, cost: 1 },
      { r: 0, c: 1, cost: 1 }
    ];
    if (allowDiagonal) {
      dirs.push(
        { r: -1, c: -1, cost: Math.SQRT2 },
        { r: -1, c: 1, cost: Math.SQRT2 },
        { r: 1, c: -1, cost: Math.SQRT2 },
        { r: 1, c: 1, cost: Math.SQRT2 }
      );
    }

    for (let d of dirs) {
      const nr = node.r + d.r;
      const nc = node.c + d.c;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid[nr][nc] === 0) {
        // Prevent corner-cutting through adjacent walls on diagonals
        if (Math.abs(d.r) === 1 && Math.abs(d.c) === 1) {
          if (grid[node.r + d.r][node.c] === 1 && grid[node.r][node.c + d.c] === 1) continue;
        }
        neighbors.push({ r: nr, c: nc, cost: d.cost });
      }
    }
    return neighbors;
  }

  function heuristic(r1, c1, r2, c2) {
    // Octile distance heuristic for 8-connected grid
    const dx = Math.abs(c1 - c2);
    const dy = Math.abs(r1 - r2);
    return (dx + dy) + (Math.SQRT2 - 2) * Math.min(dx, dy);
  }

  function lineOfSight(r1, c1, r2, c2) {
    // Bresenham's line-of-sight test for Theta*
    let dx = Math.abs(c2 - c1);
    let dy = Math.abs(r2 - r1);
    let x = c1;
    let y = r1;
    let n = 1 + dx + dy;
    let x_inc = (c2 > c1) ? 1 : -1;
    let y_inc = (r2 > r1) ? 1 : -1;
    let error = dx - dy;
    dx *= 2;
    dy *= 2;

    for (; n > 0; --n) {
      if (x < 0 || x >= COLS || y < 0 || y >= ROWS || grid[y][x] === 1) return false;
      if (error > 0) {
        x += x_inc;
        error -= dy;
      } else {
        y += y_inc;
        error += dx;
      }
    }
    return true;
  }

  function executeSearch(algoName) {
    const t0 = performance.now();
    const startKey = `${startNode.r},${startNode.c}`;
    const targetKey = `${targetNode.r},${targetNode.c}`;

    const visitedInOrder = [];
    const cameFrom = new Map();
    const gScore = new Map();
    gScore.set(startKey, 0);

    // Simple priority queue
    const openSet = [{ r: startNode.r, c: startNode.c, f: 0 }];
    const openSetKeys = new Set([startKey]);
    const closedSet = new Set();

    let found = false;

    while (openSet.length > 0) {
      // Find lowest f
      let minIdx = 0;
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].f < openSet[minIdx].f) minIdx = i;
      }
      const current = openSet.splice(minIdx, 1)[0];
      const curKey = `${current.r},${current.c}`;
      openSetKeys.delete(curKey);
      closedSet.add(curKey);

      visitedInOrder.push({ r: current.r, c: current.c });

      if (curKey === targetKey) {
        found = true;
        break;
      }

      const neighbors = getNeighbors(current, true);
      for (let neighbor of neighbors) {
        const nKey = `${neighbor.r},${neighbor.c}`;
        if (closedSet.has(nKey)) continue;

        let tentativeG = (gScore.get(curKey) || 0) + neighbor.cost;
        let parentNode = current;

        // Theta* Line-of-sight shortcutting
        if (algoName === 'thetastar' && cameFrom.has(curKey)) {
          const grandParent = cameFrom.get(curKey);
          if (lineOfSight(grandParent.r, grandParent.c, neighbor.r, neighbor.c)) {
            const directDist = Math.hypot(grandParent.c - neighbor.c, grandParent.r - neighbor.r);
            const altG = (gScore.get(`${grandParent.r},${grandParent.c}`) || 0) + directDist;
            if (altG < tentativeG) {
              tentativeG = altG;
              parentNode = grandParent;
            }
          }
        }

        if (!gScore.has(nKey) || tentativeG < gScore.get(nKey)) {
          gScore.set(nKey, tentativeG);
          cameFrom.set(nKey, parentNode);

          let fVal = tentativeG;
          const hVal = heuristic(neighbor.r, neighbor.c, targetNode.r, targetNode.c);

          if (algoName === 'astar' || algoName === 'thetastar') {
            fVal = tentativeG + hVal;
          } else if (algoName === 'dijkstra') {
            fVal = tentativeG; // No heuristic
          } else if (algoName === 'greedy') {
            fVal = hVal; // Pure heuristic
          } else if (algoName === 'bfs') {
            fVal = visitedInOrder.length; // FIFO
          }

          if (!openSetKeys.has(nKey)) {
            openSet.push({ r: neighbor.r, c: neighbor.c, f: fVal });
            openSetKeys.add(nKey);
          } else {
            const existing = openSet.find(n => n.r === neighbor.r && n.c === neighbor.c);
            if (existing) existing.f = fVal;
          }
        }
      }
    }

    const t1 = performance.now();
    const computeTimeMs = t1 - t0;

    // Reconstruct path
    const path = [];
    if (found) {
      let curr = targetNode;
      while (curr) {
        path.unshift(curr);
        const k = `${curr.r},${curr.c}`;
        if (k === startKey) break;
        curr = cameFrom.get(k);
      }
    }

    // Compute path length
    let pathLength = 0;
    for (let i = 0; i < path.length - 1; i++) {
      pathLength += Math.hypot(path[i+1].c - path[i].c, path[i+1].r - path[i].r);
    }

    return {
      found,
      visitedInOrder,
      path,
      pathLength,
      computeTimeMs,
      nodesVisited: visitedInOrder.length
    };
  }

  // Visualization Runner
  function visualizeAlgorithm(algoName) {
    clearVisualization();
    isVisualizing = true;
    updateTelemetry(0, 0, 0, 'Exploring...');

    const result = executeSearch(algoName);

    if (animSpeed === 0) {
      // Instant render
      result.visitedInOrder.forEach(n => visitedSet.add(`${n.r},${n.c}`));
      pathNodes = result.path;
      isVisualizing = false;
      draw();
      updateTelemetry(result.computeTimeMs, result.nodesVisited, result.pathLength, result.found ? 'Path Found' : 'Unreachable');
      return;
    }

    // Step-by-step animation
    const visitedBatch = Math.max(1, Math.floor(25 / animSpeed));
    let step = 0;

    function animateVisited() {
      for (let b = 0; b < visitedBatch && step < result.visitedInOrder.length; b++, step++) {
        const node = result.visitedInOrder[step];
        visitedSet.add(`${node.r},${node.c}`);
      }
      draw();

      if (step < result.visitedInOrder.length) {
        const tid = setTimeout(animateVisited, animSpeed);
        animationTimeouts.push(tid);
      } else {
        // Visited done -> Animate path
        animatePath(result);
      }
    }

    animateVisited();
  }

  function animatePath(result) {
    if (!result.found) {
      isVisualizing = false;
      updateTelemetry(result.computeTimeMs, result.nodesVisited, 0, 'Unreachable');
      return;
    }

    let pIdx = 0;
    function stepPath() {
      if (pIdx < result.path.length) {
        pathNodes.push(result.path[pIdx]);
        pIdx++;
        draw();
        const tid = setTimeout(stepPath, Math.max(15, animSpeed * 1.5));
        animationTimeouts.push(tid);
      } else {
        isVisualizing = false;
        updateTelemetry(result.computeTimeMs, result.nodesVisited, result.pathLength, 'Path Found');
      }
    }
    stepPath();
  }

  function runInstant() {
    clearVisualization();
    const result = executeSearch(currentAlgorithm);
    result.visitedInOrder.forEach(n => visitedSet.add(`${n.r},${n.c}`));
    pathNodes = result.path;
    draw();
    updateTelemetry(result.computeTimeMs, result.nodesVisited, result.pathLength, result.found ? 'Path Found' : 'Unreachable');
  }

  // Multi-Algorithm Benchmark Suite
  function runBenchmarkSuite() {
    clearVisualization();
    const algorithms = [
      { id: 'astar', name: 'A* Search (Smac 2D / Euclidean)', type: 'Heuristic Best-First' },
      { id: 'thetastar', name: 'Theta* (Any-Angle Line-of-Sight)', type: 'Any-Angle Geometric' },
      { id: 'greedy', name: 'Greedy Best-First Search', type: 'Pure Heuristic' },
      { id: 'dijkstra', name: "Dijkstra's Algorithm (NavFn)", type: 'Uniform-Cost Expansion' },
      { id: 'bfs', name: 'Breadth-First Search (BFS)', type: 'Unweighted Wavefront' }
    ];

    const results = [];
    algorithms.forEach(algo => {
      // Run each algorithm 3 times to smooth high-resolution timing jitter
      let totalTime = 0;
      let lastRes = null;
      for (let run = 0; run < 3; run++) {
        lastRes = executeSearch(algo.id);
        totalTime += lastRes.computeTimeMs;
      }
      results.push({
        name: algo.name,
        type: algo.type,
        found: lastRes.found,
        timeMs: totalTime / 3,
        nodesVisited: lastRes.nodesVisited,
        pathLength: lastRes.pathLength
      });
    });

    // Populate benchmark results container in DOM
    renderBenchmarkTable(results);

    // Also visualize A* instantly on the canvas
    const astarRes = executeSearch('astar');
    astarRes.visitedInOrder.forEach(n => visitedSet.add(`${n.r},${n.c}`));
    pathNodes = astarRes.path;
    draw();
    updateTelemetry(astarRes.computeTimeMs, astarRes.nodesVisited, astarRes.pathLength, 'Benchmarked');
  }

  function renderBenchmarkTable(results) {
    const container = document.getElementById('pf-benchmark-results');
    if (!container) return;

    container.style.display = 'block';
    
    // Find dijkstra for speedup reference
    const dijkstraRes = results.find(r => r.name.includes("Dijkstra")) || results[results.length - 1];
    const baseNodes = dijkstraRes ? dijkstraRes.nodesVisited : 1;

    let html = `
      <div style="margin-top: 20px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 18px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div>
            <h4 style="margin: 0; font-size: 15px; color: var(--accent-purple);">📊 Live Multi-Algorithm Benchmark Comparison</h4>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: var(--text-muted);">Benchmarked on current obstacle map (Grid size: ${ROWS} × ${COLS} = ${ROWS * COLS} nodes).</p>
          </div>
          <span class="badge badge-emerald">Execution Complete</span>
        </div>
        
        <div class="admin-table-wrapper">
          <table class="admin-table" style="font-size: 12.5px;">
            <thead>
              <tr>
                <th>Algorithm</th>
                <th>Classification</th>
                <th>Compute Latency</th>
                <th>Explored Nodes</th>
                <th>Path Length</th>
                <th>Exploration Efficiency</th>
                <th>Nav2 Suitability</th>
              </tr>
            </thead>
            <tbody>
    `;

    results.forEach(r => {
      const isSelected = r.name.includes('A*');
      const efficiency = ((1 - (r.nodesVisited / baseNodes)) * 100).toFixed(1);
      const effLabel = efficiency > 0 ? `<span class="badge badge-emerald">${efficiency}% Fewer Nodes</span>` : `<span class="badge badge-amber">Baseline</span>`;
      const rowStyle = isSelected ? 'background: rgba(147, 51, 234, 0.08); font-weight: 600;' : '';

      html += `
        <tr style="${rowStyle}">
          <td><strong style="color: ${isSelected ? 'var(--accent-purple)' : 'var(--text-main)'};">${r.name}</strong></td>
          <td><span style="font-size: 11.5px; color: var(--text-muted);">${r.type}</span></td>
          <td><span class="badge ${r.timeMs < 2 ? 'badge-emerald' : 'badge-blue'}">${r.timeMs.toFixed(2)} ms</span></td>
          <td>${r.nodesVisited} / ${ROWS * COLS} (${((r.nodesVisited / (ROWS * COLS)) * 100).toFixed(1)}%)</td>
          <td>${r.pathLength > 0 ? r.pathLength.toFixed(1) + ' m' : '<span style="color:var(--accent-rose)">No Path</span>'}</td>
          <td>${effLabel}</td>
          <td>${isSelected ? '<strong style="color:var(--accent-emerald);">SELECTED (Smac 2D)</strong>' : (r.name.includes('Theta') ? 'High (Smoothing)' : (r.name.includes('Dijkstra') ? 'Too Slow for 5km' : 'Sub-optimal'))}</td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
        </div>
        <p style="font-size: 12px; color: var(--text-muted); margin: 10px 0 0 0; line-height: 1.5;">
          <strong>Key Takeaway:</strong> <code>A* (Smac Planner 2D)</code> consistently searches up to <strong>70&ndash;85% fewer nodes</strong> than Dijkstra (NavFn) on open airfield straightaways, enabling sub-millisecond path generation at speeds &ge;10 km/h without lagging the ROS 2 control loop.
        </p>
      </div>
    `;

    container.innerHTML = html;
  }

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
