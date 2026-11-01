<!-- Interactive widget: the markup below, its behaviour in scripts/ (run once per page by useWidgetScript), styles scoped by its .wgt-* class. -->
<script setup lang="ts">
import { useWidgetScript } from './useWidgetScript'

import s0 from './scripts/asuka-fod-sweep-box-v2-1.js'

useWidgetScript([['asuka-fod-sweep-box-v2-1', s0]])
</script>

<template>
  <div class="vp-raw wgt wgt-asuka-fod-sweep-box-v2 wgt-app">










<div class="wrap">
  <header class="top">
    <div class="title">
      <div class="eyebrow">Runway FOD rover · sweep box v2 · hose to bin · 23 Oct 2026</div>
      <span class="mark" aria-hidden="true"></span>
      <h1>FOD Sweep Box v2</h1>
      <p class="lede">The box drops to the asphalt, the scraper lifts, the blade reaches past the FOD, the scraper drops and drags everything up the ramp. The box lifts above the bin inlet, and with the vacuum on, the FOD slides down the sloped floor, out the 5" port and down the corrugated hose into the bin.</p>
    </div>
    <div class="specs" aria-label="Key figures">
      <div class="spec"><b>0–507 mm</b><span>Lift, asphalt to docked</span></div>
      <div class="spec"><b>389 mm</b><span>Blade reach from the back stop</span></div>
      <div class="spec"><b>5" hose</b><span>127 mm corrugated, clamped both ends</span></div>
      <div class="spec"><b>35° down</b><span>Hose fall from box to bin when docked</span></div>
    </div>
  </header>

  <section class="rig" aria-label="Animated 3D model of the sweep cycle">
    <div class="stage" id="stage">
      <div class="loading" id="loading">Loading the 3D model…</div>
      <div class="hud" id="hud" hidden="">
        <div class="phase"><span class="n" id="phN">01 / 8</span><span class="t" id="phT">Docked</span></div>
        <div class="readouts">
          <span class="chip" id="vacChip">VAC OFF</span>
          <span class="chip" id="liftChip">Lift 507 mm</span>
          <span class="chip" id="bladeChip">Blade 34 mm</span>
          <span class="chip" id="scrChip">Scraper closed</span>
          <span class="chip" id="hoseChip">Hose 121 mm</span>
        </div>
      </div>
      <div class="hint" id="hint" hidden="">Drag to orbit · scroll to zoom · tap a part</div>
      <div class="pick" id="pick" hidden="">
        <h3 id="pickT">Part</h3>
        <div class="meta" id="pickM"></div>
        <p id="pickN"></p>
        <button class="btn" id="pickX" type="button">Close</button>
      </div>
    </div>
    <div class="controls">
      <div class="row">
        <button class="btn primary" id="play" type="button">Pause</button>
        <div class="scrub"><input type="range" id="scrub" min="0" max="20.5" step="0.01" value="0" aria-label="Cycle time"><span class="time" id="time">0.0 s</span></div>
      </div>
      <div class="phases" id="phases" aria-label="Cycle phases"></div>
      <div class="row">
        <label class="tog"><input type="checkbox" id="tFlow" checked=""> Airflow</label>
        <label class="tog"><input type="checkbox" id="tSec"> Cut through the centre</label>
        <label class="tog"><input type="checkbox" id="tGhost" checked=""> See-through bin</label>
        <span class="sep" aria-hidden="true"></span>
        <button class="btn" type="button" data-cam="overview">Whole rover</button>
        <button class="btn" type="button" data-cam="box">Follow box</button>
        <button class="btn" type="button" data-cam="hose">Hose side</button>
      </div>
    </div>
  </section>

  <main>
    <section class="sec">
      <header><div class="eyebrow">Sequence</div><h2>One cycle</h2><p>Two Z steppers lift, one stepper drives the blade. The scraper floats in the blade's slots; the cycle lifts it clear on the way out and lets it drop to sweep. Tap a step to jump there.</p></header>
      <div class="body"><ol class="steps" id="stepList"></ol></div>
    </section>

    <section class="sec">
      <header><div class="eyebrow">The new part</div><h2>Box to bin hose</h2><p>The hose replaces v1's drop door and chute. Gravity still does the moving; the hose just keeps it enclosed.</p></header>
      <div class="body">
        <div class="tbl"><table>
          <thead><tr><th>What</th><th>Value</th><th>Why it matters</th></tr></thead>
          <tbody>
            <tr><td>Hose run, docked</td><td class="num" id="lenDock">–</td><td>Clamp land to clamp land, straight at 35° downhill. FOD slides on the hose floor into the bin.</td></tr>
            <tr><td>Hose run, box on the asphalt</td><td class="num" id="lenLow">–</td><td>The hose has to stretch this far when the box is fully down. Buy a stretch hose rated for it, or stop the lift higher.</td></tr>
            <tr><td>Air speed in the hose</td><td class="num">~3.5 m/s</td><td>Your vacuum's ~45 L/s through a 127 mm bore. Enough to carry dust and feathers. A washer needs ~15 m/s to lift, so it relies on the 35° fall.</td></tr>
            <tr><td>Clamps</td><td class="num">2 × 130–150 mm</td><td>Worm-drive band clamps, 12.5 mm band. Each end has a raised bead the hose stretches over and a flat land for the band.</td></tr>
            <tr><td>Hose grip on the spigots</td><td class="num">22 mm / 40 mm</td><td>Box end / bin end. The bin elbow has a stop shoulder the hose butts against.</td></tr>
          </tbody>
        </table></div>
        <p class="note">The animation bends the hose as a smooth curve and lets it stretch. A real corrugated hose sags and twists a little more than this.</p>
      </div>
    </section>

    <section class="sec">
      <header><div class="eyebrow">Open issues</div><h2>What to watch</h2></header>
      <div class="body">
        <div class="tbl"><table>
          <thead><tr><th>Issue</th><th>Status</th><th>Detail</th></tr></thead>
          <tbody>
            <tr><td><b>Hose cuff at full-down</b></td><td><span class="pill no">Rubs</span></td><td>With the box on the asphalt the 35° outlet points the hose cuff about 1 mm into the ground. Stop the lift ~5 mm higher, or turn the outlet bend down to ~20°.</td></tr>
            <tr><td><b>Hose stretch</b></td><td><span class="pill mg">Check</span></td><td>See the two hose lengths above. A plain corrugated hose won't double its length.</td></tr>
            <tr><td><b>Washers under the scraper</b></td><td><span class="pill mg">Test</span></td><td>The scraper floats on its own weight with a TPU edge. A thin washer can slip under on rough asphalt. Test before printing the rest.</td></tr>
            <tr><td><b>Overhang on the ball nuts</b></td><td><span class="pill mg">Check</span></td><td>The box hangs forward of the lead screws, so the nuts carry a bending moment. Linear guides on the columns would take it off the screws.</td></tr>
            <tr><td><b>Fall into the bin</b></td><td><span class="pill ok">Fine</span></td><td>35° is above the ~27° slide angle for PETG and dry feathers. A damp bird is slower but still slides.</td></tr>
          </tbody>
        </table></div>
      </div>
    </section>
  </main>
  <footer>Sweep box, top bridge and bin elbow are from the SolidWorks model (FSB2 parts). The chassis, wheels and bin are simplified stand-ins sized from your assembly. Units mm.</footer>
