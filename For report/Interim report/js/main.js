/**
 * Runway Patrol Interim Report - Interactive Dashboard
 * Enhanced UI interactions, scroll animations, dynamic elements, and LaTeX math rendering.
 */

// ── MathJax Configuration for LaTeX Math Rendering ─────────────────────────
window.MathJax = {
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
    processEscapes: true,
    processEnvironments: true
  },
  options: {
    skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
  },
  svg: {
    fontCache: 'global'
  },
  startup: {
    ready: () => {
      window.MathJax.startup.defaultReady();
      console.log('MathJax 3 initialized and ready.');
    }
  }
};

// Dynamically inject MathJax CDN script if not present
(function loadMathJax() {
  if (!document.getElementById('mathjax-script')) {
    const script = document.createElement('script');
    script.id = 'mathjax-script';
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
    script.async = true;
    document.head.appendChild(script);
  }
})();

// Global re-render helper for modals and dynamic content
window.renderMath = function() {
  if (window.MathJax && window.MathJax.typesetPromise) {
    window.MathJax.typesetPromise();
  }
};

document.addEventListener('DOMContentLoaded', () => {

  // ── Theme Toggle ────────────────────────────────────────────────
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const storedTheme = localStorage.getItem('theme') || 'light';

  document.documentElement.setAttribute('data-theme', storedTheme);
  if (themeToggleBtn) {
    themeToggleBtn.innerHTML = storedTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';

    themeToggleBtn.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const next = isDark ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      themeToggleBtn.innerHTML = next === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
    });
  }

  // ── Mobile Sidebar Drawer ───────────────────────────────────────
  const mobileToggleBtn = document.getElementById('mobile-toggle-btn');
  const sidebar = document.querySelector('.sidebar');

  if (mobileToggleBtn && sidebar) {
    mobileToggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (sidebar.classList.contains('open') &&
          !sidebar.contains(e.target) &&
          !mobileToggleBtn.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  }

  // ── Auto-highlight Active Nav Link ──────────────────────────────
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-link, .nav-sub-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && currentPath.endsWith(href.replace('./', ''))) {
      link.classList.add('active');
      const parentSub = link.closest('.nav-sub-list');
      if (parentSub) parentSub.style.display = 'flex';
    }
  });

  // ── Print Helper ────────────────────────────────────────────────
  const printBtn = document.getElementById('print-report-btn');
  if (printBtn) {
    printBtn.addEventListener('click', () => window.print());
  }

  // ── Scroll-Triggered Reveal Animations ──────────────────────────
  const observerOptions = { threshold: 0.08, rootMargin: '0px 0px -40px 0px' };
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        revealObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.card-box, .kpi-card, .gantt-card-block, .figure-card').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = `opacity 0.5s cubic-bezier(0.22,1,0.36,1) ${i * 0.06}s, transform 0.5s cubic-bezier(0.22,1,0.36,1) ${i * 0.06}s`;
    revealObserver.observe(el);
  });

  // ── Animated Progress Bars ──────────────────────────────────────
  const barObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const fill = entry.target;
        const targetWidth = fill.style.width;
        fill.style.width = '0%';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            fill.style.transition = 'width 1.2s cubic-bezier(0.22,1,0.36,1)';
            fill.style.width = targetWidth;
          });
        });
        barObserver.unobserve(fill);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.gantt-bar-fill').forEach(bar => {
    barObserver.observe(bar);
  });

  // ── Animated KPI Counter ────────────────────────────────────────
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const text = el.textContent.trim();
        // Match patterns like "75%", "< 15 ms", "NUS SDE3"
        const match = text.match(/(\d+)/);
        if (match) {
          const target = parseInt(match[1]);
          const prefix = text.substring(0, text.indexOf(match[0]));
          const suffix = text.substring(text.indexOf(match[0]) + match[0].length);
          let current = 0;
          const step = Math.max(1, Math.ceil(target / 40));
          const interval = setInterval(() => {
            current += step;
            if (current >= target) {
              current = target;
              clearInterval(interval);
            }
            el.textContent = prefix + current + suffix;
          }, 30);
        }
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.kpi-value').forEach(v => counterObserver.observe(v));

  // ── Interactive Gantt Chart & Roadmap ────────────────────────────
  const semFilterBtns = document.querySelectorAll('.gantt-filter-btn');
  const ownerFilterBtns = document.querySelectorAll('.owner-filter-btn');
  const searchInput = document.getElementById('gantt-search-input');
  const ganttTable = document.querySelector('.gantt-matrix');

  // View toggle
  const btnViewMatrix = document.getElementById('btn-view-matrix');
  const btnViewCards = document.getElementById('btn-view-cards');
  const containerMatrix = document.getElementById('view-container-matrix');
  const containerCards = document.getElementById('view-container-cards');

  if (btnViewMatrix && btnViewCards) {
    btnViewMatrix.addEventListener('click', () => {
      btnViewMatrix.classList.add('active');
      btnViewCards.classList.remove('active');
      containerMatrix.style.display = 'block';
      containerCards.style.display = 'none';
    });
    btnViewCards.addEventListener('click', () => {
      btnViewCards.classList.add('active');
      btnViewMatrix.classList.remove('active');
      containerMatrix.style.display = 'none';
      containerCards.style.display = 'grid';
    });
  }

  if (ganttTable) {
    let currentSem = 'all';
    let currentOwner = 'all';
    let searchQuery = '';

    // Automatically color all milestone columns (S1 W12, S1 W13, S2 W11, S2 W13) across all team rows
    try {
      const headerThs = Array.from(ganttTable.querySelectorAll('thead th'));
      const milestoneCols = new Set();
      let colIdx = 0;
      headerThs.forEach(th => {
        const span = parseInt(th.getAttribute('colspan') || '1', 10);
        if (th.classList.contains('th-milestone')) {
          for (let i = 0; i < span; i++) milestoneCols.add(colIdx + i);
        }
        colIdx += span;
      });

      ganttTable.querySelectorAll('tbody tr').forEach(tr => {
        let cellCol = 0;
        const hasOwner = tr.querySelector('.gantt-owner-cell');
        if (!hasOwner) cellCol = 1; // Start after owner cell if omitted due to rowspan
        Array.from(tr.children).forEach(td => {
          const span = parseInt(td.getAttribute('colspan') || '1', 10);
          let isMilestone = false;
          for (let i = 0; i < span; i++) {
            if (milestoneCols.has(cellCol + i)) {
              isMilestone = true;
              break;
            }
          }
          if (isMilestone) td.classList.add('col-milestone-full');
          cellCol += span;
        });
      });
    } catch (e) {
      console.warn('Milestone column coloring error:', e);
    }

    function applyGanttFilters() {
      // Toggle semester class on the table container
      const container = document.getElementById('view-container-matrix');
      if (container) {
        container.classList.remove('gantt-sem-1', 'gantt-sem-2');
        if (currentSem === '1') container.classList.add('gantt-sem-1');
        else if (currentSem === '2') container.classList.add('gantt-sem-2');
      }

      const rows = ganttTable.querySelectorAll('tbody tr');
      rows.forEach(tr => {
        const rowOwner = (tr.getAttribute('data-owner') || '').toLowerCase();
        const rowText = tr.textContent.toLowerCase();

        const ownerMatch = currentOwner === 'all' || rowOwner.includes(currentOwner.toLowerCase());
        const searchMatch = !searchQuery.trim() || rowText.includes(searchQuery.toLowerCase());

        tr.classList.toggle('gantt-row-hidden', !(ownerMatch && searchMatch));
      });

      // Filter card blocks too
      document.querySelectorAll('.gantt-card-block').forEach(block => {
        const blockOwner = (block.getAttribute('data-owner') || '').toLowerCase();
        const ownerOk = currentOwner === 'all' || blockOwner.includes(currentOwner.toLowerCase());
        let hasVisible = false;

        block.querySelectorAll('.gantt-task-item').forEach(item => {
          const s1 = item.getAttribute('data-sem1') === 'true';
          const s2 = item.getAttribute('data-sem2') === 'true';
          const sem = currentSem === 'all' || (currentSem === '1' ? s1 : s2);
          const search = !searchQuery.trim() || item.textContent.toLowerCase().includes(searchQuery.toLowerCase());
          const show = sem && search;
          item.style.display = show ? 'block' : 'none';
          if (show) hasVisible = true;
        });

        block.style.display = ownerOk && hasVisible ? 'block' : 'none';
      });
    }

    // Gantt Task Box Hover Inspector
    const inspectorTitle = document.getElementById('inspector-task-title');
    const inspectorOwner = document.getElementById('inspector-task-owner');
    const inspectorPeriod = document.getElementById('inspector-task-period');

    ganttTable.querySelectorAll('.gantt-task-box').forEach(box => {
      box.addEventListener('mouseenter', () => {
        const task = box.getAttribute('data-task');
        const owner = box.getAttribute('data-owner');
        const period = box.getAttribute('data-period');

        if (inspectorTitle) inspectorTitle.textContent = task;
        if (inspectorOwner) {
          inspectorOwner.textContent = '👤 ' + owner;
          inspectorOwner.style.display = 'inline-block';
        }
        if (inspectorPeriod) {
          inspectorPeriod.textContent = '⏱️ ' + period;
          inspectorPeriod.style.display = 'inline-block';
        }
      });
    });

    semFilterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        semFilterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSem = btn.getAttribute('data-sem');
        applyGanttFilters();
      });
    });

    ownerFilterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        ownerFilterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentOwner = btn.getAttribute('data-owner');
        applyGanttFilters();
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        applyGanttFilters();
      });
    }

    applyGanttFilters();
  }

  // ── Task Detail Modal ───────────────────────────────────────────
  const taskModal = document.getElementById('task-detail-modal');
  if (taskModal) {
    const modalTitle = document.getElementById('modal-task-title');
    const modalOwner = document.getElementById('modal-task-owner');
    const modalNotes = document.getElementById('modal-task-notes');
    const modalCloseBtn = taskModal.querySelector('.modal-close');

    document.querySelectorAll('.gantt-clickable-row').forEach(row => {
      row.addEventListener('click', () => {
        if (modalTitle) modalTitle.textContent = row.getAttribute('data-title') || 'Task Item';
        if (modalOwner) modalOwner.textContent = `Owner: ${row.getAttribute('data-owner') || 'Team'}`;
        if (modalNotes) modalNotes.textContent = row.getAttribute('data-notes') || 'Standard deliverable milestone.';
        taskModal.classList.add('open');
        window.renderMath();
      });
    });

    taskModal.addEventListener('click', (e) => {
      if (e.target === taskModal || e.target === modalCloseBtn) {
        taskModal.classList.remove('open');
      }
    });
  }

  // ── State-of-the-Art Airfield Inspection Reference Systems Modal ────
  const sysModal = document.getElementById('system-detail-modal');
  if (sysModal) {
    const modalBadge = document.getElementById('sys-modal-badge');
    const modalMaker = document.getElementById('sys-modal-maker');
    const modalTitle = document.getElementById('sys-modal-title');
    const modalSubtitle = document.getElementById('sys-modal-subtitle');
    const modalImg = document.getElementById('sys-modal-img');
    const modalCaption = document.getElementById('sys-modal-caption');
    const modalPrinciple = document.getElementById('sys-modal-principle');
    const modalTech = document.getElementById('sys-modal-tech');
    const modalFeatures = document.getElementById('sys-modal-features');
    const modalLimitations = document.getElementById('sys-modal-limitations');
    const modalAdvantage = document.getElementById('sys-modal-advantage');
    const modalCloseBtn = document.getElementById('system-modal-close');

    const referenceSystemsData = {
      tarsier: {
        name: "QinetiQ Tarsier",
        maker: "QinetiQ (United Kingdom)",
        badge: "Stationary MMW Radar",
        badgeClass: "badge-blue",
        subtitle: "Stationary Millimeter-Wave Radar & PTZ Optical Surveillance Tower",
        img: "../../assets/Tarsier_System.jpg",
        caption: "Figure 3.1: QinetiQ Tarsier stationary millimeter-wave radar tower installed on airside infrastructure.",
        principle: "Uses fixed tower-mounted millimeter-wave radar to continuously sweep active runway surfaces in all weather conditions. When a radar echo indicates potential debris, the system automatically commands co-located high-resolution Pan-Tilt-Zoom (PTZ) optical cameras to slew to the target coordinates.",
        tech: "Stationary Millimeter-Wave Radar (E/W Band: 94.5 GHz) paired with high-definition daylight and infrared PTZ optical cameras with automated coordinate handoff.",
        features: [
          "High all-weather resilience: operates reliably in fog, rain, snow, and total darkness.",
          "Instant runway clearance check: continuous surface monitoring without obstructing aircraft movements.",
          "Automated PTZ cueing: cameras immediately slew to radar coordinates for remote controller verification.",
          "Proven international deployments: London Heathrow, Vancouver International, and Doha Hamad."
        ],
        limitations: [
          "High ground clutter sensitivity: pavement joints, runway grooving, surface texture, and rubber deposits cause frequent radar reflections.",
          "Needs optical feed for classification: radar alone cannot determine if an echo is a metallic bolt, organic debris, or a bird.",
          "Radar shadow zones: elevation changes or airfield structures can create blind spots along rolling runways.",
          "High infrastructure footprint: requires tall stationary towers with complex trenching and fiber runs."
        ],
        advantage: "Runway Patrol eliminates fixed-tower blind spots and civil infrastructure costs by utilizing an agile aerial scout (UAV) with RTK-GNSS and close-range LiDAR + computer vision, paired with an autonomous ground rover (UGV) that physically vacuums up the debris."
      },
      fodetect: {
        name: "Xsight Systems FODetect & RunWize",
        maker: "Xsight Systems (Israel)",
        badge: "Runway Edge-Light Hybrid",
        badgeClass: "badge-purple",
        subtitle: "Distributed Surface Detection Units (SDUs) Co-located with Runway Edge Lights",
        img: "../../assets/FODetect_Edge_Light.jpg",
        caption: "Figure 3.2: Xsight FODetect Surface Detection Units integrated directly into runway edge lights.",
        principle: "Colocates miniaturized hybrid radar and near-infrared optical sensors directly inside standard runway edge-light fixtures spaced every 30 to 50 meters along the full runway margin. Built-in laser illuminators physically project a red targeting beam onto detected debris on the asphalt to guide ground crews during night remediation.",
        tech: "Hybrid sensor payload combining 77 GHz Millimeter-Wave Radar, Near-Infrared (NIR) optical sensors, and an integrated targeting laser pointer.",
        features: [
          "Zero runway blind spots: continuous cross-runway line-of-sight from distributed fixtures along both pavement margins.",
          "Built-in laser illuminator: physically projects a visible beam onto the asphalt to direct manual retrieval crews at night.",
          "Multi-sensor verification: combines radar detection with close-proximity optical verification.",
          "Certified international deployments: operational at Boston Logan, Paris Charles de Gaulle, and Tel Aviv Ben Gurion."
        ],
        limitations: [
          "Extremely hardware-intensive deployment: requires hundreds of specialized sensor modules along a 4–5 km runway.",
          "High initial civil and maintenance cost: edge-light units are exposed to jet blast, snowplow damage, and grass-cutting hazards.",
          "Optical sensor degradation: near-IR camera lenses suffer from mud, water splashing, and severe tropical monsoon downpours."
        ],
        advantage: "Runway Patrol replaces hundreds of fragile, expensive edge-light sensors with a mobile, flexible UAV-UGV collaborative team that scans the full 60m runway strip from above without any runway modification or civil trenching."
      },
      iferret: {
        name: "NCS / CAG iFerret™ 2.0",
        maker: "Stratech Systems / NCS / Changi Airport Group (Singapore)",
        badge: "Stationary Electro-Optical AI",
        badgeClass: "badge-emerald",
        subtitle: "High-Definition Electro-Optical Camera Arrays & Deep Learning AI Analytics",
        img: "../../assets/iFerret2.0.webp",
        caption: "Figure 3.3: iFerret™ 2.0 Electro-Optical PTZ sensor array deployed for airside surveillance.",
        principle: "Intelligent electro-optical surveillance architecture utilizing fixed tower-mounted high-definition visual sensor arrays paired with proprietary computer vision analytics and deep learning models to identify, track, and classify runway anomalies.",
        tech: "Stationary High-Definition daylight & low-light Electro-Optical Camera Arrays paired with centralized AI pattern recognition servers.",
        features: [
          "Zero RF emissions & zero EMI: completely passive optical sensing guarantees zero electromagnetic interference with aircraft avionics or ATC communications.",
          "Superior visual object classification: provides high-resolution color imagery clearly showing object shape, material, and dimensions.",
          "Homegrown & proven: developed in Singapore and operational across Singapore Changi Airport runways."
        ],
        limitations: [
          "High weather vulnerability: optical detection range and accuracy degrade severely in tropical monsoon rains, dense haze, fog, or snow.",
          "Visual false alarms: moving aircraft shadows, tarmac heat shimmer, and standing water reflections frequently trigger false positives.",
          "Stationary vantage limitations: fixed tower angles result in foreshortening and obstruction by taxiing aircraft."
        ],
        advantage: "Runway Patrol pairs high-speed aerial vision with ground-level 3D LiDAR (Livox Mid-360) and multi-modal sensor fusion, eliminating shadow false alarms and ensuring robust verification even in challenging lighting conditions."
      },
      fodfinder: {
        name: "Trex Aviation FOD Finder Mobile",
        maker: "Trex Enterprises (United States)",
        badge: "Vehicle-Mounted Radar",
        badgeClass: "badge-amber",
        subtitle: "Vehicle-Mounted 78–81 GHz MMW Radar Inspection & Geotagging Platform",
        img: "../../assets/FOD_Finder_Mobile.png",
        caption: "Figure 3.4: Trex Aviation FOD Finder Mobile truck-mounted MMW radar inspection platform.",
        principle: "Mounts a specialized 78–81 GHz millimeter-wave radar antenna on the front roof of an inspection vehicle, scanning the runway while driving at speeds up to 50 km/h. Coordinates of detected debris are geotagged to 1.5 m accuracy, with an optional rear vacuum for single-pass pickup.",
        tech: "Vehicle-mounted 78–81 GHz Millimeter-Wave FMCW Radar, high-accuracy GPS geotagging receiver, and optional truck-mounted vacuum collection module.",
        features: [
          "FAA mobile-approved equipment standard under FAA Advisory Circular AC 150/5220-24.",
          "Integrated vacuum option: enables single-pass detection and immediate physical removal.",
          "Low fixed infrastructure cost: zero airside tower construction or ground cabling needed."
        ],
        limitations: [
          "Intermittent monitoring: inspection is strictly periodic (limited to patrol intervals); runway remains unmonitored between sweeps.",
          "High operational manpower: requires continuous dedicated human drivers navigating across active runways.",
          "Runway slot consumption: occupies full runway traffic windows, competing directly with scheduled aircraft departures."
        ],
        advantage: "Runway Patrol achieves 100% autonomous operation with zero human driver requirement, performing swift aerial scans in minutes and cueing an autonomous electric rover that transits precisely to the target without tying up valuable airside personnel."
      },
      elva1: {
        name: "ELVA-1 Scanning Radar Sensor",
        maker: "ELVA-1 Millimeter Wave (European Union)",
        badge: "Stationary FMCW Radar",
        badgeClass: "badge-purple",
        subtitle: "Long-Range 76.5 GHz Dual-Dish Scanning Radar Sensor Unit",
        img: "../../assets/ELVA_1_Radar.jpg",
        caption: "Figure 3.5: ELVA 1 dual-dish 76 GHz scanning radar sensor unit.",
        principle: "Utilizes dual parabolic reflector dishes operating at 76.5 GHz to perform double-azimuth mechanical scanning over a 200° sector, providing long-distance foreign object detection across runway and tarmac surfaces up to 1,000 meters away.",
        tech: "76.5 GHz Frequency Modulated Continuous Wave (FMCW) radar with dual-dish narrow pencil beam and mechanical azimuth positioning.",
        features: [
          "Exceptionally long range: covers up to 1,000 m radius per radar unit, minimizing the total number of sensor installations.",
          "Ultra-low RF power emissions: emits < 10 mW, ensuring zero interference with airport navigation aids or avionic systems.",
          "Compact footprint: dual-dish assembly can be mounted on low frangible masts adjacent to runway strips."
        ],
        limitations: [
          "Slow sweep cycle: requires approximately 3 minutes for a complete double-azimuth scan, significantly slower than competing 60–90 second systems.",
          "Relies on optical add-on: requires an auxiliary PTZ camera system for optical verification before maintenance crews can be dispatched.",
          "Mechanical wear: continuously rotating mechanical dish assemblies face increased maintenance in harsh outdoor climates."
        ],
        advantage: "Runway Patrol avoids slow mechanical scan cycles by using agile UAV aerial sweeps at 30–40 km/h with wide-angle edge machine vision, achieving full runway scanning in minutes and instantaneous target coordinate dispatch."
      }
    };

    document.querySelectorAll('.reference-system-card').forEach(card => {
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        const sysId = card.getAttribute('data-system-id');
        const data = referenceSystemsData[sysId];
        if (!data) return;

        if (modalBadge) {
          modalBadge.textContent = data.badge;
          modalBadge.className = `badge ${data.badgeClass || 'badge-blue'}`;
        }
        if (modalMaker) modalMaker.textContent = data.maker;
        if (modalTitle) modalTitle.textContent = data.name;
        if (modalSubtitle) modalSubtitle.textContent = data.subtitle;
        if (modalImg) {
          modalImg.src = data.img;
          modalImg.alt = data.name;
        }
        if (modalCaption) modalCaption.textContent = data.caption;
        if (modalPrinciple) modalPrinciple.textContent = data.principle;
        if (modalTech) modalTech.textContent = data.tech;

        if (modalFeatures) {
          modalFeatures.innerHTML = data.features.map(f => `<li>${f}</li>`).join('');
        }
        if (modalLimitations) {
          modalLimitations.innerHTML = data.limitations.map(l => `<li>${l}</li>`).join('');
        }
        if (modalAdvantage) modalAdvantage.textContent = data.advantage;

        sysModal.classList.add('open');
        window.renderMath();
      });
    });

    sysModal.addEventListener('click', (e) => {
      if (e.target === sysModal || e.target === modalCloseBtn) {
        sysModal.classList.remove('open');
      }
    });
  }

  // ── Image Lightbox ──────────────────────────────────────────────
  const lb = document.createElement('div');
  lb.className = 'lightbox-modal';
  lb.innerHTML = '<span class="lightbox-close">&times;</span><img class="lightbox-content" src="" alt="Enlarged"><div class="lightbox-caption"></div>';
  document.body.appendChild(lb);

  const lbImg = lb.querySelector('.lightbox-content');
  const lbCaption = lb.querySelector('.lightbox-caption');
  const lbClose = lb.querySelector('.lightbox-close');

  document.querySelectorAll('.img-zoomable, .figure-card img').forEach(img => {
    img.addEventListener('click', () => {
      if (img.closest('.reference-system-card')) return; // handled by system detail modal
      lb.classList.add('open');
      lbImg.src = img.src;
      lbCaption.textContent = img.alt || '';
    });
  });

  lb.addEventListener('click', (e) => {
    if (e.target === lb || e.target === lbClose) lb.classList.remove('open');
  });

  // ESC key to close modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      lb.classList.remove('open');
      if (taskModal) taskModal.classList.remove('open');
      if (sysModal) sysModal.classList.remove('open');
    }
  });
});
