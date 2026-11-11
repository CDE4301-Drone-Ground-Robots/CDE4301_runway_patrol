<script setup lang="ts">
import { ref } from 'vue'

const activeView = ref<'sem1' | 'sem2'>('sem1')

const netSem1SVG = `
  <svg viewBox="0 0 880 260" width="100%" xmlns="http://www.w3.org/2000/svg" style="max-height: 260px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <!-- Background Grid -->
    <rect width="880" height="260" fill="#090d16" rx="8"/>
    
    <!-- Machine 1: Raspberry Pi 5 (UAV C2) -->
    <g transform="translate(40, 30)">
      <rect width="240" height="190" rx="8" fill="#131c2e" stroke="#3b82f6" stroke-width="1.5"/>
      <text x="120" y="28" fill="#60a5fa" font-size="13" font-weight="700" text-anchor="middle">🍓 Machine 1: Raspberry Pi 5</text>
      <text x="120" y="46" fill="#94a3b8" font-size="10.5" text-anchor="middle">UAV C2 Ground Terminal</text>
      
      <rect x="20" y="65" width="200" height="42" rx="5" fill="#1e293b" stroke="#334155"/>
      <text x="120" y="84" fill="#f8fafc" font-size="11" font-weight="600" text-anchor="middle">DemoComs_C2.py</text>
      <text x="120" y="98" fill="#38bdf8" font-size="9.5" text-anchor="middle">Publishes /c2/target_alert</text>

      <rect x="20" y="120" width="200" height="42" rx="5" fill="#1e293b" stroke="#334155"/>
      <text x="120" y="139" fill="#f8fafc" font-size="11" font-weight="600" text-anchor="middle">CycloneDDS Transport</text>
      <text x="120" y="153" fill="#a78bfa" font-size="9.5" text-anchor="middle">IP: 192.168.168.50 (wlan0)</text>
      
      <rect x="20" y="174" width="200" height="26" rx="4" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981"/>
      <text x="120" y="191" fill="#34d399" font-size="10" font-weight="700" text-anchor="middle">VALIDATED IN BENCHTOP SIL</text>
    </g>

    <!-- Transport: Wi-Fi Router / Hotspot -->
    <g transform="translate(340, 65)">
      <circle cx="100" cy="65" r="55" fill="#1e293b" stroke="#64748b" stroke-width="1.5" stroke-dasharray="4,3"/>
      <text x="100" y="58" fill="#38bdf8" font-size="22" text-anchor="middle">📶</text>
      <text x="100" y="80" fill="#f8fafc" font-size="11.5" font-weight="700" text-anchor="middle">Wi-Fi Subnet</text>
      <text x="100" y="95" fill="#94a3b8" font-size="9.5" text-anchor="middle">2.4 / 5.8 GHz WLAN</text>
      <text x="100" y="108" fill="#64748b" font-size="9" text-anchor="middle">Static Unicast Peering</text>
    </g>

    <!-- Connecting Arrows -->
    <path d="M 280 140 L 340 130" stroke="#38bdf8" stroke-width="2" stroke-dasharray="6,4" fill="none"/>
    <path d="M 540 130 L 600 140" stroke="#38bdf8" stroke-width="2" stroke-dasharray="6,4" fill="none"/>

    <!-- Machine 2: Engineering Workstation (Laptop) -->
    <g transform="translate(600, 30)">
      <rect width="240" height="190" rx="8" fill="#131c2e" stroke="#3b82f6" stroke-width="1.5"/>
      <text x="120" y="28" fill="#60a5fa" font-size="13" font-weight="700" text-anchor="middle">💻 Machine 2: Laptop (WSL2)</text>
      <text x="120" y="46" fill="#94a3b8" font-size="10.5" text-anchor="middle">UGV Simulation &amp; Autonomy</text>

      <rect x="20" y="65" width="200" height="42" rx="5" fill="#1e293b" stroke="#334155"/>
      <text x="120" y="84" fill="#f8fafc" font-size="11" font-weight="600" text-anchor="middle">ugv_c2_bridge_node</text>
      <text x="120" y="98" fill="#34d399" font-size="9.5" text-anchor="middle">Subscribes &amp; Dispatches to Nav2</text>

      <rect x="20" y="120" width="200" height="42" rx="5" fill="#1e293b" stroke="#334155"/>
      <text x="120" y="139" fill="#f8fafc" font-size="11" font-weight="600" text-anchor="middle">CycloneDDS Transport</text>
      <text x="120" y="153" fill="#a78bfa" font-size="9.5" text-anchor="middle">IP: 192.168.168.100 (WSL2 NAT)</text>

      <rect x="20" y="174" width="200" height="26" rx="4" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981"/>
      <text x="120" y="191" fill="#34d399" font-size="10" font-weight="700" text-anchor="middle">VALIDATED IN BENCHTOP SIL</text>
    </g>
  </svg>
`

