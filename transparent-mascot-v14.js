/* Remove the opaque dusty-brown background from the original Nhi "Khó" mascot.
   Preserve original art, outline and colours. No external upload or background-removal API. */
(function () {
  'use strict';
  var SOURCE = 'nhi-puzzled.webp';
  var processedUrl = null, pending = null;
  function cutout() {
    if (processedUrl) return Promise.resolve(processedUrl);
    if (pending) return pending;
    pending = new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        try {
          var canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
          if (!canvas.width || !canvas.height) return resolve(null);
          var ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) return resolve(null);
          ctx.drawImage(img, 0, 0);
          var data = ctx.getImageData(0, 0, canvas.width, canvas.height);
          var rgba = data.data, w = canvas.width, h = canvas.height, n = w * h;
          if (rgba[3] < 10) return resolve(SOURCE); // Already has transparency.
          var red = rgba[0], green = rgba[1], blue = rgba[2];
          var visited = new Uint8Array(n), queue = new Int32Array(n);
          var first = 0, last = 0;
          function accept(i) {
            if (visited[i]) return;
            visited[i] = 1;
            var p = i * 4, r = rgba[p] - red, g = rgba[p + 1] - green, b = rgba[p + 2] - blue;
            // Background is flat brown; keep all outlined character pixels untouched.
            if (r * r + g * g + b * b > 1850) return;
            rgba[p + 3] = 0;
            queue[last++] = i;
          }
          for (var x = 0; x < w; x++) { accept(x); accept((h - 1) * w + x); }
          for (var y = 1; y < h - 1; y++) { accept(y * w); accept(y * w + w - 1); }
          while (first < last) {
            var pixel = queue[first++], cx = pixel % w;
            if (cx > 0) accept(pixel - 1);
            if (cx + 1 < w) accept(pixel + 1);
            if (pixel >= w) accept(pixel - w);
            if (pixel + w < n) accept(pixel + w);
          }
          ctx.putImageData(data, 0, 0);
          canvas.toBlob(function (blob) {
            if (blob) { processedUrl = URL.createObjectURL(blob); resolve(processedUrl); }
            else resolve(null);
          }, 'image/png');
        } catch (err) { resolve(null); }
      };
      img.onerror = function () { resolve(null); };
      img.src = SOURCE;
    });
    return pending;
  }
  function upgradeImages() {
    if (!processedUrl) return;
    document.querySelectorAll('img[src]').forEach(function (node) {
      if (node.getAttribute('src').split('?')[0] === SOURCE) {
        node.src = processedUrl;
        node.dataset.transparentBackground = 'true';
      }
    });
  }
  function init() {
    cutout().then(function (url) { if (url && url !== SOURCE) upgradeImages(); });
    var observer = new MutationObserver(function () { if (processedUrl) upgradeImages(); });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  window.NHI_CLEAR_PUZZLED = cutout;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();