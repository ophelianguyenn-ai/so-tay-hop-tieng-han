/* Image search modal for study cards: one-click selection saves the image. */
(function () {
  'use strict';
  if (!window.NHI_IMAGES) return;
  var images = window.NHI_IMAGES;
  var cache = Object.create(null);

  function el(name, cls, value) {
    var x = document.createElement(name);
    if (cls) x.className = cls;
    if (value !== undefined) x.textContent = value;
    return x;
  }
  function cleanText(html) {
    try { return new DOMParser().parseFromString(html || '', 'text/html').body.textContent.trim(); }
    catch (e) { return ''; }
  }
  function search(q) {
    q = (q || '').trim();
    if (!q) return Promise.resolve([]);
    if (cache[q]) return cache[q];
    var url = 'https://commons.wikimedia.org/w/api.php?origin=*&action=query&generator=search&gsrnamespace=6&gsrlimit=18&gsrsearch=' +
      encodeURIComponent(q) + '&prop=imageinfo&iiprop=url%7Cmime%7Cextmetadata&iiurlwidth=600&format=json';
    cache[q] = fetch(url).then(function (r) {
      if (!r.ok) throw Error('Wikimedia ' + r.status);
      return r.json();
    }).then(function (d) {
      var pages = Object.values((d.query || {}).pages || {});
      return pages.filter(function (p) {
        var x = (p.imageinfo || [])[0];
        return x && /^image\/(?:jpeg|png|webp|svg\+xml)$/i.test(x.mime || '') &&
          /^https:\/\//.test(x.thumburl || x.url || '');
      }).slice(0, 12);
    }).catch(function (err) { delete cache[q]; throw err; });
    return cache[q];
  }
  function picker(it, save, close) {
    var root = el('section', 'nhi-picture-picker');
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-label', 'Tìm và chọn ảnh minh họa');
    var head = el('div', 'nhi-picture-head');
    var title = el('strong', null, 'Chọn ảnh minh họa');
    var exit = el('button', 'ghost', '× Đóng');
    exit.type = 'button';
    exit.setAttribute('aria-label', 'Đóng tìm kiếm ảnh');
    exit.addEventListener('click', close);
    head.appendChild(title); head.appendChild(exit);
    root.appendChild(head);
    root.appendChild(el('p', 'nhi-picture-help', 'Tìm trên Wikimedia Commons. Chạm vào một hình để tự lưu vào thẻ này.'));
    var form = el('form', 'nhi-picture-search');
    var field = el('input', 'field');
    field.type = 'search'; field.setAttribute('aria-label', 'Từ khóa tìm ảnh');
    field.placeholder = 'Ví dụ: heat exchanger, pressure gauge';
    field.value = images.searchTerm ? images.searchTerm(it) || (it.ko + ' ' + it.vi) : it.ko + ' ' + it.vi;
    var go = el('button', 'primary', 'Tìm ảnh');
    go.type = 'submit';
    form.appendChild(field); form.appendChild(go);
    root.appendChild(form);
    var status = el('p', 'nhi-picture-status');
    status.setAttribute('role', 'status');
    root.appendChild(status);
    var grid = el('div', 'nhi-picture-results');
    root.appendChild(grid);
    var queryId = 0;
    function getImages() {
      var id = ++queryId, q = field.value.trim();
      grid.replaceChildren();
      if (!q) { status.textContent = 'Nhập từ khóa để tìm ảnh.'; return; }
      status.textContent = 'Đang tìm ảnh "' + q + '"…';
      go.disabled = true;
      search(q).then(function (pages) {
        if (id !== queryId || !root.isConnected) return;
        go.disabled = false;
        status.textContent = pages.length
          ? 'Tìm được ' + pages.length + ' hình. Chạm hình phù hợp để lưu ngay.'
          : 'Chưa tìm được hình. Hãy thử từ khóa tiếng Anh cụ thể hơn.';
        pages.forEach(function (page) {
          var info = (page.imageinfo || [])[0];
          if (!info) return;
          var thumb = info.thumburl || info.url;
          var tile = el('button', 'nhi-picture-result');
          tile.type = 'button';
          tile.setAttribute('aria-label', 'Thêm ảnh ' + page.title.replace(/^File:/, '') + ' vào thẻ');
          var img = el('img');
          img.src = thumb;
          img.alt = page.title.replace(/^File:/, '');
          img.loading = 'lazy';
          img.referrerPolicy = 'no-referrer';
          img.onerror = function () { tile.remove(); };
          tile.appendChild(img);
          tile.appendChild(el('span', null, page.title.replace(/^File:/, '').replace(/\.[^.]+$/, '')));
          tile.addEventListener('click', function () {
            var meta = info.extmetadata || {};
            var artist = cleanText((meta.Artist || {}).value).slice(0, 140);
            var license = cleanText((meta.LicenseShortName || {}).value).slice(0, 60);
            var value = {
              url: thumb, caption: it.vi || it.ko,
              source: info.descriptionurl || 'https://commons.wikimedia.org/',
              credit: [artist, license].filter(Boolean).join(' · ') || 'Wikimedia Commons'
            };
            save(value); // caller persists card image immediately, then closes the picker
          });
          grid.appendChild(tile);
        });
      }).catch(function () {
        if (id !== queryId || !root.isConnected) return;
        go.disabled = false;
        status.textContent = 'Không kết nối được Wikimedia Commons. Hãy thử lại hoặc dùng nút Sửa thẻ để tải ảnh từ máy.';
      });
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); getImages(); });
    root.addEventListener('click', function (e) { e.stopPropagation(); });
    root.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
    });
    setTimeout(function () { if (root.isConnected) getImages(); }, 0);
    return root;
  }
  images.picker = picker;
})();