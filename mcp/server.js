#!/usr/bin/env node
// MCP server (stdio) cho "Thư viện prompt cho dân luật". Không cần cài thư viện nào, chỉ cần Node 18+.
// Dữ liệu: prompts.json đi kèm (nếu có) hoặc bản cache, rồi tự cập nhật bản mới nhất từ trang web.
'use strict';
var fs = require('fs');
var os = require('os');
var path = require('path');

var VERSION = '1.0.0';
var SITE = 'https://ph56jk.github.io/antigravity-cho-dan-luat/';
var REMOTE = process.env.PROMPT_LUAT_URL || SITE + 'prompts.json';
var CACHE = path.join(os.homedir(), '.prompt-luat', 'prompts.json');
var LOCAL = [path.join(__dirname, '..', 'prompts.json'), path.join(__dirname, 'prompts.json'), CACHE];
var PROTOCOLS = ['2025-06-18', '2025-03-26', '2024-11-05'];
var STOP = ['cho', 'minh', 'toi', 'em', 'giup', 'voi', 'nhe', 'nha', 'can', 'muon', 'hay', 'lam', 'mot', 'cac', 'nhung', 'va', 'la', 'cua', 've', 'de', 'thi', 'ma', 'prompt', 'mau'];

function log(m) { process.stderr.write('[prompt-luat] ' + m + '\n'); }
function norm(s) {
  return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase();
}

var lib = null;
function valid(d) { return d && Array.isArray(d.prompts) && d.prompts.length > 0; }
function index(d) {
  d.prompts.forEach(function (p) {
    p._title = norm(p.title);
    p._meta = norm(p.sub + ' ' + p.group + ' ' + p.cat);
    p._desc = norm(p.desc);
    p._text = norm(p.text);
  });
  d.byId = {};
  d.prompts.forEach(function (p) { d.byId[p.id] = p; });
  return d;
}
function newer(a, b) { return !b || (a.updated || '') > (b.updated || '') || ((a.updated || '') === (b.updated || '') && a.count > b.count); }

LOCAL.forEach(function (f) {
  try {
    var d = JSON.parse(fs.readFileSync(f, 'utf8'));
    if (valid(d) && newer(d, lib)) lib = d;
  } catch (e) {}
});
if (lib) index(lib);

var remote = process.env.PROMPT_LUAT_OFFLINE ? Promise.resolve() : fetch(REMOTE, { signal: AbortSignal.timeout(8000) })
  .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
  .then(function (d) {
    if (!valid(d)) throw new Error('dữ liệu không hợp lệ');
    if (!newer(d, lib) && lib) return;
    try { fs.mkdirSync(path.dirname(CACHE), { recursive: true }); fs.writeFileSync(CACHE, JSON.stringify(d)); } catch (e) {}
    lib = index(d);
    log('đã cập nhật ' + d.count + ' prompt từ ' + REMOTE);
  })
  .catch(function (e) { log('không tải được bản mới (' + e.message + ')' + (lib ? ', dùng bản có sẵn' : '')); });

function getLib() {
  if (lib) return Promise.resolve(lib);
  return remote.then(function () {
    if (!lib) throw new Error('Chưa có dữ liệu prompt: máy cần kết nối mạng ở lần chạy đầu tiên để tải ' + REMOTE);
    return lib;
  });
}

function search(d, query, category, limit) {
  var q = norm(query).replace(/[^a-z0-9\s]/g, ' ');
  var words = q.split(/\s+/).filter(function (w) { return w && STOP.indexOf(w) < 0; });
  var cat = category ? norm(category) : '';
  var hits = [];
  d.prompts.forEach(function (p) {
    if (cat && norm(p.cat) !== cat) return;
    if (!words.length) { hits.push({ p: p, s: 0, c: 0 }); return; }
    var s = 0, c = 0;
    words.forEach(function (w) {
      var m = 0;
      if (p._title.indexOf(w) >= 0) m = 3;
      else if (p._meta.indexOf(w) >= 0) m = 2;
      else if (p._desc.indexOf(w) >= 0) m = 1;
      else if (p._text.indexOf(w) >= 0) m = 0.5;
      if (m) { s += m; c++; }
    });
    for (var i = 0; i + 1 < words.length; i++) {
      var pair = words[i] + ' ' + words[i + 1];
      if (p._title.indexOf(pair) >= 0 || p._meta.indexOf(pair) >= 0) s += 2;
    }
    if (c) hits.push({ p: p, s: s, c: c });
  });
  var need = Math.max(1, Math.ceil(words.length * 0.6));
  hits = hits.filter(function (h) { return !words.length || h.c >= need; });
  hits.sort(function (a, b) { return b.c - a.c || b.s - a.s || a.p.n - b.p.n; });
  return { total: hits.length, items: hits.slice(0, limit).map(function (h) { return h.p; }) };
}

