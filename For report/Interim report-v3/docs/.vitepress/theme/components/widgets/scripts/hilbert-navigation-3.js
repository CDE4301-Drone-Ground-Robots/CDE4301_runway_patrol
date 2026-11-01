// Widget script (runs once per page via useWidgetScript); edit here.
/* eslint-disable */

export default function init() {
/**
 * Nav2 Behavior Tree Interactive Explorer
 * CDE4301 Runway Patrol - Phase 9.1
 * Features: Two-mode hierarchy (Simplified & Full XML), Pan/Zoom, Collapsible Nodes, Node Detail Inspector
 */
(function() {
  'use strict';

  // Tree Datasets
  const fullTreeData = {
    id: "node-root",
    name: "NavigateRecovery",
    type: "RecoveryNode",
    category: "recovery",
    badge: "Recovery Supervisor",
    description: "Top-level supervisory recovery node configured with number_of_retries=\"6\". It executes the primary navigation pipeline child (left). If the pipeline encounters unrecoverable failure (e.g. complete path blockage or localization loss), cascades execution to the recovery fallback child (right).",
    attributes: { "number_of_retries": "6" },
    children: [
      {
        id: "node-pipeline",
        name: "NavigateToPosePipeline",
        type: "PipelineSequence",
        category: "control",
        badge: "Pipelined Planning & Control",
        description: "Nav2 PipelineSequence executing concurrent planning and control. Allows global path generation and high-frequency local path following to run in synchronized parallel stages without blocking.",
        children: [
          {
            id: "node-plan-branch",
            name: "ComputePathBranch",
            type: "RateController",
            category: "decorator",
            badge: "1.0 Hz Rate Throttling",
            attributes: { "hz": "1.0" },
            description: "Throttles global path replanning to 1.0 Hz, ensuring the vehicle adapts to newly detected dynamic runway obstacles or FOD debris without computational overhead.",
            children: [
              {
                id: "node-plan-recovery",
                name: "ComputePathRecovery",
                type: "RecoveryNode",
                category: "recovery",
                badge: "Planner Recovery Wrapper",
                attributes: { "number_of_retries": "1" },
                description: "Wraps global path planning with automatic costmap clearing if planning fails, eliminating transient ghost obstacles.",
                children: [
                  {
                    id: "node-smac",
                    name: "ComputePathToPose",
                    type: "Action (Planner)",
                    category: "action",
                    badge: "SmacPlannerHybrid (Reeds-Shepp)",
                    attributes: { "plugin": "nav2_smac_planner::SmacPlannerHybrid", "motion_model": "REEDS_SHEPP", "minimum_turning_radius": "1.0 m", "reverse_penalty": "2.5" },
                    description: "Computes kinodynamically feasible Reeds-Shepp trajectory satisfying non-holonomic curvature constraints (R >= 1.0 m) to prevent high-speed skid-steer scrubbing during autonomous runway transit."
                  },
                  {
                    id: "node-clear-global",
                    name: "ClearGlobalCostmap",
                    type: "Service (Costmap)",
                    category: "service",
                    badge: "Global Costmap Flush",
                    attributes: { "service": "global_costmap/clear_entirely_global_costmap" },
                    description: "Clears dynamic obstacle markings in the global costmap if planner fails, eliminating ghost obstacles caused by sensor reflections or glare."
                  }
                ]
              }
            ]
          },
          {
            id: "node-follow-branch",
            name: "FollowPathBranch",
            type: "RecoveryNode",
            category: "recovery",
            badge: "Controller Recovery Wrapper",
            attributes: { "number_of_retries": "1" },
            description: "Supervises path tracking and triggers local costmap clearing if tracking progress stalls.",
            children: [
              {
                id: "node-rpp",
                name: "FollowPath",
                type: "Action (Controller)",
                category: "action",
                badge: "Regulated Pure Pursuit (20 Hz)",
                attributes: { "plugin": "nav2_regulated_pure_pursuit_controller::RegulatedPurePursuitController", "rate": "20.0 Hz", "desired_linear_vel": "2.22 m/s (8 km/h)", "lookahead_dist": "1.2 m" },
                description: "High-frequency (20 Hz) path tracking controller. Regulates speed on high-curvature segments (R < 0.8m), dynamically scales lookahead distance (0.4m - 2.5m), and executes initial heading pivot alignment if yaw error exceeds 45 degrees (0.785 rad)."
              },
              {
                id: "node-clear-local",
                name: "ClearLocalCostmap",
                type: "Service (Costmap)",
                category: "service",
                badge: "Local Costmap Flush",
                attributes: { "service": "local_costmap/clear_entirely_local_costmap" },
                description: "Flushes the 12x12m rolling-window local costmap around vehicle hull if controller gets stuck."
              }
            ]
          }
        ]
      },
      {
        id: "node-recovery-fallback",
        name: "RecoveryFallback",
        type: "RoundRobin",
        category: "control",
        badge: "Escalating Recovery System",
        description: "Executes escalating recovery actions in cyclical round-robin sequence when the primary navigation pipeline fails to make forward progress.",
        children: [
          {
            id: "node-rec-clear-local",
            name: "ClearLocalCostmap",
            type: "Service (Costmap)",
            category: "service",
            badge: "Recovery Step 1",
            attributes: { "service": "local_costmap/clear_entirely_local_costmap" },
            description: "Step 1 of recovery: Purges rolling-window local obstacle buffer to eliminate transient sensor noise."
          },
          {
            id: "node-rec-clear-global",
            name: "ClearGlobalCostmap",
            type: "Service (Costmap)",
            category: "service",
            badge: "Recovery Step 2",
            attributes: { "service": "global_costmap/clear_entirely_global_costmap" },
            description: "Step 2 of recovery: Purges global costmap buffer to ensure clean replanning search space."
          },
          {
            id: "node-rec-spin",
            name: "Spin (In-Place Turn)",
            type: "Action (Behavior)",
            category: "action",
            badge: "Recovery Step 3: Zero-Radius Turn",
            attributes: { "spin_dist": "1.57 rad (90°)", "time_allowance": "10.0 s", "max_rot_vel": "1.0 rad/s" },
            description: "Step 3 of recovery: Commands stationary in-place rotation (R = 0) to reorient 360° LiDAR field of view and dislodge from local costmap traps."
          },
          {
            id: "node-rec-wait",
            name: "Wait (Corridor Clearance)",
            type: "Action (Behavior)",
            category: "action",
            badge: "Recovery Step 4: Standstill",
            attributes: { "wait_duration": "5.0 s" },
            description: "Step 4 of recovery: Commands full vehicle stop for 5.0 seconds to allow transient ground traffic, patrol vehicles, or personnel to clear the runway corridor."
          },
          {
            id: "node-rec-backup",
            name: "BackUp (Extraction)",
            type: "Action (Behavior)",
            category: "action",
            badge: "Recovery Step 5: Reverse",
            attributes: { "backup_dist": "0.30 m", "backup_speed": "0.05 m/s" },
            description: "Step 5 of recovery: Smoothly reverses UGV 0.30 m at 0.05 m/s along vehicle heading to extract chassis from geometric dead-ends."
          }
        ]
      }
    ]
  };

  const simplifiedTreeData = {
    id: "sim-root",
    name: "NavigateToPose (Goal Execution)",
    type: "Root Pipeline",
    category: "control",
    badge: "Navigation Lifecycle Supervisor",
    description: "High-level goal execution lifecycle. Receives target pose from Mission C2, performs continuous trajectory planning and tracking, monitors progress, and triggers recoveries if blocked.",
    children: [
      {
        id: "sim-1",
        name: "1. Goal Ingestion & Validation",
        type: "BT Navigator",
        category: "control",
        badge: "Action Server Goal",
        attributes: { "action": "/navigate_to_pose", "loop_rate": "100 Hz" },
        description: "BT Navigator accepts target coordinates from Mission C2 Bridge. Validates spatial coordinates against global map bounds and initializes the blackboard."
      },
      {
        id: "sim-2",
        name: "2. Hybrid A* Global Planning",
        type: "SmacPlannerHybrid (1 Hz)",
        category: "action",
        badge: "Curvature-Constrained Path",
        attributes: { "model": "Reeds-Shepp", "R_min": "1.0 m", "rate": "1.0 Hz" },
        description: "Computes smooth Reeds-Shepp trajectory respecting non-holonomic minimum turning radius (R >= 1.0 m) to prevent high-speed skid-steer scrubbing during transit."
      },
      {
        id: "sim-3",
        name: "3. RPP Local Path Tracking",
        type: "Regulated Pure Pursuit (20 Hz)",
        category: "action",
        badge: "Path Tracking & Speed Regulation",
        attributes: { "frequency": "20 Hz", "cruise_speed": "2.22 m/s (8 km/h)", "lookahead": "0.4m - 2.5m" },
        description: "Tracks path at 20 Hz with dynamic speed regulation: slows on curves (R < 0.8m) and near obstacles, scaling lookahead distance with velocity."
      },
      {
        id: "sim-4",
        name: "4. Dynamic Replanning & Collision Check",
        type: "RateController + Costmap",
        category: "decorator",
        badge: "Continuous Replanning",
        attributes: { "costmap_rate": "5 Hz", "replan_rate": "1.0 Hz" },
        description: "Continuously checks costmap at 5 Hz and replans global path at 1 Hz when new obstacles appear in the runway corridor."
      },
      {
        id: "sim-5",
        name: "5. Goal Tolerance Verification",
        type: "SimpleGoalChecker",
        category: "service",
        badge: "Mission Completion",
        attributes: { "xy_tolerance": "0.35 m", "yaw_tolerance": "0.35 rad (20°)" },
        description: "Monitors vehicle arrival within tolerance (position error <= 0.35 m, yaw error <= 0.35 rad). Completes navigation action cleanly."
      },
      {
        id: "sim-6",
        name: "6. Escalating Fallback Recovery",
        type: "RoundRobin Fallback",
        category: "recovery",
        badge: "Failure Handler",
        attributes: { "steps": "Clear -> Spin -> Wait -> BackUp" },
        description: "If vehicle is blocked or tracking stalls: clears costmaps -> stationary spin 90° -> wait 5s -> back up 0.30m before retrying."
      }
    ]
  };

  // State
  let currentMode = 'simplified'; // 'simplified' | 'full'
  let activeData = simplifiedTreeData;
  let collapsedSet = new Set();
  let selectedNode = null;

  // Viewport transformation state
  let transform = { x: 0, y: 0, scale: 1 };
  let isPanning = false;
  let startPan = { x: 0, y: 0 };

  // DOM Elements
  let container, svg, gRoot, gLinks, gNodes;
  let detailPanel;

  function init() {
    container = document.getElementById('bt-explorer-container');
    svg = document.getElementById('bt-explorer-svg');
    if (!container || !svg) return;

    gRoot = document.getElementById('bt-viewport-group');
    gLinks = document.getElementById('bt-links-group');
    gNodes = document.getElementById('bt-nodes-group');
    detailPanel = document.getElementById('bt-detail-content');

    setupControls();
    setupPanZoom();

    // Default to Simplified Mode initially
    switchMode('simplified');
  }

  function setupControls() {
    const btnSim = document.getElementById('bt-mode-simplified');
    const btnFull = document.getElementById('bt-mode-full');
    const btnReset = document.getElementById('bt-btn-reset');
    const btnFit = document.getElementById('bt-btn-fit');
    const btnZoomIn = document.getElementById('bt-btn-zoomin');
    const btnZoomOut = document.getElementById('bt-btn-zoomout');

    if (btnSim) {
      btnSim.addEventListener('click', () => switchMode('simplified'));
    }
    if (btnFull) {
      btnFull.addEventListener('click', () => switchMode('full'));
    }
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        transform = { x: 0, y: 0, scale: 1 };
        applyTransform();
      });
    }
    if (btnFit) {
      btnFit.addEventListener('click', fitToScreen);
    }
    if (btnZoomIn) {
      btnZoomIn.addEventListener('click', () => {
        transform.scale = Math.min(2.5, transform.scale * 1.25);
        applyTransform();
      });
    }
    if (btnZoomOut) {
      btnZoomOut.addEventListener('click', () => {
        transform.scale = Math.max(0.35, transform.scale * 0.8);
        applyTransform();
      });
    }

    window.addEventListener('resize', () => {
      renderTree();
    });
  }

  function switchMode(mode) {
    currentMode = mode;
    activeData = mode === 'simplified' ? simplifiedTreeData : fullTreeData;
    collapsedSet.clear();

    const btnSim = document.getElementById('bt-mode-simplified');
    const btnFull = document.getElementById('bt-mode-full');
    if (btnSim && btnFull) {
      if (mode === 'simplified') {
        btnSim.classList.add('active');
        btnFull.classList.remove('active');
      } else {
        btnFull.classList.add('active');
        btnSim.classList.remove('active');
      }
    }

    // Select root node by default
    selectedNode = activeData;
    renderTree();
    fitToScreen();
    displayNodeDetail(selectedNode);
  }

  function setupPanZoom() {
    svg.addEventListener('mousedown', e => {
      if (e.target.closest('.bt-node-group')) return;
      isPanning = true;
      startPan = { x: e.clientX - transform.x, y: e.clientY - transform.y };
      svg.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', e => {
      if (!isPanning) return;
      transform.x = e.clientX - startPan.x;
      transform.y = e.clientY - startPan.y;
      applyTransform();
    });

    window.addEventListener('mouseup', () => {
      isPanning = false;
      svg.style.cursor = 'grab';
    });

    svg.addEventListener('wheel', e => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      const rect = svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newScale = Math.max(0.35, Math.min(2.5, transform.scale * zoomFactor));
      transform.x = mouseX - (mouseX - transform.x) * (newScale / transform.scale);
      transform.y = mouseY - (mouseY - transform.y) * (newScale / transform.scale);
      transform.scale = newScale;
      applyTransform();
    }, { passive: false });

    // Touch support
    let touchStartDist = 0;
    svg.addEventListener('touchstart', e => {
      if (e.touches.length === 1) {
        isPanning = true;
        startPan = { x: e.touches[0].clientX - transform.x, y: e.touches[0].clientY - transform.y };
      } else if (e.touches.length === 2) {
        touchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    }, { passive: true });

    svg.addEventListener('touchmove', e => {
      if (e.touches.length === 1 && isPanning) {
        transform.x = e.touches[0].clientX - startPan.x;
        transform.y = e.touches[0].clientY - startPan.y;
        applyTransform();
      } else if (e.touches.length === 2 && touchStartDist > 0) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const factor = dist / touchStartDist;
        transform.scale = Math.max(0.35, Math.min(2.5, transform.scale * factor));
        touchStartDist = dist;
        applyTransform();
      }
    }, { passive: true });

    svg.addEventListener('touchend', () => {
      isPanning = false;
      touchStartDist = 0;
    });
  }

  function applyTransform() {
    if (gRoot) {
      gRoot.setAttribute('transform', `translate(${transform.x}, ${transform.y}) scale(${transform.scale})`);
    }
  }

  // Hierarchical Layout Calculation (Top-down Tree Layout)
  function computeLayout(node) {
    const NODE_WIDTH = 210;
    const NODE_HEIGHT = 64;
    const HORIZONTAL_GAP = 30;
    const VERTICAL_GAP = 75;

    let leafIndex = 0;

    function layoutNode(n, depth = 0) {
      n._width = NODE_WIDTH;
      n._height = NODE_HEIGHT;
      n._depth = depth;

      const isCollapsed = collapsedSet.has(n.id);
      const hasChildren = n.children && n.children.length > 0 && !isCollapsed;

      if (!hasChildren) {
        n._x = leafIndex * (NODE_WIDTH + HORIZONTAL_GAP);
        n._y = depth * (NODE_HEIGHT + VERTICAL_GAP);
        leafIndex++;
      } else {
        n.children.forEach(c => layoutNode(c, depth + 1));
        const firstChild = n.children[0];
        const lastChild = n.children[n.children.length - 1];
        n._x = (firstChild._x + lastChild._x) / 2;
        n._y = depth * (NODE_HEIGHT + VERTICAL_GAP);
      }
      return n;
    }

    leafIndex = 0;
    layoutNode(node, 0);

    // Compute bounding box
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    function getBounds(n) {
      if (n._x < minX) minX = n._x;
      if (n._x + n._width > maxX) maxX = n._x + n._width;
      if (n._y < minY) minY = n._y;
      if (n._y + n._height > maxY) maxY = n._y + n._height;
      if (n.children && !collapsedSet.has(n.id)) {
        n.children.forEach(getBounds);
      }
    }
    getBounds(node);

    return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
  }

  function renderTree() {
    if (!gLinks || !gNodes) return;
    gLinks.innerHTML = '';
    gNodes.innerHTML = '';

    const bounds = computeLayout(activeData);

    // Collect visible links and nodes
    const links = [];
    const nodes = [];

    function collect(n) {
      nodes.push(n);
      const isCollapsed = collapsedSet.has(n.id);
      if (n.children && !isCollapsed) {
        n.children.forEach(c => {
          links.push({ source: n, target: c });
          collect(c);
        });
      }
    }
    collect(activeData);

    // Render SVG connector paths
    links.forEach(l => {
      const x1 = l.source._x + l.source._width / 2;
      const y1 = l.source._y + l.source._height;
      const x2 = l.target._x + l.target._width / 2;
      const y2 = l.target._y;
      const midY = (y1 + y2) / 2;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`);
      path.setAttribute('class', 'bt-link');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', 'rgba(255, 255, 255, 0.16)');
      path.setAttribute('stroke-width', '1.5');
      gLinks.appendChild(path);
    });

    // Color theme map for node categories
    const categoryColors = {
      recovery: { bg: 'rgba(168, 85, 247, 0.12)', border: '#a855f7', text: '#c084fc' },
      control: { bg: 'rgba(59, 130, 246, 0.12)', border: '#3b82f6', text: '#60a5fa' },
      decorator: { bg: 'rgba(245, 158, 11, 0.12)', border: '#f59e0b', text: '#fbbf24' },
      action: { bg: 'rgba(16, 185, 129, 0.12)', border: '#10b981', text: '#34d399' },
      service: { bg: 'rgba(6, 182, 212, 0.12)', border: '#06b6d4', text: '#22d3ee' }
    };

    // Render Nodes
    nodes.forEach(n => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', `bt-node-group ${selectedNode && selectedNode.id === n.id ? 'selected' : ''}`);
      g.setAttribute('transform', `translate(${n._x}, ${n._y})`);
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', `${n.name} (${n.type})`);

      const colors = categoryColors[n.category] || categoryColors.control;
      const isSelected = selectedNode && selectedNode.id === n.id;

      // Card Background Rect
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('width', n._width);
      rect.setAttribute('height', n._height);
      rect.setAttribute('rx', '8');
      rect.setAttribute('fill', isSelected ? 'rgba(59, 130, 246, 0.28)' : colors.bg);
      rect.setAttribute('stroke', isSelected ? '#60a5fa' : colors.border);
      rect.setAttribute('stroke-width', isSelected ? '2' : '1.2');
      g.appendChild(rect);

      // Node Type label (small top pill)
      const textType = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      textType.setAttribute('x', '12');
      textType.setAttribute('y', '19');
      textType.setAttribute('font-size', '10');
      textType.setAttribute('font-weight', '600');
      textType.setAttribute('letter-spacing', '0.04em');
      textType.setAttribute('fill', colors.text);
      textType.textContent = n.type.toUpperCase();
      g.appendChild(textType);

      // Node Name (bold main label)
      const textName = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      textName.setAttribute('x', '12');
      textName.setAttribute('y', '40');
      textName.setAttribute('font-size', '12.5');
      textName.setAttribute('font-weight', '600');
      textName.setAttribute('fill', '#f8fafc');
      textName.textContent = n.name.length > 22 ? n.name.slice(0, 20) + '…' : n.name;
      g.appendChild(textName);

      // Subtitle / attributes snippet
      const textSub = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      textSub.setAttribute('x', '12');
      textSub.setAttribute('y', '54');
      textSub.setAttribute('font-size', '10.5');
      textSub.setAttribute('fill', 'rgba(255, 255, 255, 0.5)');
      if (n.attributes && Object.keys(n.attributes).length > 0) {
        const firstKey = Object.keys(n.attributes)[0];
        textSub.textContent = `${firstKey}: ${n.attributes[firstKey]}`;
      } else {
        textSub.textContent = n.badge || '';
      }
      g.appendChild(textSub);

      // Expand/Collapse toggle pill if has children
      if (n.children && n.children.length > 0) {
        const isCollapsed = collapsedSet.has(n.id);
        const collapseCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        collapseCircle.setAttribute('cx', n._width - 16);
        collapseCircle.setAttribute('cy', '18');
        collapseCircle.setAttribute('r', '9');
        collapseCircle.setAttribute('fill', 'rgba(255, 255, 255, 0.1)');
        collapseCircle.setAttribute('stroke', 'rgba(255, 255, 255, 0.25)');
        collapseCircle.setAttribute('stroke-width', '1');
        collapseCircle.style.cursor = 'pointer';
        g.appendChild(collapseCircle);

        const collapseText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        collapseText.setAttribute('x', n._width - 16);
        collapseText.setAttribute('y', '22');
        collapseText.setAttribute('text-anchor', 'middle');
        collapseText.setAttribute('font-size', '12');
        collapseText.setAttribute('font-weight', 'bold');
        collapseText.setAttribute('fill', '#fff');
        collapseText.style.cursor = 'pointer';
        collapseText.textContent = isCollapsed ? '+' : '−';
        g.appendChild(collapseText);

        const toggleHandler = (e) => {
          e.stopPropagation();
          if (collapsedSet.has(n.id)) {
            collapsedSet.delete(n.id);
          } else {
            collapsedSet.add(n.id);
          }
          renderTree();
        };

        collapseCircle.addEventListener('click', toggleHandler);
        collapseText.addEventListener('click', toggleHandler);
      }

      // Selection Events
      const selectHandler = () => {
        selectedNode = n;
        renderTree();
        displayNodeDetail(n);
      };

      g.addEventListener('click', selectHandler);
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectHandler();
        }
      });

      gNodes.appendChild(g);
    });
  }

  function fitToScreen() {
    if (!svg) return;
    const svgRect = svg.getBoundingClientRect();
    const bounds = computeLayout(activeData);

    const padding = 40;
    const availWidth = svgRect.width - padding * 2;
    const availHeight = svgRect.height - padding * 2;

    const scaleX = availWidth / (bounds.width || 1);
    const scaleY = availHeight / (bounds.height || 1);
    const scale = Math.max(0.18, Math.min(1.2, Math.min(scaleX, scaleY)));

    transform.scale = scale;
    transform.x = (svgRect.width - bounds.width * scale) / 2 - bounds.minX * scale;
    transform.y = 20 - bounds.minY * scale;

    applyTransform();
  }

  // Display node details as plain, clean text directly in the detail container (NO NESTED CARDS)
  function displayNodeDetail(node) {
    if (!detailPanel) return;
    if (!node) {
      detailPanel.innerHTML = '<p style="color: var(--apple-text-secondary); margin: 0; font-size: 14px;">Select any node in the behavior tree to inspect its configuration parameters, ROS 2 Nav2 plugin, and operational logic.</p>';
      return;
    }

    let attrsHtml = '';
    if (node.attributes && Object.keys(node.attributes).length > 0) {
      attrsHtml = '<div style="margin-top: 10px; font-family: monospace; font-size: 12px; color: var(--apple-text-secondary);">';
      attrsHtml += '<strong>Active XML Attributes:</strong><ul style="margin: 4px 0 0 16px; padding: 0;">';
      for (const [k, v] of Object.entries(node.attributes)) {
        attrsHtml += `<li><span style="color: #60a5fa;">${k}</span>: <span style="color: #34d399;">"${v}"</span></li>`;
      }
      attrsHtml += '</ul></div>';
    }

    detailPanel.innerHTML = `
      <div style="display: flex; align-items: baseline; gap: 10px; margin-bottom: 6px; flex-wrap: wrap;">
        <h4 style="font-size: 16px; font-weight: 700; color: #f8fafc; margin: 0;">${node.name}</h4>
        <span style="font-size: 11.5px; font-weight: 600; text-transform: uppercase; color: #60a5fa; letter-spacing: 0.04em;">[${node.type}]</span>
        ${node.badge ? `<span style="font-size: 11.5px; color: #94a3b8;">&bull; ${node.badge}</span>` : ''}
      </div>
      <p style="font-size: 14px; line-height: 1.6; color: var(--apple-text-secondary); margin: 0 0 8px 0;">
        ${node.description}
      </p>
      ${attrsHtml}
    `;
  }

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

}
