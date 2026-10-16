#!/usr/bin/env node
// Sinh prompts.json từ 30 prompt viết tay (curated.js) và các mẫu theo chủ đề (data.js).
// Chạy: node tools/build-prompts.js
var fs = require('fs');
var path = require('path');
var C = require('./curated');
var D = require('./data');

var R = C.R;
var AN = '\nNếu tài liệu còn thông tin thật (họ tên, số CCCD, số tài khoản, địa chỉ) mà mình chưa ẩn danh, hãy nhắc mình trước khi làm.';

function slug(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '');
}
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

var out = [];
var ids = {};
function add(p) {
  var id = p.id || slug(p.title);
  if (ids[id]) throw new Error('Trùng id: ' + id);
  ids[id] = true;
  out.push({ id: id, cat: p.cat, sub: p.sub || '', group: p.group || '', title: p.title, desc: p.desc, file: p.file, text: p.text });
}

// 1. Prompt viết tay
[C.FEATURED].concat(C.P).forEach(function (p) {
  add({ id: 'chon-' + slug(p.title), cat: p.cat, sub: 'Prompt chọn lọc', group: 'Chọn lọc', title: p.title, desc: p.desc, file: p.file, text: p.text });
});

// 2. Hợp đồng
var CT = [
  { k: 'soan', t: 'Soạn {N}', d: 'Bản nháp đầy đủ điều khoản, AI hỏi bạn đứng về bên nào trước khi viết.', f: 'Không cần file. Có bản mẫu cũ thì đính kèm.',
    x: function (c, s) { return 'Soạn bản nháp ' + c.n + ' theo pháp luật Việt Nam hiện hành, giữa "Bên A (' + c.a + ')" và "Bên B (' + c.b + ')". Thông tin cụ thể để dạng [.....].\nTrước khi soạn, hỏi mình lần lượt tối đa 5 câu: mình đứng về bên nào, giá trị và thời hạn dự kiến, thoả thuận đặc biệt, có cần song ngữ không.\nPhải có đủ điều khoản cơ bản, đặc biệt chú ý: ' + c.f + '. Nếu loại hợp đồng này bắt buộc công chứng, chứng thực hoặc đăng ký thì nói rõ.\nSau bản nháp, liệt kê 5 điểm hai bên hay tranh chấp nhất. Lưu vào ' + s + '.docx.' + R; } },
  { k: 'soat', t: 'Soát rủi ro {N}', d: 'Bảng điều khoản – rủi ro – mức độ – câu chữ đề xuất sửa.', f: 'Đính kèm: bản hợp đồng cần soát (nên ẩn danh).',
    x: function (c, s) { return 'Đọc ' + c.n + ' mình đính kèm. Mình là [GHI: ' + c.a + ' hay ' + c.b + '].\nLập bảng: Điều khoản | Nội dung chính | Rủi ro cho phía mình | Mức độ (Cao / Vừa / Thấp) | Đề xuất sửa (viết sẵn câu chữ thay thế).\nSoát kỹ: ' + c.f + '. Đánh dấu điều khoản mơ hồ, còn thiếu, hoặc có nguy cơ vô hiệu.\nCuối báo cáo nêu 3 điểm nên đàm phán lại trước tiên. Lưu vào soat-' + s + '.docx.' + AN + R; } },
  { k: 'checklist', t: 'Checklist trước khi ký {N}', d: 'Danh sách việc cần kiểm tra, in ra tick từng ô.', f: 'Không cần file. Có bản dự thảo thì đính kèm.',
    x: function (c, s) { return 'Lập checklist những việc cần kiểm tra trước khi ký ' + c.n + ', mình là [GHI: ' + c.a + ' / ' + c.b + '].\nGồm: giấy tờ cần xem của bên kia (tư cách pháp lý, quyền sở hữu, thẩm quyền ký); điều khoản bắt buộc phải có; các điểm: ' + c.f + '; thủ tục công chứng / đăng ký nếu bắt buộc; và các "dấu hiệu cảnh báo" nên dừng lại hỏi luật sư.\nXuất PDF 1–2 trang có ô tick, font tiếng Việt đầy đủ dấu, lưu vào checklist-' + s + '.pdf.' + R; } },
  { k: 'giai-thich', t: 'Giải thích {N} cho người không học luật', d: 'Dịch từng điều sang lời thường, đánh dấu ⚠️ chỗ nên hỏi lại.', f: 'Đính kèm: bản hợp đồng.',
    x: function (c) { return 'Mình (hoặc khách của mình) sắp ký ' + c.n + ' đính kèm nhưng không học luật.\nGiải thích từng điều bằng lời đơn giản: điều này nghĩa là gì, bên nào được lợi, nếu xảy ra chuyện thì sao (kèm ví dụ đời thường).\nĐánh dấu ⚠️ những điều nên hỏi lại trước khi ký, nhất là: ' + c.f + '. Không dùng thuật ngữ mà không giải thích.' + R; } },
  { k: 'dam-phan', t: 'Chuẩn bị đàm phán {N}', d: 'Điểm phải giữ, điểm nhượng bộ, câu chữ thay thế, rồi đóng vai bên kia cho bạn tập.', f: 'Đính kèm: bản dự thảo (nếu có).',
    x: function (c) { return 'Mình chuẩn bị đàm phán ' + c.n + '; mình là [GHI: ' + c.a + ' / ' + c.b + ']. Dựa trên bản dự thảo đính kèm (nếu có), lập kế hoạch đàm phán:\n1. Điểm phải giữ bằng được và lý do.\n2. Điểm có thể nhượng bộ, đổi lại yêu cầu gì.\n3. Phương án câu chữ thay thế từ cứng đến mềm cho: ' + c.f + '.\n4. Lập luận bên kia có thể đưa ra và cách đáp lại.\nSau đó đóng vai bên kia để mình tập đàm phán, mỗi lượt một câu, cuối buổi nhận xét mình.' + R; } },
  { k: 'vi-pham', t: 'Xử lý khi bên kia vi phạm {N}', d: 'Biện pháp có thể áp dụng, chứng cứ cần giữ và thư yêu cầu khắc phục.', f: 'Đính kèm: hợp đồng và ghi chú sự việc.',
    x: function (c, s) { return 'Bên kia đang vi phạm ' + c.n + ' (mình là [GHI: ' + c.a + ' / ' + c.b + ']). Mình đính kèm hợp đồng và ghi chú sự việc.\nHãy: (1) xác định điều khoản bị vi phạm và chứng cứ cần giữ ngay; (2) các biện pháp mình có thể áp dụng theo hợp đồng và theo luật (nhắc nhở, phạt vi phạm, bồi thường, tạm ngừng, đơn phương chấm dứt…) kèm điều kiện và rủi ro của từng biện pháp; (3) soạn thư yêu cầu khắc phục gửi bên kia, cứng rắn nhưng lịch sự, có thời hạn cụ thể.\nLưu vào xu-ly-vi-pham-' + s + '.docx.' + AN + R; } }
];
D.CONTRACTS.forEach(function (c) {
  var s = slug(c.n);
  CT.forEach(function (t) {
    add({ id: 'hd-' + s + '-' + t.k, cat: 'Hợp đồng & văn bản', sub: cap(c.n), group: c.g, title: t.t.replace('{N}', c.n), desc: t.d, file: t.f, text: t.x(c, s) });
  });
});

