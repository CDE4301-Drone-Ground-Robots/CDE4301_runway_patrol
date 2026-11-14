// Widget script (runs once per page via useWidgetScript); edit here.
/* eslint-disable */

export default function init() {

    (function () {
      // Derive vfov from sensor height and focal length: vfov = 2 * atan((height / 2) / fx)
      function computeVfovDeg(height, fx) {
        return 2 * Math.atan((height / 2) / fx) * (180 / Math.PI);
      }

      // Sensor Preset Definitions
      const PRESETS = {
        elp5mp: {
          name: 'ELP-USBGS5MP01-L601 (OX05B1S, 6 mm)',
          width: 2592,
          height: 1944,
          hfovDeg: 57.0,
          fx: 2386.9,
          fy: 2386.9,
          vfovDeg: 42.0
        },
        imx568: {
          name: 'Leopard LI-IMX568',
          width: 2472,
          height: 2064,
          hfovDeg: 50.0,
          fx: 2650.0,
          fy: 2650.0,
          vfovDeg: computeVfovDeg(2064, 2650.0)
        },
        ecam56: {
          name: 'e-con e-CAM56',
          width: 2472,
          height: 2064,
          hfovDeg: 104.8,
          fx: 951.8,
          fy: 951.8,
          vfovDeg: computeVfovDeg(2064, 951.8)
        },
        ugreen: {
          name: 'UGREEN CM831 Webcam',
          width: 1920,
          height: 1080,
          hfovDeg: 62.0,
          fx: 1597.7,
          fy: 1597.7,
          vfovDeg: computeVfovDeg(1080, 1597.7)
        }
      };

      let currentPresetKey = 'elp5mp';
      const V_SPEED = 4.19; // 400 RPM wheels = 4.19 m/s

      // DOM Elements
      const sliderHeight = document.getElementById('slider-height');
      const sliderTilt = document.getElementById('slider-tilt');
      const sliderDebris = document.getElementById('slider-debris');

      const valHeight = document.getElementById('val-height');
      const valTilt = document.getElementById('val-tilt');
      const valDebris = document.getElementById('val-debris');

      const hudDnear = document.getElementById('hud-dnear');
      const hudDcenter = document.getElementById('hud-dcenter');
      const hudGsdh = document.getElementById('hud-gsdh');
      const hudGsdv = document.getElementById('hud-gsdv');
      const hudNativePx = document.getElementById('hud-native-px');
      const hudYolo640Px = document.getElementById('hud-yolo640-px');
      const hudStatus640 = document.getElementById('hud-status-640');
      const hudSub640 = document.getElementById('hud-sub-640');

      const hudYolo1088Px = document.getElementById('hud-yolo1088-px');
      const hudStatus1088 = document.getElementById('hud-status-1088');
      const hudSub1088 = document.getElementById('hud-sub-1088');

      const hudTexp = document.getElementById('hud-texp');
      const hudTexpSub = document.getElementById('hud-texp-sub');

      const canvas = document.getElementById('sim-canvas');
      const ctx = canvas.getContext('2d');

      const presetButtons = document.querySelectorAll('.preset-btn');

      // Preset click handlers
      presetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          presetButtons.forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-checked', 'false');
          });
          btn.classList.add('active');
          btn.setAttribute('aria-checked', 'true');
          currentPresetKey = btn.dataset.preset;
          updateSimulation();
        });
      });

      // Slider input handlers
      sliderHeight.addEventListener('input', updateSimulation);
      sliderTilt.addEventListener('input', updateSimulation);
      sliderDebris.addEventListener('input', updateSimulation);

      function updateSimulation() {
        const H = parseFloat(sliderHeight.value);
        const thetaDeg = parseFloat(sliderTilt.value);
        const debrisMm = parseFloat(sliderDebris.value);

        valHeight.textContent = H.toFixed(2) + ' m';
        valTilt.textContent = thetaDeg.toFixed(1) + '°';
        valDebris.textContent = debrisMm.toFixed(0) + ' mm';

        const preset = PRESETS[currentPresetKey];
        const thetaRad = thetaDeg * Math.PI / 180;
        const vfovRad = preset.vfovDeg * Math.PI / 180;

        // 1. Geometric intersections on ground plane (Z = 0)
        // Image centre (boresight) ground point
        const dCenter = thetaRad > 0.01 ? H / Math.tan(thetaRad) : 99.0;

        // Near ground cutoff (theta + vfov/2)
        const angleNear = thetaRad + vfovRad / 2;
        const dNear = angleNear < Math.PI / 2 ? H / Math.tan(angleNear) : 0.05;

        // Far ground cutoff (theta - vfov/2)
        const angleFar = thetaRad - vfovRad / 2;
        const isAboveHorizon = angleFar <= 0;
        const dFar = !isAboveHorizon ? H / Math.tan(angleFar) : Infinity;

        // 2. GSD Calculations at IMAGE CENTRE (d = dCenter, alpha = 0)
        const R_center = Math.sqrt(H * H + dCenter * dCenter);
        const psi_center = thetaRad; // Angle at image centre equals tilt theta

        // Horizontal GSD (across) at image centre
        const gsdAcrossCenter = (R_center * 1000) / preset.fx;
        // Oblique Vertical GSD (along direction of travel) at image centre
        const gsdAlongCenter = gsdAcrossCenter / Math.sin(psi_center);

        // 3. Target Footprint at Image Centre (W = width across, L = length along)
        const nativeW = debrisMm / gsdAcrossCenter;
        const nativeL = debrisMm / gsdAlongCenter;

        // YOLO 640p scaling (640 / width)
        const scale640 = 640 / preset.width;
        const yolo640W = nativeW * scale640;
        const yolo640L = nativeL * scale640;

        // YOLO 1088p scaling (1088 / width)
        const scale1088 = 1088 / preset.width;
        const yolo1088W = nativeW * scale1088;
        const yolo1088L = nativeL * scale1088;

        // 4. Max exposure calculations: t_exp = GSD_along / v
        // At image centre (alpha = 0):
        const tExpCentre = (gsdAlongCenter / 1000) / V_SPEED * 1e6; // in microseconds

        // At near edge (alpha = vfov / 2):
        const alphaNear = vfovRad / 2;
        const gsdAlongNear = (H * Math.pow(Math.cos(alphaNear), 2) / (preset.fx * Math.pow(Math.sin(angleNear), 2))) * 1000; // in mm/px
        const gsdAcrossNear = ((H / Math.sin(angleNear)) * Math.cos(alphaNear) / preset.fx) * 1000; // in mm/px
        const tExpNear = (gsdAlongNear / 1000) / V_SPEED * 1e6; // in microseconds

        // Update HUD Telemetry DOM
        hudDnear.textContent = (dNear > 0 ? dNear.toFixed(2) : '0.00') + ' m';
        hudDcenter.textContent = (dCenter < 50 ? dCenter.toFixed(2) : '> 50') + ' m';
        hudGsdh.textContent = gsdAcrossCenter.toFixed(2) + ' mm/px';
        hudGsdv.textContent = 'Along: ' + gsdAlongCenter.toFixed(2) + ' mm/px';
        hudNativePx.textContent = nativeW.toFixed(1) + ' \u00d7 ' + nativeL.toFixed(1) + ' px';

        hudYolo640Px.textContent = yolo640W.toFixed(1) + ' \u00d7 ' + yolo640L.toFixed(1) + ' px';
        hudSub640.textContent = 'Width: ' + yolo640W.toFixed(1) + ' px, Length: ' + yolo640L.toFixed(1) + ' px';

        hudYolo1088Px.textContent = yolo1088W.toFixed(1) + ' \u00d7 ' + yolo1088L.toFixed(1) + ' px';
        hudSub1088.textContent = 'Width: ' + yolo1088W.toFixed(1) + ' px, Length: ' + yolo1088L.toFixed(1) + ' px';

        // Status Pills based on item's WIDTH vs sheet's 32 px rule (>=32 pass, 16-32 marginal, <16 fail)
        function getStatusPillHtml(widthPx) {
          if (widthPx >= 32.0) {
            return '<span class="status-pill status-pass">🟢 PASS (&ge;32px)</span>';
          } else if (widthPx >= 16.0) {
            return '<span class="status-pill status-marginal">🟡 MARGINAL (16–32px)</span>';
          } else {
            return '<span class="status-pill status-fail">🔴 FAIL (&lt;16px)</span>';
          }
        }

        hudStatus640.innerHTML = getStatusPillHtml(yolo640W);
        hudStatus1088.innerHTML = getStatusPillHtml(yolo1088W);

        if (hudTexp) hudTexp.textContent = Math.round(tExpCentre) + ' \u00b5s / ' + Math.round(tExpNear) + ' \u00b5s';
        if (hudTexpSub) hudTexpSub.textContent = 'Centre: ' + Math.round(tExpCentre) + ' \u00b5s \u2022 Near: ' + Math.round(tExpNear) + ' \u00b5s (binding)';

        // Render Canvas
        renderCanvas(H, thetaRad, vfovRad, dNear, dCenter, dFar, isAboveHorizon, debrisMm);
      }

      function renderCanvas(H, theta, vfov, dNear, dCenter, dFar, isAboveHorizon, debrisMm) {
        const W = canvas.width;
        const H_canv = canvas.height;
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';

        ctx.clearRect(0, 0, W, H_canv);

        // Ground line at y = 330
        const groundY = 330;
        // UGV bumper & camera mount reference at x = 110 (0.0 m runway mark)
        const originX = 110;

        // Scale factors: ONE scale for both axes (120 px per metre) so drawn angles match real angles
        const scale = 120;
        const scaleX = scale;
        const scaleY = scale;

        const maxMeters = 5.5;

        // 1. Draw Runway Ground Plane
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = isLight ? '#cbd5e1' : '#334155';
        ctx.lineWidth = 3;
        ctx.moveTo(0, groundY);
        ctx.lineTo(W, groundY);
        ctx.stroke();

        // Asphalt runway sub-base fill
        ctx.fillStyle = isLight ? '#f1f5f9' : '#0a0e17';
        ctx.fillRect(0, groundY, W, H_canv - groundY);

        // Runway distance scale tick markers (every 0.5m)
        ctx.font = '10px -apple-system, BlinkMacSystemFont, "SF Pro Text", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
        ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;

        for (let m = 0; m <= maxMeters; m += 0.5) {
          const tx = originX + m * scale;
          if (tx > W) break;

          ctx.beginPath();
          ctx.moveTo(tx, groundY - (m % 1 === 0 ? 8 : 4));
          ctx.lineTo(tx, groundY + (m % 1 === 0 ? 8 : 4));
          ctx.stroke();

          if (m % 1 === 0) {
            ctx.fillText(m.toFixed(1) + ' m', tx, groundY + 20);
          }
        }

        // Tarmac expansion seam texture
        ctx.fillStyle = isLight ? '#94a3b8' : '#1e293b';
        for (let x = 30; x < W; x += 130) {
          ctx.fillRect(x, groundY + 1, 2, 50);
        }
        ctx.restore();

        // 2. Draw 4WD Robotic Patrol UGV Silhouette
        ctx.save();
        const wheelRadius = 0.10 * scale; // 100 mm radius = 12 px (wheel diameter = 200 mm)
        const wheelY = groundY - wheelRadius;

        ctx.fillStyle = isLight ? '#475569' : '#1e293b';
        ctx.strokeStyle = isLight ? '#0284c7' : '#38bdf8';
        ctx.lineWidth = 2;

        // Rear wheel
        ctx.beginPath();
        ctx.arc(originX - 65, wheelY, wheelRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Front wheel
        ctx.beginPath();
        ctx.arc(originX - 15, wheelY, wheelRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Chassis body box
        ctx.fillStyle = isLight ? '#e2e8f0' : '#1e293b';
        ctx.strokeStyle = isLight ? '#94a3b8' : '#475569';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(originX - 80, wheelY - 26, 80, 24, 4);
        ctx.fill();
        ctx.stroke();

        // Mast mounting post for camera at x = originX (aligned with 0.0m mark)
        const camX = originX;
        const camY = groundY - H * scale;

        ctx.strokeStyle = isLight ? '#64748b' : '#64748b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(camX, wheelY - 24);
        ctx.lineTo(camX, camY);
        ctx.stroke();

        // Mast height dimension label
        ctx.font = '10px -apple-system, BlinkMacSystemFont, monospace';
        ctx.fillStyle = isLight ? '#2563eb' : '#38bdf8';
        ctx.textAlign = 'right';
        ctx.fillText('H = ' + H.toFixed(2) + 'm', camX - 8, camY + (groundY - camY) / 2);

        // Height dotted guideline
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.setLineDash([2, 2]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(camX, camY);
        ctx.lineTo(originX + 25, camY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Camera Sensor Body
        ctx.save();
        ctx.translate(camX, camY);
        ctx.rotate(theta);

        ctx.fillStyle = isLight ? '#0f172a' : '#0284c7';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        // Camera enclosure
        ctx.fillRect(-12, -7, 18, 14);
        ctx.strokeRect(-12, -7, 18, 14);
        // Lens snout
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(6, -5);
        ctx.lineTo(12, -7);
        ctx.lineTo(12, 7);
        ctx.lineTo(6, 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        ctx.restore();

        // 3. Draw Optical FOV Cone & Boresight Ray
        ctx.save();
        const nearCanvasX = camX + dNear * scale;
        const centerCanvasX = camX + dCenter * scale;

        let farCanvasX;
        let farCanvasY = groundY;
        let hitsTopEdge = false;

        if (isAboveHorizon) {
          // Ray points above horizon: intersect right or top edge of canvas
          const topAngle = theta - vfov / 2; // <= 0
          const tanTop = Math.tan(topAngle);
          const yAtRight = camY + (W - camX) * tanTop;
          if (yAtRight < 0 && Math.abs(tanTop) > 1e-4) {
            hitsTopEdge = true;
            farCanvasY = 0;
            farCanvasX = Math.min(W, Math.max(camX, camX - camY / tanTop));
          } else {
            farCanvasX = W;
            farCanvasY = Math.max(0, yAtRight);
          }
        } else {
          farCanvasX = camX + dFar * scale;
        }

        // VFOV Frustum Polygon
        ctx.beginPath();
        ctx.moveTo(camX, camY);
        ctx.lineTo(nearCanvasX, groundY);
        if (isAboveHorizon) {
          ctx.lineTo(W, groundY);
          if (hitsTopEdge) {
            ctx.lineTo(W, 0);
            ctx.lineTo(farCanvasX, 0);
          } else {
            ctx.lineTo(farCanvasX, farCanvasY);
          }
        } else {
          ctx.lineTo(Math.min(farCanvasX, W + 100), groundY);
        }
        ctx.closePath();

        const frustumGrad = ctx.createLinearGradient(camX, camY, Math.min(centerCanvasX, W), groundY);
        frustumGrad.addColorStop(0, 'rgba(41, 151, 255, 0.45)');
        frustumGrad.addColorStop(0.6, 'rgba(41, 151, 255, 0.16)');
        frustumGrad.addColorStop(1, 'rgba(41, 151, 255, 0.03)');
        ctx.fillStyle = frustumGrad;
        ctx.fill();

        // Outer FOV rays
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(41, 151, 255, 0.7)';
        ctx.beginPath();
        // Near ray
        ctx.moveTo(camX, camY);
        ctx.lineTo(nearCanvasX, groundY);
        // Far ray
        ctx.moveTo(camX, camY);
        ctx.lineTo(farCanvasX, farCanvasY);
        ctx.stroke();

        // Center Optical Axis (Boresight)
        ctx.strokeStyle = '#ff9f0a';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(camX, camY);
        ctx.lineTo(centerCanvasX, groundY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Cutoff Marker Lines & Points
        // 1. Near cutoff point
        ctx.fillStyle = '#30d158';
        ctx.beginPath();
        ctx.arc(nearCanvasX, groundY, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '10px -apple-system, BlinkMacSystemFont, monospace';
        ctx.fillStyle = isLight ? '#15803d' : '#4ade80';
        ctx.textAlign = 'center';
        ctx.fillText('d_near (' + dNear.toFixed(2) + 'm)', nearCanvasX, groundY - 12);

        // 2. Boresight Center hit point
        if (centerCanvasX <= W - 20) {
          ctx.fillStyle = '#ff9f0a';
          ctx.beginPath();
          ctx.arc(centerCanvasX, groundY, 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, monospace';
          ctx.fillStyle = isLight ? '#b45309' : '#fbbf24';
          ctx.fillText('Image Centre (' + dCenter.toFixed(2) + 'm)', centerCanvasX, groundY - 26);

          // 3. Draw Target Debris (Bolt icon) at Boresight Hit
          ctx.save();
          ctx.translate(centerCanvasX, groundY);
          ctx.fillStyle = '#e2e8f0';
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1;
          ctx.fillRect(-5, -6, 10, 6);
          ctx.strokeRect(-5, -6, 10, 6);
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(-2.5, -12, 5, 6);
          ctx.strokeRect(-2.5, -12, 5, 6);
          ctx.restore();

          ctx.font = '10px -apple-system, BlinkMacSystemFont, monospace';
          ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
          ctx.fillText(debrisMm + 'mm bolt', centerCanvasX, groundY - 42);
        }

        // Far edge label
        if (isAboveHorizon) {
          const topAngleDeg = Math.abs((theta - vfov / 2) * 180 / Math.PI);
          ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, monospace';
          ctx.fillStyle = isLight ? '#b45309' : '#fbbf24';
          ctx.textAlign = 'right';
          const labelText = 'Top ray: ' + topAngleDeg.toFixed(1) + '° above horizon';
          if (hitsTopEdge) {
            ctx.fillText(labelText, Math.min(W - 14, farCanvasX + 110), 18);
          } else {
            ctx.fillText(labelText, W - 14, Math.max(20, Math.min(groundY - 15, farCanvasY + 14)));
          }
        } else if (farCanvasX <= W - 10) {
          ctx.font = '10px -apple-system, BlinkMacSystemFont, monospace';
          ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
          ctx.textAlign = 'center';
          ctx.fillText('d_far (' + dFar.toFixed(2) + 'm)', farCanvasX, groundY - 12);
        }

        ctx.restore();
      }

      // Initial simulation cycle
      updateSimulation();

      // Theme change observer to trigger canvas re-render
      const observer = new MutationObserver(() => updateSimulation());
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

      // Window resize handler for responsive redraw
      window.addEventListener('resize', () => updateSimulation());
    })();
  
}
