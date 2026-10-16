(function () {
  var PAGE = 24;
  var grid = document.getElementById('grid');
  var tabs = document.getElementById('tabs');
  var search = document.getElementById('search');
  var count = document.getElementById('count');
  var more = document.getElementById('more');
  var ALL = [], current = 'Tất cả', list = [], shown = 0, pin = null;

  function norm(s) {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase();
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function copyText(text, btn) {
    var done = function () {
      btn.textContent = 'Đã copy ✓';
      setTimeout(function () { btn.textContent = 'Copy prompt'; }, 1800);
    };
    var fail = function () { btn.textContent = 'Lỗi, hãy copy tay'; };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fail);
    } else { fail(); }
  }

  function card(p) {
    var c = el('article', 'pcard' + (p.n === 1 ? ' featured' : ''));
    c.id = p.id;
    var top = el('div', 'pcard-top');
    top.appendChild(el('span', 'pnum', String(p.n)));
    top.appendChild(el('span', 'ptag', p.cat));
    if (p.n === 1) top.appendChild(el('span', 'ptag hot', 'AI hỏi bạn từng câu'));
    else if (p.sub && p.sub !== 'Prompt chọn lọc') top.appendChild(el('span', 'ptag', p.sub));
    c.appendChild(top);
    c.appendChild(el('h3', null, p.title));
    c.appendChild(el('p', 'pdesc', p.desc));
    c.appendChild(el('p', 'pfile', '📎 ' + p.file));
    var d = el('details', 'pdetails');
    d.appendChild(el('summary', null, 'Xem nội dung prompt'));
    d.addEventListener('toggle', function () {
      if (d.open && !d.querySelector('pre')) d.appendChild(el('pre', null, p.text));
    });
    c.appendChild(d);
    var b = el('button', 'copy big', 'Copy prompt');
    b.addEventListener('click', function () { copyText(p.text, b); });
    c.appendChild(b);
    return c;
  }

  function renderMore() {
    var frag = document.createDocumentFragment();
    list.slice(shown, shown + PAGE).forEach(function (p) { frag.appendChild(card(p)); });
    grid.appendChild(frag);
    shown = Math.min(shown + PAGE, list.length);
    more.hidden = shown >= list.length;
    more.textContent = 'Xem thêm (' + (list.length - shown).toLocaleString('vi-VN') + ' prompt nữa)';
  }

  function apply() {
    var words = norm(search.value.trim()).split(/\s+/).filter(Boolean);
    list = [];
    ALL.forEach(function (p) {
      if (current !== 'Tất cả' && p.cat !== current) return;
      if (!words.length) { list.push(p); return; }
      var score = 0;
      for (var i = 0; i < words.length; i++) {
        if (p._head.indexOf(words[i]) >= 0) score += 2;
        else if (p._body.indexOf(words[i]) >= 0) score += 1;
        else return;
      }
      p._score = score;
      list.push(p);
    });
    if (words.length) list.sort(function (a, b) { return b._score - a._score || a.n - b.n; });
    if (pin) list = [pin].concat(list.filter(function (p) { return p !== pin; }));
    grid.textContent = '';
    shown = 0;
    if (!list.length) grid.appendChild(el('p', 'muted', 'Không tìm thấy prompt nào. Thử từ khoá ngắn hơn, ví dụ "thuê nhà", "ly hôn", "trắc nghiệm".'));
    renderMore();
    count.textContent = list.length.toLocaleString('vi-VN') + ' / ' + ALL.length.toLocaleString('vi-VN') + ' prompt';
  }

  function setTab(name) {
    current = name;
    Array.prototype.forEach.call(tabs.children, function (t) { t.classList.toggle('active', t.dataset.cat === name); });
    apply();
  }

  function init(lib) {
    ALL = lib.prompts;
    ALL.forEach(function (p) {
      p._head = norm(p.title + ' ' + p.sub + ' ' + p.cat + ' ' + p.group);
      p._body = norm(p.desc + ' ' + p.text);
    });
    document.querySelectorAll('[data-total]').forEach(function (e) { e.textContent = ALL.length.toLocaleString('vi-VN'); });
    [{ name: 'Tất cả', count: ALL.length }].concat(lib.categories).forEach(function (c) {
      var b = el('button', 'tab', c.name + ' · ' + c.count.toLocaleString('vi-VN'));
      b.dataset.cat = c.name;
      b.addEventListener('click', function () { pin = null; setTab(c.name); });
      tabs.appendChild(b);
    });
    var q = new URLSearchParams(location.search).get('q');
    if (q) search.value = q;
    var target = location.hash.slice(1);
    var hit = target && ALL.filter(function (p) { return p.id === target; })[0];
    if (hit) { pin = hit; search.value = hit.title; }
    setTab('Tất cả');
    if (hit) {
      var c = document.getElementById(hit.id);
      if (c) { c.querySelector('details').open = true; c.scrollIntoView(); }
    }
  }

  var t;
  search.addEventListener('input', function () { pin = null; clearTimeout(t); t = setTimeout(apply, 120); });
  more.addEventListener('click', renderMore);

  fetch('prompts.json').then(function (r) { return r.json(); }).then(init, function () {
    grid.textContent = 'Không tải được thư viện prompt. Nếu bạn mở file trực tiếp trên máy, hãy mở qua web hoặc chạy một máy chủ tĩnh.';
  });
})();