// 3. Thủ tục
var PT = [
  { k: 'checklist', t: 'Checklist hồ sơ: {N}', d: 'Giấy tờ, nơi nộp, lệ phí, thời hạn; PDF có ô tick để in.', f: 'Không cần file. Có hướng dẫn của cơ quan thì đính kèm.',
    x: function (p, s) { return 'Lập checklist hồ sơ thủ tục ' + p.n + ' theo quy định hiện hành: giấy tờ cần có (ghi rõ bản chính / bản sao / bản sao chứng thực), cơ quan tiếp nhận, nộp trực tiếp hay trực tuyến qua Cổng Dịch vụ công, lệ phí, thời hạn giải quyết, kết quả nhận được.\nNêu riêng các trường hợp hay gặp: ' + p.x + '.\nGhi tên văn bản căn cứ cho từng mục; chỗ nào có thể đã thay đổi gần đây thì ghi [CẦN XÁC NHẬN].\nXuất PDF 1–2 trang có ô tick, font tiếng Việt đầy đủ dấu, lưu vào checklist-' + s + '.pdf.' + R; } },
  { k: 'quy-trinh', t: 'Giải thích quy trình {N} từng bước', d: 'Làm ở đâu, mang gì, bao lâu, lỗi hay bị trả hồ sơ, kèm sơ đồ.', f: 'Không cần file.',
    x: function (p) { return 'Giải thích cho ' + p.who + ' quy trình ' + p.n + ' theo từng bước, bằng lời dễ hiểu: bước nào, làm ở đâu, mang gì, mất bao lâu, tốn bao nhiêu, và các sai sót hay khiến hồ sơ bị trả lại.\nVẽ sơ đồ các bước (mermaid hoặc bảng). Nêu riêng trường hợp: ' + p.x + '.\nCuối cùng là 5 câu hỏi thường gặp kèm trả lời ngắn.' + R; } },
  { k: 'to-khai', t: 'Soạn đơn / tờ khai cho {N}', d: 'Bản nháp theo mẫu hiện hành kèm hướng dẫn điền từng mục.', f: 'Đính kèm: thông tin cá nhân đã ẩn danh (nếu muốn điền sẵn).',
    x: function (p, s) { return 'Soạn bản nháp các đơn / tờ khai cần cho thủ tục ' + p.n + ', theo mẫu hiện hành nếu có (nêu tên mẫu và văn bản ban hành để mình tải bản chính thức đối chiếu).\nThông tin cá nhân để dạng [.....]. Kèm hướng dẫn điền từng mục và các lỗi điền sai hay gặp.\nLưu vào to-khai-' + s + '.docx.' + R; } },
  { k: 'tu-van', t: 'Câu hỏi tư vấn ban đầu: {N}', d: 'Câu cần hỏi khách để biết họ thuộc trường hợp nào và còn thiếu gì.', f: 'Không cần file.',
    x: function (p) { return 'Mình sắp tư vấn cho ' + p.who + ' về thủ tục ' + p.n + '.\nLập 12–15 câu hỏi cần hỏi để xác định họ thuộc trường hợp nào, đủ điều kiện chưa, còn thiếu giấy tờ gì; nhóm theo chủ đề; mỗi câu ghi vì sao cần hỏi. Chú ý các trường hợp: ' + p.x + '.\nThêm danh sách giấy tờ nên dặn khách mang theo trong buổi gặp.' + R; } },
  { k: 'bai-viet', t: 'Bài hướng dẫn cho người dân: {N}', d: 'Bài ~800 chữ đăng web / Facebook, có FAQ và căn cứ pháp lý.', f: 'Không cần file.',
    x: function (p, s) { return 'Viết bài hướng dẫn "' + cap(p.n) + ': cần giấy tờ gì, làm ở đâu, mất bao lâu?" cho người dân, khoảng 800 chữ.\nCó tiêu đề phụ, gạch đầu dòng, mục câu hỏi thường gặp, nêu trường hợp đặc biệt (' + p.x + '), và dòng "Thông tin mang tính tham khảo, cập nhật đến [GHI NGÀY]; vui lòng kiểm tra lại quy định hiện hành". Ghi căn cứ pháp lý ở cuối bài.\nLưu vào bai-viet-' + s + '.md.' + R; } }
];
D.PROCEDURES.forEach(function (p) {
  var s = slug(p.n);
  PT.forEach(function (t) {
    add({ id: 'tt-' + s + '-' + t.k, cat: 'Thủ tục hành chính', sub: cap(p.n), group: p.g, title: t.t.replace('{N}', p.n), desc: t.d, file: t.f, text: t.x(p, s) });
  });
});