const netSem2SVG = `
  <svg viewBox="0 0 880 260" width="100%" xmlns="http://www.w3.org/2000/svg" style="max-height: 260px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <!-- Background Grid -->
    <rect width="880" height="260" fill="#090d16" rx="8"/>
    
    <!-- UAV Drone Subsystem -->
    <g transform="translate(30, 30)">
      <rect width="250" height="190" rx="8" fill="#131c2e" stroke="#c084fc" stroke-width="1.5"/>
      <text x="125" y="28" fill="#c084fc" font-size="13" font-weight="700" text-anchor="middle">🚁 Aerial Scouting UAV</text>
      <text x="125" y="46" fill="#94a3b8" font-size="10.5" text-anchor="middle">YOLO Edge Vision + RPi 5</text>
      
      <rect x="15" y="65" width="220" height="38" rx="5" fill="#1e293b" stroke="#334155"/>
      <text x="125" y="82" fill="#f8fafc" font-size="11" font-weight="600" text-anchor="middle">C2 Mission Dispatcher</text>
      <text x="125" y="95" fill="#a78bfa" font-size="9" text-anchor="middle">JSON Target Assembly</text>

      <rect x="15" y="112" width="220" height="42" rx="5" fill="rgba(192, 132, 252, 0.1)" stroke="#a855f7"/>
      <text x="125" y="129" fill="#f8fafc" font-size="10.5" font-weight="600" text-anchor="middle">Serial Framing Gateway Node</text>
      <text x="125" y="143" fill="#c084fc" font-size="9" text-anchor="middle">COBS Encoding + CRC-32 (UART)</text>
      
      <rect x="15" y="165" width="220" height="38" rx="4" fill="#0f172a" stroke="#475569"/>
      <text x="125" y="182" fill="#38bdf8" font-size="10.5" font-weight="700" text-anchor="middle">Holybro P900 V2 (UAV OEM)</text>
      <text x="125" y="194" fill="#94a3b8" font-size="9" text-anchor="middle">UART Interface (JST-GH) @ 115.2 kbps</text>
    </g>

    <!-- Long-Range RF Link -->
    <g transform="translate(320, 65)">
      <rect x="0" y="20" width="240" height="90" rx="8" fill="#1e1b4b" stroke="#818cf8" stroke-width="1.5"/>
      <text x="120" y="42" fill="#a5b4fc" font-size="12" font-weight="700" text-anchor="middle">📡 900 MHz FHSS Physical Link</text>
      <text x="120" y="60" fill="#f8fafc" font-size="11" font-weight="600" text-anchor="middle">Microhard P900 V2 Wireless Datalink</text>
      <text x="120" y="78" fill="#34d399" font-size="10" text-anchor="middle">Conforming to Singapore 917–925 MHz</text>
      <text x="120" y="94" fill="#fbbf24" font-size="9.5" text-anchor="middle">Point-to-Point Range &gt; 3.0 km (Air-to-Ground)</text>
    </g>

    <!-- Connecting Lines -->
    <path d="M 280 184 L 320 65" stroke="#818cf8" stroke-width="1.5" stroke-dasharray="4,4" fill="none"/>
    <path d="M 560 65 L 600 184" stroke="#818cf8" stroke-width="1.5" stroke-dasharray="4,4" fill="none"/>

    <!-- UGV Chassis Subsystem -->
    <g transform="translate(600, 30)">
      <rect width="250" height="190" rx="8" fill="#131c2e" stroke="#34d399" stroke-width="1.5"/>
      <text x="125" y="28" fill="#34d399" font-size="13" font-weight="700" text-anchor="middle">🚜 Autonomous Runway UGV</text>
      <text x="125" y="46" fill="#94a3b8" font-size="10.5" text-anchor="middle">Jetson Orin + STM32 Firmware</text>

      <rect x="15" y="65" width="220" height="38" rx="5" fill="#1e293b" stroke="#334155"/>
      <text x="125" y="82" fill="#f8fafc" font-size="11" font-weight="600" text-anchor="middle">ugv_c2_bridge_node</text>
      <text x="125" y="95" fill="#34d399" font-size="9" text-anchor="middle">Nav2 Action Queue &amp; Marker Array</text>

      <rect x="15" y="112" width="220" height="42" rx="5" fill="rgba(52, 211, 153, 0.1)" stroke="#10b981"/>
      <text x="125" y="129" fill="#f8fafc" font-size="10.5" font-weight="600" text-anchor="middle">Serial Framing Gateway Node</text>
      <text x="125" y="143" fill="#34d399" font-size="9" text-anchor="middle">COBS Decoding + CRC-32 Ingestion</text>

      <rect x="15" y="165" width="220" height="38" rx="4" fill="#0f172a" stroke="#475569"/>
      <text x="125" y="182" fill="#38bdf8" font-size="10.5" font-weight="700" text-anchor="middle">Holybro P900 V2 (UGV OEM)</text>
      <text x="125" y="194" fill="#94a3b8" font-size="9" text-anchor="middle">UART Interface (USB-C / JST-GH)</text>
    </g>
  </svg>
`
</script>

