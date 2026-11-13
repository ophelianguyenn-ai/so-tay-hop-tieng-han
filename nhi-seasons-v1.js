/* Animated SVG four-season cover — no external images or learning-data changes. */
(function () {
  'use strict';
  var cover = document.getElementById('cover');
  if (!cover) return;
  var landscape = cover.querySelector('.landscape');
  if (!landscape) return;

  var COLORS = {
    spring: {
      day:   ['#86cff4','#fdf8e8','#a2e8b3','#71cda0','#367e62','#e5acd0','#b9e7ea','#ffda77'],
      night: ['#07182c','#21475b','#245947','#153f3a','#092b2b','#c47baf','#438991','#f6efc0']
    },
    summer: {
      day:   ['#64c7f4','#f7f7cc','#95df8c','#44ba73','#246b52','#8add75','#66d5e3','#ffdb66'],
      night: ['#061524','#143b53','#286547','#165137','#08312d','#6bab75','#338ba7','#ffeda4']
    },
    autumn: {
      day:   ['#9eccef','#ffdfb4','#edc28d','#ca8955','#76563e','#e8884b','#9ed1d2','#f5c67e'],
      night: ['#10182d','#3c3153','#5c513b','#3d332f','#241e29','#d47b48','#6c8594','#f6e7b2']
    },
    winter: {
      day:   ['#9cc5e5','#f4f9ff','#ebf6fa','#bbdfe5','#567a8c','#e2eef3','#c1e7f9','#ffeed0'],
      night: ['#07162c','#314568','#9db8c7','#617f94','#324358','#dae8ec','#5b88ae','#f7f1cb']
    }
  };
  var LABELS = [['spring', '🌸 Xuân'], ['summer', '☀️ Hạ'], ['autumn', '🍁 Thu'], ['winter', '❄️ Đông']];
  var month = new Date().getMonth() + 1;
  var fallback = month >= 3 && month <= 5 ? 'spring' : month <= 8 && month >= 6 ? 'summer' : month <= 11 && month >= 9 ? 'autumn' : 'winter';
  var season = fallback;
  try { var saved = localStorage.getItem('nlc-season-v1'); if (COLORS[saved]) season = saved; } catch (e) {}
  var dark = false;
  var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'nhi-season-svg');
  svg.setAttribute('viewBox', '0 0 1440 900');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  landscape.insertBefore(svg, landscape.firstChild);

  function f(n) { return Number(n).toFixed(1).replace(/\.0$/, ''); }
  function tree(x, y, size, index, c) {
    var trunk = dark ? '#473c3b' : '#6e523d', foliage = c[5], highlights = dark ? c[3] : c[2];
    var s = '<g transform="translate(' + x + ' ' + y + ') scale(' + size + ')">';
    s += '<path d="M0 12 L0 -118 M0 -61 L-32 -93 M0 -74 L32 -111" stroke="' + trunk + '" stroke-width="12" stroke-linecap="round" fill="none"/>';
    if (season === 'winter') {
      s += '<path d="M-58 -92L0 -191L58 -92Z" fill="' + c[4] + '"/>';
      s += '<path d="M-56 -87L0 -182L56 -87L27 -103L0 -164L-27 -103Z" fill="' + c[5] + '" opacity=".95"/>';
      s += '<path d="M-42 -129L0 -195L42 -129" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/>';
      s += '<path d="M-54 -94q54 -17 108 0" fill="none" stroke="#ebf9ff" stroke-width="6"/>';
    } else {
      s += '<g class="nhi-treetop ' + (index % 2 ? 'alt' : '') + '">';
      s += '<ellipse cx="-35" cy="-119" rx="42" ry="48" fill="' + c[4] + '"/>';
      s += '<ellipse cx="35" cy="-119" rx="45" ry="53" fill="' + foliage + '"/>';
      s += '<ellipse cx="0" cy="-157" rx="53" ry="55" fill="' + foliage + '"/>';
      s += '<path d="M-31 -154q28-34 63-18" fill="none" stroke="' + highlights + '" stroke-width="13" opacity=".55" stroke-linecap="round"/>';
      if (season === 'spring') {
        for (var i = 0; i < 11; i++) {
          var a = i * 2.4, tx = Math.sin(a) * 49, ty = -136 + Math.cos(a * 1.4) * 43;
          s += '<circle cx="' + f(tx) + '" cy="' + f(ty) + '" r="' + (i % 3 + 3) + '" fill="' + (i % 2 ? '#fff3f6' : '#ffd0e5') + '" opacity=".94"/>';
        }
      }
      if (season === 'autumn') {
        for (var j = 0; j < 9; j++) {
          var b = j * 2.26, xx = Math.sin(b) * 40, yy = -140 + Math.cos(b * 1.55) * 37;
          s += '<ellipse cx="' + f(xx) + '" cy="' + f(yy) + '" rx="10" ry="6" transform="rotate(' + j * 39 + ' ' + f(xx) + ' ' + f(yy) + ')" fill="' + (j % 2 ? '#e9b15a' : '#b8543c') + '" opacity=".72"/>';
        }
      }
      s += '</g>';
    }
    return s + '</g>';
  }
  function stars() {
    var s = '';
    for (var i = 0; i < 76; i++) {
      var x = (i * 197 + 67) % 1436, y = (i * 79 + 19) % 390;
      var radius = i % 9 === 0 ? 2.6 : i % 3 === 0 ? 1.8 : 1.1;
      s += '<circle class="nhi-night-glimmer" cx="' + x + '" cy="' + y + '" r="' + radius + '" fill="#fff6d1" opacity="' + (i % 4 + 4) / 10 + '" style="animation-delay:-' + f(i * .33) + 's"/>';
    }
    return s;
  }
  function cabin(c) {
    var wall = dark ? '#485264' : season === 'winter' ? '#dae6e8' : '#f7e4be';
    var roof = dark ? '#273b40' : '#a76c55';
    var s = '<g transform="translate(205 625)">';
    s += '<rect x="-86" y="-22" width="176" height="130" rx="8" fill="' + wall + '" stroke="' + c[4] + '" stroke-width="5"/>';
    s += '<path d="M-112 -20L3 -104L114 -20Z" fill="' + roof + '" stroke="' + c[4] + '" stroke-width="6" stroke-linejoin="round"/>';
    s += '<path d="M53 -79V-120H75V-62" fill="' + roof + '" stroke="' + c[4] + '" stroke-width="3"/>';
    if (season === 'winter' || season === 'autumn') s += '<path class="nhi-smoke" d="M68 -126q-22-20 4-39q17-13 2-31" fill="none" stroke="#d7e7ec" stroke-width="8" opacity=".35" stroke-linecap="round"/>';
    if (season === 'winter') s += '<path d="M-112 -22L3 -105L114 -22" fill="none" stroke="#edf9ff" stroke-width="11" stroke-linecap="round"/>';
    s += '<rect x="-19" y="30" width="43" height="78" rx="5" fill="' + roof + '"/><circle cx="13" cy="72" r="3" fill="#ffe4a0"/>';
    s += '<rect class="nhi-house-light" x="-69" y="12" width="36" height="35" rx="5" fill="' + (dark ? '#ffe6a5' : '#b5e8ef') + '" stroke="' + roof + '" stroke-width="5"/>';
    s += '<rect class="nhi-house-light" x="42" y="12" width="36" height="35" rx="5" fill="' + (dark ? '#ffe6a5' : '#b5e8ef') + '" stroke="' + roof + '" stroke-width="5"/>';
    s += '<path d="M-51 13v32M60 13v32M-68 30h34M43 30h34" fill="none" stroke="' + roof + '" stroke-width="3"/>';
    s += '</g>';
    return s;
  }
  function accents(c) {
    var s = '';
    if (season === 'spring') {
      for (var i = 0; i < 23; i++) {
        var x = i * 65 + 15, y = 695 + (i % 4) * 31;
        s += '<path d="M' + x + ' ' + y + 'v-25" stroke="#437d5e" stroke-width="3"/><circle cx="' + x + '" cy="' + (y - 27) + '" r="8" fill="' + (i % 3 ? '#ffe1f0' : '#ffbadc') + '"/>';
      }
    } else if (season === 'summer') {
      for (var j = 0; j < 24; j++) {
        var a = j * 61 + 23, b = 760 + (j % 5) * 20;
        s += '<path d="M' + a + ' ' + b + 'q-3-13 0-30q8 10 8 14" fill="none" stroke="#2f855d" stroke-width="4" stroke-linecap="round"/>';
        if (j % 4 === 0) s += '<circle cx="' + a + '" cy="' + (b - 32) + '" r="6" fill="#ffe066"/>';
      }
    } else if (season === 'autumn') {
      for (var k = 0; k < 14; k++) {
        var p = k * 111 + 26, q = 735 + k % 5 * 18;
        s += '<ellipse cx="' + p + '" cy="' + q + '" rx="17" ry="6" fill="' + (k % 2 ? '#c86d3c' : '#edb052') + '" transform="rotate(-22 ' + p + ' ' + q + ')"/>';
      }
      s += '<g transform="translate(1130 747)"><ellipse rx="55" ry="19" fill="#c48b3e"/><rect x="-38" y="-40" width="76" height="49" rx="24" fill="#efbb61"/><path d="M-28-37v46M0-40v49M26-37v46" stroke="#ca7f40" stroke-width="3"/></g>';
    } else {
      s += '<g transform="translate(1130 728)"><circle cy="12" r="44" fill="#f7fdff"/><circle cy="-45" r="33" fill="#f7fdff"/>';
      s += '<path d="M-8-79L2-102L15-78Z" fill="#437d82"/><circle cx="-12" cy="-53" r="4" fill="#293a4a"/><circle cx="12" cy="-53" r="4" fill="#293a4a"/>';
      s += '<path d="M-5-38l19-5-19-5z" fill="#e5a359"/><circle cx="0" cy="4" r="5" fill="#45718d"/><circle cx="0" cy="23" r="5" fill="#45718d"/>';
      s += '<path d="M-32-10l-51-23M31-10l49-30" stroke="#735a4a" stroke-width="5" stroke-linecap="round"/></g>';
    }
    return s;
  }
  function makeScene() {
    dark = document.documentElement.getAttribute('data-theme') === 'dark';
    var c = COLORS[season][dark ? 'night' : 'day'];
    var s = '<defs><linearGradient id="nhi-sky" x2="0" y2="1"><stop stop-color="' + c[0] + '"/><stop offset="1" stop-color="' + c[1] + '"/></linearGradient>';
    s += '<linearGradient id="nhi-river" x2=".3" y2="1"><stop stop-color="' + c[6] + '" stop-opacity=".86"/><stop offset="1" stop-color="' + c[6] + '" stop-opacity=".28"/></linearGradient>';
    s += '<radialGradient id="nhi-orb-halo"><stop stop-color="' + c[7] + '" stop-opacity=".35"/><stop offset="1" stop-color="' + c[7] + '" stop-opacity="0"/></radialGradient></defs>';
    s += '<rect width="1440" height="900" fill="url(#nhi-sky)"/>';
    if (dark) s += stars();
    s += '<g class="nhi-sun-orb nhi-moon-orb">';
    s += '<circle cx="1110" cy="159" r="145" fill="url(#nhi-orb-halo)"/>';
    if (dark) {
      s += '<circle cx="1110" cy="159" r="53" fill="' + c[7] + '" opacity=".96"/>';
      s += '<circle cx="1135" cy="137" r="47" fill="' + c[0] + '" opacity=".94"/>';
      s += '<circle cx="1094" cy="156" r="4.5" fill="#e5dea9" opacity=".55"/>';
    } else {
      s += '<g class="nhi-sun-rays" stroke="' + c[7] + '" stroke-width="5" stroke-linecap="round">';
      for (var i = 0; i < 12; i++) {
        var angle = i * Math.PI / 6;
        s += '<path d="M' + f(1110 + Math.cos(angle) * 73) + ' ' + f(159 + Math.sin(angle) * 73) + 'L' + f(1110 + Math.cos(angle) * 90) + ' ' + f(159 + Math.sin(angle) * 90) + '"/>';
      }
      s += '</g><circle cx="1110" cy="159" r="56" fill="' + c[7] + '"/><circle cx="1094" cy="146" r="40" fill="#fff8db" opacity=".25"/>';
    }
    s += '</g>';
    s += '<g class="nhi-svg-cloud" opacity="' + (dark ? '.24' : '.66') + '" fill="' + (dark ? '#bed4e2' : '#fff') + '"><ellipse cx="250" cy="190" rx="102" ry="29"/><ellipse cx="210" cy="169" rx="48" ry="37"/><ellipse cx="286" cy="155" rx="56" ry="45"/></g>';
    s += '<g class="nhi-svg-cloud alt" opacity="' + (dark ? '.19' : '.55') + '" fill="' + (dark ? '#b7d2df' : '#fff') + '"><ellipse cx="815" cy="295" rx="105" ry="27"/><ellipse cx="781" cy="278" rx="48" ry="34"/><ellipse cx="855" cy="268" rx="61" ry="46"/></g>';
    s += '<path d="M0 625C195 450 360 558 559 488C808 398 981 520 1440 424V900H0Z" fill="' + c[2] + '" opacity=".88"/>';
    s += '<path d="M0 722C179 620 355 680 528 595C795 471 956 666 1440 546V900H0Z" fill="' + c[3] + '"/>';
    s += '<path d="M0 775C269 683 389 761 544 683C708 603 1020 709 1440 664V900H0Z" fill="' + c[4] + '" opacity=".62"/>';
    if (season === 'winter') {
      s += '<path d="M0 720C179 620 355 678 528 595C795 469 956 663 1440 542" stroke="#f7fcff" stroke-width="15" fill="none" opacity=".73"/>';
      s += '<path d="M0 774C269 683 389 761 544 683C708 603 1020 709 1440 664" stroke="#fff" stroke-width="12" fill="none" opacity=".67"/>';
    }
    s += '<path d="M630 715C853 690 1040 712 1440 693V900H587C720 822 584 791 630 715Z" fill="url(#nhi-river)" opacity=".74"/>';
    for (var r = 0; r < 11; r++) {
      var x = 670 + r * 80, y = 756 + (r % 4) * 22;
      s += '<path class="nhi-ripple" d="M' + x + ' ' + y + 'q22-5 47 0" fill="none" stroke="' + (dark ? '#e1ffec' : '#fff') + '" stroke-width="3" opacity=".4" style="animation-delay:-' + r * .27 + 's"/>';
    }
    s += '<path d="M-10 900C223 743 395 790 628 705" fill="none" stroke="' + (season === 'winter' ? '#eaf5fa' : '#e6d4aa') + '" stroke-width="61" opacity=".85"/>';
    s += tree(30, 711, 1.2, 0, c) + tree(465, 690, .87, 1, c);
    s += tree(670, 634, .68, 2, c) + tree(1014, 698, 1.08, 3, c);
    s += tree(1329, 695, 1.38, 4, c);
    s += cabin(c) + accents(c);
    if (dark) {
      for (var q = 0; q < 24; q++) {
        var fx = (q * 131 + 76) % 1420, fy = 555 + (q * 37) % 260;
        s += '<circle class="nhi-night-glimmer" cx="' + fx + '" cy="' + fy + '" r="' + (q % 3 + 2) + '" fill="#f9f6ac" opacity=".76" style="animation-delay:-' + (q * .42) + 's"/>';
      }
      s += '<g class="nhi-owl" transform="translate(1251 425)"><path d="M-28 0q-13-42 4-56l16 14 12-22 12 22 16-14q17 24 4 56Z" fill="#7c7781"/><circle cx="-11" cy="-25" r="9" fill="#f6e6b0"/><circle cx="13" cy="-25" r="9" fill="#f6e6b0"/><circle cx="-11" cy="-25" r="4" fill="#2f2736"/><circle cx="13" cy="-25" r="4" fill="#2f2736"/><path d="M-2-13L5-4L12-13" fill="#e0b875"/></g>';
      s += '<g class="nhi-svg-cloud" opacity=".35" transform="translate(210 325)" fill="#758da5"><ellipse rx="60" ry="15"/><ellipse cy="-11" cx="-15" rx="35" ry="28"/></g>';
    } else {
      s += '<g class="nhi-svg-cloud" transform="translate(80 425)" opacity=".42"><path d="M0 0q15-15 30 0q15-15 30 0M90-20q12-14 24 0q12-14 24 0" stroke="#34546a" stroke-width="5" fill="none" stroke-linecap="round"/></g>';
    }
    svg.innerHTML = s;
  }
  function particles() {
    landscape.querySelectorAll('.nhi-season-particle').forEach(function (el) { el.remove(); });
    var amount = window.innerWidth < 700 ? 18 : 30;
    for (var i = 0; i < amount; i++) {
      var item = document.createElement('span');
      item.className = 'nhi-season-particle ' + season;
      item.setAttribute('aria-hidden', 'true');
      item.textContent = season === 'spring' ? (i % 3 ? '❀' : '✿') :
        season === 'summer' ? (i % 3 ? '✦' : '✧') :
        season === 'autumn' ? (i % 2 ? '🍂' : '🍁') : (i % 4 ? '❄' : '✧');
      item.style.setProperty('--particle-x', ((i * 67 + 9) % 100) + '%');
      item.style.setProperty('--particle-size', (season === 'winter' ? 12 + i % 12 : 12 + i % 14) + 'px');
      item.style.setProperty('--particle-duration', (season === 'summer' ? 7 + i % 6 : 10 + i % 10) + 's');
      item.style.setProperty('--particle-delay', '-' + f(i * 1.37) + 's');
      item.style.setProperty('--particle-drift', ((i % 2 ? 1 : -1) * (45 + i * 11)) + 'px');
      item.style.setProperty('--particle-color', season === 'spring' ? (i % 2 ? '#f7b2cd' : '#fff0fa') :
        season === 'summer' ? '#fff2a6' : season === 'autumn' ? '#e69a4b' : '#f2fbff');
      landscape.appendChild(item);
    }
  }
  var controls = document.createElement('div');
  controls.id = 'nhi-season-controls';
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', 'Chọn bốn mùa cho trang bìa');
  LABELS.forEach(function (entry) {
    var button = document.createElement('button');
    button.type = 'button';
    button.dataset.season = entry[0];
    button.textContent = entry[1];
    button.setAttribute('aria-label', 'Mùa ' + entry[1].split(' ').slice(1).join(' '));
    button.addEventListener('click', function (e) {
      e.stopPropagation();
      if (season === entry[0]) return;
      season = entry[0];
      try { localStorage.setItem('nlc-season-v1', season); } catch (err) {}
      render();
    });
    controls.appendChild(button);
  });
  cover.appendChild(controls);
  function render() {
    cover.dataset.season = season;
    controls.querySelectorAll('button').forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.dataset.season === season));
    });
    makeScene();
    particles();
  }
  document.addEventListener('click', function (event) {
    var button = event.target.closest && event.target.closest('#nhi-cover-theme-v5 button');
    if (!button) return;
    button.classList.remove('nhi-theme-pulse');
    void button.offsetWidth;
    button.classList.add('nhi-theme-pulse');
    setTimeout(function () { button.classList.remove('nhi-theme-pulse'); }, 650);
  });
  new MutationObserver(function () {
    var newDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (newDark !== dark) makeScene();
  }).observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']});
  render();
})();