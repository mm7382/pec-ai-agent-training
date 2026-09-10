(() => {
  const scene = document.querySelector('.home-landing');
  if (!scene) return;
  const motion = matchMedia('(prefers-reduced-motion: no-preference) and (hover: hover) and (min-width: 1001px)');
  let frame = 0;
  let latest;
  function reset() {
    cancelAnimationFrame(frame);
    frame = 0;
    scene.style.removeProperty('--desk-x');
    scene.style.removeProperty('--desk-y');
    scene.style.removeProperty('--desk-angle');
  }
  function update() {
    frame = 0;
    if (!motion.matches || document.hidden) return;
    const rect = scene.getBoundingClientRect();
    const x = Math.max(-.5, Math.min(.5, (latest.clientX - rect.left) / rect.width - .5));
    const y = Math.max(-.5, Math.min(.5, (latest.clientY - rect.top) / rect.height - .5));
    scene.style.setProperty('--desk-x', `${x * 22}px`);
    scene.style.setProperty('--desk-y', `${y * 12}px`);
    scene.style.setProperty('--desk-angle', `${x * 1.5}deg`);
  }
  scene.addEventListener('pointermove', event => {
    if (!motion.matches) return;
    latest = event;
    if (!frame) frame = requestAnimationFrame(update);
  }, {passive: true});
  scene.addEventListener('pointerleave', reset);
  motion.addEventListener('change', reset);
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
  if (motion.matches) document.body.classList.add('desk-motion-ready');
})();