<template>
  <div class="vp-raw wgt wgt-hilbert-communications">
    <div class="editorial-visual-full">
      <div class="editorial-card-container">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
          <div>
            <strong style="color: var(--apple-text-primary); font-size: 14px;">Interactive Explorer: Communications Network Architecture</strong>
            <p style="font-size: 12px; color: var(--apple-text-tertiary); margin: 2px 0 0 0;">Toggle between Semester 1 validated testbed and proposed Semester 2 long-range RF link</p>
          </div>
          <div class="interactive-controls" style="display: flex; gap: 8px;">
            <button
              type="button"
              id="net-btn-sem1"
              class="apple-btn-pill"
              :class="{ active: activeView === 'sem1' }"
              @click="activeView = 'sem1'"
            >
              Tested — Indoor Wi-Fi
            </button>
            <button
              type="button"
              id="net-btn-sem2"
              class="apple-btn-pill"
              :class="{ active: activeView === 'sem2' }"
              @click="activeView = 'sem2'"
            >
              Proposed — Long-Range RF
            </button>
          </div>
        </div>

        <!-- SVG Container for Architecture Switcher -->
        <div
          id="net-arch-svg-container"
          style="background: #090d16; border: 1px solid var(--apple-border); border-radius: 10px; padding: 20px; text-align: center;"
          v-html="activeView === 'sem1' ? netSem1SVG : netSem2SVG"
        />

        <div
          v-if="activeView === 'sem1'"
          id="net-arch-status-banner"
          style="margin-top: 14px; font-size: 12.5px; padding: 10px 14px; border-radius: 6px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25); color: #34d399;"
        >
          <strong>Validation Status:</strong> Tested — Indoor Wi-Fi. Verified in physical multi-machine hardware-in-the-loop benchtop tests with CycloneDDS static unicast peering.
        </div>
        <div
          v-else
          id="net-arch-status-banner"
          style="margin-top: 14px; font-size: 12.5px; padding: 10px 14px; border-radius: 6px; background: rgba(192, 132, 252, 0.1); border: 1px solid rgba(192, 132, 252, 0.25); color: #c084fc;"
        >
          <strong>Validation Status:</strong> Proposed — Long-Range RF. Proposed Semester 2 Architecture. Subject to Singapore IMDA 917–925 MHz regulatory verification, serial gateway software bring-up, and vendor hardware procurement.
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.wgt-hilbert-communications {
  --apple-bg: #000000;
  --apple-surface: rgba(255, 255, 255, 0.04);
  --apple-surface-card-hover: rgba(255, 255, 255, 0.07);
  --apple-border: rgba(255, 255, 255, 0.12);
  --apple-text-primary: #f5f5f7;
  --apple-text-secondary: #a1a1a6;
  --apple-text-tertiary: #6e6e73;
  --apple-blue: #3b82f6;
  --apple-blue-hover: #60a5fa;
  --apple-blue-bg: rgba(59, 130, 246, 0.12);
  --apple-green: #34d399;
  --apple-green-bg: rgba(16, 185, 129, 0.12);
  --apple-purple: #c084fc;
  --apple-purple-bg: rgba(168, 85, 247, 0.12);
  --apple-amber: #fbbf24;
  --apple-amber-bg: rgba(245, 158, 11, 0.12);
  --apple-red: #f87171;
}

.wgt-hilbert-communications .editorial-card-container {
  background: var(--apple-surface);
  border: 1px solid var(--apple-border);
  border-radius: 12px;
  padding: 20px;
  margin: 16px 0;
}

.wgt-hilbert-communications .apple-btn-pill {
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 20px;
  border: 1px solid var(--apple-border);
  background: rgba(255, 255, 255, 0.05);
  color: var(--apple-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.wgt-hilbert-communications .apple-btn-pill:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--apple-text-primary);
}

.wgt-hilbert-communications .apple-btn-pill.active {
  background: var(--apple-blue);
  border-color: var(--apple-blue);
  color: #ffffff;
  font-weight: 600;
}
</style>
