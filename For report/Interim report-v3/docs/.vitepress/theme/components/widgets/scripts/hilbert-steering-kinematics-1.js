// Widget script (runs once per page via useWidgetScript); edit here.
/* eslint-disable */

export default function init() {

    // Theme toggle initialization
    (function() {
      var btn = document.getElementById('theme-toggle');
      if (btn) {
        btn.addEventListener('click', function() {
          var current = document.documentElement.getAttribute('data-theme') || 'dark';
          var next = current === 'dark' ? 'light' : 'dark';
          document.documentElement.setAttribute('data-theme', next);
          try { localStorage.setItem('theme', next); } catch(e) {}
        });
      }
    })();

    // Modal Control Functions
    function openSteeringModal(key) {
      document.querySelectorAll('.steering-modal-panel').forEach(function(panel) {
        panel.style.display = 'none';
      });
      var targetPanel = document.getElementById('modal-panel-' + key);
      if (targetPanel) {
        targetPanel.style.display = 'block';
      }
      var backdrop = document.getElementById('steering-modal-backdrop');
      if (backdrop) {
        backdrop.style.display = 'flex';
      }
      document.body.style.overflow = 'hidden';
    }

    function closeSteeringModal() {
      var backdrop = document.getElementById('steering-modal-backdrop');
      if (backdrop) {
        backdrop.style.display = 'none';
      }
      document.body.style.overflow = '';
    }

    function closeSteeringModalOnBackdrop(e) {
      if (e.target && e.target.id === 'steering-modal-backdrop') {
        closeSteeringModal();
      }
    }

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeSteeringModal();
      }
    });

    // Preset Buttons
    function setPresetLB(L, B) {
      var inputL = document.getElementById('input-wheelbase');
      var inputB = document.getElementById('input-trackwidth');
      if (inputL) inputL.value = L;
      if (inputB) inputB.value = B;
      updateLBSimulation();
    }

    // Wheelbase-to-Trackwidth Ratio (L/B) Dynamic Simulation
    function updateLBSimulation() {
      var inputL = document.getElementById('input-wheelbase');
      var inputB = document.getElementById('input-trackwidth');
      var selectMu = document.getElementById('select-friction');
      if (!inputL || !inputB || !selectMu) return;

      var L_mm = parseFloat(inputL.value);
      var B_mm = parseFloat(inputB.value);
      var mu = parseFloat(selectMu.value);

      var L_m = L_mm / 1000.0;
      var B_m = B_mm / 1000.0;
      var ratio = L_mm / B_mm;

      // Confirmed Platform Physical Parameters:
      var m = 65.0; // Gross laden vehicle mass (kg)
      var g = 9.80665; // m/s^2
      var r = 0.1315; // Wheel radius (m) [D = 263 mm]
      var eta = 0.85; // Inverter & electromagnetic electrical efficiency
      var hcg = 0.200; // Center of gravity height (m)

      // Mathematical Formulations:
      // 1. Resisting Scrub Torque: M_scrub = 0.5 * mu * m * g * L
      var m_scrub = 0.5 * mu * m * g * L_m;

      // 2. Required Drive Force per Wheel (4 wheels): Fw = M_scrub / (2 * B) = (mu * m * g * L) / (4 * B)
      var fx_wheel_req = m_scrub / (2.0 * B_m);
      var fx_wheel_max = mu * (m * g / 4.0);

      // 3. Direct-Drive Hub Motor Torque Distinction:
      // Mechanical shaft torque: tau_shaft = Fw * r (direct drive, no gearbox reduction)
      // Electrical equivalent torque demand: tau_elec = tau_shaft / eta
      var tau_shaft = fx_wheel_req * r;
      var tau_elec = tau_shaft / eta;
      var tau_cont_rated = 15.00; // Nm continuous rating per hub motor
      var tau_peak_rated = 28.50; // Nm peak rating per hub motor

      // 4. Longitudinal Load Transfer (Friction-Limited vs 1.0 g Structural):
      // Achievable friction-limited deceleration: a_frict = mu * g
      var a_frict = mu * g;
      var delta_n_frict = (m * a_frict * hcg) / L_m;
      var n_rear_frict = (m * g / 2.0) - delta_n_frict;

      // Hypothetical 1.0 g structural deceleration case:
      var a_struct = 1.0 * g;
      var delta_n_struct = (m * a_struct * hcg) / L_m;
      var n_rear_struct = (m * g / 2.0) - delta_n_struct;

      // Pitch Stability Floor: L/B >= 2 * (hcg / B) * (a / g)
      var min_stable_ratio_frict = 2.0 * (hcg / B_m) * mu;
      var min_stable_ratio_struct = 2.0 * (hcg / B_m) * 1.0;

      // Update Numerical Labels:
      var valL = document.getElementById('val-wheelbase');
      var valB = document.getElementById('val-trackwidth');
      var badge = document.getElementById('sim-ratio-badge');
      var aspectLabel = document.getElementById('sim-aspect-ratio-label');
      var elMScrub = document.getElementById('metric-m-scrub');
      var elTauWheel = document.getElementById('metric-tau-wheel');
      var elTauSub = document.getElementById('metric-tau-sub');
      var elDeltaN = document.getElementById('metric-delta-n');
      var elDeltaNSub = document.getElementById('metric-deltan-sub');
      var elNFront = document.getElementById('metric-n-front');
      var elNFrontSub = document.getElementById('metric-nfront-sub');
      var nFrontCard = document.getElementById('metric-nfront-card');

      if (valL) valL.textContent = L_mm.toFixed(1) + " mm (" + L_m.toFixed(3) + " m)";
      if (valB) valB.textContent = B_mm.toFixed(1) + " mm (" + B_m.toFixed(3) + " m)";
      if (badge) badge.textContent = ratio.toFixed(3);
      if (aspectLabel) aspectLabel.textContent = "Chassis Footprint: Wheelbase L = " + L_mm.toFixed(1) + " mm, Track Width B = " + B_mm.toFixed(1) + " mm (L/B = " + ratio.toFixed(3) + ")";
      if (elMScrub) elMScrub.textContent = m_scrub.toFixed(2) + " Nm";
      if (elTauWheel) elTauWheel.textContent = tau_shaft.toFixed(2) + " Nm";
      if (elDeltaN) elDeltaN.textContent = delta_n_frict.toFixed(1) + " N";
      if (elDeltaNSub) elDeltaNSub.textContent = "Friction " + mu.toFixed(1) + "g (" + delta_n_frict.toFixed(1) + " N) / Struct 1.0g (" + delta_n_struct.toFixed(1) + " N)";
      if (elNFront) elNFront.textContent = (n_rear_frict > 0 ? "+" : "") + n_rear_frict.toFixed(1) + " N";

      // Motor Torque Status Subtext
      if (elTauSub) {
        if (tau_shaft <= tau_cont_rated) {
          elTauSub.textContent = "Shaft: " + tau_shaft.toFixed(2) + " Nm (Cont) | Elec: " + tau_elec.toFixed(2) + " Nm";
          elTauSub.style.color = "#10b981";
        } else if (tau_shaft <= tau_peak_rated) {
          elTauSub.textContent = "Shaft: " + tau_shaft.toFixed(2) + " Nm (Peak " + ((tau_shaft / tau_peak_rated) * 100).toFixed(0) + "%) | Elec: " + tau_elec.toFixed(2) + " Nm";
          elTauSub.style.color = "#38bdf8";
        } else {
          elTauSub.textContent = "EXCEEDS PEAK (" + tau_shaft.toFixed(1) + " > 28.5 Nm)";
          elTauSub.style.color = "#f43f5e";
        }
      }

      // Evaluate Stability Status:
      var banner = document.getElementById('sim-status-banner');
      var icon = document.getElementById('sim-status-icon');
      var title = document.getElementById('sim-status-title');
      var desc = document.getElementById('sim-status-desc');

      var statusMode = "optimal"; // "optimal", "pitch", "scrub"
      if (ratio < min_stable_ratio_struct) {
        statusMode = "pitch";
        if (banner) {
          banner.style.background = 'rgba(245, 158, 11, 0.12)';
          banner.style.borderColor = 'rgba(245, 158, 11, 0.4)';
        }
        if (icon) { icon.innerHTML = "&#9888;"; icon.style.color = "#fbbf24"; }
        if (title) { title.textContent = "Longitudinal Pitch Risk: Narrow Wheelbase (L/B = " + ratio.toFixed(3) + " < " + min_stable_ratio_struct.toFixed(2) + ")"; title.style.color = "#fbbf24"; }
        if (desc) { desc.textContent = "Short wheelbase reduces dynamic braking stability. Decelerating at friction limit (" + mu.toFixed(2) + " g) transfers " + delta_n_frict.toFixed(1) + " N forward, reducing rear-axle normal force to " + n_rear_frict.toFixed(1) + " N (rear wheels risk dynamic lift-off or brake hop under hard stops)."; }
        if (badge) { badge.className = "badge badge-amber"; }
        if (nFrontCard) { nFrontCard.style.borderColor = "#f59e0b"; }
        if (elNFrontSub) { elNFrontSub.textContent = "Reduced Rear-Axle Load (" + (n_rear_frict / (m * g / 2.0) * 100).toFixed(0) + "% Retained)"; elNFrontSub.style.color = "#fbbf24"; }
      } else if (ratio > 1.00) {
        statusMode = "scrub";
        if (banner) {
          banner.style.background = 'rgba(239, 68, 68, 0.12)';
          banner.style.borderColor = 'rgba(239, 68, 68, 0.4)';
        }
        if (icon) { icon.innerHTML = "&#10060;"; icon.style.color = "#f87171"; }
        if (title) { title.textContent = "Pivot Traction Limit Exceeded (L/B = " + ratio.toFixed(3) + " > 1.00)"; title.style.color = "#f87171"; }
        if (desc) { desc.textContent = "Under isotropic Coulomb friction, required tractive force per wheel (" + fx_wheel_req.toFixed(1) + " N) exceeds available ground grip (" + fx_wheel_max.toFixed(1) + " N). The simplified analytical model predicts longitudinal wheel slip before initiating pivot."; }
        if (badge) { badge.className = "badge badge-red"; }
        if (nFrontCard) { nFrontCard.style.borderColor = "var(--apple-border)"; }
        if (elNFrontSub) { elNFrontSub.textContent = "Positive Calculated Rear-Axle Load"; elNFrontSub.style.color = "#34d399"; }
      } else {
        statusMode = "optimal";
        if (banner) {
          banner.style.background = 'rgba(16, 185, 129, 0.12)';
          banner.style.borderColor = 'rgba(16, 185, 129, 0.35)';
        }
        if (icon) { icon.innerHTML = "&#10003;"; icon.style.color = "#34d399"; }
        if (title) { title.textContent = "Within Assumed Design Range (L/B = " + ratio.toFixed(3) + ") • Predicted Stability Margin"; title.style.color = "#34d399"; }
        if (desc) { desc.textContent = "The chassis stance resides within the assumed analytical design envelope (L/B >= " + min_stable_ratio_struct.toFixed(2) + " and L/B <= 1.00). Direct-drive hub motors produce sufficient shaft torque (" + tau_shaft.toFixed(2) + " Nm) to overcome lateral tire scrub within simplified traction estimates."; }
        if (badge) { badge.className = "badge badge-purple"; }
        if (nFrontCard) { nFrontCard.style.borderColor = "var(--apple-border)"; }
        if (elNFrontSub) { elNFrontSub.textContent = "Positive Calculated Rear-Axle Load"; elNFrontSub.style.color = "#34d399"; }
      }

      // Re-render Dynamic Chassis SVG:
      renderInteractiveChassisSvg(L_mm, B_mm, statusMode);
    }

    function renderInteractiveChassisSvg(L_mm, B_mm, statusMode) {
      var svg = document.getElementById('interactive-chassis-svg');
      if (!svg) return;

      var scale = 200.0 / 600.0;
      var scaledL = (L_mm * scale) * 0.8;
      var scaledB = (B_mm * scale) * 0.8;

      var halfL = scaledL / 2.0;
      var halfB = scaledB / 2.0;

      var tireWidth = 14;
      var tireLength = 40;

      var strokeColor = statusMode === "optimal" ? "#a855f7" : (statusMode === "pitch" ? "#f59e0b" : "#ef4444");
      var fillColor = statusMode === "optimal" ? "rgba(168, 85, 247, 0.12)" : (statusMode === "pitch" ? "rgba(245, 158, 11, 0.12)" : "rgba(239, 68, 68, 0.12)");

      var html = '';
      html += '<defs>';
      html += '<marker id="sim-arrow-purple" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 1 L10 5 L0 9 z" fill="#c084fc"/></marker>';
      html += '<marker id="sim-arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 1 L10 5 L0 9 z" fill="#38bdf8"/></marker>';
      html += '</defs>';

      // Grid crosshairs
      html += '<line x1="-220" y1="0" x2="220" y2="0" stroke="rgba(255,255,255,0.06)" stroke-dasharray="4,4"/>';
      html += '<line x1="0" y1="-140" x2="0" y2="140" stroke="rgba(255,255,255,0.06)" stroke-dasharray="4,4"/>';

      // Chassis Body Rectangle
      html += '<rect x="' + (-halfB) + '" y="' + (-halfL) + '" width="' + scaledB + '" height="' + scaledL + '" rx="8" fill="' + fillColor + '" stroke="' + strokeColor + '" stroke-width="2"/>';

      // Heading arrow forward
      html += '<line x1="0" y1="0" x2="0" y2="' + (-halfL - 25) + '" stroke="#60a5fa" stroke-width="2.5" marker-end="url(#sim-arrow-blue)"/>';
      html += '<text x="0" y="' + (-halfL - 32) + '" fill="#60a5fa" font-size="11" font-weight="700" text-anchor="middle">Forward (vx)</text>';

      // 4 Wheels
      var wheels = [
        { x: -halfB, y: -halfL, id: "FL", label: "FL" },
        { x: halfB, y: -halfL, id: "FR", label: "FR" },
        { x: -halfB, y: halfL, id: "RL", label: "RL" },
        { x: halfB, y: halfL, id: "RR", label: "RR" }
      ];

      for (var i = 0; i < wheels.length; i++) {
        var w = wheels[i];
        html += '<rect x="' + (w.x - tireWidth/2) + '" y="' + (w.y - tireLength/2) + '" width="' + tireWidth + '" height="' + tireLength + '" rx="4" fill="#0f172a" stroke="#94a3b8" stroke-width="1.8"/>';
        html += '<text x="' + (w.x > 0 ? w.x + 16 : w.x - 16) + '" y="' + (w.y + 4) + '" fill="#cbd5e1" font-size="10" font-weight="600" text-anchor="' + (w.x > 0 ? "start" : "end") + '">' + w.label + '</text>';
      }

      // Wheelbase dimension line (vertical)
      var dimX = halfB + 45;
      html += '<line x1="' + dimX + '" y1="' + (-halfL) + '" x2="' + dimX + '" y2="' + (halfL) + '" stroke="#64748b" stroke-width="1.5"/>';
      html += '<line x1="' + (dimX - 5) + '" y1="' + (-halfL) + '" x2="' + (dimX + 5) + '" y2="' + (-halfL) + '" stroke="#64748b" stroke-width="1.5"/>';
      html += '<line x1="' + (dimX - 5) + '" y1="' + (halfL) + '" x2="' + (dimX + 5) + '" y2="' + (halfL) + '" stroke="#64748b" stroke-width="1.5"/>';
      html += '<text x="' + (dimX + 8) + '" y="4" fill="#94a3b8" font-size="11" font-family="monospace">L = ' + L_mm.toFixed(0) + ' mm</text>';

      // Track width dimension line (horizontal)
      var dimY = halfL + 35;
      html += '<line x1="' + (-halfB) + '" y1="' + dimY + '" x2="' + halfB + '" y2="' + dimY + '" stroke="#64748b" stroke-width="1.5"/>';
      html += '<line x1="' + (-halfB) + '" y1="' + (dimY - 5) + '" x2="' + (-halfB) + '" y2="' + (dimY + 5) + '" stroke="#64748b" stroke-width="1.5"/>';
      html += '<line x1="' + halfB + '" y1="' + (dimY - 5) + '" x2="' + halfB + '" y2="' + (dimY + 5) + '" stroke="#64748b" stroke-width="1.5"/>';
      html += '<text x="0" y="' + (dimY + 16) + '" fill="#94a3b8" font-size="11" font-family="monospace" text-anchor="middle">B = ' + B_mm.toFixed(0) + ' mm</text>';

      // CG Center Marker
      html += '<circle cx="0" cy="0" r="5" fill="#f59e0b"/>';
      html += '<circle cx="0" cy="0" r="8" fill="none" stroke="#f59e0b" stroke-width="1.5"/>';
      html += '<text x="12" y="4" fill="#f59e0b" font-size="10" font-weight="700">CG</text>';

      svg.innerHTML = html;
    }

    // Expose handlers globally so inline oninput/onclick attributes work in browser
    if (typeof window !== 'undefined') {
      window.updateLBSimulation = updateLBSimulation;
      window.setPresetLB = setPresetLB;
      window.openSteeringModal = openSteeringModal;
      window.closeSteeringModal = closeSteeringModal;
    }

    // Attach event listeners directly to DOM elements
    function bindSteeringWidgetEvents() {
      var inputL = document.getElementById('input-wheelbase');
      var inputB = document.getElementById('input-trackwidth');
      var selectMu = document.getElementById('select-friction');
      if (inputL) {
        inputL.removeEventListener('input', updateLBSimulation);
        inputL.addEventListener('input', updateLBSimulation);
      }
      if (inputB) {
        inputB.removeEventListener('input', updateLBSimulation);
        inputB.addEventListener('input', updateLBSimulation);
      }
      if (selectMu) {
        selectMu.removeEventListener('change', updateLBSimulation);
        selectMu.addEventListener('change', updateLBSimulation);
      }
      updateLBSimulation();
    }

    // Initialize on page load
    document.addEventListener('DOMContentLoaded', bindSteeringWidgetEvents);
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      bindSteeringWidgetEvents();
    }
  
}