// 4. Tranh chấp
var DT = [
  { k: 'gap-khach', t: 'Gặp khách lần đầu: {N}', d: '15 câu hỏi, tài liệu cần xin, điều cần nói rõ với khách.', f: 'Không cần file.',
    x: function (d, s) { return 'Mình sắp gặp khách lần đầu về vụ việc: ' + d.n + '.\nLập: (1) 15 câu hỏi cần hỏi, nhóm theo sự việc / giấy tờ – chứng cứ / mốc thời gian (lưu ý thời hiệu) / mong muốn của khách; (2) danh sách tài liệu nên xin khách; (3) 5 điều cần nói rõ với khách về phạm vi tư vấn, chi phí, bảo mật.\nLưu vào gap-khach-' + s + '.docx.' + R; } },
  { k: 'chung-cu', t: 'Lập bảng chứng cứ: {N}', d: 'Cần chứng minh gì, bằng gì, thu thập hợp pháp ra sao.', f: 'Đính kèm: ghi chú vụ việc (nếu có).',
    x: function (d, s) { return 'Vụ việc: ' + d.n + '. Dựa trên ghi chú đính kèm (nếu có), lập bảng chứng cứ: Sự kiện cần chứng minh | Chứng cứ có thể dùng | Đang có hay cần thu thập | Cách thu thập hợp pháp | Rủi ro (chứng cứ yếu, dễ bị bác).\nNêu lưu ý khi dùng ghi âm, tin nhắn, ảnh chụp màn hình, vi bằng. Lưu vào chung-cu-' + s + '.docx.' + AN + R; } },
  { k: 'phuong-an', t: 'Memo đánh giá phương án: {N}', d: 'So sánh thương lượng, hoà giải, khởi kiện: thời gian, chi phí, rủi ro.', f: 'Đính kèm: ghi chú vụ việc.',
    x: function (d, s) { return 'Dựa trên ghi chú vụ việc đính kèm (' + d.n + '), soạn memo đánh giá các phương án: thương lượng, hoà giải, ' + (d.tt === 'hành chính' ? 'khiếu nại, khởi kiện vụ án hành chính' : d.tt === 'thương mại' ? 'trọng tài thương mại (nếu có thoả thuận), khởi kiện ra toà' : d.tt === 'lao động' ? 'hoà giải viên lao động, khởi kiện ra toà' : 'khởi kiện ra toà') + '.\nMỗi phương án: điều kiện, thời gian ước tính, chi phí, khả năng thành công, rủi ro. Nêu rõ thời hiệu và cơ quan có thẩm quyền giải quyết.\nKết thúc bằng khuyến nghị và đánh dấu [CẦN KIỂM TRA] ở chỗ chưa chắc. Xuất PDF, lưu vào memo-' + s + '.pdf.' + R; } },
  { k: 'thu-yeu-cau', t: 'Thư yêu cầu gửi bên kia: {N}', d: 'Thư cứng rắn nhưng lịch sự, có căn cứ và thời hạn.', f: 'Đính kèm: ghi chú sự việc, hợp đồng (nếu có).',
    x: function (d, s) { return 'Soạn thư yêu cầu gửi bên kia trong vụ việc: ' + d.n + ', dựa trên tài liệu đính kèm.\nNội dung: tóm tắt sự việc, căn cứ (hợp đồng / quy định), yêu cầu cụ thể, thời hạn thực hiện, bước tiếp theo nếu không thực hiện. Giọng văn rõ ràng, cứng rắn nhưng không đe doạ.\nThông tin thiếu để [.....]. Lưu vào thu-yeu-cau-' + s + '.docx.' + R; } },
  { k: 'don-khoi-kien', t: 'Soạn đơn khởi kiện: {N}', d: 'Theo mẫu hiện hành, xác định toà có thẩm quyền và tài liệu kèm theo.', f: 'Đính kèm: ghi chú vụ việc và chứng cứ đang có.',
    x: function (d, s) { return 'Soạn bản nháp đơn khởi kiện cho vụ việc: ' + d.n + ', theo mẫu đơn khởi kiện hiện hành trong tố tụng ' + (d.tt === 'hành chính' ? 'hành chính' : 'dân sự') + ' (nêu tên mẫu và văn bản ban hành), dựa vào tài liệu đính kèm.\nXác định toà có thẩm quyền và giải thích vì sao; kiểm tra điều kiện khởi kiện (thời hiệu, thủ tục tiền tố tụng nếu có); liệt kê tài liệu, chứng cứ kèm theo; nêu yêu cầu khởi kiện cụ thể, tính toán số tiền nếu có.\nChỗ thiếu thông tin để [.....]. Lưu vào don-khoi-kien-' + s + '.docx.' + AN + R; } },
  { k: 'dong-thoi-gian', t: 'Dòng thời gian sự việc: {N}', d: 'Từ hồ sơ lộn xộn thành bảng mốc thời gian có nguồn, chỉ ra mâu thuẫn.', f: 'Dùng thư mục chứa toàn bộ tài liệu vụ việc.',
    x: function (d, s) { return 'Từ các tài liệu trong thư mục này (vụ việc: ' + d.n + '), lập dòng thời gian: Ngày | Sự kiện | Nguồn (tên file, trang) | Ý nghĩa pháp lý.\nĐánh dấu mâu thuẫn giữa các tài liệu và khoảng trống cần hỏi thêm khách. Lưu vào dong-thoi-gian-' + s + '.docx.' + AN + R; } },
  { k: 'luan-cu', t: 'Dàn ý bản luận cứ: {N}', d: 'Vấn đề cần chứng minh, lập luận, phản bác, rồi AI chất vấn bạn.', f: 'Đính kèm: hồ sơ vụ việc.',
    x: function (d) { return 'Lập dàn ý bản luận cứ bảo vệ quyền lợi cho [GHI: bên mình bảo vệ] trong vụ việc: ' + d.n + ', dựa trên hồ sơ đính kèm.\nGồm: tóm tắt yêu cầu; các vấn đề cần chứng minh; lập luận cho từng vấn đề kèm chứng cứ và căn cứ pháp luật; dự đoán lập luận bên kia và cách phản bác; đề nghị cụ thể với Hội đồng xét xử.\nSau đó hỏi mình 5 câu chất vấn khó như ở phiên toà thật, mỗi lần một câu, rồi nhận xét câu trả lời.' + R; } }
];
D.DISPUTES.forEach(function (d) {
  var s = slug(d.n);
  DT.forEach(function (t) {
    add({ id: 'tc-' + s + '-' + t.k, cat: 'Tranh chấp & tố tụng', sub: cap(d.n), group: d.g, title: t.t.replace('{N}', d.n), desc: t.d, file: t.f, text: t.x(d, s) });
  });
});

