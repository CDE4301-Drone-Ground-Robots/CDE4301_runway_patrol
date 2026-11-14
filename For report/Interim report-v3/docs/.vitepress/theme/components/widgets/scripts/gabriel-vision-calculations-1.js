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

      const hudBand = document.getElementById('hud-band');
      const hudBandSub = document.getElementById('hud-band-sub');
      const hudGsdh = document.getElementById('hud-gsdh');
      const hudGsdv = document.getElementById('hud-gsdv');
      const hudNativePx = document.getElementById('hud-native-px');
      const hudStatusNative = document.getElementById('hud-status-native');
      const hudNativeSub = document.getElementById('hud-native-sub');
      const hudYolo1088Px = document.getElementById('hud-yolo1088-px');
      const hudStatus1088 = document.getElementById('hud-status-1088');

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
        if (hudBand) {
          hudBand.textContent = dNear.toFixed(2) + ' \u2192 ' + (!isAboveHorizon ? dFar.toFixed(2) + ' m' : '\u221e');
        }
        if (hudBandSub) {
          hudBandSub.textContent = 'Centre: ' + (dCenter < 50 ? dCenter.toFixed(2) : '>50') + ' m \u00b7 \u0394x ' + (!isAboveHorizon ? (dFar - dNear).toFixed(2) + ' m' : 'Unbounded');
        }
        if (hudGsdh) hudGsdh.textContent = gsdAcrossCenter.toFixed(2) + ' mm/px';
        if (hudGsdv) hudGsdv.textContent = 'Along: ' + gsdAlongCenter.toFixed(2) + ' mm/px';
        if (hudNativePx) hudNativePx.textContent = nativeW.toFixed(1) + ' \u00d7 ' + nativeL.toFixed(1) + ' px';
        if (hudNativeSub) hudNativeSub.textContent = preset.width + ' \u00d7 ' + preset.height + ' sensor';
        if (hudYolo1088Px) hudYolo1088Px.textContent = yolo1088W.toFixed(1) + ' / ' + yolo640W.toFixed(1) + ' px';

        // Status Pill based on item's WIDTH vs 32 px rule
        function getStatusPillHtml(widthPx, label) {
          if (widthPx >= 32.0) {
            return '<span class="status-pill status-pass">PASS (\u226532 px @ ' + label + ')</span>';
          } else if (widthPx >= 16.0) {
            return '<span class="status-pill status-marginal">MARGINAL (16\u201332 px @ ' + label + ')</span>';
          } else {
            return '<span class="status-pill status-fail">FAIL (&lt;16 px @ ' + label + ')</span>';
          }
        }

        if (hudStatusNative) hudStatusNative.innerHTML = getStatusPillHtml(nativeW, 'Native');
        if (hudStatus1088) hudStatus1088.innerHTML = getStatusPillHtml(yolo1088W, '1088');

        // Render Canvas
        renderCanvas(H, thetaRad, vfovRad, dNear, dCenter, dFar, isAboveHorizon, debrisMm);
      }

      function renderCanvas(H, theta, vfov, dNear, dCenter, dFar, isAboveHorizon, debrisMm) {
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 3);
        const logicalW = Math.max(640, Math.round(rect.width || 880));
        const logicalH = Math.round(logicalW * (230 / 800));

        if (canvas.width !== Math.round(logicalW * dpr) || canvas.height !== Math.round(logicalH * dpr)) {
          canvas.width = Math.round(logicalW * dpr);
          canvas.height = Math.round(logicalH * dpr);
        }

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const W = logicalW;
        const H_canv = logicalH;
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';

        ctx.clearRect(0, 0, W, H_canv);

        // Ground line leaving 46 px at bottom for scale ticks & Near label
        const groundY = H_canv - 46;
        // UGV bumper & camera mast reference at x = 115 (0.0 m runway mark)
        const originX = 115;

        // Equal X/Y scale so drawn angles match real angles; auto-fits tall mast heights
        const scale = Math.min(145, (groundY - 36) / Math.max(H, 0.35));
        const maxMeters = (W - originX) / scale;

        // Subtle engineering grid (0.25 m step)
        ctx.save();
        const gridStep = scale * 0.25;
        ctx.strokeStyle = isLight ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        for (let gx = originX % gridStep; gx < W; gx += gridStep) {
          ctx.beginPath();
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx, groundY);
          ctx.stroke();
        }
        for (let gy = groundY; gy > 0; gy -= gridStep) {
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.lineTo(W, gy);
          ctx.stroke();
        }
        ctx.restore();

        // 1. Draw Runway Ground Plane
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = isLight ? '#cbd5e1' : '#334155';
        ctx.lineWidth = 2.5;
        ctx.moveTo(0, groundY);
        ctx.lineTo(W, groundY);
        ctx.stroke();

        // Asphalt runway sub-base fill
        ctx.fillStyle = isLight ? '#f1f5f9' : '#0a0e17';
        ctx.fillRect(0, groundY, W, H_canv - groundY);

        // Runway distance scale tick markers (every 0.5 m)
        ctx.font = '10px -apple-system, BlinkMacSystemFont, "SF Pro Text", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
        ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;

        for (let m = 0; m <= maxMeters; m += 0.5) {
          const tx = originX + m * scale;
          if (tx > W - 10) break;

          ctx.beginPath();
          ctx.moveTo(tx, groundY - (m % 1 === 0 ? 6 : 3));
          ctx.lineTo(tx, groundY + (m % 1 === 0 ? 6 : 3));
          ctx.stroke();

          if (m % 1 === 0) {
            ctx.fillText(m.toFixed(1) + ' m', tx, groundY + 17);
          }
        }
        ctx.restore();

        // 2. Draw 4WD Robotic Patrol UGV Silhouette
        ctx.save();
        const wheelRadius = Math.max(8, Math.min(12, 0.09 * scale));
        const wheelY = groundY - wheelRadius;

        ctx.fillStyle = isLight ? '#475569' : '#1e293b';
        ctx.strokeStyle = isLight ? '#0284c7' : '#38bdf8';
        ctx.lineWidth = 1.8;

        // Rear wheel
        ctx.beginPath();
        ctx.arc(originX - 58, wheelY, wheelRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Front wheel
        ctx.beginPath();
        ctx.arc(originX - 14, wheelY, wheelRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Chassis body box
        const chassisTopY = wheelY - 22;
        ctx.fillStyle = isLight ? '#e2e8f0' : '#1e293b';
        ctx.strokeStyle = isLight ? '#94a3b8' : '#475569';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(originX - 72, chassisTopY, 72, 20, 4);
        ctx.fill();
        ctx.stroke();

        // Mast / neck mounting post for camera at x = originX (0.0 m mark)
        const camX = originX;
        const camY = groundY - H * scale;

        ctx.strokeStyle = isLight ? '#475569' : '#94a3b8';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        if (camY < chassisTopY) {
          // Vertical mast from top of UGV chassis up to camera pivot
          ctx.moveTo(camX - 8, chassisTopY);
          ctx.lineTo(camX - 8, camY);
          ctx.lineTo(camX, camY);
        } else {
          // Low bumper bracket when h is below chassis deck
          ctx.moveTo(originX, chassisTopY + 10);
          ctx.lineTo(camX, camY);
        }
        ctx.stroke();
        ctx.lineCap = 'butt';

        // Mast base flange & pivot joint
        ctx.fillStyle = '#38bdf8';
        if (camY < chassisTopY) {
          ctx.fillRect(camX - 13, chassisTopY - 3, 10, 4);
        }
        ctx.beginPath();
        ctx.arc(camX, camY, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Vertical height dimension line (groundY to camY)
        const dimX = originX - 84;
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(dimX, groundY);
        ctx.lineTo(dimX, camY);
        ctx.moveTo(dimX - 4, camY);
        ctx.lineTo(camX - 10, camY);
        ctx.moveTo(dimX - 4, groundY);
        ctx.lineTo(dimX + 4, groundY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Mast height dimension label
        ctx.font = 'bold 10.5px -apple-system, BlinkMacSystemFont, monospace';
        ctx.fillStyle = isLight ? '#2563eb' : '#38bdf8';
        ctx.textAlign = 'left';
        ctx.fillText('h = ' + H.toFixed(2) + ' m', dimX, Math.max(14, camY - 8));

        // Horizon reference dotted guideline
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(camX, camY);
        ctx.lineTo(camX + 42, camY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Tilt angle arc
        ctx.strokeStyle = 'rgba(255, 159, 10, 0.7)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(camX, camY, 24, 0, theta);
        ctx.stroke();

        // Camera Sensor Body
        ctx.save();
        ctx.translate(camX, camY);
        ctx.rotate(theta);

        ctx.fillStyle = isLight ? '#0f172a' : '#0284c7';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.fillRect(-10, -6, 15, 12);
        ctx.strokeRect(-10, -6, 15, 12);
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(5, -4);
        ctx.lineTo(10, -6);
        ctx.lineTo(10, 6);
        ctx.lineTo(5, 4);
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
          const topAngle = theta - vfov / 2;
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
        frustumGrad.addColorStop(0, 'rgba(41, 151, 255, 0.42)');
        frustumGrad.addColorStop(0.65, 'rgba(41, 151, 255, 0.16)');
        frustumGrad.addColorStop(1, 'rgba(41, 151, 255, 0.03)');
        ctx.fillStyle = frustumGrad;
        ctx.fill();

        // Ground detection band highlight
        ctx.strokeStyle = '#30d158';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(nearCanvasX, groundY);
        ctx.lineTo(isAboveHorizon ? W : Math.min(farCanvasX, W), groundY);
        ctx.stroke();

        // Outer FOV rays
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = 'rgba(41, 151, 255, 0.75)';
        ctx.beginPath();
        ctx.moveTo(camX, camY);
        ctx.lineTo(nearCanvasX, groundY);
        ctx.moveTo(camX, camY);
        ctx.lineTo(farCanvasX, farCanvasY);
        ctx.stroke();

        // Center Optical Axis (Boresight)
        ctx.strokeStyle = '#ff9f0a';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(camX, camY);
        ctx.lineTo(centerCanvasX, groundY);
        ctx.stroke();
        ctx.setLineDash([]);

        // 1. Near cutoff point & label (placed below ground line so it never collides with Centre)
        ctx.fillStyle = '#30d158';
        ctx.beginPath();
        ctx.arc(nearCanvasX, groundY, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, monospace';
        ctx.fillStyle = isLight ? '#15803d' : '#4ade80';
        ctx.textAlign = 'center';
        ctx.fillText('Near: ' + dNear.toFixed(2) + ' m', nearCanvasX, groundY + 34);

        // 2. Boresight Center hit point & target FOD
        if (centerCanvasX <= W - 30) {
          ctx.fillStyle = '#ff9f0a';
          ctx.beginPath();
          ctx.arc(centerCanvasX, groundY, 4.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = 'bold 10.5px -apple-system, BlinkMacSystemFont, monospace';
          ctx.fillStyle = isLight ? '#b45309' : '#fbbf24';
          ctx.fillText('Centre: ' + dCenter.toFixed(2) + ' m', centerCanvasX, groundY - 22);

          // Target Debris icon at Boresight Hit
          ctx.save();
          ctx.translate(centerCanvasX, groundY);
          ctx.fillStyle = '#e2e8f0';
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1;
          ctx.fillRect(-4, -5, 8, 5);
          ctx.strokeRect(-4, -5, 8, 5);
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(-2, -10, 4, 5);
          ctx.strokeRect(-2, -10, 4, 5);
          ctx.restore();

          ctx.font = '10px -apple-system, BlinkMacSystemFont, monospace';
          ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
          ctx.fillText(debrisMm + ' mm FOD', centerCanvasX, groundY - 36);
        }

        // 3. Far edge label
        if (isAboveHorizon) {
          const topAngleDeg = Math.abs((theta - vfov / 2) * 180 / Math.PI);
          ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, monospace';
          ctx.fillStyle = isLight ? '#b45309' : '#fbbf24';
          ctx.textAlign = 'right';
          const labelText = 'Top ray: ' + topAngleDeg.toFixed(1) + '° above horizon';
          ctx.fillText(labelText, W - 12, hitsTopEdge ? 16 : Math.max(18, Math.min(groundY - 12, farCanvasY + 14)));
        } else if (farCanvasX <= W - 18) {
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(farCanvasX, groundY, 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, monospace';
          ctx.fillStyle = isLight ? '#0284c7' : '#7dd3fc';
          ctx.textAlign = 'center';
          const farLabelY = (farCanvasX - centerCanvasX < 85) ? groundY + 34 : groundY - 12;
          ctx.fillText('Far: ' + dFar.toFixed(2) + ' m', farCanvasX, farLabelY);
        }

        // Top-right compact geometry summary badge on canvas
        const slantCenter = Math.sqrt(H * H + dCenter * dCenter);
        const summaryText = !isAboveHorizon
          ? 'Slant: ' + slantCenter.toFixed(2) + ' m  |  Band Δx: ' + (dFar - dNear).toFixed(2) + ' m'
          : 'Slant: ' + slantCenter.toFixed(2) + ' m  |  Band Δx: Unbounded';
        ctx.font = '10.5px -apple-system, BlinkMacSystemFont, monospace';
        const badgeW = ctx.measureText(summaryText).width + 18;
        ctx.fillStyle = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = isLight ? 'rgba(15,23,42,0.12)' : 'rgba(56, 189, 248, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(W - badgeW - 10, 10, badgeW, 22, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = isLight ? '#0f172a' : '#e2e8f0';
        ctx.textAlign = 'right';
        ctx.fillText(summaryText, W - 19, 25);

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