function line(p, i) {
  return (i + 1) + '. id: ' + p.id + '\n   ' + p.title + ' (' + p.cat + (p.sub ? ' · ' + p.sub : '') + ')\n   ' + p.desc + '\n   📎 ' + p.file;
}

function full(d, p) {
  return '# ' + p.title + '\n' +
    'Nhóm: ' + p.cat + (p.sub ? ' · ' + p.sub : '') + ' | id: ' + p.id + ' | Xem trên web: ' + (d.url || SITE) + 'prompts.html#' + p.id + '\n' +
    '📎 ' + p.file + '\n\n' +
    '--- NỘI DUNG PROMPT ---\n' + p.text + '\n--- HẾT PROMPT ---\n\n' +
    'Cách dùng (dành cho AI): nếu người dùng nhờ làm việc này, hãy làm theo nội dung prompt như thể họ vừa gửi nó. ' +
    'Thay các chỗ [GHI ...] và [.....] bằng thông tin người dùng đã cho; thiếu thì hỏi họ từng câu một. ' +
    'Nếu prompt cần file mà người dùng chưa đính kèm, nhắc họ đính kèm (và ẩn danh) trước. ' +
    'Nếu người dùng chỉ muốn xem hoặc copy prompt, đưa nguyên văn phần NỘI DUNG PROMPT.';
}

var TOOLS = [
  {
    name: 'search_prompts',
    title: 'Tìm prompt pháp lý',
    description: 'Tìm trong thư viện hơn 1.700 prompt mẫu tiếng Việt cho công việc pháp lý: soạn / soát / đàm phán hợp đồng, thủ tục hành chính, tranh chấp và tố tụng, hình sự, học luật (đề cương, trắc nghiệm, nhận định, tình huống), pháp chế doanh nghiệp, dịch thuật pháp lý, truyền thông pháp luật, kịch bản Google Flow. ' +
      'Dùng khi người dùng nhờ làm một việc pháp lý hoặc hỏi "có prompt nào để…". Truyền vài từ khoá chính (có dấu hoặc không dấu đều được), ví dụ "soát hợp đồng thuê nhà", "ly hôn thuận tình checklist", "trắc nghiệm luật đất đai". Sau đó gọi get_prompt với id phù hợp nhất.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Từ khoá mô tả việc cần làm, ví dụ "đơn khởi kiện đòi nợ".' },
        category: { type: 'string', description: 'Lọc theo nhóm (không bắt buộc). Xem list_categories để biết tên nhóm.' },
        limit: { type: 'integer', minimum: 1, maximum: 25, description: 'Số kết quả tối đa, mặc định 8.' }
      },
      required: ['query']
    },
    annotations: { readOnlyHint: true, openWorldHint: false }
  },
  {
    name: 'get_prompt',
    title: 'Lấy nội dung prompt',
    description: 'Lấy nội dung đầy đủ của một prompt theo id (lấy từ search_prompts) hoặc theo số thứ tự trên trang web. Kết quả có kèm hướng dẫn cách thực hiện prompt cho người dùng.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'id của prompt (ví dụ "hd-hop-dong-thue-nha-o-soat") hoặc số thứ tự (ví dụ "12").' } },
      required: ['id']
    },
    annotations: { readOnlyHint: true, openWorldHint: false }
  },
  {
    name: 'list_categories',
    title: 'Danh mục thư viện prompt',
    description: 'Liệt kê các nhóm prompt và số lượng. Truyền category để xem các chủ đề con trong nhóm đó (ví dụ các loại hợp đồng, các thủ tục, các môn học).',
    inputSchema: {
      type: 'object',
      properties: { category: { type: 'string', description: 'Tên nhóm muốn xem chi tiết (không bắt buộc).' } }
    },
    annotations: { readOnlyHint: true, openWorldHint: false }
  }
];

function findCat(d, name) {
  var n = norm(name);
  return d.categories.filter(function (c) { return norm(c.name) === n; })[0] ||
    d.categories.filter(function (c) { return norm(c.name).indexOf(n) >= 0; })[0];
}