// 5. Hình sự
var CR = [
  { k: 'cau-thanh', t: 'Phân tích cấu thành tội {N}', d: 'Bảng 4 yếu tố cấu thành, khung hình phạt, tội dễ nhầm.', f: 'Không cần file.',
    x: function (c) { return 'Phân tích cấu thành tội ' + c.n + ' theo Bộ luật Hình sự hiện hành: khách thể, mặt khách quan, chủ thể, mặt chủ quan; các khung hình phạt và tình tiết định khung; phân biệt với các tội dễ nhầm.\nTrình bày dạng bảng, kèm 2 ví dụ ngắn (một trường hợp cấu thành tội, một trường hợp không).' + R; } },
  { k: 'bai-tap', t: 'Luyện bài tập tình huống tội {N}', d: 'AI ra 3 đề tăng dần, chờ bạn làm rồi mới chấm.', f: 'Không cần file.',
    x: function (c) { return 'Ra cho mình 3 bài tập tình huống về tội ' + c.n + ', độ khó tăng dần, mỗi bài 2–3 câu hỏi (định tội danh, khung hình phạt, tình tiết).\nĐưa từng bài một, chờ mình làm xong mới chấm, giải thích và chỉ ra chỗ mình xác định sai.' + R; } },
  { k: 'gia-dinh', t: 'Tư vấn gia đình người bị buộc tội {N}', d: 'Câu cần hỏi, giấy tờ đăng ký bào chữa, các giai đoạn tố tụng.', f: 'Không cần file.',
    x: function (c) { return 'Mình sắp gặp gia đình của người bị tạm giữ / bị can trong vụ việc liên quan đến tội ' + c.n + '.\nLập: (1) câu hỏi cần hỏi để nắm sự việc; (2) giấy tờ cần chuẩn bị để đăng ký bào chữa; (3) giải thích ngắn cho gia đình các giai đoạn tố tụng tiếp theo và quyền của người bị buộc tội; (4) những việc gia đình KHÔNG nên làm.\nGiọng văn trấn an, dễ hiểu.' + R; } },
  { k: 'tinh-tiet', t: 'Rà tình tiết giảm nhẹ – tăng nặng: tội {N}', d: 'Bảng tình tiết, căn cứ, chứng cứ trong hồ sơ, cần bổ sung gì.', f: 'Đính kèm: hồ sơ hoặc ghi chú vụ án.',
    x: function (c) { return 'Trong vụ án về tội ' + c.n + ', dựa trên hồ sơ / ghi chú đính kèm, rà soát tình tiết giảm nhẹ, tình tiết tăng nặng và căn cứ có thể đề nghị chuyển khung nhẹ hơn, hưởng án treo hoặc miễn trách nhiệm hình sự.\nBảng: Tình tiết | Căn cứ pháp luật | Chứng cứ trong hồ sơ (bút lục / trang) | Cần bổ sung gì.' + AN + R; } },
  { k: 'bao-chua', t: 'Dàn ý bài bào chữa: tội {N}', d: 'Chứng cứ, thủ tục, tội danh, giảm nhẹ; rồi AI đóng vai Kiểm sát viên.', f: 'Đính kèm: hồ sơ vụ án.',
    x: function (c) { return 'Lập dàn ý bài bào chữa cho bị cáo trong vụ án về tội ' + c.n + ', dựa trên hồ sơ đính kèm: vấn đề về chứng cứ và thủ tục tố tụng, vấn đề định tội danh, tình tiết giảm nhẹ, đề nghị cụ thể.\nMỗi luận điểm ghi kèm chứng cứ (bút lục / trang). Sau đó đóng vai Kiểm sát viên đối đáp để mình luyện, mỗi lượt một ý.' + AN + R; } }
];
D.CRIMES.forEach(function (c) {
  var s = slug(c.n);
  CR.forEach(function (t) {
    add({ id: 'hs-' + s + '-' + t.k, cat: 'Hình sự', sub: 'Tội ' + c.n, group: c.g, title: t.t.replace('{N}', c.n), desc: t.d, file: t.f, text: t.x(c) });
  });
});

