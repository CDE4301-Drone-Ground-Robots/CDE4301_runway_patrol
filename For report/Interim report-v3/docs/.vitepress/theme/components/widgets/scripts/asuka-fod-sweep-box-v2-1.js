// Widget script (runs once per page via useWidgetScript); edit here.
/* eslint-disable */

export default function init() {

/* Tell the embedding page how tall the rig is */
(function () {
  if (!document.documentElement.classList.contains('embed') || window.parent === window) return;
  var rig = document.querySelector('.rig');
  var post = function () { window.parent.postMessage({ type: 'fod-model-height', h: rig.getBoundingClientRect().height }, '*'); };
  new ResizeObserver(post).observe(rig);
  window.addEventListener('load', post);
})();

}
