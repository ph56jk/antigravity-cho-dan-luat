(function () {
  var root = document.documentElement;

  try {
    var saved = localStorage.getItem('theme');
    if (saved) root.setAttribute('data-theme', saved);
  } catch (e) {}

  document.getElementById('themeBtn').addEventListener('click', function () {
    var dark = root.getAttribute('data-theme') === 'dark' ||
      (!root.getAttribute('data-theme') && matchMedia('(prefers-color-scheme: dark)').matches);
    var next = dark ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  var nav = document.getElementById('nav');
  var menuBtn = document.getElementById('menuBtn');
  menuBtn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
  });
  nav.addEventListener('click', function () {
    nav.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
  });

  document.querySelectorAll('.copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.closest('.prompt').querySelector('pre').innerText;
      var done = function () {
        btn.textContent = 'Đã copy ✓';
        setTimeout(function () { btn.textContent = 'Copy'; }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { btn.textContent = 'Lỗi, hãy copy tay'; });
      } else {
        btn.textContent = 'Lỗi, hãy copy tay';
      }
    });
  });
})();