// 6. Học luật
var ST = [
  { k: 'de-cuong', t: 'Đề cương ôn thi {N}', d: 'Chia chương, khái niệm, khung "Cần nhớ", câu tự kiểm tra.', f: 'Đính kèm: giáo trình, slide hoặc ghi chú.',
    x: function (n, s) { return 'Dựa trên tài liệu môn ' + n + ' mình đính kèm, lập đề cương ôn thi dạng Word: có mục lục; chia theo chương; mỗi chương gồm khái niệm chính, điều kiện / yếu tố cấu thành, ví dụ ngắn, khung "Cần nhớ" và 3 câu hỏi tự kiểm tra; dùng bảng khi so sánh.\nChỗ tài liệu của mình thiếu thì ghi [THIẾU TÀI LIỆU] thay vì tự bịa. Lưu vào de-cuong-' + s + '.docx.' + R; } },
  { k: 'trac-nghiem', t: '20 câu trắc nghiệm {N}', d: 'Độ khó tăng dần, có đáp án và giải thích.', f: 'Đính kèm: tài liệu muốn ôn (nên có).',
    x: function (n, s) { return 'Tạo 20 câu trắc nghiệm A/B/C/D môn ' + n + ' (dựa trên tài liệu đính kèm nếu có), độ khó tăng dần: 7 dễ, 8 vừa, 5 khó.\nMỗi câu có đáp án, giải thích vì sao đúng và vì sao các đáp án khác sai, kèm căn cứ. Xáo trộn vị trí đáp án đúng.\nLưu vào trac-nghiem-' + s + '.docx, phần đáp án để cuối file.' + R; } },
  { k: 'nhan-dinh', t: '10 câu nhận định đúng / sai {N}', d: 'Kiểu đề thi trường luật; bạn trả lời trước, AI chấm sau.', f: 'Không cần file.',
    x: function (n) { return 'Ra 10 câu nhận định đúng / sai môn ' + n + ' theo kiểu đề thi trường luật, có vài câu "bẫy".\nĐưa cả 10 câu, chờ mình trả lời (Đúng / Sai + giải thích ngắn), xong mới chấm từng câu, nêu đáp án và căn cứ pháp luật cụ thể, chỉ ra lỗi lập luận của mình.' + R; } },
  { k: 'tinh-huong', t: 'Tự luyện bài tập tình huống {N}', d: 'AI ra đề, bạn làm, AI chấm theo IRAC.', f: 'Không cần file.',
    x: function (n) { return 'Ra cho mình 1 bài tập tình huống môn ' + n + ' giống đề thi cuối kỳ, gồm 3 câu hỏi. Chủ đề: [GHI CHỦ ĐỀ, hoặc để bạn chọn].\nChờ mình làm xong rồi chấm theo bố cục Vấn đề – Quy định – Áp dụng – Kết luận (IRAC), cho điểm thang 10, chỉ ra ý thiếu. Chỉ đưa đáp án mẫu khi mình yêu cầu.' + R; } },
  { k: 'flashcard', t: 'Flashcard thuật ngữ {N}', d: '30 thuật ngữ dạng CSV, nhập vào Anki / Quizlet được.', f: 'Đính kèm: giáo trình hoặc ghi chú (nên có).',
    x: function (n, s) { return 'Từ tài liệu đính kèm (nếu có), tạo 30 flashcard thuật ngữ quan trọng môn ' + n + '.\nFile CSV, phân cách bằng dấu chấm phẩy, 3 cột: Thuật ngữ;Định nghĩa ngắn (dưới 40 chữ);Căn cứ / ví dụ. Mã hoá UTF-8 để giữ dấu tiếng Việt.\nLưu vào flashcard-' + s + '.csv và cho mình xem 5 thẻ đầu.' + R; } },
  { k: 'so-do', t: 'Sơ đồ tư duy {N}', d: 'Mindmap toàn môn hoặc một chương, xuất ảnh / HTML.', f: 'Đính kèm: tài liệu (nên có).',
    x: function (n, s) { return 'Vẽ sơ đồ tư duy cho [GHI: toàn môn / chương nào] môn ' + n + ', dựa trên tài liệu đính kèm nếu có.\nDùng cú pháp mermaid mindmap, tối đa 4 cấp, mỗi nhánh ngắn gọn. Sau đó xuất thành file so-do-' + s + '.html mở được bằng trình duyệt, mở thử và chụp màn hình cho mình xem.' + R; } },
  { k: 'so-sanh', t: 'So sánh khái niệm dễ nhầm {N}', d: 'Bảng so sánh các cặp khái niệm hay bị nhầm khi thi.', f: 'Không cần file.',
    x: function (n) { return 'Liệt kê 8 cặp (hoặc nhóm) khái niệm hay bị nhầm trong môn ' + n + '. Với mỗi cặp, lập bảng so sánh: tiêu chí | khái niệm 1 | khái niệm 2 | căn cứ, kèm 1 ví dụ phân biệt và 1 câu hỏi nhanh để mình tự kiểm tra.' + R; } },
  { k: 'van-dap', t: 'Luyện thi vấn đáp {N}', d: 'AI đóng vai giảng viên hỏi xoáy, nhận xét từng câu.', f: 'Không cần file.',
    x: function (n) { return 'Đóng vai giảng viên hỏi thi vấn đáp môn ' + n + '. Hỏi mình 8 câu, mỗi lần một câu, từ cơ bản đến hỏi xoáy, có câu hỏi nối tiếp dựa trên câu trả lời của mình.\nSau mỗi câu: nhận xét ngắn, nêu ý còn thiếu. Kết thúc cho điểm thang 10 và chỉ ra phần cần ôn lại.' + R; } },
  { k: 'giai-thich', t: 'Giải thích phần khó môn {N}', d: 'Giảng như cho người mới, có ví dụ đời thường, rồi kiểm tra bạn hiểu chưa.', f: 'Đính kèm: phần giáo trình chưa hiểu (nếu có).',
    x: function (n) { return 'Mình chưa hiểu phần [GHI CHƯƠNG / CHỦ ĐỀ] của môn ' + n + '. Hãy giảng lại như cho người mới: bắt đầu từ ý tưởng cốt lõi, rồi đến quy định cụ thể, mỗi ý một ví dụ đời thường.\nCuối cùng hỏi mình 3 câu để kiểm tra đã hiểu chưa, chờ mình trả lời rồi mới nhận xét.' + R; } }
];
D.SUBJECTS.forEach(function (n) {
  var s = slug(n);
  ST.forEach(function (t) {
    add({ id: 'hl-' + s + '-' + t.k, cat: 'Học luật', sub: n, group: 'Môn học', title: t.t.replace('{N}', n), desc: t.d, file: t.f, text: t.x(n, s) });
  });
});

// 7. Pháp chế doanh nghiệp
var IT = [
  { k: 'soan', t: 'Soạn {N}', d: 'Bản nháp theo quy định hiện hành, có chỗ trống cho đặc thù doanh nghiệp.', f: 'Đính kèm: thông tin doanh nghiệp, bản cũ (nếu có).',
    x: function (n, s) { return 'Soạn bản nháp ' + n + ' cho doanh nghiệp của mình theo quy định pháp luật Việt Nam hiện hành.\nTrước khi soạn, hỏi mình lần lượt: ngành nghề, quy mô nhân sự, loại hình doanh nghiệp, có hoạt động với nước ngoài không, có bản cũ không.\nThông tin đặc thù để [.....]. Đánh dấu điều nào bắt buộc theo luật, điều nào tuỳ chọn. Nếu văn bản này phải đăng ký / thông báo / lấy ý kiến với cơ quan hay tổ chức nào thì nói rõ. Lưu vào ' + s + '.docx.' + R; } },
  { k: 'soat', t: 'Soát tuân thủ {N}', d: 'Đối chiếu bản hiện tại với luật mới, bảng điểm cần sửa.', f: 'Đính kèm: văn bản hiện hành của doanh nghiệp.',
    x: function (n, s) { return 'Soát ' + n + ' của doanh nghiệp mình (đính kèm) so với quy định hiện hành.\nBảng: Điều / mục | Nội dung hiện tại | Vấn đề (trái luật / lỗi thời / thiếu / rủi ro tranh chấp) | Căn cứ | Đề xuất câu chữ mới.\nƯu tiên vấn đề có thể bị xử phạt. Lưu vào soat-' + s + '.docx.' + AN + R; } },
  { k: 'pho-bien', t: 'Phổ biến {N} cho nhân viên / ban giám đốc', d: 'Bản tóm tắt 1 trang, slide ngắn và câu hỏi thường gặp.', f: 'Đính kèm: văn bản cần phổ biến.',
    x: function (n, s) { return 'Từ ' + n + ' đính kèm, soạn: (1) bản tóm tắt 1 trang cho nhân viên, lời lẽ dễ hiểu; (2) 8–10 slide trình bày trong buổi phổ biến (tiêu đề + 3–4 gạch đầu dòng mỗi slide); (3) 10 câu hỏi thường gặp kèm trả lời.\nLưu vào pho-bien-' + s + '.docx.' + R; } },
  { k: 'cap-nhat', t: 'Theo dõi thay đổi pháp luật về {N}', d: 'Danh sách văn bản liên quan, việc cần làm khi luật đổi.', f: 'Không cần file.',
    x: function (n, s) { return 'Lập bảng theo dõi pháp luật liên quan đến ' + n + ' của doanh nghiệp: Văn bản | Số hiệu | Nội dung liên quan | Tình trạng hiệu lực | Việc doanh nghiệp phải làm.\nĐánh dấu [CẦN XÁC NHẬN] ở mọi văn bản bạn không chắc còn hiệu lực, và nhắc mình kiểm tra lại trên vbpl.vn. Thêm checklist việc cần làm mỗi khi có văn bản mới. Lưu vào theo-doi-' + s + '.xlsx.' + R; } }
];
D.INHOUSE.forEach(function (i) {
  var s = slug(i.n);
  IT.forEach(function (t) {
    add({ id: 'pc-' + s + '-' + t.k, cat: 'Pháp chế doanh nghiệp', sub: cap(i.n), group: i.g, title: t.t.replace('{N}', i.n), desc: t.d, file: t.f, text: t.x(i.n, s) });
  });
});

