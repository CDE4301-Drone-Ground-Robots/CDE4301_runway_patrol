// Widget script (runs once per page via useWidgetScript); edit here.
/* eslint-disable */
import __a0 from '@docs/report/members/gabriel/assets/images/screw.png'
export default function init() {

    (function () {
      // -----------------------------------------------------------------------
      // 2. SECTION 2: METRIC SWAPPER (Test Performance on Leak-Free FOD-A)
      // -----------------------------------------------------------------------
      const metricData = {
        latency: {
          yolo11: 5.2,
          yolov8: 4.5,
          rtdetr: 24.2,
          isLatency: true,
          caption: 'YOLOv8-S (4.5 ms) and YOLO11-S (5.2 ms) execute ~5x faster than RT-DETR-L (24.2 ms), comfortably within the 33.3 ms real-time edge budget.'
        },
        map5095: {
          yolo11: 39.57,
          yolov8: 34.55,
          rtdetr: 51.82,
          isLatency: false,
          caption: 'RT-DETR-L leads test mAP@50-95 by +12.25 pp, demonstrating superior bounding-box localization tightness.'
        },
        precision: {
          yolo11: 75.63,
          yolov8: 65.68,
          rtdetr: 66.44,
          isLatency: false,
          caption: 'YOLO11-S achieves highest precision (75.63%), producing fewer false positive stops on runway clutter.'
        },
        recall: {
          yolo11: 42.50,
          yolov8: 42.28,
          rtdetr: 62.57,
          isLatency: false,
          caption: 'RT-DETR-L achieves +20.07 pp higher recall (62.57% vs 42.50%), missing significantly fewer runway hazards.'
        }
      };

      const metricButtons = document.querySelectorAll('.metric-btn');
      const barYolo11 = document.getElementById('bar-yolo11');
      const valYolo11 = document.getElementById('val-yolo11');
      const barYolov8 = document.getElementById('bar-yolov8');
      const valYolov8 = document.getElementById('val-yolov8');
      const barRtdetr = document.getElementById('bar-rtdetr');
      const valRtdetr = document.getElementById('val-rtdetr');
      const metricCaption = document.getElementById('metric-caption');
      const axisScale = document.getElementById('metric-axis-scale');
      const chartTitle = document.getElementById('metric-chart-title');

      function updateMetric(metricKey) {
        const d = metricData[metricKey];
        if (!d) return;

        metricButtons.forEach(btn => {
          const isActive = btn.dataset.metric === metricKey;
          btn.classList.toggle('active', isActive);
          btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });

        if (d.isLatency) {
          if (chartTitle) {
            chartTitle.textContent = 'A40 Inference Latency vs. 33.3 ms Real-Time Budget';
          }
          // Latency in ms (lower is better):
          // YOLOv8-S (4.5 ms) is fastest (best) -> GREEN
          // YOLO11-S (5.2 ms) is middle -> BLUE
          // RT-DETR-L (24.2 ms) is slowest (worst) -> RED
          const budgetMs = 33.3;
          if (barYolo11 && valYolo11) {
            barYolo11.style.width = ((d.yolo11 / budgetMs) * 100).toFixed(1) + '%';
            valYolo11.textContent = d.yolo11.toFixed(1) + ' ms';
            barYolo11.style.background = 'var(--apple-blue)';
            valYolo11.style.color = 'var(--apple-blue)';
          }
          if (barYolov8 && valYolov8) {
            barYolov8.style.width = ((d.yolov8 / budgetMs) * 100).toFixed(1) + '%';
            valYolov8.textContent = d.yolov8.toFixed(1) + ' ms';
            barYolov8.style.background = 'var(--apple-green)';
            valYolov8.style.color = 'var(--apple-green)';
          }
          if (barRtdetr && valRtdetr) {
            barRtdetr.style.width = ((d.rtdetr / budgetMs) * 100).toFixed(1) + '%';
            valRtdetr.textContent = d.rtdetr.toFixed(1) + ' ms';
            barRtdetr.style.background = 'var(--apple-red)';
            valRtdetr.style.color = 'var(--apple-red)';
          }
          if (axisScale) {
            axisScale.innerHTML = '<span>0 ms</span><span>8.3 ms</span><span>16.7 ms</span><span>25.0 ms</span><span>33.3 ms (Budget)</span>';
          }
        } else {
          if (chartTitle) {
            chartTitle.textContent = 'True Test Generalization on Leak-Free FOD-A';
          }
          // Accuracy metrics in % (higher is better):
          // Best (highest) -> GREEN, Middle -> BLUE, Worst (lowest) -> RED
          const list = [
            { key: 'yolo11', val: d.yolo11, bar: barYolo11, label: valYolo11 },
            { key: 'yolov8', val: d.yolov8, bar: barYolov8, label: valYolov8 },
            { key: 'rtdetr', val: d.rtdetr, bar: barRtdetr, label: valRtdetr }
          ];
          list.sort((a, b) => b.val - a.val);

          // Best [0] -> Green
          if (list[0].bar && list[0].label) {
            list[0].bar.style.width = list[0].val + '%';
            list[0].label.textContent = list[0].val.toFixed(2) + '%';
            list[0].bar.style.background = 'var(--apple-green)';
            list[0].label.style.color = 'var(--apple-green)';
          }
          // Middle [1] -> Blue
          if (list[1].bar && list[1].label) {
            list[1].bar.style.width = list[1].val + '%';
            list[1].label.textContent = list[1].val.toFixed(2) + '%';
            list[1].bar.style.background = 'var(--apple-blue)';
            list[1].label.style.color = 'var(--apple-blue)';
          }
          // Worst [2] -> Red
          if (list[2].bar && list[2].label) {
            list[2].bar.style.width = list[2].val + '%';
            list[2].label.textContent = list[2].val.toFixed(2) + '%';
            list[2].bar.style.background = 'var(--apple-red)';
            list[2].label.style.color = 'var(--apple-red)';
          }

          if (axisScale) {
            axisScale.innerHTML = '<span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>';
          }
        }

        if (metricCaption) {
          metricCaption.textContent = d.caption;
        }
      }

      metricButtons.forEach(btn => {
        btn.addEventListener('click', () => updateMetric(btn.dataset.metric));
      });

      // -----------------------------------------------------------------------
      // 1. SECTION 1: FRAME STRIP VISUALIZER & LEAKAGE TOGGLE
      // -----------------------------------------------------------------------
      const RANDOM_STRIP = [
        'train', 'train', 'test', 'train', 'train', 'val', 'test', 'train', 'train', 'test',
        'train', 'train', 'test', 'train', 'train', 'train', 'test', 'val', 'train', 'train',
        'test', 'train', 'train', 'train', 'test', 'train', 'train', 'train', 'test', 'train',
        'val', 'train', 'train', 'test', 'train', 'train', 'train', 'test', 'train', 'train'
      ];

      const LEAKFREE_STRIP = [
        // 28 train
        'train', 'train', 'train', 'train', 'train', 'train', 'train', 'train', 'train', 'train',
        'train', 'train', 'train', 'train', 'train', 'train', 'train', 'train', 'train', 'train',
        'train', 'train', 'train', 'train', 'train', 'train', 'train', 'train',
        // 3 grey (buffer)
        'buffer', 'buffer', 'buffer',
        // 4 val
        'val', 'val', 'val', 'val',
        // 2 grey (buffer)
        'buffer', 'buffer',
        // 3 test
        'test', 'test', 'test'
      ];

      const COLOR_MAP = {
        train: 'var(--apple-blue)',
        val: 'var(--apple-purple)',
        test: '#ff9f0a',
        buffer: '#636366'
      };

      const LABEL_MAP = {
        train: 'Train',
        val: 'Validation',
        test: 'Test',
        buffer: 'Discarded buffer'
      };

      const stripContainer = document.getElementById('frame-strip-container');
      const btnStripRandom = document.getElementById('btn-strip-random');
      const btnStripClean = document.getElementById('btn-strip-clean');
      const stripDesc = document.getElementById('strip-description');

      // Initialize 40 squares
      if (stripContainer) {
        stripContainer.innerHTML = '';
        for (let i = 0; i < 40; i++) {
          const sq = document.createElement('div');
          sq.className = 'frame-square';
          sq.style.background = COLOR_MAP[RANDOM_STRIP[i]];
          sq.setAttribute('title', 'Frame ' + (i + 1) + ': ' + (LABEL_MAP[RANDOM_STRIP[i]] || RANDOM_STRIP[i]));
          stripContainer.appendChild(sq);
        }
      }

      function setStripMode(isClean) {
        if (!btnStripRandom || !btnStripClean) return;

        btnStripRandom.classList.toggle('active', !isClean);
        btnStripRandom.setAttribute('aria-pressed', !isClean ? 'true' : 'false');
        btnStripClean.classList.toggle('active', isClean);
        btnStripClean.setAttribute('aria-pressed', isClean ? 'true' : 'false');

        const squares = stripContainer ? stripContainer.querySelectorAll('.frame-square') : [];
        const pattern = isClean ? LEAKFREE_STRIP : RANDOM_STRIP;

        squares.forEach((sq, i) => {
          if (pattern[i]) {
            sq.style.background = COLOR_MAP[pattern[i]];
            sq.setAttribute('title', 'Frame ' + (i + 1) + ': ' + (LABEL_MAP[pattern[i]] || pattern[i]));
          }
        });

        if (stripDesc) {
          if (isClean) {
            stripDesc.textContent = 'Leak-free split isolates continuous scenes into train, validation, and test partitions with discarded buffer frames.';
          } else {
            stripDesc.textContent = 'Random frame split interleaves test and validation frames immediately adjacent to train frames.';
          }
        }
      }

      if (btnStripRandom && btnStripClean) {
        btnStripRandom.addEventListener('click', () => setStripMode(false));
        btnStripClean.addEventListener('click', () => setStripMode(true));
      }

      // -----------------------------------------------------------------------
      // 3. SECTION 1: 5-STEP PROTOCOL STEPPER
      // -----------------------------------------------------------------------
      const protocolSteps = [
        {
          badge: 'STEP 1',
          title: 'Group Frames to Scenes',
          desc: 'All 33,793 frames are put in order and grouped into scenes, where each scene is showing a different object.'
        },
        {
          badge: 'STEP 2',
          title: 'Scene Segmentation',
          desc: 'For classes filmed in 3 or more scenes, every scene goes entirely into train, validation or test, and is never cut in half.'
        },
        {
          badge: 'STEP 3',
          title: 'Splitting Rare Scenes',
          desc: 'Classes filmed in only 1–2 scenes are cut by time instead: first 70% train, 8% discarded, 10% validation, 4% discarded, last 8% test.'
        },
        {
          badge: 'STEP 4',
          title: 'Removing Buffers',
          desc: 'Wherever a training scene sits right next to a test scene, 15 frames at the boundary are deleted, 3,416 frames in total were removed in this way.'
        },
        {
          badge: 'STEP 5',
          title: 'Final Check',
          desc: 'An automated check confirms zero duplicate frames and zero neighbouring frames across splits. The closest train and test frames are at least 31 frames apart.'
        }
      ];

      let currentStepIndex = 0;
      const stepBadge = document.getElementById('step-badge');
      const stepTitle = document.getElementById('step-title');
      const stepDesc = document.getElementById('step-desc');
      const stepCounter = document.getElementById('step-counter');
      const prevBtn = document.getElementById('step-prev-btn');
      const nextBtn = document.getElementById('step-next-btn');
      const dots = document.querySelectorAll('#protocol-dots .step-dot');

      function renderStep(idx) {
        currentStepIndex = Math.max(0, Math.min(idx, protocolSteps.length - 1));
        const step = protocolSteps[currentStepIndex];

        if (stepBadge) stepBadge.textContent = step.badge;
        if (stepTitle) stepTitle.textContent = step.title;
        if (stepDesc) stepDesc.textContent = step.desc;
        if (stepCounter) stepCounter.textContent = 'Step ' + (currentStepIndex + 1) + ' of ' + protocolSteps.length;

        dots.forEach((dot, i) => {
          dot.classList.toggle('active', i === currentStepIndex);
        });

        if (prevBtn) prevBtn.disabled = (currentStepIndex === 0);
        if (nextBtn) nextBtn.disabled = (currentStepIndex === protocolSteps.length - 1);
      }

      if (prevBtn) prevBtn.addEventListener('click', () => renderStep(currentStepIndex - 1));
      if (nextBtn) nextBtn.addEventListener('click', () => renderStep(currentStepIndex + 1));
      dots.forEach((dot, i) => {
        dot.style.cursor = 'pointer';
        dot.setAttribute('title', 'Go to step ' + (i + 1));
        dot.addEventListener('click', () => renderStep(i));
      });

      // -----------------------------------------------------------------------
      // 4. SECTION 3: MULTI-SEED SWAPPER & PIXELATION VISUALIZER
      // -----------------------------------------------------------------------
      const seedData = {
        s0: {
          r640: { regime: 'Fine-Tuned Native (Seed 0)', map50: '88.3%', map5095: '55.8%', prec: '96.8%', rec: '82.1%' },
          r1088: { regime: 'Fine-Tuned Native (Seed 0)', map50: '95.7%', map5095: '69.4%', prec: '97.1%', rec: '89.2%' }
        },
        s1: {
          r640: { regime: 'Fine-Tuned Native (Seed 1)', map50: '86.9%', map5095: '55.1%', prec: '95.6%', rec: '81.5%' },
          r1088: { regime: 'Fine-Tuned Native (Seed 1)', map50: '97.0%', map5095: '66.8%', prec: '99.2%', rec: '93.4%' }
        },
        s2: {
          r640: { regime: 'Fine-Tuned Native (Seed 2)', map50: '88.0%', map5095: '53.4%', prec: '94.9%', rec: '80.8%' },
          r1088: { regime: 'Fine-Tuned Native (Seed 2)', map50: '98.4%', map5095: '71.2%', prec: '99.4%', rec: '95.4%' }
        },
        mean: {
          r640: { regime: 'Fine-Tuned Native (Seeds 0, 1, 2)', map50: '87.7 &plusmn; 0.7%', map5095: '54.8 &plusmn; 1.2%', prec: '95.8 &plusmn; 1.0%', rec: '81.5 &plusmn; 0.7%' },
          r1088: { regime: 'Fine-Tuned Native (Seeds 0, 1, 2)', map50: '97.0 &plusmn; 1.4%', map5095: '69.1 &plusmn; 2.2%', prec: '98.6 &plusmn; 1.3%', rec: '92.7 &plusmn; 3.2%' }
        }
      };

      const seedButtons = document.querySelectorAll('.seed-btn');
      const r640Regime = document.getElementById('s3-r640-regime');
      const r640Map50 = document.getElementById('s3-r640-map50');
      const r640Map5095 = document.getElementById('s3-r640-map5095');
      const r640Prec = document.getElementById('s3-r640-prec');
      const r640Rec = document.getElementById('s3-r640-rec');

      const r1088Regime = document.getElementById('s3-r1088-regime');
      const r1088Map50 = document.getElementById('s3-r1088-map50');
      const r1088Map5095 = document.getElementById('s3-r1088-map5095');
      const r1088Prec = document.getElementById('s3-r1088-prec');
      const r1088Rec = document.getElementById('s3-r1088-rec');

      function updateSeed(seedKey) {
        const item = seedData[seedKey];
        if (!item) return;

        seedButtons.forEach(btn => {
          const isActive = btn.dataset.seed === seedKey;
          btn.classList.toggle('active', isActive);
          btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });

        if (r640Regime) r640Regime.innerHTML = '<strong>' + item.r640.regime + '</strong>';
        if (r640Map50) r640Map50.innerHTML = '<span class="blue-stat">' + item.r640.map50 + '</span>';
        if (r640Map5095) r640Map5095.innerHTML = '<span class="blue-stat">' + item.r640.map5095 + '</span>';
        if (r640Prec) r640Prec.innerHTML = '<span class="blue-stat">' + item.r640.prec + '</span>';
        if (r640Rec) r640Rec.innerHTML = '<span class="blue-stat">' + item.r640.rec + '</span>';

        if (r1088Regime) r1088Regime.innerHTML = '<strong>' + item.r1088.regime + '</strong>';
        if (r1088Map50) r1088Map50.innerHTML = '<strong class="highlight-stat">' + item.r1088.map50 + '</strong>';
        if (r1088Map5095) r1088Map5095.innerHTML = '<span class="highlight-stat">' + item.r1088.map5095 + '</span>';
        if (r1088Prec) r1088Prec.innerHTML = '<span class="highlight-stat">' + item.r1088.prec + '</span>';
        if (r1088Rec) r1088Rec.innerHTML = '<strong class="highlight-stat">' + item.r1088.rec + '</strong>';
      }

      seedButtons.forEach(btn => {
        btn.addEventListener('click', () => updateSeed(btn.dataset.seed));
      });

      // 3c. Fastener Pixelation Comparison (Camera, 1088, 640)
      function drawPixelatedBlock(canvas, img, scale) {
        if (!canvas || !img) return;
        const W = canvas.width;
        const H = canvas.height;
        const offscreen = document.createElement('canvas');
        const sw = Math.max(1, Math.round(W * scale));
        const sh = Math.max(1, Math.round(H * scale));
        offscreen.width = sw;
        offscreen.height = sh;
        const offCtx = offscreen.getContext('2d');
        offCtx.drawImage(img, 0, 0, sw, sh);

        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        if ('mozImageSmoothingEnabled' in ctx) ctx.mozImageSmoothingEnabled = false;
        if ('webkitImageSmoothingEnabled' in ctx) ctx.webkitImageSmoothingEnabled = false;
        if ('msImageSmoothingEnabled' in ctx) ctx.msImageSmoothingEnabled = false;
        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(offscreen, 0, 0, sw, sh, 0, 0, W, H);

        // Faint 1 px grid drawn over each visible pixel block
        const blockW = W / sw;
        const blockH = H / sh;
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        ctx.save();
        ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = blockW; x < W; x += blockW) {
          const px = Math.round(x) + 0.5;
          ctx.moveTo(px, 0);
          ctx.lineTo(px, H);
        }
        for (let y = blockH; y < H; y += blockH) {
          const py = Math.round(y) + 0.5;
          ctx.moveTo(0, py);
          ctx.lineTo(W, py);
        }
        ctx.stroke();
        ctx.restore();
      }

      function renderPixelPanels(img) {
        const cCam = document.getElementById('s3-pixel-canvas-camera');
        const c1088 = document.getElementById('s3-pixel-canvas-1088');
        const c640 = document.getElementById('s3-pixel-canvas-640');

        // Panel 1: Camera (full resolution, smoothing on)
        if (cCam) {
          const ctx = cCam.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.clearRect(0, 0, cCam.width, cCam.height);
          ctx.drawImage(img, 0, 0, cCam.width, cCam.height);
        }

        // Panel 2: 1088 input (scale 0.567, smoothing off, faint 1px pixel grid)
        if (c1088) {
          drawPixelatedBlock(c1088, img, 0.567);
        }

        // Panel 3: 640 input (scale 0.333, smoothing off, faint 1px pixel grid)
        if (c640) {
          drawPixelatedBlock(c640, img, 0.333);
        }
      }

      function showPixelFallback(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const fallback = document.createElement('div');
        fallback.textContent = 'Add assets/images/Gabriel/screw.png (tight ~96 px crop, full resolution)';
        fallback.style.cssText = 'width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 11.5px; color: var(--apple-text-tertiary); text-align: center; padding: 16px; box-sizing: border-box; line-height: 1.4;';
        canvas.replaceWith(fallback);
      }

      const screwImg = new Image();
      screwImg.onload = function () {
        renderPixelPanels(screwImg);
      };
      screwImg.onerror = function () {
        showPixelFallback('s3-pixel-canvas-camera');
        showPixelFallback('s3-pixel-canvas-1088');
        showPixelFallback('s3-pixel-canvas-640');
      };
      screwImg.src = __a0;
      if (screwImg.complete) {
        if (screwImg.naturalWidth > 0) {
          screwImg.onload();
        } else {
          screwImg.onerror();
        }
      }

      // Re-render pixel panels if data-theme changes to update faint grid contrast
      const themeObserver = new MutationObserver(() => {
        if (screwImg.complete && screwImg.naturalWidth > 0) {
          renderPixelPanels(screwImg);
        }
      });
      themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

      // -----------------------------------------------------------------------
      // 5. LIGHTBOX MODAL DIALOG
      // -----------------------------------------------------------------------
      const lightboxDialog = document.getElementById('image-lightbox-dialog');
      const lightboxImg = document.getElementById('lightbox-img');
      const lightboxCaption = document.getElementById('lightbox-caption');
      const lightboxCloseBtn = document.getElementById('lightbox-close-btn');

      if (lightboxDialog && lightboxImg) {
        document.querySelectorAll('img.zoomable, .figure-preview img').forEach(img => {
          img.addEventListener('click', () => {
            lightboxImg.src = img.src;
            lightboxImg.alt = img.alt || 'Enlarged figure';
            if (lightboxCaption) {
              const captionEl = img.closest('.chart-box')?.querySelector('.figure-caption') ||
                img.parentElement?.querySelector('.figure-caption');
              lightboxCaption.textContent = captionEl ? captionEl.textContent.trim() : (img.alt || '');
            }
            lightboxDialog.showModal();
          });
        });

        if (lightboxCloseBtn) {
          lightboxCloseBtn.addEventListener('click', () => lightboxDialog.close());
        }

        // Close on clicking outside the dialog content box (backdrop click)
        lightboxDialog.addEventListener('click', (e) => {
          if (e.target === lightboxDialog) {
            lightboxDialog.close();
          }
        });
      }
    })();

    // -------------------------------------------------------------------------
    // 6. PDF EXPORT HANDLER (Expand all details before print)
    // -------------------------------------------------------------------------
    function openAllDetailsAndPrint() {
      document.querySelectorAll('details').forEach(d => { d.open = true; });
      window.print();
    }

    window.addEventListener('beforeprint', function () {
      document.querySelectorAll('details').forEach(d => { d.open = true; });
    });
  
}