</div>









  </div>
</template>

<style>
.wgt-asuka-fod-sweep-box-v2{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}.wgt-asuka-fod-sweep-box-v2{scroll-padding-top:env(safe-area-inset-top,0px)}.wgt-asuka-fod-sweep-box-v2{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#000}.wgt-asuka-fod-sweep-box-v2 img{max-width:100%}.wgt-asuka-fod-sweep-box-v2 [hidden]:not([hidden=until-found i]){display:none!important}

.wgt-asuka-fod-sweep-box-v2 .embed body{padding:0;background:transparent}
.wgt-asuka-fod-sweep-box-v2 .embed .top,.wgt-asuka-fod-sweep-box-v2 .embed main,.wgt-asuka-fod-sweep-box-v2 .embed footer{display:none}
.wgt-asuka-fod-sweep-box-v2 .embed .wrap{max-width:none}
.wgt-asuka-fod-sweep-box-v2 .embed .stage{max-height:none}


/* Layout: one engineering sheet. Live rig on top, then the cycle and the hose notes on a 12-col grid.
   Palette from the airfield: asphalt neutrals, taxiway-marking yellow as the single accent (same family as the v1 sheet). */
.wgt-asuka-fod-sweep-box-v2{
  --bg:#eceeec; --surface:#f7f8f6; --raise:#ffffff; --ink:#1b1f22; --muted:#596267; --line:#cbd1cf;
  --accent:#e2a600; --accent-ink:#7a5900; --accent-soft:#f6e7b4;
  --scene:#d6dad8; --good:#2c7a4b; --warn:#9a5c00; --bad:#ad3529;
  --good-soft:#dcefe3; --warn-soft:#f6e6cc; --bad-soft:#f6dcd8;
  --f-display:"Barlow Condensed","Arial Narrow",Arial,sans-serif;
  --f-body:"Source Sans 3","Segoe UI",system-ui,sans-serif;
  --f-mono:"IBM Plex Mono",ui-monospace,Menlo,Consolas,monospace;
  --r:6px;
}
.wgt-asuka-fod-sweep-box-v2{
  --bg:#141719; --surface:#1b1f22; --raise:#22272a; --ink:#e6e9e7; --muted:#97a1a5; --line:#2f363a;
  --accent:#f0bb1c; --accent-ink:#f0bb1c; --accent-soft:#3a3115;
  --scene:#1e2326; --good:#62c38d; --warn:#e9a63d; --bad:#f07468;
  --good-soft:#18301f; --warn-soft:#352813; --bad-soft:#3a1c19; color-scheme:dark}
.wgt-asuka-fod-sweep-box-v2 *{box-sizing:border-box}
.wgt-asuka-fod-sweep-box-v2{background:var(--bg);color:var(--ink);font-family:var(--f-body);font-size:16px;line-height:1.55;
  padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));padding-block:0 64px}