// 8. Truyền thông pháp lý và Google Flow
var TT = [
  { k: 'bai-viet', cat: 'Truyền thông pháp lý', t: 'Bài viết phổ biến: {N}', d: 'Bài ~700 chữ cho website / blog văn phòng.', f: 'Không cần file.',
    x: function (q, s) { return 'Viết bài phổ biến pháp luật cho người dân với tiêu đề "' + q + '", khoảng 700 chữ: mở bài bằng một tình huống đời thường, trả lời thẳng câu hỏi, giải thích các trường hợp ngoại lệ, mục "Bạn nên làm gì", căn cứ pháp lý ở cuối.\nGiọng văn thân thiện, không dùng thuật ngữ khó. Cuối bài ghi "Thông tin mang tính tham khảo, không thay thế tư vấn pháp lý". Lưu vào ' + s + '.md.' + R; } },
  { k: 'post', cat: 'Truyền thông pháp lý', t: 'Bài đăng mạng xã hội: {N}', d: '3 phiên bản ngắn cho Facebook / Zalo / LinkedIn.', f: 'Không cần file.',
    x: function (q) { return 'Viết 3 phiên bản bài đăng mạng xã hội trả lời câu hỏi "' + q + '": (1) Facebook ~150 chữ, có emoji vừa phải; (2) Zalo OA ~100 chữ; (3) LinkedIn ~200 chữ, chuyên nghiệp.\nMỗi bản có câu mở thu hút, 3 ý chính, lời kêu gọi liên hệ / để lại câu hỏi, và dòng "chỉ mang tính tham khảo". Không hứa hẹn kết quả.' + R; } },
  { k: 'faq', cat: 'Truyền thông pháp lý', t: 'Bộ câu hỏi thường gặp: {N}', d: '10 câu hỏi – trả lời ngắn để đặt lên trang web.', f: 'Không cần file.',
    x: function (q, s) { return 'Xoay quanh chủ đề "' + q + '", soạn 10 câu hỏi người dân hay hỏi nhất kèm câu trả lời ngắn (dưới 80 chữ mỗi câu), mỗi câu ghi tên văn bản căn cứ.\nXuất 2 dạng: file faq-' + s + '.md, và đoạn HTML dùng thẻ <details> để dán vào trang web.' + R; } },
  { k: 'slide', cat: 'Truyền thông pháp lý', t: 'Slide thuyết trình: {N}', d: '10 slide cho buổi nói chuyện pháp luật cộng đồng.', f: 'Không cần file.',
    x: function (q, s) { return 'Soạn bài thuyết trình 10 slide cho buổi phổ biến pháp luật ở cộng đồng / trường học, chủ đề "' + q + '".\nMỗi slide: tiêu đề, 3–4 ý ngắn, ghi chú lời nói cho người trình bày, gợi ý hình minh hoạ. Có 1 slide tình huống để hỏi khán giả và 1 slide tóm tắt.\nTạo file ' + s + '.pptx nếu được, không thì ' + s + '.md.' + R; } },
  { k: 'video', cat: 'Google Flow', t: 'Kịch bản video Flow: {N}', d: '5 cảnh × 8 giây, lời thoại tiếng Việt + prompt tiếng Anh cho Flow.', f: 'Không cần file.',
    x: function (q, s) { return 'Mình cần video 40 giây giải thích cho người dân: "' + q + '".\nChia thành 5 cảnh, mỗi cảnh khoảng 8 giây. Mỗi cảnh viết: lời thoại tiếng Việt (1–2 câu dễ hiểu) và 1 prompt tiếng Anh cho Google Flow theo công thức chủ thể + hành động + bối cảnh + góc máy + ánh sáng / phong cách.\nGiữ phong cách hoạt hình 2D nhất quán giữa các cảnh, không mô phỏng người thật. Ghi kèm văn bản pháp luật làm căn cứ để mình đối chiếu. Lưu vào kich-ban-' + s + '.md.\nLưu ý: nội dung pháp lý phải được người có chuyên môn kiểm tra trước khi đăng.'; } },
  { k: 'anh', cat: 'Google Flow', t: 'Prompt ảnh infographic Flow: {N}', d: '5 prompt ảnh minh hoạ cùng phong cách, không chữ trong ảnh.', f: 'Không cần file.',
    x: function (q, s) { return 'Mình làm infographic / bài đăng về "' + q + '". Chia nội dung thành 5 ý chính, mỗi ý viết 1 prompt tiếng Anh để tạo hình minh hoạ bằng Google Flow.\nPhong cách thống nhất: phẳng, tối giản, bảng màu xanh đậm – trắng – vàng, không có chữ trong ảnh, nền đơn giản. Mỗi prompt kèm 1 dòng tiếng Việt: hình cho ý nào và câu chữ sẽ đặt lên hình. Lưu vào prompt-anh-' + s + '.md.'; } }
];
D.TOPICS.forEach(function (q) {
  var s = slug(q);
  TT.forEach(function (t) {
    add({ id: 'ph-' + s + '-' + t.k, cat: t.cat, sub: q, group: 'Phổ biến pháp luật', title: t.t.replace('{N}', q), desc: t.d, file: t.f, text: t.x(q, s) });
  });
});

