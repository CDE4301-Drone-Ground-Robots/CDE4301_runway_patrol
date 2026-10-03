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

  // ── Apple Light / Dark Theme Toggle & Seamless Synchronization ──
  const navActions = document.querySelector('.apple-nav-actions');
  const themeNav = document.querySelector('.apple-nav');
  let themeToggleBtn = document.getElementById('theme-toggle-btn');
  let storedTheme = 'dark';
  try {
    storedTheme = localStorage.getItem('theme') || 'dark';
  } catch (error) {
    storedTheme = 'dark';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch (error) {}

    // Update all toggle buttons across header and mobile drawer
    document.querySelectorAll('.apple-theme-toggle').forEach(btn => {
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      btn.setAttribute('title', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      btn.dataset.theme = theme;
    });

    if (window.renderNaturalHeatmap) {
      window.renderNaturalHeatmap();
    }
  }

  // Inject toggle button into header navigation actions
  if (!themeToggleBtn) {
    themeToggleBtn = document.createElement('button');
    themeToggleBtn.id = 'theme-toggle-btn';
    themeToggleBtn.className = 'apple-theme-toggle';
    themeToggleBtn.type = 'button';
    themeToggleBtn.innerHTML = '<span class="apple-theme-toggle-icon" aria-hidden="true"></span><span class="apple-theme-toggle-knob" aria-hidden="true"></span>';
    
    if (navActions) {
      navActions.insertBefore(themeToggleBtn, navActions.firstChild);
    } else if (themeNav) {
      themeNav.appendChild(themeToggleBtn);
    }
  }

  // Apply current theme immediately
  applyTheme(storedTheme === 'light' ? 'light' : 'dark');

  // Bind click handlers to all toggles
  document.querySelectorAll('.apple-theme-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
    });
  });

  // Cross-tab / cross-window real-time synchronization
  window.addEventListener('storage', (e) => {
    if (e.key === 'theme' && (e.newValue === 'light' || e.newValue === 'dark')) {
      applyTheme(e.newValue);
    }
  });

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

    // 1. Normalize Top Nav Links: Remove Simulation, Add Documentation
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
          a.textContent = 'Documentation';
          if (isDocActive) a.classList.add('active');
          hasDocsLink = true;
        } else if (text === 'Documentation' || text.includes('Documentation') || href.includes('7-documentation.html')) {
          a.textContent = 'Documentation';
          hasDocsLink = true;
          if (isDocActive) a.classList.add('active');
        } else if (isDocActive) {
          a.classList.remove('active');
        }
      });

      if (!hasDocsLink) {
        const docLi = document.createElement('li');
        docLi.innerHTML = `<a href="${prefix}7-documentation.html" class="apple-nav-link ${isDocActive ? 'active' : ''}">Documentation</a>`;
        navLinksList.appendChild(docLi);
      }
    }

    // Normalize Mobile Drawer
    const mobileDrawer = document.getElementById('apple-mobile-drawer');
    if (mobileDrawer) {
      mobileDrawer.querySelectorAll('a').forEach(a => {
        if (a.textContent.includes('Simulation') || (a.getAttribute('href') || '').includes('simulation.html')) {
          a.href = `${prefix}7-documentation.html`;
          a.textContent = 'Documentation';
        } else if (a.textContent.includes('Documentation') || (a.getAttribute('href') || '').includes('7-documentation.html')) {
          a.textContent = 'Documentation';
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
              <a href="${prefix}4-subsystems/mechanical.html#sec-4-1-1" class="apple-megamenu-sublink">
                <span class="num">4.1.1</span> Chassis Design &amp; CAD
              </a>
              <a href="${prefix}4-subsystems/mechanical.html#sec-4-1-2" class="apple-megamenu-sublink">
                <span class="num">4.1.2</span> Structural FEA Analysis
              </a>
              <a href="${prefix}4-subsystems/mechanical.html#sec-4-1-3" class="apple-megamenu-sublink">
                <span class="num">4.1.3</span> Wheel Diameter Justification
              </a>
              <a href="${prefix}4-subsystems/mechanical.html#sec-4-1-4" class="apple-megamenu-sublink">
                <span class="num">4.1.4</span> DFM &amp; Serviceability
              </a>
              <a href="${prefix}4-subsystems/mechanical.html#sec-4-1-5" class="apple-megamenu-sublink">
                <span class="num">4.1.5</span> Physical Load Testing
              </a>
              <a href="${prefix}4-subsystems/mechanical.html#sec-4-1-6" class="apple-megamenu-sublink">
                <span class="num">4.1.6</span> Suspension Subsystem
              </a>
              <a href="${prefix}4-subsystems/mechanical.html#sec-4-1-7" class="apple-megamenu-sublink">
                <span class="num">4.1.7</span> Vacuum FOD Pickup
              </a>
              <a href="${prefix}4-subsystems/mechanical.html#sec-4-1-8" class="apple-megamenu-sublink">
                <span class="num">4.1.8</span> Motor Selection &amp; Calculations
              </a>
              <a href="${prefix}4-subsystems/mechanical.html#sec-4-1-9" class="apple-megamenu-sublink">
                <span class="num">4.1.9</span> Steering Kinematic Trade-Off
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
              <a href="${prefix}4-subsystems/programming.html#sec-1-middleware" class="apple-megamenu-sublink">
                <span class="num">4.3.1</span> ROS 2 Jazzy &amp; Middleware Baseline
              </a>
              <a href="${prefix}4-subsystems/programming.html#sec-2-pipeline" class="apple-megamenu-sublink">
                <span class="num">4.3.2</span> "Detect-to-Clear" Autonomy Pipeline
              </a>
              <a href="${prefix}4-subsystems/programming.html#sec-3-autonomy" class="apple-megamenu-sublink">
                <span class="num">4.3.3</span> Autonomous Navigation &amp; Scrub Physics
              </a>
              <a href="${prefix}4-subsystems/programming.html#sec-5-demonstration" class="apple-megamenu-sublink">
                <span class="num">4.3.4</span> Gazebo Harmonic Digital Twin Simulation
              </a>
              <a href="${prefix}4-subsystems/programming.html#sec-6-roadmap" class="apple-megamenu-sublink">
                <span class="num">4.3.5</span> Phase 2 Tasks &amp; Physical Implementation
              </a>
              <a href="${prefix}4-subsystems/programming.html#sec-4-visualizer" class="apple-megamenu-sublink highlight">
                <span class="num">⚡</span> Interactive Pathfinding Visualizer &amp; Benchmark
              </a>
            </div>

            <!-- 4.4 Vision Flyout -->
            <div class="apple-megamenu-flyout" id="flyout-vis">
              <div class="apple-megamenu-heading">4.4 Drone &amp; Computer Vision</div>
              <a href="${prefix}4-subsystems/computer-vision.html#sec-4-4-1" class="apple-megamenu-sublink">
                <span class="num">4.4.1</span> Computer Vision &amp; Sensor Fusion Suite
              </a>
              <a href="${prefix}4-subsystems/computer-vision.html#sec-4-4-2" class="apple-megamenu-sublink">
                <span class="num">4.4.2</span> YOLO Model Benchmarking &amp; Edge Inference
              </a>
              <a href="${prefix}4-subsystems/computer-vision.html#sec-4-4-3" class="apple-megamenu-sublink">
                <span class="num">4.4.3</span> Technical Documentation &amp; Optics Specs
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
          <span style="color: var(--apple-text-secondary); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">EXPLORE DOCUMENTATION</span>
          <a href="${prefix}7-documentation.html" style="color: var(--apple-blue); font-size: 12.5px; text-decoration: none; font-weight: 600;">
            🌟 Open Document Hub →
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
            <a href="${prefix}7-documentation/zacarias/chassis-design.html" class="apple-megamenu-sublink">
              Chassis Design
            </a>
            <a href="${prefix}7-documentation/zacarias/materiel-selection.html" class="apple-megamenu-sublink">
              Material Selection
            </a>
            <a href="${prefix}7-documentation/zacarias/fea-simulation.html" class="apple-megamenu-sublink">
              FEA Simulation
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
            <a href="${prefix}7-documentation/gabriel/stm32.html" class="apple-megamenu-sublink">
              STM32 Microcontroller &amp; Firmware
            </a>
          </div>

          <!-- Col 6: Hilbert -->
          <div class="apple-megamenu-col">
            <div class="apple-megamenu-heading">Hilbert</div>
            <a href="${prefix}7-documentation/hilbert/Motor_drivetrain_calculation.html" class="apple-megamenu-sublink">
              Motor &amp; Drivetrain Sizing
            </a>
            <a href="${prefix}7-documentation/hilbert/steering-kinematics.html" class="apple-megamenu-sublink">
              Steering &amp; Kinematics
            </a>
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

    // 4b. Create 6. References Mega Menu (Direct member names list with Explore References & Open Reference Hub)
    let refsMenu = document.getElementById('apple-megamenu-references');
    if (!refsMenu) {
      refsMenu = document.createElement('div');
      refsMenu.id = 'apple-megamenu-references';
      refsMenu.className = 'apple-megamenu';
      refsMenu.innerHTML = `
        <div style="max-width: 500px; margin: 0 auto; padding: 0 24px 14px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255, 255, 255, 0.08); margin-bottom: 16px;">
          <span style="color: var(--apple-text-secondary); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">EXPLORE REFERENCES</span>
          <a href="${prefix}6-references.html" style="color: var(--apple-blue); font-size: 12.5px; text-decoration: none; font-weight: 600;">
            🌟 Open Reference Hub →
          </a>
        </div>

        <div style="max-width: 500px; margin: 0 auto; padding: 0 24px;">
          <div class="apple-megamenu-col" style="width: 100%;">
            <a href="${prefix}6-references/asuka/references.html" class="apple-megamenu-big-link">
              <span>Asuka</span>
              <span class="arrow">›</span>
            </a>
            <a href="${prefix}6-references/zacarias/references.html" class="apple-megamenu-big-link">
              <span>Zacarias</span>
              <span class="arrow">›</span>
            </a>
            <a href="${prefix}6-references/hilbert/references.html" class="apple-megamenu-big-link">
              <span>Hilbert</span>
              <span class="arrow">›</span>
            </a>
            <a href="${prefix}6-references/bryan/references.html" class="apple-megamenu-big-link">
              <span>Bryan</span>
              <span class="arrow">›</span>
            </a>
            <a href="${prefix}6-references/gabriel/references.html" class="apple-megamenu-big-link">
              <span>Gabriel</span>
              <span class="arrow">›</span>
            </a>
          </div>
        </div>
      `;
      document.body.appendChild(refsMenu);
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
    let refsTrigger = null;

    appleNav.querySelectorAll('.apple-nav-link').forEach(link => {
      const text = link.textContent.trim();
      const href = link.getAttribute('href') || '';
      if (text.includes('4.') || text.includes('Subsystem') || href.includes('4-subsystems')) {
        subsystemsTrigger = link;
      } else if (text.includes('7.') || text.includes('Documentation') || href.includes('7-documentation')) {
        docsTrigger = link;
      } else if (text.includes('6.') || text.includes('References') || href.includes('6-references')) {
        refsTrigger = link;
      }
    });

    let closeTimer = null;

    function openSubsystemsMenu() {
      if (closeTimer) clearTimeout(closeTimer);
      docsMenu.classList.remove('active');
      refsMenu.classList.remove('active');
      subsystemsMenu.classList.add('active');
      overlay.classList.add('active');
      bigLinks.forEach(l => l.classList.remove('hovered'));
      flyouts.forEach(f => f.classList.remove('active'));
    }

    function openDocsMenu() {
      if (closeTimer) clearTimeout(closeTimer);
      subsystemsMenu.classList.remove('active');
      refsMenu.classList.remove('active');
      docsMenu.classList.add('active');
      overlay.classList.add('active');
    }

    function openRefsMenu() {
      if (closeTimer) clearTimeout(closeTimer);
      subsystemsMenu.classList.remove('active');
      docsMenu.classList.remove('active');
      refsMenu.classList.add('active');
      overlay.classList.add('active');
    }

    function scheduleCloseAll() {
      if (closeTimer) clearTimeout(closeTimer);
      closeTimer = setTimeout(() => {
        subsystemsMenu.classList.remove('active');
        docsMenu.classList.remove('active');
        refsMenu.classList.remove('active');
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

    if (refsTrigger) {
      refsTrigger.addEventListener('mouseenter', openRefsMenu);
      refsTrigger.addEventListener('mouseleave', scheduleCloseAll);
    }

    subsystemsMenu.addEventListener('mouseenter', () => {
      if (closeTimer) clearTimeout(closeTimer);
    });
    subsystemsMenu.addEventListener('mouseleave', scheduleCloseAll);

    docsMenu.addEventListener('mouseenter', () => {
      if (closeTimer) clearTimeout(closeTimer);
    });
    docsMenu.addEventListener('mouseleave', scheduleCloseAll);

    refsMenu.addEventListener('mouseenter', () => {
      if (closeTimer) clearTimeout(closeTimer);
    });
    refsMenu.addEventListener('mouseleave', scheduleCloseAll);

    overlay.addEventListener('mouseenter', scheduleCloseAll);
    overlay.addEventListener('click', scheduleCloseAll);

    // Close when clicking any link
    document.querySelectorAll('.apple-megamenu a').forEach(a => {
      a.addEventListener('click', () => {
        subsystemsMenu.classList.remove('active');
        docsMenu.classList.remove('active');
        if (refsMenu) refsMenu.classList.remove('active');
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
      const mmRef = document.getElementById('apple-megamenu-references');
      const mo = document.getElementById('apple-megamenu-overlay');
      if (mmSub) mmSub.classList.remove('active');
      if (mmDoc) mmDoc.classList.remove('active');
      if (mmRef) mmRef.classList.remove('active');
      if (mo) mo.classList.remove('active');
      // Also close search modal
      if (typeof window._closeSearchModal === 'function') window._closeSearchModal();
    }
  });

  // ── UX Enhancement: Reading Progress Bar ─────────────────────────────
  (function initReadingProgress() {
    const bar = document.createElement('div');
    bar.className = 'reading-progress-bar';
    bar.id = 'reading-progress-bar';
    document.body.appendChild(bar);

    function updateProgress() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0;
      bar.style.width = pct + '%';
    }

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  })();

  // ── UX Enhancement: Back-to-Top Button ───────────────────────────────
  (function initBackToTop() {
    const btn = document.createElement('button');
    btn.id = 'back-to-top';
    btn.className = 'back-to-top-btn';
    btn.setAttribute('aria-label', 'Back to top');
    btn.setAttribute('title', 'Back to top');
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 15l-6-6-6 6"/>
    </svg>`;
    document.body.appendChild(btn);

    window.addEventListener('scroll', () => {
      btn.classList.toggle('visible', window.scrollY > 420);
    }, { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  })();

  // ── UX Enhancement: Auto Breadcrumbs ─────────────────────────────────
  (function initBreadcrumbs() {
    const path = window.location.pathname;
    // Don't show on root index
    if (path.endsWith('index.html') || path.endsWith('/') || path === '' || !path.includes('.html')) return;

    // Path → label mapping
    const LABELS = {
      '1-introduction':      { label: 'Introduction', icon: '📖' },
      '2-design-overview':   { label: 'Design Overview', icon: '🎨' },
      '3-individual-scopes': { label: 'Individual Scopes', icon: '👥' },
      '4-subsystems':        { label: 'Subsystems', icon: '⚙️' },
      '5-timeline':          { label: 'Timeline', icon: '⏱️' },
      '6-references':        { label: 'References', icon: '📚' },
      '7-documentation':     { label: 'Documentation', icon: '📂' },
      'index':               { label: 'Overview', icon: '🤖' },
      'mechanical':          { label: 'Mechanical', icon: '⚙️' },
      'electrical':          { label: 'Electrical', icon: '⚡' },
      'programming':         { label: 'Programming', icon: '💻' },
      'computer-vision':     { label: 'Computer Vision', icon: '👁️' },
      'asuka':               { label: 'Asuka', icon: '🔩' },
      'bryan':               { label: 'Bryan', icon: '🔋' },
      'gabriel':             { label: 'Gabriel', icon: '👁️' },
      'hilbert':             { label: 'Hilbert', icon: '🗺️' },
      'zacarias':            { label: 'Zacarias', icon: '🏗️' },
      'literature':          { label: 'Literature', icon: '📄' },
      'suspension':          { label: 'Suspension Analysis', icon: '🔩' },
      'vacuum-module':       { label: 'Vacuum Module', icon: '🌀' },
      'components-bom':      { label: 'Components BOM', icon: '📋' },
      'power-calculations':  { label: 'Power Calculations', icon: '🔋' },
      'yolo-comparison':     { label: 'YOLO Comparison', icon: '🚀' },
      'vision-calculations': { label: 'Vision Calculations', icon: '📐' },
      'vision-research':     { label: 'Vision Research', icon: '🔬' },
      'stm32':               { label: 'STM32 & Firmware', icon: '⚡' },
      'Motor_drivetrain_calculation': { label: 'Motor & Drivetrain', icon: '🛞' },
      'steering-kinematics': { label: 'Steering & Kinematics', icon: '↔️' },
      'simulation':          { label: 'Simulation', icon: '🤖' },
      'navigation':          { label: 'Navigation', icon: '🗺️' },
      'communications':      { label: 'UAV Communication', icon: '📡' },
      'chassis-design':      { label: 'Chassis Design', icon: '🏗️' },
      'fea-simulation':      { label: 'FEA Simulation', icon: '🧪' },
      'materiel-selection':  { label: 'Material Selection', icon: '🪨' },
      'primary-research':    { label: 'Primary Research', icon: '📖' },
      'problem-statement':   { label: 'Problem Statement', icon: '📄' },
      'references':          { label: 'References', icon: '📄' },
    };

    // Calculate prefix to root
    const styleLink = document.querySelector('link[href*="css/styles.css"]');
    let pfx = '';
    if (styleLink) {
      const href = styleLink.getAttribute('href') || '';
      const m = href.match(/\.\.\//g);
      pfx = m ? m.join('') : '';
    }

    // Parse segments
    const segments = path.split('/').filter(s => s && s !== '');
    const crumbs = [];

    // Always start with Home
    crumbs.push({ label: 'FOD Hunter', icon: '🏠', url: pfx + 'index.html' });

    let accPath = pfx;
    segments.forEach((seg, idx) => {
      const cleanSeg = seg.replace('.html', '');
      const info = LABELS[cleanSeg] || { label: cleanSeg.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), icon: '📄' };
      const isLast = idx === segments.length - 1;

      if (!isLast) {
        accPath += seg + '/';
        // Only add a crumb for known directory segments
        if (LABELS[cleanSeg]) {
          crumbs.push({ label: info.label, icon: info.icon, url: accPath + 'index.html' });
        }
      } else {
        crumbs.push({ label: info.label, icon: info.icon, url: null });
      }
    });

    if (crumbs.length <= 1) return; // Nothing interesting to show

    // Build DOM
    const bar = document.createElement('nav');
    bar.className = 'apple-breadcrumb-bar';
    bar.setAttribute('aria-label', 'Breadcrumb');

    const inner = document.createElement('div');
    inner.className = 'apple-breadcrumb';

    crumbs.forEach((crumb, idx) => {
      const isLast = idx === crumbs.length - 1;
      if (idx > 0) {
        const sep = document.createElement('span');
        sep.className = 'apple-breadcrumb-sep';
        sep.textContent = '›';
        inner.appendChild(sep);
      }
      if (isLast) {
        const cur = document.createElement('span');
        cur.className = 'apple-breadcrumb-current';
        cur.textContent = `${crumb.icon} ${crumb.label}`;
        inner.appendChild(cur);
      } else {
        const a = document.createElement('a');
        a.href = crumb.url;
        a.textContent = `${crumb.icon} ${crumb.label}`;
        inner.appendChild(a);
      }
    });

    bar.appendChild(inner);

    // Insert after <header>
    const header = document.querySelector('header.apple-nav');
    if (header && header.nextSibling) {
      header.parentNode.insertBefore(bar, header.nextSibling);
    }
  })();

  // ── UX Enhancement: Section Heading Anchor Links ──────────────────────
  (function initSectionAnchors() {
    const selectors = ['h2[id]', 'h3[id]', 'h4[id]', '.card-title[id]'];
    // Also find parent elements with id containing headings
    document.querySelectorAll('[id]').forEach(el => {
      const tag = el.tagName.toLowerCase();
      if (['h2','h3','h4'].includes(tag)) {
        if (!el.querySelector('.section-anchor')) {
          const anchor = document.createElement('a');
          anchor.href = '#' + el.id;
          anchor.className = 'section-anchor';
          anchor.setAttribute('aria-label', 'Link to section');
          anchor.setAttribute('title', 'Copy link to section');
          anchor.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>`;
          anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const url = window.location.href.split('#')[0] + '#' + el.id;
            navigator.clipboard?.writeText(url).catch(() => {});
            window.history.pushState(null, '', '#' + el.id);
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Brief visual feedback
            anchor.style.color = 'var(--apple-blue)';
            anchor.style.opacity = '1';
            setTimeout(() => {
              anchor.style.color = '';
              anchor.style.opacity = '';
            }, 1500);
          });
          el.appendChild(anchor);
        }
      }
    });
  })();

  // ── UX Enhancement: Search Icon Tooltip ──────────────────────────────
  (function initSearchTooltip() {
    const searchWrapper = document.getElementById('apple-nav-search-wrapper');
    if (!searchWrapper) return;
    const tip = document.createElement('div');
    tip.className = 'apple-search-tooltip';
    tip.innerHTML = `Search report <kbd>⌘K</kbd>`;
    searchWrapper.appendChild(tip);
  })();

  // ── UX Enhancement: Mobile Drawer Icons ──────────────────────────────
  (function initDrawerIcons() {
    const ICON_MAP = {
      'Overview':       '🏠',
      'Introduction':   '📖',
      'Design':         '🎨',
      'Scopes':         '👥',
      'Subsystems':     '⚙️',
      'Timeline':       '⏱️',
      'References':     '📚',
      'Documentation':  '📂',
    };
    const drawer = document.getElementById('apple-mobile-drawer');
    if (!drawer) return;
    drawer.querySelectorAll('a').forEach(a => {
      const text = a.textContent.trim();
      // Find matching icon
      const icon = Object.entries(ICON_MAP).find(([key]) => text.includes(key));
      if (icon && !a.querySelector('.apple-drawer-icon')) {
        const iconEl = document.createElement('span');
        iconEl.className = 'apple-drawer-icon';
        iconEl.textContent = icon[1];
        a.insertBefore(iconEl, a.firstChild);
      }
    });
  })();

  // ── Site-Wide Search Bar ─────────────────────────────────────────────
  (function initSiteSearch() {
    // Determine if this is index (root page)
    const pathParts = window.location.pathname;
    const isIndex = pathParts.endsWith('index.html') ||
                    pathParts.endsWith('/') ||
                    pathParts === '' ||
                    (!pathParts.includes('.html'));

    // ── Search Index ──────────────────────────────────────────────────
    const SEARCH_INDEX = [
      // Main pages
      { icon: '🏠', title: 'Overview', badge: 'Home', desc: 'FOD Hunter UGV System — Autonomous Multi-Agent Airfield Clearance', url: 'index.html', group: 'Main Pages' },
      { icon: '📖', title: '1. Introduction & Problem Statement', badge: 'Intro', desc: 'FOD hazard context, ICAO standards, project motivation and goals', url: '1-introduction.html', group: 'Main Pages' },
      { icon: '🎨', title: '2. Design Overview', badge: 'Design', desc: 'System architecture, design constraints, high-level concept overview', url: '2-design-overview.html', group: 'Main Pages' },
      { icon: '👥', title: '3. Individual Scopes', badge: 'Scopes', desc: 'Team member roles, individual engineering scopes and responsibilities', url: '3-individual-scopes.html', group: 'Main Pages' },
      { icon: '⏱️', title: '5. Project Timeline', badge: 'Timeline', desc: 'Gantt chart, milestones, semester task breakdown', url: '5-timeline.html', group: 'Main Pages' },
      { icon: '📚', title: '6. References', badge: 'Refs', desc: 'All references, standards, papers and citations used in this report', url: '6-references.html', group: 'Main Pages' },
      { icon: '📂', title: '7. Documentation Hub', badge: 'Docs', desc: 'Team member detailed technical documentation and specifications', url: '7-documentation.html', group: 'Main Pages' },

      // Subsystems
      { icon: '🤖', title: '4. Subsystems Overview', badge: 'Subsystems', desc: 'Mechanical, Electrical, Programming, and Vision subsystem summary', url: '4-subsystems/index.html', group: 'Subsystems' },
      { icon: '⚙️', title: '4.1 Mechanical Subsystem', badge: 'Mechanical', desc: 'Chassis design, drivetrain, vacuum FOD pickup, material selection', url: '4-subsystems/mechanical.html', group: 'Subsystems' },
      { icon: '4.1.1', title: 'Platform Architecture & Layout', badge: 'Mechanical', desc: 'UGV platform footprint, component layout and structural design', url: '4-subsystems/mechanical.html#sec-4-1-1', group: 'Mechanical' },
      { icon: '4.1.2', title: 'Chassis Frame Analysis', badge: 'Mechanical', desc: 'Structural analysis of the UGV chassis frame under load', url: '4-subsystems/mechanical.html#sec-4-1-2', group: 'Mechanical' },
      { icon: '4.1.3', title: 'Wheel & Ground Pressure', badge: 'Mechanical', desc: 'Wheel selection, contact pressure and ground clearance analysis', url: '4-subsystems/mechanical.html#sec-4-1-3', group: 'Mechanical' },
      { icon: '4.1.4', title: 'Differential Drive Kinematics', badge: 'Mechanical', desc: 'Ackermann/differential steering kinematics and turning radius', url: '4-subsystems/mechanical.html#sec-4-1-4', group: 'Mechanical' },
      { icon: '4.1.5', title: 'Suspension Design', badge: 'Mechanical', desc: 'Passive suspension system, shock isolation and asphalt compliance', url: '4-subsystems/mechanical.html#sec-4-1-5', group: 'Mechanical' },
      { icon: '4.1.6', title: 'CAD Assembly & BOM', badge: 'Mechanical', desc: 'SolidWorks assembly model and full bill of materials', url: '4-subsystems/mechanical.html#sec-4-1-6', group: 'Mechanical' },
      { icon: '4.1.7', title: 'Vacuum FOD Pickup', badge: 'Mechanical', desc: 'Motorised vacuum pickup system for debris collection', url: '4-subsystems/mechanical.html#sec-4-1-7', group: 'Mechanical' },
      { icon: '4.1.8', title: 'Motor Selection & Calculations', badge: 'Mechanical', desc: 'BLDC motor torque, power, and speed calculations', url: '4-subsystems/mechanical.html#sec-4-1-8', group: 'Mechanical' },
      { icon: '4.1.9', title: 'Steering Kinematic Trade-Off', badge: 'Mechanical', desc: 'Comparison of Ackermann vs. differential vs. 4WS steering', url: '4-subsystems/mechanical.html#sec-4-1-9', group: 'Mechanical' },

      { icon: '⚡', title: '4.2 Electrical Subsystem', badge: 'Electrical', desc: '48V bus, ZLAC8015D servo driver, E-Stop, power distribution', url: '4-subsystems/electrical.html', group: 'Subsystems' },
      { icon: '💻', title: '4.3 Programming Subsystem', badge: 'Programming', desc: 'ROS 2 Jazzy, Nav2, Gazebo Harmonic simulation, autonomy pipeline', url: '4-subsystems/programming.html', group: 'Subsystems' },
      { icon: '4.3.1', title: 'ROS 2 Jazzy & Middleware Baseline', badge: 'Programming', desc: 'ROS 2 Jazzy on Ubuntu 24.04 LTS, middleware justification', url: '4-subsystems/programming.html#sec-1-middleware', group: 'Programming' },
      { icon: '4.3.2', title: '"Detect-to-Clear" Autonomy Pipeline', badge: 'Programming', desc: 'Multi-agent heterogeneous autonomy architecture overview', url: '4-subsystems/programming.html#sec-2-pipeline', group: 'Programming' },
      { icon: '4.3.3', title: 'Autonomous Navigation & Scrub Physics', badge: 'Programming', desc: 'Nav2 stack, SmacPlanner2D, Regulated Pure Pursuit, MPPI', url: '4-subsystems/programming.html#sec-3-autonomy', group: 'Programming' },
      { icon: '4.3.4', title: 'Gazebo Harmonic Digital Twin', badge: 'Programming', desc: 'Simulation environment, SDF model, sensor plugins', url: '4-subsystems/programming.html#sec-5-demonstration', group: 'Programming' },
      { icon: '4.3.5', title: 'Phase 2 Tasks & Physical Implementation', badge: 'Programming', desc: 'Phase 2 roadmap: hardware bring-up, real-world navigation testing', url: '4-subsystems/programming.html#sec-6-roadmap', group: 'Programming' },
      { icon: '🔬', title: 'Interactive Pathfinding Visualizer', badge: 'Programming', desc: 'A* / Dijkstra / Dubins interactive benchmark demo', url: '4-subsystems/programming.html#sec-4-visualizer', group: 'Programming' },

      { icon: '👁️', title: '4.4 Computer Vision & Drone', badge: 'Vision', desc: 'YOLO inference, sensor fusion, aerial macro-scout, optics specs', url: '4-subsystems/computer-vision.html', group: 'Subsystems' },
      { icon: '4.4.1', title: 'Computer Vision & Sensor Fusion Suite', badge: 'Vision', desc: 'Drone CV pipeline, LiDAR-camera fusion strategy', url: '4-subsystems/computer-vision.html#sec-4-4-1', group: 'Vision' },
      { icon: '4.4.2', title: 'YOLO Model Benchmarking & Edge Inference', badge: 'Vision', desc: 'YOLOv8/v11 mAP50-95 on TensorRT vs ONNX, Jetson Orin NX', url: '4-subsystems/computer-vision.html#sec-4-4-2', group: 'Vision' },
      { icon: '4.4.3', title: 'Technical Documentation & Optics Specs', badge: 'Vision', desc: 'Gabriel\'s deep-dive specs: lens, FOV, GSD calculations', url: '4-subsystems/computer-vision.html#sec-4-4-3', group: 'Vision' },

      // Documentation
      { icon: '🔩', title: 'Asuka — Suspension Analysis', badge: 'Asuka', desc: 'Coil spring, damper selection, FEA suspension load analysis', url: '7-documentation/asuka/suspension.html', group: 'Documentation' },
      { icon: '🌀', title: 'Asuka — Vacuum Module Design', badge: 'Asuka', desc: 'Centrifugal fan sizing, pickup head geometry, debris containment', url: '7-documentation/asuka/vacuum-module.html', group: 'Documentation' },
      { icon: '🏗️', title: 'Zacarias — Chassis Design', badge: 'Zacarias', desc: 'Welded frame topology, cross-member layout, load path analysis', url: '7-documentation/zacarias/chassis-design.html', group: 'Documentation' },
      { icon: '🧪', title: 'Zacarias — FEA Simulation', badge: 'Zacarias', desc: 'ANSYS static structural FEA on chassis frame under worst-case loading', url: '7-documentation/zacarias/fea-simulation.html', group: 'Documentation' },
      { icon: '🪨', title: 'Zacarias — Material Selection', badge: 'Zacarias', desc: 'Material trade-off matrix: Al6061-T6 vs. steel vs. CFRP', url: '7-documentation/zacarias/materiel-selection.html', group: 'Documentation' },
      { icon: '📋', title: 'Bryan — Components BOM', badge: 'Bryan', desc: 'Full bill of materials: part numbers, costs, suppliers, lead times', url: '7-documentation/bryan/components-bom.html', group: 'Documentation' },
      { icon: '🔋', title: 'Bryan — Power Calculations', badge: 'Bryan', desc: 'Detailed 48V bus power budget, run-time estimation, wiring sizing', url: '7-documentation/bryan/power-calculations.html', group: 'Documentation' },
      { icon: '🚀', title: 'Gabriel — YOLO Model Comparison', badge: 'Gabriel', desc: 'YOLOv8n/s/m/l/x vs YOLOv11: latency, mAP, deployment benchmarks', url: '7-documentation/gabriel/yolo-comparison.html', group: 'Documentation' },
      { icon: '📐', title: 'Gabriel — Vision Calculations', badge: 'Gabriel', desc: 'Camera focal length, FOV, Ground Sampling Distance (GSD)', url: '7-documentation/gabriel/vision-calculations.html', group: 'Documentation' },
      { icon: '🔬', title: 'Gabriel — Computer Vision Research', badge: 'Gabriel', desc: 'Airfield FOD datasets, adverse weather augmentation, LiDAR fusion', url: '7-documentation/gabriel/vision-research.html', group: 'Documentation' },
      { icon: '⚡', title: 'Gabriel — STM32 Microcontroller & Firmware', badge: 'Gabriel', desc: 'STM32 F446RE micro-ROS firmware, CAN bus, PID, E-Stop', url: '7-documentation/gabriel/stm32.html', group: 'Documentation' },
      { icon: '🛞', title: 'Hilbert — Motor & Drivetrain Sizing', badge: 'Hilbert', desc: 'BLDC motor torque/speed curves, drivetrain gear ratio calculations', url: '7-documentation/hilbert/Motor_drivetrain_calculation.html', group: 'Documentation' },
      { icon: '↔️', title: 'Hilbert — Steering & Kinematics', badge: 'Hilbert', desc: 'Ackermann geometry, turning circle, encoder odometry calibration', url: '7-documentation/hilbert/steering-kinematics.html', group: 'Documentation' },
      { icon: '🤖', title: 'Hilbert — Simulation (Gazebo)', badge: 'Hilbert', desc: 'Gazebo Harmonic SDF model, Nav2 SLAM, sensor plugin configuration', url: '7-documentation/hilbert/simulation.html', group: 'Documentation' },
      { icon: '🗺️', title: 'Hilbert — Navigation', badge: 'Hilbert', desc: 'Nav2 planner benchmarks, SmacPlanner2D, Pure Pursuit, MPPI results', url: '7-documentation/hilbert/navigation.html', group: 'Documentation' },
      { icon: '📡', title: 'Hilbert — UAV Communication', badge: 'Hilbert', desc: 'ROS 2 bridge, MAVLink, C2 alert ingestion from drone to UGV Nav2', url: '7-documentation/hilbert/communications.html', group: 'Documentation' },

      // References
      { icon: '📖', title: 'Literature References', badge: 'References', desc: 'Primary and secondary literature sources for problem context', url: '7-documentation/literature/primary-research.html', group: 'References' },
      { icon: '📄', title: 'Asuka\'s References', badge: 'References', desc: 'Mechanical subsystem design references and standards', url: '6-references/asuka/references.html', group: 'References' },
      { icon: '📄', title: 'Bryan\'s References', badge: 'References', desc: 'Electrical component datasheets and power system standards', url: '6-references/bryan/references.html', group: 'References' },
      { icon: '📄', title: 'Gabriel\'s References', badge: 'References', desc: 'Computer vision papers, YOLO models, airfield FOD datasets', url: '6-references/gabriel/references.html', group: 'References' },
      { icon: '📄', title: 'Hilbert\'s References', badge: 'References', desc: 'ROS 2 Nav2 papers, navigation algorithms, simulation references', url: '6-references/hilbert/references.html', group: 'References' },
      { icon: '📄', title: 'Zacarias\'s References', badge: 'References', desc: 'FEA simulation, material science, structural design references', url: '6-references/zacarias/references.html', group: 'References' },
    ];

    // ── Build Absolute URLs using the same prefix logic ──────────────
    const styleLink = document.querySelector('link[href*="css/styles.css"]');
    let pfx = '';
    if (styleLink) {
      const href = styleLink.getAttribute('href') || '';
      const m = href.match(/\.\.\//g);
      pfx = m ? m.join('') : '';
    }

    SEARCH_INDEX.forEach(item => {
      item.absUrl = pfx + item.url;
    });

    // ── Inject search icon button ─────────────────────────────────────
    const navActionsEl = document.querySelector('.apple-nav-actions');
    if (navActionsEl && !document.getElementById('apple-nav-search-wrapper')) {
      const searchWrapper = document.createElement('div');
      searchWrapper.className = 'apple-nav-search';
      searchWrapper.id = 'apple-nav-search-wrapper';
      searchWrapper.innerHTML = `
        <button class="apple-search-trigger" id="apple-search-open-btn" title="Search report (⌘K)" aria-label="Open site search">
          <svg class="apple-search-icon" width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="9" r="7"/><path d="M14.5 14.5l4 4"/>
          </svg>
        </button>`;

      if (isIndex) {
        // On index: insert BEFORE the hamburger toggle, keep existing pill
        const mobileToggle = navActionsEl.querySelector('.apple-mobile-toggle');
        if (mobileToggle) {
          navActionsEl.insertBefore(searchWrapper, mobileToggle);
        } else {
          navActionsEl.appendChild(searchWrapper);
        }
      } else {
        // On other pages: replace the existing .apple-btn-pill with search icon
        const existingPill = navActionsEl.querySelector('.apple-btn-pill');
        if (existingPill) {
          existingPill.replaceWith(searchWrapper);
        } else {
          const mobileToggle = navActionsEl.querySelector('.apple-mobile-toggle');
          if (mobileToggle) {
            navActionsEl.insertBefore(searchWrapper, mobileToggle);
          } else {
            navActionsEl.appendChild(searchWrapper);
          }
        }
      }
    }

    // ── Build Modal DOM ───────────────────────────────────────────────
    let searchModal = document.getElementById('apple-site-search-modal');
    if (!searchModal) {
      searchModal = document.createElement('div');
      searchModal.id = 'apple-site-search-modal';
      searchModal.className = 'apple-search-modal-backdrop';
      searchModal.setAttribute('role', 'dialog');
      searchModal.setAttribute('aria-modal', 'true');
      searchModal.setAttribute('aria-label', 'Site Search');
      searchModal.innerHTML = `
        <div class="apple-search-modal-window" id="apple-search-modal-window">
          <div class="apple-search-header">
            <svg class="apple-search-modal-icon" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="9" r="7"/><path d="M14.5 14.5l4 4"/>
            </svg>
            <input
              type="search"
              id="apple-search-modal-input"
              class="apple-search-modal-input"
              placeholder="Search pages, sections, topics…"
              autocomplete="off"
              spellcheck="false"
            />
            <button class="apple-search-clear-btn" id="apple-search-clear" aria-label="Clear search" title="Clear">✕</button>
            <span class="apple-search-esc-hint">ESC</span>
          </div>
          <div class="apple-search-results-list" id="apple-search-results-list" role="listbox"></div>
          <div class="apple-search-footer">
            <div class="apple-search-footer-shortcuts">
              <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
              <span><kbd>↵</kbd> Open</span>
              <span><kbd>ESC</kbd> Close</span>
            </div>
            <span id="apple-search-result-count" style="opacity:0.6;"></span>
          </div>
        </div>`;
      document.body.appendChild(searchModal);
    }

    const modalInput = document.getElementById('apple-search-modal-input');
    const resultsList = document.getElementById('apple-search-results-list');
    const clearBtn = document.getElementById('apple-search-clear');
    const resultCount = document.getElementById('apple-search-result-count');
    let selectedIdx = -1;
    let currentResults = [];

    function openSearchModal() {
      searchModal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => {
        if (modalInput) modalInput.focus();
      });
      renderResults('');
    }

    function closeSearchModal() {
      if (!searchModal) return;
      searchModal.classList.remove('is-open');
      document.body.style.overflow = '';
      if (modalInput) {
        modalInput.value = '';
        clearBtn.style.display = 'none';
      }
      selectedIdx = -1;
    }
    // Expose so outer ESC handler can call it
    window._closeSearchModal = closeSearchModal;

    // ── Fuzzy Highlight helper ────────────────────────────────────────
    function highlight(text, query) {
      if (!query.trim()) return text;
      const esc = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return text.replace(new RegExp(`(${esc})`, 'gi'), '<span class="apple-search-highlight">$1</span>');
    }

    // ── Fuzzy score helper ────────────────────────────────────────────
    function score(item, q) {
      const haystack = (item.title + ' ' + item.desc + ' ' + item.badge + ' ' + item.group).toLowerCase();
      const needle = q.toLowerCase();
      if (haystack.includes(needle)) {
        if (item.title.toLowerCase().startsWith(needle)) return 4;
        if (item.title.toLowerCase().includes(needle)) return 3;
        if (item.badge.toLowerCase().includes(needle)) return 2;
        return 1;
      }
      // Split query into words for partial match
      const words = needle.split(/\s+/);
      if (words.every(w => haystack.includes(w))) return 0.5;
      return 0;
    }

    function renderResults(query) {
      resultsList.innerHTML = '';
      selectedIdx = -1;

      let results;
      if (!query.trim()) {
        // Show default top-level pages
        results = SEARCH_INDEX.filter(item => item.group === 'Main Pages' || item.group === 'Subsystems');
      } else {
        results = SEARCH_INDEX
          .map(item => ({ item, s: score(item, query) }))
          .filter(({ s }) => s > 0)
          .sort((a, b) => b.s - a.s)
          .map(({ item }) => item);
      }

      currentResults = results;

      if (results.length === 0) {
        resultsList.innerHTML = `
          <div class="apple-search-empty-state">
            <div class="apple-search-empty-icon">🔍</div>
            <div>No results for "<strong>${query}</strong>"</div>
            <div style="margin-top:6px;font-size:12px;opacity:0.6;">Try different keywords</div>
          </div>`;
        resultCount.textContent = '';
        return;
      }

      // Group results
      const grouped = {};
      results.forEach(item => {
        if (!grouped[item.group]) grouped[item.group] = [];
        grouped[item.group].push(item);
      });

      const groupOrder = ['Main Pages', 'Subsystems', 'Mechanical', 'Electrical', 'Programming', 'Vision', 'Documentation', 'References'];
      let flatIndex = 0;

      groupOrder.forEach(groupName => {
        if (!grouped[groupName] || grouped[groupName].length === 0) return;
        const gTitle = document.createElement('div');
        gTitle.className = 'apple-search-group-title';
        gTitle.textContent = groupName;
        resultsList.appendChild(gTitle);

        grouped[groupName].forEach(item => {
          const a = document.createElement('a');
          a.className = 'apple-search-item';
          a.href = item.absUrl;
          a.setAttribute('role', 'option');
          a.dataset.index = flatIndex++;
          const q = query.trim();
          a.innerHTML = `
            <div class="apple-search-item-icon">${item.icon}</div>
            <div class="apple-search-item-content">
              <div class="apple-search-item-title">
                ${highlight(item.title, q)}
                <span class="apple-search-item-badge">${item.badge}</span>
              </div>
              <div class="apple-search-item-desc">${highlight(item.desc, q)}</div>
            </div>
            <div class="apple-search-item-enter">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 6v4a2 2 0 01-2 2H3m0 0l3-3M3 12l3 3"/>
              </svg>
            </div>`;
          a.addEventListener('click', () => closeSearchModal());
          resultsList.appendChild(a);
        });
      });

      resultCount.textContent = `${results.length} result${results.length !== 1 ? 's' : ''}`;
    }

    // ── Wire up events ────────────────────────────────────────────────
    const openBtn = document.getElementById('apple-search-open-btn');
    if (openBtn) openBtn.addEventListener('click', openSearchModal);

    // Click backdrop to close
    searchModal.addEventListener('click', (e) => {
      if (e.target === searchModal) closeSearchModal();
    });

    // Input events
    if (modalInput) {
      modalInput.addEventListener('input', (e) => {
        const q = e.target.value;
        clearBtn.style.display = q ? 'flex' : 'none';
        renderResults(q);
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        modalInput.value = '';
        clearBtn.style.display = 'none';
        renderResults('');
        modalInput.focus();
      });
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      // ⌘K or Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (searchModal.classList.contains('is-open')) {
          closeSearchModal();
        } else {
          openSearchModal();
        }
        return;
      }

      if (!searchModal.classList.contains('is-open')) return;

      const items = resultsList.querySelectorAll('.apple-search-item');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIdx = Math.min(selectedIdx + 1, items.length - 1);
        updateSelection(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIdx = Math.max(selectedIdx - 1, -1);
        updateSelection(items);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIdx >= 0 && items[selectedIdx]) {
          closeSearchModal();
          window.location.href = items[selectedIdx].href;
        }
      }
    });

    function updateSelection(items) {
      items.forEach((el, i) => {
        el.classList.toggle('is-selected', i === selectedIdx);
        if (i === selectedIdx) el.scrollIntoView({ block: 'nearest' });
      });
    }

    // ── Mobile drawer: add search button ─────────────────────────────
    const mobileDrawer = document.getElementById('apple-mobile-drawer');
    if (mobileDrawer && !mobileDrawer.querySelector('.apple-mobile-search-btn')) {
      const mobileSearchBtn = document.createElement('button');
      mobileSearchBtn.className = 'apple-mobile-search-btn';
      mobileSearchBtn.innerHTML = `<span>🔍 Search report...</span><kbd style="font-size:11px;padding:2px 6px;border-radius:4px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);">⌘K</kbd>`;
      mobileSearchBtn.addEventListener('click', () => {
        // Close drawer first
        mobileDrawer.classList.remove('active');
        openSearchModal();
      });
      mobileDrawer.insertBefore(mobileSearchBtn, mobileDrawer.firstChild);
    }
  })();

});