.wgt-asuka-fod-sweep-box-v2 .wrap{max-width:1180px;margin:0 auto}
.wgt-asuka-fod-sweep-box-v2 h1,.wgt-asuka-fod-sweep-box-v2 h2,.wgt-asuka-fod-sweep-box-v2 h3{font-family:var(--f-display);font-weight:600;letter-spacing:.01em;text-wrap:balance;margin:0}
.wgt-asuka-fod-sweep-box-v2 h1{font-size:clamp(2.6rem,6vw,4.2rem);line-height:.95;font-weight:700;text-transform:uppercase}
.wgt-asuka-fod-sweep-box-v2 h2{font-size:1.75rem;line-height:1.1;text-transform:uppercase}
.wgt-asuka-fod-sweep-box-v2 h3{font-size:1.15rem;text-transform:uppercase}
.wgt-asuka-fod-sweep-box-v2 p{margin:0}
.wgt-asuka-fod-sweep-box-v2 code{font-family:var(--f-mono);font-size:.86em}
.wgt-asuka-fod-sweep-box-v2 .eyebrow{font-family:var(--f-mono);font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}

.wgt-asuka-fod-sweep-box-v2 .top{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:28px 40px;padding-block:36px 24px;align-items:end}
.wgt-asuka-fod-sweep-box-v2 .top .title{display:grid;gap:12px}
.wgt-asuka-fod-sweep-box-v2 .lede{max-width:62ch}
.wgt-asuka-fod-sweep-box-v2 .mark{display:inline-block;height:10px;width:56px;background:var(--accent);border-radius:1px;margin-bottom:6px}
.wgt-asuka-fod-sweep-box-v2 .specs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));border-top:2px solid var(--ink)}
.wgt-asuka-fod-sweep-box-v2 .spec{padding:10px 12px 10px 0;border-bottom:1px solid var(--line);display:grid;gap:2px}
.wgt-asuka-fod-sweep-box-v2 .spec:nth-child(odd){border-right:1px solid var(--line)}
.wgt-asuka-fod-sweep-box-v2 .spec:nth-child(even){padding-left:12px}
.wgt-asuka-fod-sweep-box-v2 .spec b{font-family:var(--f-display);font-size:1.6rem;font-weight:600;line-height:1.05;font-variant-numeric:tabular-nums}
.wgt-asuka-fod-sweep-box-v2 .spec span{font-size:.82rem;color:var(--muted)}