// 9. Dịch thuật
var TR = [
  { k: 'anh-viet', t: 'Dịch {N} Anh → Việt', d: 'Bản dịch song ngữ đặt cạnh nhau, giữ thuật ngữ pháp lý chuẩn.', f: 'Đính kèm: văn bản tiếng Anh.',
    x: function (n, s) { return 'Dịch ' + n + ' mình đính kèm từ tiếng Anh sang tiếng Việt, văn phong pháp lý Việt Nam.\nTrình bày bảng song ngữ 2 cột theo từng đoạn. Giữ nguyên số điều, định nghĩa, tên riêng. Thuật ngữ không có từ tương đương thì giữ tiếng Anh trong ngoặc. Chỗ câu gốc mơ hồ, có thể hiểu hai cách thì đánh dấu [MƠ HỒ] và giải thích.\nLưu vào ' + s + '-vi.docx, cuối file có bảng thuật ngữ đã dùng.' + R; } },
  { k: 'viet-anh', t: 'Dịch {N} Việt → Anh', d: 'Bản dịch tiếng Anh pháp lý, kèm bảng thuật ngữ.', f: 'Đính kèm: văn bản tiếng Việt.',
    x: function (n, s) { return 'Dịch ' + n + ' mình đính kèm từ tiếng Việt sang tiếng Anh pháp lý (legal English), dùng thuật ngữ nhất quán.\nTên cơ quan, văn bản pháp luật Việt Nam dịch theo cách dịch phổ biến và giữ tên tiếng Việt trong ngoặc ở lần đầu. Không thêm, bớt nội dung. Đánh dấu [CẦN XÁC NHẬN] ở chỗ bạn không chắc.\nLưu vào ' + s + '-en.docx kèm bảng thuật ngữ Việt – Anh ở cuối.' + R; } },
  { k: 'soat-ban-dich', t: 'Soát bản dịch {N}', d: 'Đối chiếu bản gốc và bản dịch, chỉ ra chỗ dịch sai nghĩa.', f: 'Đính kèm: bản gốc và bản dịch.',
    x: function (n, s) { return 'Mình đính kèm bản gốc và bản dịch của ' + n + '. Đối chiếu từng đoạn, lập bảng: Vị trí | Bản gốc | Bản dịch | Vấn đề (sai nghĩa / thiếu / thừa / thuật ngữ không nhất quán) | Đề xuất sửa.\nƯu tiên lỗi làm thay đổi quyền và nghĩa vụ của các bên. Lưu vào soat-dich-' + s + '.docx.' + R; } }
];
D.TRANSLATE.forEach(function (n) {
  var s = slug(n);
  TR.forEach(function (t) {
    add({ id: 'dt-' + s + '-' + t.k, cat: 'Dịch thuật pháp lý', sub: cap(n), group: 'Dịch thuật', title: t.t.replace('{N}', n), desc: t.d, file: t.f, text: t.x(n, s) });
  });
});

