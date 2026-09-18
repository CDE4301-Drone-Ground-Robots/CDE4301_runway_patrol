/**
 * FOD Hunter Interim Report - Interactive Dashboard
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

  // ── Auto-highlight Active Nav Link (Legacy Sidebars) ─────────────
  const currentPath = window.location.pathname;
  const currentFile = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html';
  document.querySelectorAll('.nav-link, .nav-sub-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href) {
      const linkFile = href.substring(href.lastIndexOf('/') + 1);
      if (linkFile && (linkFile === currentFile || (currentFile === '' && linkFile === 'index.html'))) {
        link.classList.add('active');
        const parentSub = link.closest('.nav-sub-list');
        if (parentSub) parentSub.style.display = 'flex';
      }
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

  // ── Apple Watch Concentric Activity Rings Animation ───────────────
  const ringsSvg = document.querySelector('.apple-rings-svg');
  if (ringsSvg) {
    const ringIds = ['ring-1', 'ring-2', 'ring-3', 'ring-4', 'ring-5', 'ring-6'];
    const ringObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          ringIds.forEach((id, index) => {
            const ring = document.getElementById(id);
            if (ring) {
              setTimeout(() => {
                ring.style.transition = 'stroke-dashoffset 1.8s cubic-bezier(0.16, 1, 0.3, 1)';
                ring.style.strokeDashoffset = '0';
              }, index * 120);
            }
          });
          ringObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    ringObserver.observe(ringsSvg);
  }

  // ── Member Scopes Tinder 3D Stack Deck & Swipe-Down Details ───────
  const deckContainer = document.getElementById('tinder-deck-container');
  if (deckContainer) {
    const cards = Array.from(deckContainer.querySelectorAll('.member-scope-card'));
    const prevBtn = document.getElementById('tinder-prev-btn');
    const nextBtn = document.getElementById('tinder-next-btn');
    const currNumEl = document.getElementById('tinder-curr-num');
    const currNameEl = document.getElementById('tinder-curr-name');

    const totalCards = cards.length;
    let currentIndex = 0;
    let isAnimating = false;

    // Names map for counter
    const memberNames = cards.map(c => {
      const nameEl = c.querySelector('.member-card-name');
      return nameEl ? nameEl.textContent.trim() : '';
    });

    // Update stack visual classes according to currentIndex
    function updateStackClasses() {
      const leftIndex = (currentIndex - 1 + totalCards) % totalCards;
      const rightIndex = (currentIndex + 1) % totalCards;

      cards.forEach((card, index) => {
        // ALWAYS clear inline transform & transition so drag or hover never freezes/displaces the card
        card.style.transform = '';
        card.style.transition = '';

        // Remove old position and state classes
        card.classList.remove('fan-center', 'fan-left', 'fan-right', 'fan-hidden', 'expanded');

        // Reset details toggle buttons
        const swipeBtn = card.querySelector('.swipe-down-pill');
        if (swipeBtn) {
          swipeBtn.setAttribute('aria-expanded', 'false');
          const chevron = swipeBtn.querySelector('.swipe-chevron');
          if (chevron) chevron.textContent = '↓';
          const label = swipeBtn.querySelector('span:first-child');
          if (label) label.textContent = 'Scope Details';
        }

        if (index === currentIndex) {
          // Center flat active card
          card.classList.add('fan-center');
        } else if (index === leftIndex) {
          // Left tilted card
          card.classList.add('fan-left');
        } else if (index === rightIndex) {
          // Right tilted card
          card.classList.add('fan-right');
        } else {
          // Hidden back cards
          card.classList.add('fan-hidden');
        }
      });

      const cardsStack = document.getElementById('tinder-cards-stack');
      if (cardsStack) cardsStack.classList.remove('is-expanded');

      // Update counter UI
      if (currNumEl) currNumEl.textContent = currentIndex + 1;
      if (currNameEl && memberNames[currentIndex]) currNameEl.textContent = memberNames[currentIndex];
    }

    // Swipe Next (Right card rotates into center)
    function swipeNext() {
      if (isAnimating) return;
      isAnimating = true;
      currentIndex = (currentIndex + 1) % totalCards;
      updateStackClasses();
      setTimeout(() => {
        isAnimating = false;
      }, 420);
    }

    // Swipe Prev (Left card rotates into center)
    function swipePrev() {
      if (isAnimating) return;
      isAnimating = true;
      currentIndex = (currentIndex - 1 + totalCards) % totalCards;
      updateStackClasses();
      setTimeout(() => {
        isAnimating = false;
      }, 420);
    }

    // Button event listeners
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        swipeNext();
      });
    }
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        swipePrev();
      });
    }

    // Keyboard navigation: Left/Right arrows
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') swipeNext();
      else if (e.key === 'ArrowLeft') swipePrev();
    });

    // Expand / Collapse Scope Details and direct card click handlers
    cards.forEach((card) => {
      const swipeBtn = card.querySelector('.swipe-down-pill');
      const collapseBtn = card.querySelector('.collapse-details-btn');
      const portraitFrame = card.querySelector('.member-portrait-frame');

      function toggleDetails(e) {
        if (e) {
          e.stopPropagation();
          e.preventDefault();
        }
        // Only allow toggle if this card is the active center card
        if (!card.classList.contains('fan-center')) return;
        const isExpanded = card.classList.toggle('expanded');
        const cardsStack = document.getElementById('tinder-cards-stack');
        if (cardsStack) cardsStack.classList.toggle('is-expanded', isExpanded);
        if (swipeBtn) {
          swipeBtn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
          const chevron = swipeBtn.querySelector('.swipe-chevron');
          if (chevron) chevron.textContent = isExpanded ? '↑' : '↓';
          const label = swipeBtn.querySelector('span:first-child');
          if (label) label.textContent = isExpanded ? 'Hide Details' : 'Scope Details';
        }
      }

      function collapseDetails(e) {
        if (e) {
          e.stopPropagation();
          e.preventDefault();
        }
        card.classList.remove('expanded');
        const cardsStack = document.getElementById('tinder-cards-stack');
        if (cardsStack) cardsStack.classList.remove('is-expanded');
        if (swipeBtn) {
          swipeBtn.setAttribute('aria-expanded', 'false');
          const chevron = swipeBtn.querySelector('.swipe-chevron');
          if (chevron) chevron.textContent = '↓';
          const label = swipeBtn.querySelector('span:first-child');
          if (label) label.textContent = 'Scope Details';
        }
      }

      if (swipeBtn) swipeBtn.addEventListener('click', toggleDetails);
      if (portraitFrame) portraitFrame.addEventListener('click', toggleDetails);
      if (collapseBtn) collapseBtn.addEventListener('click', collapseDetails);

      // Clicking on left or right fanned card brings it into active focus
      card.addEventListener('click', (e) => {
        if (card.classList.contains('fan-left')) {
          e.stopPropagation();
          swipePrev();
        } else if (card.classList.contains('fan-right')) {
          e.stopPropagation();
          swipeNext();
        }
      });

      // Prevent card swipe or toggle when interacting with social links
      card.querySelectorAll('.member-social-link').forEach((link) => {
        link.addEventListener('click', (e) => e.stopPropagation());
      });
    });

    // Unified Touch & Mouse Gesture Swipe Controller on Active Card
    let dragStartX = 0;
    let dragStartY = 0;
    let dragCurrX = 0;
    let dragCurrY = 0;
    let isDragging = false;
    let activeCard = null;

    function handleStart(clientX, clientY, target) {
      if (isAnimating) return;
      // Do not initiate drag if interacting with buttons, links, or drawer content
      if (target.closest('button, a, input, .member-scope-details')) return;
      activeCard = deckContainer.querySelector('.member-scope-card.fan-center');
      if (!activeCard) return;

      isDragging = true;
      dragStartX = clientX;
      dragStartY = clientY;
      dragCurrX = clientX;
      dragCurrY = clientY;
      activeCard.style.transition = 'none';
    }

    function handleMove(clientX, clientY) {
      if (!isDragging || !activeCard) return;
      dragCurrX = clientX;
      dragCurrY = clientY;
      const deltaX = dragCurrX - dragStartX;
      const deltaY = dragCurrY - dragStartY;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        const rotation = deltaX * 0.07;
        activeCard.style.transform = `translate3d(${deltaX}px, ${deltaY * 0.15}px, 0) rotate(${rotation}deg)`;
      }
    }

    function handleEnd() {
      if (!isDragging || !activeCard) return;
      isDragging = false;
      const currentCard = activeCard;
      activeCard = null;

      currentCard.style.transition = '';
      currentCard.style.transform = '';

      const deltaX = dragCurrX - dragStartX;
      const deltaY = dragCurrY - dragStartY;

      // Horizontal swipe threshold (> 60px)
      if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX < 0) {
          swipeNext();
        } else {
          swipePrev();
        }
      }
      // Vertical swipe down (> 50px) to reveal scope details
      else if (deltaY > 50 && Math.abs(deltaY) > Math.abs(deltaX)) {
        if (!currentCard.classList.contains('expanded')) {
          const pill = currentCard.querySelector('.swipe-down-pill');
          if (pill) pill.click();
        }
      }
      // Vertical swipe up (< -50px) to collapse
      else if (deltaY < -50 && Math.abs(deltaY) > Math.abs(deltaX)) {
        if (currentCard.classList.contains('expanded')) {
          const pill = currentCard.querySelector('.swipe-down-pill');
          if (pill) pill.click();
        }
      }
    }

    // Touch events on deckContainer
    deckContainer.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        handleStart(e.touches[0].clientX, e.touches[0].clientY, e.target);
      }
    }, { passive: true });

    deckContainer.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && isDragging) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    deckContainer.addEventListener('touchend', handleEnd, { passive: true });
    deckContainer.addEventListener('touchcancel', handleEnd, { passive: true });

    // Mouse drag-to-swipe for desktop
    deckContainer.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        handleStart(e.clientX, e.clientY, e.target);
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (isDragging) {
        handleMove(e.clientX, e.clientY);
      }
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        handleEnd();
      }
    });

    // Initialize stack state cleanly
    updateStackClasses();
  }

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
    const modalImgBox = document.getElementById('sys-modal-images');
    const modalSingleImg = document.getElementById('sys-modal-img');
    const modalCaption = document.getElementById('sys-modal-caption');
    const modalPrinciple = document.getElementById('sys-modal-principle');
    const modalFeatures = document.getElementById('sys-modal-features');
    const modalLimitations = document.getElementById('sys-modal-limitations');
    const modalAdvantage = document.getElementById('sys-modal-advantage');
    const modalCloseBtn = document.getElementById('system-modal-close');

    const referenceSystemsData = {
      tarsier: {
        name: "1. QinetiQ Tarsier (Stationary MMW Radar)",
        maker: "QinetiQ (United Kingdom)",
        badge: "Stationary MMW Radar",
        badgeClass: "badge-blue",
        subtitle: "Stationary Millimeter-Wave Radar Tower & Integrated PTZ Cameras",
        images: [
          { src: "assets/Tarsier_System.jpg", alt: "Tarsier System Tower", style: "max-height: 250px; width: auto; max-width: 100%; border-radius: 6px;" }
        ],
        caption: "Figure 3.1: QinetiQ Tarsier stationary millimeter-wave radar tower installed on airside infrastructure.",
        principle: "Uses fixed tower-mounted millimeter-wave radar to continuously sweep active runway surfaces.",
        features: [
          "Integrated PTZ optical cameras automatically pan to radar coordinates to provide live visual verification for airside traffic controllers."
        ],
        limitations: [
          "Radar signals alone cannot classify debris types and remain sensitive to ground clutter from pavement joints and texture."
        ],
        advantage: "FOD Hunter eliminates stationary radar tower ground clutter and shadow zones by employing an agile aerial scout (UAV) with multi-sensor fusion, paired with an autonomous ground rover (UGV) for physical vacuum remediation."
      },
      fodetect: {
        name: "2. Xsight Systems FODetect & RunWize (Edge-Light Hybrid)",
        maker: "Xsight Systems (Israel)",
        badge: "Edge-Light Hybrid",
        badgeClass: "badge-purple",
        subtitle: "Distributed Surface Detection Units (SDUs) Co-located in Runway Edge Lights",
        images: [
          { src: "assets/FODetect_Edge_Light.jpg", alt: "FODetect Edge Light Unit", style: "max-height: 200px; width: 48%; object-fit: cover; border-radius: 6px;" },
          { src: "assets/FODetect_Deployments.jpg", alt: "FODetect Global Deployments", style: "max-height: 200px; width: 48%; object-fit: cover; border-radius: 6px;" }
        ],
        caption: "Figure 3.2: Xsight FODetect Surface Detection Units integrated into runway edge lights across international airfields.",
        principle: "Surface Detection Units (SDUs) co-located directly inside runway edge-light fixtures along the pavement margin.",
        features: [
          "Built-in laser illuminator physically points to detected debris on the asphalt to guide manual retrieval crews at night."
        ],
        limitations: [
          "Requires dense, hardware-intensive deployment along the full runway length, raising installation and maintenance overhead."
        ],
        advantage: "FOD Hunter eliminates hundreds of fragile edge-light fixtures and high civil installation costs by using a mobile, coordinated UAV-UGV system that requires zero runway infrastructure modifications."
      },
      iferret: {
        name: "3. NCS / Changi Airport Group iFerret™ 2.0 (Electro-Optical AI)",
        maker: "NCS / Changi Airport Group (Singapore)",
        badge: "Electro-Optical AI",
        badgeClass: "badge-emerald",
        subtitle: "High-Definition Visual Sensor Arrays Paired with Deep Learning AI Analytics",
        images: [
          { src: "assets/iFerret2.0.webp", alt: "iFerret 2.0 Electro-Optical System", style: "max-height: 250px; width: auto; max-width: 100%; border-radius: 6px;" }
        ],
        caption: "Figure 3.3: iFerret™ 2.0 Electro-Optical PTZ sensor array deployed for airside surveillance.",
        principle: "Intelligent electro-optical system utilizing high-definition visual sensor arrays paired with deep learning analytics.",
        features: [
          "Completely passive sensing with zero RF emissions, guaranteeing zero electromagnetic interference with aircraft avionics."
        ],
        limitations: [
          "Detection accuracy drops significantly during heavy rain, dense fog, or snowstorms, and suffers from shadow-induced false positives."
        ],
        advantage: "FOD Hunter complements high-resolution optical vision with active 3D LiDAR (Livox Mid-360) and multi-spectral sensors, eliminating false positives caused by tarmac shadows or monsoonal rain."
      },
      fodfinder: {
        name: "4. Trex Aviation FOD Finder Mobile (Vehicle-Mounted Radar)",
        maker: "Trex Aviation (United States)",
        badge: "Vehicle-Mounted Radar",
        badgeClass: "badge-amber",
        subtitle: "Vehicle-Mounted 78–81 GHz MMW Radar Inspection Platform with 1.5m Geotagging",
        images: [
          { src: "assets/FOD_Finder_Mobile.png", alt: "FOD Finder Mobile Vehicle", style: "max-height: 250px; width: auto; max-width: 100%; border-radius: 6px;" }
        ],
        caption: "Figure 3.4: Trex Aviation FOD Finder Mobile truck-mounted MMW radar inspection platform.",
        principle: "FAA-approved vehicle-mounted 78–81 GHz MMW radar scanning while driving at operational speeds up to 50 km/h with 1.5 m GPS geotagging.",
        features: [
          "Offers an optional truck-mounted vacuum collection module for single-pass detection and physical pickup."
        ],
        limitations: [
          "Scanning is intermittent (limited to patrol frequency) and requires continuous dedicated human drivers."
        ],
        advantage: "FOD Hunter achieves 100% autonomous operation without tying up human drivers or heavy service trucks, completing full aerial scans in minutes and cueing an autonomous electric rover to target locations."
      },
      elva1: {
        name: "5. ELVA 1 Scanning Radar Sensor (FMCW Radar)",
        maker: "ELVA 1 Millimeter Wave (European Union)",
        badge: "FMCW Radar",
        badgeClass: "badge-purple",
        subtitle: "Long-Range 76.5 GHz Dual-Dish FMCW Scanning Radar Sensor",
        images: [
          { src: "assets/ELVA_1_Radar.jpg", alt: "ELVA 1 Scanning Radar Sensor", style: "max-height: 250px; width: auto; max-width: 100%; border-radius: 6px;" }
        ],
        caption: "Figure 3.5: ELVA 1 dual-dish 76 GHz scanning radar sensor unit.",
        principle: "76.5 GHz FMCW radar with a 200° FOV covering up to 1,000 m radius per radar module.",
        features: [
          "Ultra-low RF power emissions with long-range coverage per sensor node."
        ],
        limitations: [
          "Takes 3 minutes for a complete double-azimuth scan, significantly slower than competing 60–90 second systems."
        ],
        advantage: "FOD Hunter provides instantaneous continuous aerial coverage at 30–40 km/h flight velocities, bypassing slow mechanical dish rotation and delivering immediate target coordinates to ground units."
      }
    };

    const closeSysModal = () => {
      sysModal.classList.remove('open');
      document.body.style.overflow = '';
    };

    document.querySelectorAll('.reference-system-card').forEach(card => {
      card.addEventListener('click', (e) => {
        e.preventDefault();
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

        // Render image(s)
        if (modalImgBox) {
          modalImgBox.innerHTML = data.images.map(img => `
            <img src="${img.src}" alt="${img.alt}" style="${img.style || 'max-height: 240px; max-width: 100%; border-radius: 6px;'}">
          `).join('');
        } else if (modalSingleImg && data.images.length > 0) {
          modalSingleImg.src = data.images[0].src;
          modalSingleImg.alt = data.images[0].alt;
        }

        if (modalCaption) modalCaption.textContent = data.caption;
        if (modalPrinciple) modalPrinciple.textContent = data.principle;

        if (modalFeatures) {
          modalFeatures.innerHTML = data.features.map(f => `<li>${f}</li>`).join('');
        }
        if (modalLimitations) {
          modalLimitations.innerHTML = data.limitations.map(l => `<li>${l}</li>`).join('');
        }
        if (modalAdvantage) modalAdvantage.textContent = data.advantage;

        sysModal.classList.add('open');
        document.body.style.overflow = 'hidden';
        if (window.renderMath) window.renderMath();
      });
    });

    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeSysModal();
      });
    }

    sysModal.addEventListener('click', (e) => {
      if (e.target === sysModal) {
        closeSysModal();
      }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sysModal.classList.contains('open')) {
        closeSysModal();
      }
    });
  }

  // ── Universal Return to Top Floating Button ──────────────────────
  (function initBackToTop() {
    if (document.getElementById('apple-back-to-top')) return;
    const btn = document.createElement('button');
    btn.id = 'apple-back-to-top';
    btn.className = 'apple-back-to-top';
    btn.setAttribute('aria-label', 'Return to top');
    btn.setAttribute('title', 'Return to top');
    btn.innerHTML = '<span class="arrow">↑</span><span>Return to Top</span>';
    document.body.appendChild(btn);

    window.addEventListener('scroll', () => {
      if (window.scrollY > 280) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    }, { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  })();

  // ── Apple Watch Concentric Activity Rings (1-introduction.html) ──
  const ringsWidget = document.querySelector('.apple-rings-card');
  if (ringsWidget) {
    const ringOuter = document.getElementById('ring-outer');
    const ringMid = document.getElementById('ring-mid');
    const ringInner = document.getElementById('ring-inner');
    const pillOuter = document.getElementById('pill-outer');
    const pillMid = document.getElementById('pill-mid');
    const pillInner = document.getElementById('pill-inner');

    const animateRings = () => {
      // All Phase 1 deliverables are 100% complete
      if (ringOuter) ringOuter.style.strokeDashoffset = '0';
      if (ringMid) ringMid.style.strokeDashoffset = '0';
      if (ringInner) ringInner.style.strokeDashoffset = '0';
      setTimeout(() => {
        if (pillOuter) pillOuter.classList.add('visible');
        if (pillMid) pillMid.classList.add('visible');
        if (pillInner) pillInner.classList.add('visible');
      }, 700);
    };

    if ('IntersectionObserver' in window) {
      const ringObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateRings();
            ringObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.25 });
      ringObserver.observe(ringsWidget);
    } else {
      setTimeout(animateRings, 400);
    }
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

  // ── Apple Subsystem Hardware Tabs ───────────────────────────
  const tabBtns = document.querySelectorAll('.apple-tab-btn');
  const tabPanes = document.querySelectorAll('.apple-tab-pane');
  if (tabBtns.length > 0) {
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const activePane = document.getElementById('tab-' + targetTab);
        if (activePane) activePane.classList.add('active');
      });
    });
  }

  // ── Apple Mobile Drawer Toggle ──────────────────────────────
  const mobileToggle = document.getElementById('apple-mobile-toggle');
  const mobileDrawer = document.getElementById('apple-mobile-drawer');
  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener('click', () => {
      mobileDrawer.classList.toggle('active');
    });
  }

  // ── Apple Top Navigation & Mega Menu Dropdowns ──────────────
  const appleNav = document.querySelector('.apple-nav');
  if (appleNav) {
    // Determine path prefix based on relative depth to root (counting ../)
    const styleLink = document.querySelector('link[href*="css/styles.css"]');
    let prefix = '';
    if (styleLink) {
      const href = styleLink.getAttribute('href') || '';
      const matches = href.match(/\.\.\//g);
      prefix = matches ? matches.join('') : '';
    }

    // 1. Normalize Top Nav Links: Remove Simulation, Add 7. Documentation
    const navLinksList = appleNav.querySelector('.apple-nav-links');
    if (navLinksList) {
      const isDocActive = window.location.pathname.includes('7-documentation.html') || window.location.pathname.includes('/7-documentation/');
      let hasDocsLink = false;

      navLinksList.querySelectorAll('li').forEach(li => {
        const a = li.querySelector('a');
        if (!a) return;
        const text = a.textContent.trim();
        const href = a.getAttribute('href') || '';
        
        // Remove standalone "Simulation" link from top navbar
        if (text === 'Simulation' || href.includes('simulation.html')) {
          a.href = `${prefix}7-documentation.html`;
          a.textContent = '7. Documentation';
          if (isDocActive) a.classList.add('active');
          hasDocsLink = true;
        } else if (text.includes('7. Documentation') || href.includes('7-documentation.html')) {
          hasDocsLink = true;
          if (isDocActive) a.classList.add('active');
        }
      });

      if (!hasDocsLink) {
        const docLi = document.createElement('li');
        docLi.innerHTML = `<a href="${prefix}7-documentation.html" class="apple-nav-link ${isDocActive ? 'active' : ''}">7. Documentation</a>`;
        navLinksList.appendChild(docLi);
      }
    }

    // Normalize Mobile Drawer
    const mobileDrawer = document.getElementById('apple-mobile-drawer');
    if (mobileDrawer) {
      mobileDrawer.querySelectorAll('a').forEach(a => {
        if (a.textContent.includes('Simulation') || (a.getAttribute('href') || '').includes('simulation.html')) {
          a.href = `${prefix}7-documentation.html`;
          a.textContent = '7. Documentation';
        }
      });
    }

    // 2. Shared Backdrop Overlay
    let overlay = document.getElementById('apple-megamenu-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'apple-megamenu-overlay';
      overlay.className = 'apple-megamenu-overlay';
      document.body.appendChild(overlay);
    }

    // 3. Create Subsystems Mega Menu (Interactive Contextual Hover Flyout)
    let subsystemsMenu = document.getElementById('apple-megamenu-subsystems');
    if (!subsystemsMenu) {
      subsystemsMenu = document.createElement('div');
      subsystemsMenu.id = 'apple-megamenu-subsystems';
      subsystemsMenu.className = 'apple-megamenu';
      subsystemsMenu.innerHTML = `
        <div class="apple-megamenu-subsystems-inner">
          <!-- Primary Subsystems Col -->
          <div class="apple-megamenu-col">
            <div class="apple-megamenu-heading">Explore Subsystems</div>
            <a href="${prefix}4-subsystems/index.html" class="apple-megamenu-big-link" data-sub="overview">
              <span>Subsystems Overview</span>
              <span class="arrow">›</span>
            </a>
            <a href="${prefix}4-subsystems/mechanical.html" class="apple-megamenu-big-link" data-sub="mech">
              <span>4.1 Mechanical</span>
              <span class="arrow">›</span>
            </a>
            <a href="${prefix}4-subsystems/electrical.html" class="apple-megamenu-big-link" data-sub="elec">
              <span>4.2 Electrical</span>
              <span class="arrow">›</span>
            </a>
            <a href="${prefix}4-subsystems/programming.html" class="apple-megamenu-big-link" data-sub="prog">
              <span>4.3 Programming</span>
              <span class="arrow">›</span>
            </a>
            <a href="${prefix}4-subsystems/computer-vision.html" class="apple-megamenu-big-link" data-sub="vis">
              <span>4.4 Vision</span>
              <span class="arrow">›</span>
            </a>
          </div>

          <!-- Contextual Subsections Flyout (Right side) -->
          <div class="apple-megamenu-flyouts-container">
            <!-- Overview Flyout -->
            <div class="apple-megamenu-flyout" id="flyout-overview">
              <div class="apple-megamenu-heading">Subsystems Overview</div>
              <a href="${prefix}4-subsystems/index.html" class="apple-megamenu-sublink">
                Subsystem Architecture &amp; Integration Summary
              </a>
              <a href="${prefix}2-design-overview.html" class="apple-megamenu-sublink">
                Multi-Agent System Architecture
              </a>
              <a href="${prefix}index.html#subsystems-anchor" class="apple-megamenu-sublink">
                Hardware &amp; Software Integration Showcase
              </a>
            </div>

            <!-- 4.1 Mechanical Flyout -->
            <div class="apple-megamenu-flyout" id="flyout-mech">
              <div class="apple-megamenu-heading">4.1 Mechanical Architecture</div>
              <a href="${prefix}4-subsystems/mechanical.html" class="apple-megamenu-sublink">
                <span class="num">4.1.1</span> 6061-T6 Aluminum Chassis Framing
              </a>
              <a href="${prefix}4-subsystems/mechanical.html" class="apple-megamenu-sublink">
                <span class="num">4.1.2</span> High-Flow Intake Ground Effect Suction
              </a>
              <a href="${prefix}4-subsystems/mechanical.html" class="apple-megamenu-sublink">
                <span class="num">4.1.3</span> Differential Dual-Hub Motor Drive
              </a>
              <a href="${prefix}4-subsystems/mechanical.html" class="apple-megamenu-sublink">
                <span class="num">4.1.4</span> SolidWorks FEA Structural Stress Analysis
              </a>
            </div>

            <!-- 4.2 Electrical Flyout -->
            <div class="apple-megamenu-flyout" id="flyout-elec">
              <div class="apple-megamenu-heading">4.2 Electrical &amp; Power</div>
              <a href="${prefix}4-subsystems/electrical.html" class="apple-megamenu-sublink">
                <span class="num">4.2.1</span> 48V Isolated Battery Power Bus
              </a>
              <a href="${prefix}4-subsystems/electrical.html" class="apple-megamenu-sublink">
                <span class="num">4.2.2</span> Dual-Channel ZLAC8015D Servo Driver
              </a>
              <a href="${prefix}4-subsystems/electrical.html" class="apple-megamenu-sublink">
                <span class="num">4.2.3</span> Synchronous DC-DC Buck Regulators
              </a>
              <a href="${prefix}4-subsystems/electrical.html" class="apple-megamenu-sublink">
                <span class="num">4.2.4</span> Hardware E-Stop &amp; Protection Circuitry
              </a>
            </div>

            <!-- 4.3 Programming Flyout -->
            <div class="apple-megamenu-flyout" id="flyout-prog">
              <div class="apple-megamenu-heading">4.3 Programming Architecture</div>
              <a href="${prefix}4-subsystems/programming.html#sec-4-3-1" class="apple-megamenu-sublink">
                <span class="num">4.3.1</span> ROS 2 Jazzy &amp; Compute Stack
              </a>
              <a href="${prefix}4-subsystems/programming.html#sec-4-3-2" class="apple-megamenu-sublink">
                <span class="num">4.3.2</span> Gazebo Simulation Benchmarking
              </a>
              <a href="${prefix}4-subsystems/programming.html#sec-4-3-3" class="apple-megamenu-sublink">
                <span class="num">4.3.3</span> Autonomous Navigation, SLAM &amp; Path Planning
              </a>
              <a href="${prefix}4-subsystems/programming.html#sec-4-3-4" class="apple-megamenu-sublink">
                <span class="num">4.3.4</span> Multi-Agent C2 Communications
              </a>
              <a href="${prefix}4-subsystems/programming.html#interactive-pathfinding" class="apple-megamenu-sublink highlight">
                <span class="num">⚡</span> Interactive A* / Dijkstra Benchmark
              </a>
            </div>

            <!-- 4.4 Vision Flyout -->
            <div class="apple-megamenu-flyout" id="flyout-vis">
              <div class="apple-megamenu-heading">4.4 Drone &amp; Computer Vision</div>
              <a href="${prefix}4-subsystems/computer-vision.html" class="apple-megamenu-sublink">
                <span class="num">4.4.1</span> Heavy-Lift Scout Quadrotor Airframe
              </a>
              <a href="${prefix}4-subsystems/computer-vision.html" class="apple-megamenu-sublink">
                <span class="num">4.4.2</span> Edge YOLOv8 Real-Time Detection
              </a>
              <a href="${prefix}4-subsystems/computer-vision.html" class="apple-megamenu-sublink">
                <span class="num">4.4.3</span> Multi-Band RTK Georeferencing Pipeline
              </a>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(subsystemsMenu);
    }

    // Brand Logo Auto-Injection
    const brand = appleNav.querySelector('.apple-nav-brand');
    if (brand) {
      const iconSpan = brand.querySelector('span.icon');
      if (iconSpan) {
        const logoImg = document.createElement('img');
        logoImg.src = `${prefix}assets/images/project-logo.png`;
        logoImg.alt = 'FOD Hunter UGV System';
        logoImg.className = 'apple-nav-logo';
        iconSpan.replaceWith(logoImg);
      }
    }

    // 4. Create 7. Documentation Mega Menu (6 Distinct Columns with Individual HTML Files)
    let docsMenu = document.getElementById('apple-megamenu-docs');
    if (!docsMenu) {
      docsMenu = document.createElement('div');
      docsMenu.id = 'apple-megamenu-docs';
      docsMenu.className = 'apple-megamenu';
      docsMenu.innerHTML = `
        <div style="max-width: 1440px; margin: 0 auto; padding: 0 24px 14px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255, 255, 255, 0.08); margin-bottom: 20px;">
          <span style="color: var(--apple-text-secondary); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">7.0 System Engineering Documentation &amp; Research</span>
          <a href="${prefix}7-documentation.html" style="color: var(--apple-blue); font-size: 12.5px; text-decoration: none; font-weight: 500;">
            Documentation Hub Overview →
          </a>
        </div>

        <div class="apple-megamenu-docs-inner">
          <!-- Col 1: Literature Review -->
          <div class="apple-megamenu-col">
            <div class="apple-megamenu-heading">Literature Review</div>
            <a href="${prefix}7-documentation/literature/primary-research.html" class="apple-megamenu-sublink">
              Primary Research
            </a>
            <a href="${prefix}7-documentation/literature/problem-statement.html" class="apple-megamenu-sublink">
              Secondary Research
            </a>
            <a href="${prefix}6-references.html" class="apple-megamenu-sublink">
              Standards &amp; Citations
            </a>
          </div>

          <!-- Col 2: Asuka -->
          <div class="apple-megamenu-col">
            <div class="apple-megamenu-heading">Asuka</div>
            <a href="${prefix}7-documentation/asuka/suspension.html" class="apple-megamenu-sublink">
              Suspension Design and Calculations
            </a>
            <a href="${prefix}7-documentation/asuka/vacuum-module.html" class="apple-megamenu-sublink">
              FOD Remidation Vacuum module
            </a>
          </div>

          <!-- Col 3: Zacarias -->
          <div class="apple-megamenu-col">
            <div class="apple-megamenu-heading">Zacarias</div>
            <a href="${prefix}7-documentation/zacarias/chassis-fea.html" class="apple-megamenu-sublink">
              Chassis Design and FEA Analysis
            </a>
            <a href="${prefix}7-documentation/zacarias/motor-calculations.html" class="apple-megamenu-sublink">
              Motor Calculations
            </a>
            <a href="${prefix}7-documentation/zacarias/drivetrain-kinematics.html" class="apple-megamenu-sublink">
              Drivetrain Kinematics calculations
            </a>
          </div>

          <!-- Col 4: Bryan -->
          <div class="apple-megamenu-col">
            <div class="apple-megamenu-heading">Bryan</div>
            <a href="${prefix}7-documentation/bryan/components-bom.html" class="apple-megamenu-sublink">
              Components BOM
            </a>
            <a href="${prefix}7-documentation/bryan/power-calculations.html" class="apple-megamenu-sublink">
              Detailed Power Calculations
            </a>
          </div>

          <!-- Col 5: Gabriel -->
          <div class="apple-megamenu-col">
            <div class="apple-megamenu-heading">Gabriel</div>
            <a href="${prefix}7-documentation/gabriel/yolo-comparison.html" class="apple-megamenu-sublink">
              YOLO model comparison
            </a>
            <a href="${prefix}7-documentation/gabriel/vision-calculations.html" class="apple-megamenu-sublink">
              Computer vison calculation
            </a>
            <a href="${prefix}7-documentation/gabriel/vision-research.html" class="apple-megamenu-sublink">
              Computer vison research
            </a>
          </div>

          <!-- Col 6: Hilbert -->
          <div class="apple-megamenu-col">
            <div class="apple-megamenu-heading">Hilbert</div>
            <a href="${prefix}7-documentation/hilbert/simulation.html" class="apple-megamenu-sublink">
              Simulation
            </a>
            <a href="${prefix}7-documentation/hilbert/navigation.html" class="apple-megamenu-sublink">
              Navigation
            </a>
            <a href="${prefix}7-documentation/hilbert/communications.html" class="apple-megamenu-sublink">
              UAV Communication
            </a>
          </div>
        </div>
      `;
      document.body.appendChild(docsMenu);
    }

    // 5. Interactive Flyout Hover Logic for Subsystems Menu
    const bigLinks = subsystemsMenu.querySelectorAll('.apple-megamenu-big-link');
    const flyouts = subsystemsMenu.querySelectorAll('.apple-megamenu-flyout');

    function activateFlyout(targetKey) {
      bigLinks.forEach(lnk => {
        if (lnk.getAttribute('data-sub') === targetKey) {
          lnk.classList.add('hovered');
        } else {
          lnk.classList.remove('hovered');
        }
      });
      flyouts.forEach(flyout => {
        if (flyout.id === `flyout-${targetKey}`) {
          flyout.classList.add('active');
        } else {
          flyout.classList.remove('active');
        }
      });
    }

    bigLinks.forEach(link => {
      link.addEventListener('mouseenter', () => {
        const sub = link.getAttribute('data-sub');
        activateFlyout(sub);
      });
    });

    // 6. Hook Triggers in Nav Bar
    let subsystemsTrigger = null;
    let docsTrigger = null;

    appleNav.querySelectorAll('.apple-nav-link').forEach(link => {
      const text = link.textContent.trim();
      const href = link.getAttribute('href') || '';
      if (text.includes('4.') || text.includes('Subsystem') || href.includes('4-subsystems')) {
        subsystemsTrigger = link;
      } else if (text.includes('7.') || text.includes('Documentation') || href.includes('7-documentation')) {
        docsTrigger = link;
      }
    });

    let closeTimer = null;

    function openSubsystemsMenu() {
      if (closeTimer) clearTimeout(closeTimer);
      docsMenu.classList.remove('active');
      subsystemsMenu.classList.add('active');
      overlay.classList.add('active');
      // Initially clear active flyouts so only primary items are seen
      bigLinks.forEach(l => l.classList.remove('hovered'));
      flyouts.forEach(f => f.classList.remove('active'));
    }

    function openDocsMenu() {
      if (closeTimer) clearTimeout(closeTimer);
      subsystemsMenu.classList.remove('active');
      docsMenu.classList.add('active');
      overlay.classList.add('active');
    }

    function scheduleCloseAll() {
      if (closeTimer) clearTimeout(closeTimer);
      closeTimer = setTimeout(() => {
        subsystemsMenu.classList.remove('active');
        docsMenu.classList.remove('active');
        overlay.classList.remove('active');
        bigLinks.forEach(l => l.classList.remove('hovered'));
        flyouts.forEach(f => f.classList.remove('active'));
      }, 180);
    }

    if (subsystemsTrigger) {
      subsystemsTrigger.addEventListener('mouseenter', openSubsystemsMenu);
      subsystemsTrigger.addEventListener('mouseleave', scheduleCloseAll);
    }

    if (docsTrigger) {
      docsTrigger.addEventListener('mouseenter', openDocsMenu);
      docsTrigger.addEventListener('mouseleave', scheduleCloseAll);
    }

    subsystemsMenu.addEventListener('mouseenter', () => {
      if (closeTimer) clearTimeout(closeTimer);
    });
    subsystemsMenu.addEventListener('mouseleave', scheduleCloseAll);

    docsMenu.addEventListener('mouseenter', () => {
      if (closeTimer) clearTimeout(closeTimer);
    });
    docsMenu.addEventListener('mouseleave', scheduleCloseAll);

    overlay.addEventListener('mouseenter', scheduleCloseAll);
    overlay.addEventListener('click', scheduleCloseAll);

    // Close when clicking any link
    document.querySelectorAll('.apple-megamenu a').forEach(a => {
      a.addEventListener('click', () => {
        subsystemsMenu.classList.remove('active');
        docsMenu.classList.remove('active');
        overlay.classList.remove('active');
      });
    });
  }

  // ESC key to close modals & menus
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      lb.classList.remove('open');
      if (typeof taskModal !== 'undefined' && taskModal) taskModal.classList.remove('open');
      if (typeof sysModal !== 'undefined' && sysModal) sysModal.classList.remove('open');
      const mmSub = document.getElementById('apple-megamenu-subsystems');
      const mmDoc = document.getElementById('apple-megamenu-docs');
      const mo = document.getElementById('apple-megamenu-overlay');
      if (mmSub) mmSub.classList.remove('active');
      if (mmDoc) mmDoc.classList.remove('active');
      if (mo) mo.classList.remove('active');
    }
  });
});
