/* Seasonal covers: ORIGINAL garden-day.webp and garden-night.webp = spring.
   Summer/autumn/winter are matched variants of the same illustrations.
   Study data, audio, cards and the mascot are deliberately untouched. */
(function () {
  'use strict';
  var cover = document.getElementById('cover');
  if (!cover) return;
  var landscape = cover.querySelector('.landscape');
  if (!landscape) return;

  // New key ignores the previous SVG design's selection: first visit is SPRING.
  var STORE = 'nlc-garden-season-v1';
  var seasons = [
    ['spring', '🌸 Xuân', 'Mùa xuân - khu vườn nguyên bản'],
    ['summer', '🌿 Hạ', 'Mùa hạ - khu vườn xanh mát'],
    ['autumn', '🍁 Thu', 'Mùa thu - khu vườn lá vàng'],
    ['winter', '❄️ Đông', 'Mùa đông - khu vườn tuyết trắng']
  ];
  var season = 'spring';
  try {
    var remembered = localStorage.getItem(STORE);
    if (seasons.some(function (s) { return s[0] === remembered; })) season = remembered;
  } catch (e) {}

  var controls = document.getElementById('nhi-season-controls');
  if (!controls) {
    controls = document.createElement('div');
    controls.id = 'nhi-season-controls';
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', 'Chọn phong cảnh theo mùa');
    cover.appendChild(controls);
  }
  controls.textContent = '';

  seasons.forEach(function (entry) {
    var button = document.createElement('button');
    button.type = 'button';
    button.dataset.season = entry[0];
    button.textContent = entry[1];
    button.setAttribute('aria-label', entry[2]);
    button.addEventListener('click', function (e) {
      e.stopPropagation();
      if (season === entry[0]) return;
      season = entry[0];
      try { localStorage.setItem(STORE, season); } catch (err) {}
      render();
    });
    controls.appendChild(button);
  });

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function particles() {
    landscape.querySelectorAll('.nhi-season-particle').forEach(function (e) { e.remove(); });
    if (reduced || season === 'spring') return; // Original spring garden remains unchanged.
    var w = window.innerWidth || 960, n = w < 500 ? 15 : 27;
    for (var i = 0; i < n; i++) {
      var span = document.createElement('span');
      span.className = 'nhi-season-particle ' + season;
      span.setAttribute('aria-hidden', 'true');
      var autumn = season === 'autumn', winter = season === 'winter';
      span.textContent = autumn ? (i % 3 ? '🍂' : '🍁') :
        winter ? (i % 4 ? '❄' : '✧') : (i % 3 ? '🍃' : '✦');
      span.style.setProperty('--particle-x', ((i * 41 + 7) % 100) + '%');
      span.style.setProperty('--particle-size', (winter ? 12 + i % 13 : autumn ? 13 + i % 12 : 9 + i % 9) + 'px');
      span.style.setProperty('--particle-duration', (winter ? 12 + i % 10 : 9 + i % 9) + 's');
      span.style.setProperty('--particle-delay', '-' + (i * 1.67).toFixed(1) + 's');
      span.style.setProperty('--particle-drift', ((i % 2 ? 1 : -1) * (62 + i * 8)) + 'px');
      span.style.setProperty('--particle-color', autumn ? '#d88e41' : winter ? '#eaf8ff' : '#a5d67c');
      landscape.appendChild(span);
    }
  }
  function render() {
    cover.dataset.season = season;
    controls.querySelectorAll('button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.season === season));
    });
    particles();
  }

  // Give the existing backgroundless ☀ / ☾ buttons a small click animation.
  document.addEventListener('click', function (e) {
    var button = e.target.closest && e.target.closest('#nhi-cover-theme-v5 button');
    if (!button) return;
    button.classList.remove('nhi-theme-pulse');
    void button.offsetWidth;
    button.classList.add('nhi-theme-pulse');
    window.setTimeout(function () { button.classList.remove('nhi-theme-pulse'); }, 650);
  });
  render();
})();