// 10. Việc văn phòng hằng ngày (viết tay)
[
  ['Ẩn danh tài liệu trước khi đưa cho AI', 'Thay tên, số CCCD, số tài khoản bằng mã, giữ bảng đối chiếu riêng.', 'Đính kèm: tài liệu cần ẩn danh.',
    'Ẩn danh tài liệu mình đính kèm: thay họ tên người bằng "Người A, Người B…", tên công ty bằng "Công ty X, Y…", thay số CCCD, số điện thoại, số tài khoản, địa chỉ, biển số xe bằng [ĐÃ ẨN].\nGiữ nguyên nội dung khác. Lưu bản ẩn danh vào file mới có đuôi -an-danh, và bảng đối chiếu (tên thật → mã) vào file riêng doi-chieu-an-danh.txt để mình tự giữ, KHÔNG đưa bảng này vào bất kỳ kết quả nào khác.\nCuối cùng liệt kê những chỗ bạn không chắc có phải thông tin định danh hay không.'],
  ['Kiểm tra trích dẫn pháp luật trong văn bản', 'Liệt kê mọi điều luật được trích, đánh dấu chỗ đáng ngờ để tra lại.', 'Đính kèm: văn bản có trích dẫn luật.',
    'Đọc văn bản mình đính kèm, liệt kê MỌI trích dẫn pháp luật (tên văn bản, số hiệu, điều, khoản) thành bảng: Vị trí | Trích dẫn | Nội dung văn bản nói điều đó quy định gì | Mức độ đáng ngờ (số hiệu sai định dạng, văn bản có thể đã hết hiệu lực, nội dung không khớp).\nKHÔNG tự sửa. Với mỗi dòng ghi đường tra cứu gợi ý trên vbpl.vn để mình tự kiểm tra.' + R],
  ['Viết lại prompt của bạn cho rõ hơn', 'Dán yêu cầu thô, AI hỏi lại rồi viết thành prompt đầy đủ.', 'Cần: dán yêu cầu của bạn vào chỗ trống.',
    'Mình muốn nhờ AI làm việc sau nhưng chưa biết viết yêu cầu cho rõ:\n\n[DÁN YÊU CẦU THÔ CỦA BẠN VÀO ĐÂY]\n\nHãy hỏi mình lần lượt từng câu (tối đa 5 câu) để làm rõ: mình là ai, tài liệu nào, kết quả mong muốn (định dạng, độ dài, tên file), điều không được làm. Sau đó viết lại thành một prompt hoàn chỉnh theo công thức đó để mình copy dùng lại.'],
  ['Chuyển ảnh chụp / file scan thành Word', 'Nhận dạng chữ, giữ bố cục, đánh dấu chỗ đọc không rõ.', 'Đính kèm: ảnh chụp hoặc PDF scan.',
    'Chuyển ảnh chụp / file scan mình đính kèm thành file Word có thể chỉnh sửa, giữ bố cục (tiêu đề, đánh số điều, bảng).\nChỗ nào chữ mờ, đọc không chắc (nhất là số tiền, ngày tháng, tên riêng, số hiệu) thì đánh dấu [KHÔNG RÕ: cách bạn đoán] và tô vàng. Cuối file liệt kê toàn bộ chỗ không rõ để mình tự đối chiếu với bản gốc. Lưu vào ban-danh-may.docx.'],
  ['Trả lời email khách hàng', 'Bản nháp email lịch sự, đúng trọng tâm, không hứa quá mức.', 'Đính kèm hoặc dán: email của khách.',
    'Dưới đây là email của khách hàng: [DÁN EMAIL]. Ý mình muốn trả lời: [GHI Ý CHÍNH].\nSoạn email trả lời bằng tiếng Việt, lịch sự, ngắn gọn, đúng trọng tâm; không hứa kết quả vụ việc; nếu cần thêm thông tin thì liệt kê rõ cần gì và hạn gửi. Đưa 2 phiên bản: trang trọng và thân thiện hơn.'],
  ['Tóm tắt chuỗi email / tin nhắn dài', 'Ai nói gì, đã chốt gì, còn việc gì chưa xong.', 'Đính kèm: file xuất email / tin nhắn.',
    'Tóm tắt chuỗi email / tin nhắn mình đính kèm: (1) diễn biến chính theo thời gian, (2) những điều các bên đã thống nhất, (3) những điểm còn tranh cãi, (4) bảng việc cần làm tiếp (việc – ai – hạn). Ghi kèm ngày của tin nhắn làm nguồn cho từng ý.' + AN],
  ['So sánh nhiều hợp đồng cùng loại', 'Bảng đối chiếu điều khoản giữa 3–10 hợp đồng trong thư mục.', 'Dùng thư mục chứa các hợp đồng cần so sánh.',
    'Thư mục này có nhiều hợp đồng cùng loại. Lập bảng đối chiếu: mỗi hàng là một điều khoản (giá, thanh toán, thời hạn, phạt vi phạm, bồi thường, chấm dứt, tranh chấp, luật áp dụng), mỗi cột là một hợp đồng.\nTô màu ô khác biệt so với đa số. Cuối bảng nêu hợp đồng nào có lợi / bất lợi nhất cho phía [GHI BÊN] và vì sao. Lưu vào doi-chieu-hop-dong.xlsx.' + R],
  ['Soát chính tả và thể thức văn bản hành chính', 'Lỗi chính tả, viết hoa, thể thức, số trang, ký hiệu văn bản.', 'Đính kèm: văn bản cần soát.',
    'Soát văn bản mình đính kèm theo quy định về thể thức và kỹ thuật trình bày văn bản hành chính hiện hành: quốc hiệu, tiêu ngữ, số và ký hiệu, địa danh ngày tháng, trích yếu, viết hoa, phông chữ, cỡ chữ, lề trang, nơi nhận, chữ ký.\nLập bảng lỗi: Vị trí | Lỗi | Sửa thành. Không tự sửa file gốc; tạo thêm bản đã sửa có đuôi -da-sua.' + R],
  ['Tạo bộ mẫu văn bản dùng lại', 'Biến văn bản đã làm thành mẫu có chỗ trống chuẩn hoá.', 'Đính kèm: 1–3 văn bản đã làm trước đây.',
    'Từ các văn bản mình đính kèm, tạo một mẫu dùng lại: thay mọi thông tin cụ thể bằng trường điền dạng {{TEN_BEN_A}}, {{NGAY_KY}}…; giữ nguyên phần câu chữ chuẩn; thêm ghi chú ở đầu file giải thích từng trường.\nLưu vào mau-van-ban.docx và danh sách trường vào cac-truong.csv. Sau đó hỏi mình có muốn tạo luôn một Skill để lần sau tự điền mẫu này không.'],
  ['Lập bảng theo dõi thời hạn vụ việc', 'Hạn nộp, hạn kháng cáo, thời hiệu; xuất Excel và lịch nhắc.', 'Dùng thư mục chứa hồ sơ các vụ việc.',
    'Đọc hồ sơ trong thư mục này, lập bảng theo dõi thời hạn: Vụ việc | Loại thời hạn (nộp hồ sơ, kháng cáo, thời hiệu, hạn hợp đồng…) | Ngày bắt đầu tính | Ngày hết hạn | Căn cứ | Còn bao nhiêu ngày.\nSắp xếp theo hạn gần nhất, tô đỏ hạn dưới 7 ngày. Lưu vào theo-doi-thoi-han.xlsx và tạo thêm file lich-nhac.ics để nhập vào lịch.' + R],
  ['Biến bản ghi âm / ghi chú buổi tư vấn thành biên bản', 'Nội dung khách trình bày, tư vấn đã đưa, việc tiếp theo.', 'Đính kèm: bản ghi chép hoặc file chép lời ghi âm.',
    'Từ bản ghi chép / chép lời ghi âm buổi tư vấn đính kèm, soạn biên bản: thông tin buổi gặp, sự việc khách trình bày, câu hỏi của khách, nội dung đã tư vấn, tài liệu khách cần bổ sung, việc tiếp theo (việc – ai – hạn).\nTách bạch rõ "khách nói" và "luật sư tư vấn". Lưu vào bien-ban-tu-van.docx.' + AN + R],
  ['Lập kế hoạch học / làm việc theo tuần với AI', 'Chia mục tiêu lớn thành việc nhỏ từng ngày.', 'Không cần file.',
    'Mục tiêu của mình trong [GHI SỐ TUẦN] tuần tới: [GHI MỤC TIÊU, ví dụ ôn thi Luật Dân sự và làm xong tiểu luận].\nHỏi mình lần lượt: mỗi ngày rảnh bao nhiêu giờ, ngày nào bận, hạn chót cụ thể. Sau đó lập kế hoạch từng ngày, mỗi ngày tối đa 3 việc, có buổi ôn lại và ngày dự phòng. Xuất bảng và lưu vào ke-hoach.xlsx.']
].forEach(function (a) {
  add({ id: 'vp-' + slug(a[0]), cat: 'Công việc', sub: 'Việc văn phòng hằng ngày', group: 'Văn phòng', title: a[0], desc: a[1], file: a[2], text: a[3] });
});

out.forEach(function (p, i) { p.n = i + 1; });
var ORDER = ['Hợp đồng & văn bản', 'Tranh chấp & tố tụng', 'Thủ tục hành chính', 'Hình sự', 'Học luật', 'Pháp chế doanh nghiệp',
  'Truyền thông pháp lý', 'Google Flow', 'Dịch thuật pháp lý', 'Công việc', 'PDF & tài liệu', 'Trang web', 'Skill'];
var cats = ORDER.map(function (name) { return { name: name, count: 0 }; });
out.forEach(function (p) {
  var c = cats.filter(function (x) { return x.name === p.cat; })[0];
  if (!c) throw new Error('Nhóm chưa có trong ORDER: ' + p.cat);
  c.count++;
});

var lib = {
  name: 'Thư viện prompt cho dân luật',
  url: 'https://ph56jk.github.io/antigravity-cho-dan-luat/',
  updated: new Date().toISOString().slice(0, 10),
  count: out.length,
  categories: cats,
  prompts: out
};
var file = path.join(__dirname, '..', 'prompts.json');
fs.writeFileSync(file, JSON.stringify(lib));
console.log('Đã ghi ' + out.length + ' prompt vào prompts.json (' + Math.round(fs.statSync(file).size / 1024) + ' KB)');
cats.forEach(function (c) { console.log('  ' + c.name + ': ' + c.count); });