function callTool(d, name, a) {
  a = a || {};
  if (name === 'search_prompts') {
    if (!a.query || typeof a.query !== 'string') throw new Error('Thiếu tham số query.');
    var limit = Math.min(25, Math.max(1, parseInt(a.limit, 10) || 8));
    var c = a.category ? findCat(d, a.category) : null;
    if (a.category && !c) return 'Không có nhóm "' + a.category + '". Các nhóm: ' + d.categories.map(function (x) { return x.name; }).join(', ') + '.';
    var r = search(d, a.query, c && c.name, limit);
    if (!r.total) return 'Không tìm thấy prompt nào cho "' + a.query + '". Thử từ khoá ngắn hơn (ví dụ "thuê nhà", "ly hôn", "trắc nghiệm") hoặc gọi list_categories để xem các nhóm.';
    return 'Tìm thấy ' + r.total + ' prompt cho "' + a.query + '"' + (c ? ' trong nhóm ' + c.name : '') + ', hiện ' + r.items.length + ' kết quả khớp nhất:\n\n' +
      r.items.map(line).join('\n\n') + '\n\nGọi get_prompt với id để lấy nội dung đầy đủ.';
  }
  if (name === 'get_prompt') {
    var id = String(a.id || '').trim();
    if (!id) throw new Error('Thiếu tham số id.');
    var p = d.byId[id] || (/^\d+$/.test(id) && d.prompts[parseInt(id, 10) - 1]);
    if (p) return full(d, p);
    var s = search(d, id.replace(/-/g, ' '), null, 5);
    return 'Không có prompt id "' + id + '".' + (s.total ? ' Có thể bạn cần:\n\n' + s.items.map(line).join('\n\n') : ' Hãy dùng search_prompts để tìm id đúng.');
  }
  if (name === 'list_categories') {
    if (a.category) {
      var cat = findCat(d, a.category);
      if (!cat) return 'Không có nhóm "' + a.category + '". Các nhóm: ' + d.categories.map(function (x) { return x.name; }).join(', ') + '.';
      var subs = {};
      d.prompts.forEach(function (p) { if (p.cat === cat.name) subs[p.sub] = (subs[p.sub] || 0) + 1; });
      return 'Nhóm ' + cat.name + ' có ' + cat.count + ' prompt, gồm các chủ đề:\n' +
        Object.keys(subs).map(function (k) { return '- ' + k + ' (' + subs[k] + ')'; }).join('\n') +
        '\n\nDùng search_prompts với tên chủ đề để xem các prompt trong đó.';
    }
    return (d.name || 'Thư viện prompt') + ': ' + d.count + ' prompt, cập nhật ' + d.updated + '.\n' +
      d.categories.map(function (c) { return '- ' + c.name + ': ' + c.count; }).join('\n') +
      '\n\nTruyền category để xem chủ đề con, hoặc dùng search_prompts để tìm.';
  }
  var e = new Error('Không có tool ' + name);
  e.code = -32602;
  throw e;
}

var FINDER = {
  name: 'tim-prompt-luat',
  title: 'Tìm prompt luật phù hợp rồi làm luôn',
  description: 'Mô tả việc bạn cần, AI tự tìm prompt hợp nhất trong thư viện và làm theo.',
  arguments: [{ name: 'viec_can_lam', description: 'Việc bạn cần làm, ví dụ "soát hợp đồng thuê mặt bằng, mình là bên thuê".', required: true }]
};

function listPrompts(d) {
  return [FINDER].concat(d.prompts.filter(function (p) { return p.id.indexOf('chon-') === 0; }).map(function (p) {
    return { name: p.id, title: p.title, description: p.desc + ' (' + p.file + ')' };
  }));
}

function getPromptMsg(d, name, args) {
  var text;
  if (name === FINDER.name) {
    var v = (args && args.viec_can_lam) || '';
    text = 'Mình cần: ' + v + '\n\nHãy dùng tool search_prompts của thư viện prompt luật để tìm prompt phù hợp nhất với việc trên, cho mình xem 3 lựa chọn tốt nhất (tên + mô tả 1 dòng) và hỏi mình chọn cái nào. Sau khi mình chọn, gọi get_prompt rồi làm theo prompt đó; chỗ nào cần thông tin hoặc file thì hỏi mình từng câu.';
    return { description: FINDER.title, messages: [{ role: 'user', content: { type: 'text', text: text } }] };
  }
  var p = d.byId[name];
  if (!p) { var e = new Error('Không có prompt ' + name); e.code = -32602; throw e; }
  return { description: p.title, messages: [{ role: 'user', content: { type: 'text', text: p.text } }] };
}

