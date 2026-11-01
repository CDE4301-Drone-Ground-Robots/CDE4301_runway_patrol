// Widget script (runs once per page via useWidgetScript); edit here.
/* eslint-disable */
import __a0 from '@docs/report/members/hilbert/assets/models/scout-v2.glb'
// The script expects three and its example loaders as globals; the site bundles three, so this
// script gets the same THREE namespace (with OrbitControls and GLTFLoader attached) from the package.
import * as THREE_NS from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
const THREE = { ...THREE_NS, OrbitControls, GLTFLoader }
export default function init() {

    (function initScoutViewer() {
      const container = document.querySelector('.wgt-hilbert-simulation #scout-canvas-container'); // scoped: the steering viewer uses the same id on the Report page
      const overlay = document.querySelector('.wgt-hilbert-simulation #scout-loading-overlay');
      const text = document.getElementById('scout-loading-text');
      if (!container) return;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0b1120);

      const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
      camera.position.set(1.4, 0.9, 1.4);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      container.appendChild(renderer.domElement);

      const controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.target.set(0, 0, 0);

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
      scene.add(ambientLight);

      const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.85);
      dirLight1.position.set(5, 10, 7);
      scene.add(dirLight1);

      const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.4);
      dirLight2.position.set(-5, 5, -5);
      scene.add(dirLight2);

      // Ground Grid Helper matching wheel baseline (y = -0.235 m)
      const grid = new THREE.GridHelper(3.5, 20, 0x3b82f6, 0x1e293b);
      grid.position.y = -0.235;
      scene.add(grid);

      // Coordinate Triad (TF tree base_link axes)
      const axes = new THREE.AxesHelper(0.45);
      axes.position.y = -0.235;
      scene.add(axes);

      // Expose controls globally for preset buttons
      window._scoutViewer = {
        camera,
        controls,
        axes,
        scene
      };

      // Load Scout 2.0 GLB Model
      const loader = new THREE.GLTFLoader();
      loader.load(
        __a0,
        function(gltf) {
          const model = gltf.scene;
          scene.add(model);
          if (overlay) overlay.style.display = 'none';
        },
        function(xhr) {
          if (xhr.total > 0 && text) {
            const pct = Math.round((xhr.loaded / xhr.total) * 100);
            text.innerText = 'Loading Scout 2.0 model (' + pct + '%)...';
          }
        },
        function(err) {
          console.error('Error loading scout_v2.glb:', err);
          if (text) text.innerText = 'Model reference: scout_v2.glb';
          if (overlay) overlay.style.background = 'rgba(11, 17, 32, 0.6)';
        }
      );

      // Animation loop
      function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      }
      animate();

      // Responsive resize
      window.addEventListener('resize', function() {
        if (!container) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
      });
    })();

    // Camera preset helper functions
    function setScoutCam(view) {
      if (!window._scoutViewer) return;
      const { camera, controls } = window._scoutViewer;
      controls.target.set(0, 0, 0);

      const buttons = ['iso', 'front', 'side', 'top'];
      buttons.forEach(function(b) {
        const el = document.getElementById('btn-cam-' + b);
        if (el) el.classList.remove('active');
      });

      const activeEl = document.getElementById('btn-cam-' + view);
      if (activeEl) activeEl.classList.add('active');

      if (view === 'iso') {
        camera.position.set(1.4, 0.9, 1.4);
      } else if (view === 'front') {
        camera.position.set(1.6, 0.15, 0);
      } else if (view === 'side') {
        camera.position.set(0, 0.15, 1.6);
      } else if (view === 'top') {
        camera.position.set(0.001, 2.0, 0);
      }
      controls.update();
    }

    function toggleScoutAxes() {
      if (!window._scoutViewer) return;
      const { axes } = window._scoutViewer;
      axes.visible = !axes.visible;
      const btn = document.getElementById('btn-cam-axes');
      if (btn) btn.classList.toggle('active', axes.visible);
    }

    function resetScoutCam() {
      setScoutCam('iso');
    }
  
}