.wgt-asuka-fod-sweep-box-v2 .rig{border:1px solid var(--line);border-radius:var(--r);background:var(--surface);overflow:hidden}
.wgt-asuka-fod-sweep-box-v2 .stage{position:relative;aspect-ratio:16/9;max-height:74vh;width:100%;max-width:100%;background:var(--scene)}
.wgt-asuka-fod-sweep-box-v2 .stage canvas{display:block;width:100%;height:100%;touch-action:none;outline:none}
.wgt-asuka-fod-sweep-box-v2 .hud{position:absolute;left:12px;top:12px;display:grid;gap:6px;pointer-events:none;max-width:calc(100% - 24px)}
.wgt-asuka-fod-sweep-box-v2 .hud .phase{background:var(--raise);border:1px solid var(--line);border-radius:var(--r);padding:7px 10px;display:flex;gap:10px;align-items:baseline;box-shadow:0 1px 2px rgb(0 0 0 / .08);justify-self:start}
.wgt-asuka-fod-sweep-box-v2 .hud .phase .n{font-family:var(--f-mono);font-size:.78rem;color:var(--muted)}
.wgt-asuka-fod-sweep-box-v2 .hud .phase .t{font-family:var(--f-display);font-size:1.25rem;font-weight:600;text-transform:uppercase;line-height:1.1}
.wgt-asuka-fod-sweep-box-v2 .readouts{display:flex;flex-wrap:wrap;gap:6px}
.wgt-asuka-fod-sweep-box-v2 .chip{font-family:var(--f-mono);font-size:.74rem;background:var(--raise);border:1px solid var(--line);border-radius:999px;padding:3px 9px;font-variant-numeric:tabular-nums;white-space:nowrap}
.wgt-asuka-fod-sweep-box-v2 .chip.on{background:var(--accent);color:#1b1f22;border-color:var(--accent)}
.wgt-asuka-fod-sweep-box-v2 .loading{position:absolute;inset:0;display:grid;place-items:center;color:var(--muted);font-family:var(--f-mono);font-size:.85rem;text-align:center;padding:16px}
.wgt-asuka-fod-sweep-box-v2 .pick{position:absolute;right:12px;bottom:12px;max-width:min(320px,calc(100% - 24px));background:var(--raise);border:1px solid var(--line);border-radius:var(--r);padding:10px 12px;font-size:.88rem;display:grid;gap:4px;box-shadow:0 2px 8px rgb(0 0 0 / .12)}
.wgt-asuka-fod-sweep-box-v2 .pick .meta{font-family:var(--f-mono);font-size:.74rem;color:var(--muted)}
.wgt-asuka-fod-sweep-box-v2 .pick button{justify-self:start}
.wgt-asuka-fod-sweep-box-v2 .hint{position:absolute;right:12px;top:12px;font-family:var(--f-mono);font-size:.72rem;color:var(--muted);background:color-mix(in srgb,var(--raise) 80%,transparent);padding:3px 8px;border-radius:4px;pointer-events:none}

.wgt-asuka-fod-sweep-box-v2 .controls{display:grid;gap:12px;padding:12px 14px;border-top:1px solid var(--line)}
.wgt-asuka-fod-sweep-box-v2 .row{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center}
.wgt-asuka-fod-sweep-box-v2 .btn{font:600 .9rem var(--f-body);color:var(--ink);background:var(--raise);border:1px solid var(--line);border-radius:var(--r);padding:6px 12px;cursor:pointer;display:inline-flex;gap:6px;align-items:center;min-height:34px}
.wgt-asuka-fod-sweep-box-v2 .btn:hover{border-color:var(--muted)}
.wgt-asuka-fod-sweep-box-v2 .btn[aria-pressed="true"]{border-color:var(--ink)}
.wgt-asuka-fod-sweep-box-v2 .btn:focus-visible,.wgt-asuka-fod-sweep-box-v2 .tog input:focus-visible,.wgt-asuka-fod-sweep-box-v2 input[type=range]:focus-visible,.wgt-asuka-fod-sweep-box-v2 .ph:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.wgt-asuka-fod-sweep-box-v2 .btn.primary{background:var(--ink);color:var(--bg);border-color:var(--ink);min-width:86px;justify-content:center}
.wgt-asuka-fod-sweep-box-v2 .scrub{flex:1 1 260px;display:flex;gap:10px;align-items:center;min-width:0}
.wgt-asuka-fod-sweep-box-v2 .scrub input{flex:1;min-width:0;accent-color:var(--accent)}
.wgt-asuka-fod-sweep-box-v2 .time{font-family:var(--f-mono);font-size:.8rem;color:var(--muted);font-variant-numeric:tabular-nums;white-space:nowrap}
.wgt-asuka-fod-sweep-box-v2 .tog{display:inline-flex;gap:6px;align-items:center;font-size:.9rem;cursor:pointer;user-select:none}
.wgt-asuka-fod-sweep-box-v2 .tog input{accent-color:var(--accent);width:16px;height:16px}
.wgt-asuka-fod-sweep-box-v2 .sep{width:1px;height:22px;background:var(--line)}
.wgt-asuka-fod-sweep-box-v2 .phases{display:flex;gap:4px;overflow-x:auto;padding-bottom:2px}
.wgt-asuka-fod-sweep-box-v2 .ph{flex:1 0 auto;min-width:52px;border:0;background:transparent;padding:0;cursor:pointer;display:grid;gap:4px;text-align:left;color:var(--muted)}
.wgt-asuka-fod-sweep-box-v2 .ph i{display:block;height:5px;border-radius:2px;background:var(--line);position:relative;overflow:hidden}
.wgt-asuka-fod-sweep-box-v2 .ph i b{position:absolute;inset:0;width:0;background:var(--accent)}
.wgt-asuka-fod-sweep-box-v2 .ph span{font-family:var(--f-mono);font-size:.68rem;white-space:nowrap}
.wgt-asuka-fod-sweep-box-v2 .ph.cur{color:var(--ink)}

.wgt-asuka-fod-sweep-box-v2 main{display:grid;gap:56px;margin-top:48px}
.wgt-asuka-fod-sweep-box-v2 .sec{display:grid;grid-template-columns:minmax(0,4fr) minmax(0,8fr);gap:20px 40px;border-top:2px solid var(--ink);padding-top:16px}
.wgt-asuka-fod-sweep-box-v2 .sec > header{display:grid;gap:8px;align-content:start}
.wgt-asuka-fod-sweep-box-v2 .sec > header p{color:var(--muted);font-size:.95rem;max-width:40ch}
.wgt-asuka-fod-sweep-box-v2 .body{display:grid;gap:18px;min-width:0}
.wgt-asuka-fod-sweep-box-v2 .steps{list-style:none;margin:0;padding:0;display:grid;counter-reset:st}
.wgt-asuka-fod-sweep-box-v2 .steps li{display:grid;grid-template-columns:44px minmax(0,1fr) auto;gap:12px;padding:10px 0;border-bottom:1px solid var(--line);counter-increment:st;align-items:start}
.wgt-asuka-fod-sweep-box-v2 .steps li::before{content:counter(st,decimal-leading-zero);font-family:var(--f-mono);font-size:.8rem;color:var(--accent-ink);padding-top:3px}
.wgt-asuka-fod-sweep-box-v2 .steps li.cur{background:var(--accent-soft)}
.wgt-asuka-fod-sweep-box-v2 .steps b{display:block;font-weight:600}
.wgt-asuka-fod-sweep-box-v2 .steps span{color:var(--muted);font-size:.94rem}
.wgt-asuka-fod-sweep-box-v2 .steps .at{font-family:var(--f-mono);font-size:.76rem;color:var(--muted);padding-top:3px;white-space:nowrap}
.wgt-asuka-fod-sweep-box-v2 .tbl{overflow-x:auto;border:1px solid var(--line);border-radius:var(--r);background:var(--surface)}
.wgt-asuka-fod-sweep-box-v2 table{border-collapse:collapse;width:100%;font-size:.9rem}
.wgt-asuka-fod-sweep-box-v2 th,.wgt-asuka-fod-sweep-box-v2 td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--line);vertical-align:top}
.wgt-asuka-fod-sweep-box-v2 th{font-family:var(--f-mono);font-size:.7rem;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);font-weight:500;background:var(--raise)}
.wgt-asuka-fod-sweep-box-v2 tr:last-child td{border-bottom:0}
.wgt-asuka-fod-sweep-box-v2 td.num{font-family:var(--f-mono);font-variant-numeric:tabular-nums;font-size:.84rem;white-space:nowrap}
.wgt-asuka-fod-sweep-box-v2 .pill{display:inline-block;font-family:var(--f-mono);font-size:.72rem;padding:2px 8px;border-radius:999px;white-space:nowrap;border:1px solid}
.wgt-asuka-fod-sweep-box-v2 .pill.ok{color:var(--good);background:var(--good-soft);border-color:var(--good)}
.wgt-asuka-fod-sweep-box-v2 .pill.mg{color:var(--warn);background:var(--warn-soft);border-color:var(--warn)}
.wgt-asuka-fod-sweep-box-v2 .pill.no{color:var(--bad);background:var(--bad-soft);border-color:var(--bad)}
.wgt-asuka-fod-sweep-box-v2 .note{font-size:.9rem;color:var(--muted);max-width:70ch}
.wgt-asuka-fod-sweep-box-v2 footer{margin-top:56px;color:var(--muted);font-size:.85rem;border-top:1px solid var(--line);padding-top:14px}
@media (max-width:860px){
  .wgt-asuka-fod-sweep-box-v2 .top{grid-template-columns:1fr}
  .wgt-asuka-fod-sweep-box-v2 .sec{grid-template-columns:1fr}
  .wgt-asuka-fod-sweep-box-v2 .stage{aspect-ratio:4/5;max-height:80vh}
  .wgt-asuka-fod-sweep-box-v2 .ph span{display:none}
  .wgt-asuka-fod-sweep-box-v2 .ph{min-width:18px}
  .wgt-asuka-fod-sweep-box-v2 .steps li{grid-template-columns:36px minmax(0,1fr)}
  .wgt-asuka-fod-sweep-box-v2 .steps .at{display:none}
}

</style>