var INSTRUCTIONS = 'Server này là "Thư viện prompt cho dân luật" (' + SITE + '): hơn 1.700 prompt mẫu tiếng Việt cho công việc pháp lý ở Việt Nam. ' +
  'Khi người dùng nhờ làm một việc pháp lý (soạn, soát, giải thích, đàm phán hợp đồng; hồ sơ thủ tục; tranh chấp, đơn khởi kiện, luận cứ; hình sự; ôn thi luật; văn bản pháp chế; dịch thuật; bài viết, video phổ biến pháp luật), ' +
  'hãy gọi search_prompts với vài từ khoá chính, chọn prompt khớp nhất, gọi get_prompt rồi làm theo nội dung đó. Nếu có nhiều prompt gần giống, hỏi người dùng chọn. ' +
  'Luôn tuân thủ quy tắc trong prompt: không sửa file gốc, ghi rõ căn cứ pháp luật để người dùng tra lại, không chắc thì nói không chắc.';

function handle(msg) {
  var id = msg.id, m = msg.method, p = msg.params || {};
  var isReq = id !== undefined && id !== null;
  if (!m) return Promise.resolve(null);
  var work;
  if (m === 'initialize') {
    work = Promise.resolve({
      protocolVersion: PROTOCOLS.indexOf(p.protocolVersion) >= 0 ? p.protocolVersion : PROTOCOLS[0],
      capabilities: { tools: { listChanged: false }, prompts: { listChanged: false } },
      serverInfo: { name: 'prompt-luat', title: 'Thư viện prompt cho dân luật', version: VERSION },
      instructions: INSTRUCTIONS
    });
  } else if (m === 'ping') work = Promise.resolve({});
  else if (m === 'tools/list') work = Promise.resolve({ tools: TOOLS });
  else if (m === 'tools/call') {
    work = getLib().then(function (d) {
      return { content: [{ type: 'text', text: callTool(d, p.name, p.arguments) }] };
    }).catch(function (e) {
      if (e.code) throw e;
      return { content: [{ type: 'text', text: 'Lỗi: ' + e.message }], isError: true };
    });
  } else if (m === 'prompts/list') work = getLib().then(function (d) { return { prompts: listPrompts(d) }; });
  else if (m === 'prompts/get') work = getLib().then(function (d) { return getPromptMsg(d, p.name, p.arguments); });
  else if (m === 'resources/list') work = Promise.resolve({ resources: [] });
  else if (m === 'resources/templates/list') work = Promise.resolve({ resourceTemplates: [] });
  else if (!isReq) return Promise.resolve(null);
  else work = Promise.reject(Object.assign(new Error('Method not found: ' + m), { code: -32601 }));
  if (!isReq) return work.then(function () { return null; }, function () { return null; });
  return work.then(function (result) { return { jsonrpc: '2.0', id: id, result: result }; }, function (e) {
    return { jsonrpc: '2.0', id: id, error: { code: e.code || -32603, message: e.message } };
  });
}

function send(o) { if (o) process.stdout.write(JSON.stringify(o) + '\n'); }

var buf = '', pending = 0, ended = false;
function quit() { process.stdout.write('', function () { process.exit(0); }); }
function track(pr) {
  pending++;
  pr.then(send).then(function () { if (--pending === 0 && ended) quit(); });
}
process.stdin.setEncoding('utf8');
process.stdin.on('data', function (chunk) {
  buf += chunk;
  var i;
  while ((i = buf.indexOf('\n')) >= 0) {
    var raw = buf.slice(0, i).trim();
    buf = buf.slice(i + 1);
    if (!raw) continue;
    var msg;
    try { msg = JSON.parse(raw); } catch (e) {
      send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
      continue;
    }
    if (Array.isArray(msg)) {
      track(Promise.all(msg.map(handle)).then(function (rs) { rs = rs.filter(Boolean); return rs.length ? rs : null; }));
    } else track(handle(msg));
  }
});
process.stdin.on('end', function () { ended = true; if (!pending) quit(); });
log('sẵn sàng' + (lib ? ' (' + lib.count + ' prompt có sẵn)' : ', đang tải dữ liệu…'));
