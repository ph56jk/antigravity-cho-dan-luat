// 30 prompt viết tay ban đầu (1 prompt nổi bật + 29 prompt).
var R = '\nQuy tắc: không sửa file gốc, ghi kết quả vào file mới. Khi trích dẫn pháp luật phải ghi rõ tên văn bản và số điều để mình tra lại; không chắc thì nói "không chắc", đừng đoán.';

var FEATURED = {
  cat: 'Trang web',
  title: 'Tạo trang web: AI hỏi bạn từng câu rồi mới làm',
  desc: 'Dùng khi bạn chưa biết bắt đầu từ đâu. AI đọc tài liệu bạn đính kèm, hỏi lần lượt từng câu (trắc nghiệm hoặc tự luận), bạn chỉ việc trả lời, xong nó dựng trang web.',
  file: 'Nên đính kèm tài liệu giới thiệu (file Word / PDF / ghi chú) của bạn hoặc văn phòng.',
  text:
'Bạn là người thiết kế web kiêm người phỏng vấn. Hãy giúp mình làm một trang web mà mình KHÔNG cần biết lập trình.\n\n' +
'CÁCH LÀM, đúng thứ tự:\n' +
'1. Đọc kỹ các file mình đính kèm hoặc có trong thư mục này (nếu có). Rút ra những gì đã rõ để khỏi hỏi lại.\n' +
'2. Hỏi mình LẦN LƯỢT TỪNG CÂU, mỗi lượt chỉ một câu, chờ mình trả lời rồi mới hỏi câu tiếp. Câu trắc nghiệm ghi rõ A, B, C, D và luôn có thêm lựa chọn "Khác (mình tự ghi)". Câu tự luận thì để mình tự gõ. Có thể hỏi thêm câu khác nếu tài liệu của mình còn thiếu hoặc mâu thuẫn.\n' +
'3. Các câu cần hỏi:\n' +
'   1) Trang này dùng để làm gì? A. Giới thiệu văn phòng / câu lạc bộ  B. Hướng dẫn thủ tục cho khách  C. Hỏi đáp pháp lý (FAQ)  D. CV / portfolio cá nhân  E. Khác\n' +
'   2) Ai sẽ xem trang này? A. Khách hàng / người dân  B. Sinh viên, bạn học  C. Đối tác, nhà tuyển dụng  D. Khác\n' +
'   3) Tên trang hoặc tên đơn vị là gì? (tự luận; nếu chưa có tên thật thì dùng tên giả)\n' +
'   4) Trang cần những mục nào? (chọn nhiều) A. Giới thiệu  B. Lĩnh vực hoạt động  C. Quy trình làm việc  D. Câu hỏi thường gặp  E. Tin tức / bài viết  F. Liên hệ\n' +
'   5) Giọng văn? A. Nghiêm túc, chuyên nghiệp  B. Thân thiện, dễ hiểu  C. Trẻ trung, năng động\n' +
'   6) Màu chủ đạo? A. Xanh đậm + trắng  B. Đen + vàng đồng  C. Xanh lá nhẹ  D. Để bạn tự chọn cho hợp\n' +
'   7) Có thông tin nào KHÔNG được đưa lên mạng? (tự luận; ví dụ tên khách hàng, số điện thoại thật, địa chỉ)\n' +
'   8) Mình có muốn đưa trang lên mạng sau khi làm xong không? A. Có  B. Chưa, chỉ xem trên máy\n' +
'4. Hỏi xong, tóm tắt lại toàn bộ lựa chọn của mình trong vài dòng và hỏi "Đúng chưa?". Mình xác nhận thì mới làm tiếp.\n' +
'5. Làm trang web tĩnh (HTML, CSS, JS thuần, không framework), tiếng Việt, đọc tốt trên điện thoại. Chỉ tạo file trong thư mục hiện tại. Dùng nội dung từ tài liệu của mình; chỗ nào thiếu thì để nội dung mẫu và ghi rõ là mẫu.\n' +
'6. Làm xong, mở thử, chụp màn hình cho mình xem, rồi hỏi mình muốn chỉnh gì.\n\n' +
'Bắt đầu bằng cách đọc tài liệu rồi hỏi câu số 1.'
};

var P = [
  // ---- Bài tập & học luật
  { cat: 'Học luật', title: 'Chấm bài tập tình huống', desc: 'Nhận xét từng ý, chỉ ra lỗi và lý do, không viết lại bài hộ.', file: 'Đính kèm: đề bài và bài làm của bạn.',
    text: 'Bạn là giảng viên luật nghiêm túc nhưng khích lệ. Mình đính kèm đề bài tình huống và bài làm của mình.\nHãy:\n1. Đánh giá theo bố cục: xác định vấn đề pháp lý, căn cứ pháp luật, áp dụng vào tình huống, kết luận.\n2. Chỉ ra ý còn thiếu hoặc lập luận chưa chặt, giải thích vì sao.\n3. Cho điểm thang 10 kèm lý do cho từng phần.\n4. KHÔNG viết lại bài hộ mình. Ghi nhận xét vào file mới nhan-xet.docx, cuối file gợi ý 3 dạng bài nên luyện thêm.' + R },
  { cat: 'Học luật', title: 'Giải bài tình huống theo từng bước (IRAC)', desc: 'AI dẫn dắt bạn tự làm, không đưa đáp án ngay.', file: 'Đính kèm: đề bài tình huống.',
    text: 'Mình đính kèm một đề bài tình huống luật. Hãy hướng dẫn mình tự giải theo 4 bước Vấn đề – Quy định – Áp dụng – Kết luận (IRAC).\nVới mỗi bước: đặt cho mình 1–2 câu hỏi gợi mở để mình tự trả lời trước, rồi mới nhận xét. Chỉ khi mình bảo "cho xem đáp án mẫu" thì mới đưa lời giải đầy đủ.' + R },
  { cat: 'Học luật', title: 'Lập đề cương ôn thi', desc: 'Chia chương, nêu ý chính, khung "Cần nhớ" và câu hỏi tự kiểm tra.', file: 'Đính kèm: giáo trình, slide hoặc ghi chú của bạn.',
    text: 'Dựa trên các tài liệu mình đính kèm, lập đề cương ôn thi dạng Word.\nYêu cầu: có mục lục; chia theo chương; mỗi chương gồm khái niệm chính, điều kiện / yếu tố cấu thành, ví dụ ngắn, khung "Cần nhớ" và 3 câu hỏi tự kiểm tra; dùng bảng khi so sánh khái niệm.\nChỗ nào tài liệu của mình thiếu thì ghi [THIẾU TÀI LIỆU] thay vì tự bịa.' + R },
  { cat: 'Học luật', title: 'Tạo 20 câu trắc nghiệm ôn tập', desc: 'Có đáp án và giải thích vì sao đúng / sai.', file: 'Đính kèm: tài liệu muốn ôn.',
    text: 'Từ tài liệu mình đính kèm, tạo 20 câu trắc nghiệm A/B/C/D để ôn tập, độ khó tăng dần (7 dễ, 8 vừa, 5 khó).\nMỗi câu có: đáp án đúng, giải thích ngắn vì sao đúng, vì sao các đáp án còn lại sai, và ghi rõ lấy từ phần nào của tài liệu.\nXáo trộn vị trí đáp án đúng. Lưu vào file trac-nghiem.docx, phần đáp án để ở cuối file.' + R },
  { cat: 'Học luật', title: 'Giải thích điều luật bằng ngôn ngữ đơn giản', desc: 'Biến điều luật khó đọc thành lời giải thích kèm ví dụ.', file: 'Đính kèm: văn bản hoặc đoạn điều luật.',
    text: 'Đọc đoạn văn bản pháp luật mình đính kèm. Với từng điều, giải thích bằng ngôn ngữ đơn giản như nói với người không học luật: điều này nói gì, áp dụng cho ai, khi nào, và cho 1 ví dụ đời thường.\nGiải nghĩa riêng các thuật ngữ khó. Giữ nguyên nội dung, không thêm quy định không có trong văn bản.' + R },
  { cat: 'Học luật', title: 'Đóng vai bên đối lập để luyện tranh luận', desc: 'AI phản biện lập luận của bạn như đối thủ trong phiên tranh tụng.', file: 'Đính kèm: lập luận hoặc tình huống của bạn.',
    text: 'Mình đang luyện tranh luận. Dựa trên tình huống và lập luận mình đính kèm, hãy đóng vai bên đối lập.\nHãy: (1) nêu 3 lập luận phản bác mạnh nhất, (2) chỉ ra điểm yếu trong lập luận của mình, (3) hỏi mình 3 câu chất vấn khó như thẩm phán / bên kia sẽ hỏi.\nSau đó chờ mình trả lời từng câu rồi nhận xét câu trả lời.' + R },
  { cat: 'Học luật', title: 'Soát tiểu luận', desc: 'Bố cục, mạch lập luận, trích dẫn, lỗi diễn đạt.', file: 'Đính kèm: bài tiểu luận.',
    text: 'Soát bài tiểu luận mình đính kèm. Nhận xét theo: bố cục và mạch lập luận; chỗ thiếu dẫn chứng hoặc căn cứ pháp luật; cách trích dẫn; lỗi chính tả, ngữ pháp, câu lủng củng.\nĐề xuất cách sửa cho từng chỗ nhưng KHÔNG viết lại cả bài; ý và giọng văn phải giữ là của mình. Ghi nhận xét vào file nhan-xet-tieu-luan.docx.' + R },

  // ---- Hợp đồng & văn bản
  { cat: 'Hợp đồng & văn bản', title: 'Soát hợp đồng, liệt kê rủi ro', desc: 'Bảng điều khoản – rủi ro – đề xuất sửa.', file: 'Đính kèm: hợp đồng (nên ẩn danh).',
    text: 'Đọc hợp đồng mình đính kèm. Lập bảng gồm các cột: Điều khoản | Nội dung chính | Rủi ro cho phía mình | Đề xuất sửa.\nChú ý đặc biệt: giá và thanh toán, phạt vi phạm, bồi thường thiệt hại, chấm dứt hợp đồng, bảo mật, giải quyết tranh chấp, luật áp dụng. Đánh dấu điều khoản mơ hồ hoặc còn thiếu.\nLưu kết quả vào file bao-cao-soat-hop-dong.docx.' + R },
  { cat: 'Hợp đồng & văn bản', title: 'Soạn hợp đồng thuê nhà mẫu', desc: 'Bản nháp đầy đủ điều khoản, dùng tên giả để mình thay sau.', file: 'Không cần file.',
    text: 'Soạn bản nháp hợp đồng thuê nhà ở theo pháp luật Việt Nam, dùng "Bên A (bên cho thuê)" và "Bên B (bên thuê)", các thông tin cụ thể để dạng [.....].\nCó đủ: đối tượng, giá thuê và phương thức thanh toán, đặt cọc, thời hạn, quyền và nghĩa vụ hai bên, sửa chữa, chấm dứt, phạt vi phạm, giải quyết tranh chấp.\nSau bản nháp, liệt kê 5 điểm hai bên hay tranh cãi nhất để mình cân nhắc. Lưu vào hop-dong-thue-nha.docx.' + R },
  { cat: 'Hợp đồng & văn bản', title: 'So sánh hai phiên bản hợp đồng', desc: 'Chỉ ra điểm khác nhau và phiên bản nào bất lợi hơn.', file: 'Đính kèm: 2 file (bản cũ, bản mới).',
    text: 'Mình đính kèm hai phiên bản của một hợp đồng (bản cũ và bản mới). Lập bảng so sánh: Điều khoản | Bản cũ | Bản mới | Ý nghĩa thay đổi | Có lợi hay bất lợi cho phía mình.\nCuối cùng tóm tắt 5 thay đổi quan trọng nhất cần chú ý khi ký. Lưu vào so-sanh-hop-dong.docx.' + R },
  { cat: 'Hợp đồng & văn bản', title: 'Soạn đơn / thư đề nghị', desc: 'Đơn khiếu nại, đơn đề nghị, thư yêu cầu thực hiện nghĩa vụ.', file: 'Đính kèm: ghi chú sự việc (nếu có).',
    text: 'Dựa trên ghi chú sự việc mình đính kèm, soạn bản nháp đơn đề nghị / thư yêu cầu gửi cơ quan hoặc đối tác. Dùng đúng thể thức văn bản hành chính Việt Nam: quốc hiệu, tiêu ngữ, kính gửi, nội dung theo trình tự thời gian, căn cứ, yêu cầu cụ thể, danh mục tài liệu kèm theo.\nGiọng văn lịch sự, rõ ràng. Thông tin thiếu để dạng [.....]. Lưu vào don-de-nghi.docx.' + R },
  { cat: 'Hợp đồng & văn bản', title: 'Tóm tắt bản án', desc: 'Các bên, yêu cầu, quan điểm toà, căn cứ, kết quả – kèm số trang.', file: 'Đính kèm: bản án (PDF).',
    text: 'Tóm tắt bản án mình đính kèm cho người chưa biết vụ việc: các bên; yêu cầu của nguyên đơn / bị cáo; tóm tắt sự việc; quan điểm và lập luận của toà; căn cứ pháp luật toà áp dụng; kết quả.\nMỗi ý kèm số trang để mình tra lại. Tối đa 1 trang A4. Cuối cùng nêu 3 điểm đáng học hỏi hoặc đáng tranh luận.' + R },
  { cat: 'Hợp đồng & văn bản', title: 'Bảng so sánh quy định cũ – mới', desc: 'Đối chiếu hai văn bản để thấy điểm thay đổi.', file: 'Đính kèm: văn bản cũ và văn bản mới.',
    text: 'Mình đính kèm văn bản pháp luật cũ và văn bản mới thay thế. Lập bảng: Nội dung | Quy định cũ (điều số) | Quy định mới (điều số) | Thay đổi cốt lõi | Ảnh hưởng thực tế.\nNhóm theo chủ đề. Đánh dấu nội dung chỉ có ở một bên. Lưu vào so-sanh-quy-dinh.docx.' + R },

  // ---- PDF & tài liệu
  { cat: 'PDF & tài liệu', title: 'Memo tư vấn 1 trang (PDF)', desc: 'Dành cho khách không có nền tảng pháp lý.', file: 'Đính kèm: ghi chú vụ việc.',
    text: 'Soạn memo tư vấn 1 trang PDF khổ A4 dựa trên ghi chú mình đính kèm, gửi cho khách hàng không có nền tảng pháp lý.\nCấu trúc: Tóm tắt vấn đề → Các phương án → Rủi ro của từng phương án → Khuyến nghị. Văn phong dễ hiểu, hạn chế thuật ngữ. Chỗ cần luật sư xác nhận ghi [CẦN KIỂM TRA].\nDùng font hỗ trợ tiếng Việt đầy đủ dấu. Lưu thành memo.pdf, rồi mở kiểm tra dấu tiếng Việt và bố cục.' + R },
  { cat: 'PDF & tài liệu', title: 'Biến ghi chú thành tài liệu PDF đẹp', desc: 'Có mục lục, tiêu đề, bảng, đánh số trang.', file: 'Đính kèm: ghi chú hoặc file Word.',
    text: 'Chuyển nội dung file mình đính kèm thành tài liệu PDF khổ A4, trình bày chuyên nghiệp: trang bìa, mục lục, tiêu đề phân cấp, đánh số trang, bảng có viền rõ, lề 2,5 cm, cỡ chữ 12.\nDùng font hỗ trợ tiếng Việt đầy đủ dấu (ví dụ Noto Sans). Không đổi nội dung. Lưu thành tai-lieu.pdf, mở kiểm tra từng trang xem có tràn lề hoặc mất dấu không.' },
  { cat: 'PDF & tài liệu', title: 'Checklist hồ sơ thủ tục (PDF)', desc: 'Danh sách giấy tờ cần chuẩn bị, có ô tick để in ra.', file: 'Đính kèm: hướng dẫn thủ tục (nếu có).',
    text: 'Từ tài liệu hướng dẫn thủ tục mình đính kèm, lập checklist hồ sơ dạng PDF 1–2 trang để in ra: nhóm theo giai đoạn, mỗi mục có ô tick, ghi rõ giấy tờ nào là bản gốc / bản sao / bản công chứng, nơi nộp, thời hạn.\nCuối trang có mục "Lưu ý hay bị bỏ sót". Chỗ nào tài liệu không nói rõ thì ghi [CẦN XÁC NHẬN].' + R },
  { cat: 'PDF & tài liệu', title: 'Biên bản buổi họp / buổi gặp khách', desc: 'Từ ghi chú lộn xộn thành biên bản gọn gàng.', file: 'Đính kèm: ghi chú thô của buổi họp.',
    text: 'Chuyển ghi chú thô mình đính kèm thành biên bản họp dạng PDF: thời gian, thành phần tham dự, nội dung đã thảo luận theo từng chủ đề, quyết định đã thống nhất, và bảng công việc tiếp theo (việc gì – ai làm – hạn chót).\nChỗ ghi chú không rõ thì hỏi mình hoặc ghi [CẦN XÁC NHẬN]. Dùng font tiếng Việt đầy đủ dấu. Lưu thành bien-ban.pdf.' },
  { cat: 'PDF & tài liệu', title: 'Sắp xếp thư mục hồ sơ', desc: 'Đặt lại tên file thống nhất và lập mục lục hồ sơ.', file: 'Dùng thư mục project có nhiều file lộn xộn.',
    text: 'Xem các file trong thư mục này. Đề xuất cách đặt tên thống nhất (ví dụ NGAY_LOAI-TAI-LIEU_TEN-NGAN) và cách chia thư mục con. KHÔNG đổi tên hay di chuyển gì cả.\nLập bảng "tên cũ → tên mới đề xuất" vào file de-xuat-sap-xep.md. Chỉ khi mình đồng ý mới thực hiện, và khi đó hãy tạo thêm file mục lục hồ sơ.' },

  // ---- Skill
  { cat: 'Skill', title: 'Tạo Skill từ quy trình của bạn', desc: 'Biến quy trình làm việc quen thuộc thành Skill dùng lại.', file: 'Cần: dán quy trình của bạn vào chỗ trống.',
    text: 'Hãy tạo giúp mình một Skill trong thư mục .agents/skills/ của project này, từ quy trình làm việc sau của mình:\n\n[DÁN QUY TRÌNH CỦA BẠN VÀO ĐÂY, ví dụ các bước soát hợp đồng của văn phòng]\n\nYêu cầu: đặt tên skill bằng chữ thường có gạch ngang; dòng description nói rõ "làm gì" và "khi nào dùng"; các bước đánh số; có quy tắc "không sửa file gốc".\nTạo xong hãy cho mình xem nội dung SKILL.md và giải thích cách gọi skill.' },
  { cat: 'Skill', title: 'Skill chấm bài theo thang điểm', desc: 'Chấm bài đúng tiêu chí của giảng viên mỗi lần.', file: 'Cần: tiêu chí chấm của bạn (đính kèm hoặc dán).',
    text: 'Tạo một Skill tên cham-bai trong .agents/skills/ để chấm bài tập luật theo tiêu chí mình đính kèm (hoặc, nếu mình không đính kèm, dùng thang 10 điểm gồm: xác định vấn đề 2đ, căn cứ pháp luật 3đ, áp dụng 3đ, kết luận và trình bày 2đ).\nSkill phải: cho điểm từng phần kèm lý do, chỉ ra lỗi và cách tự sửa, không viết lại bài hộ, không sửa file gốc, ghi kết quả vào nhan-xet.md. Xong cho mình xem SKILL.md.' },

  // ---- Trang web
  { cat: 'Trang web', title: 'Trang giới thiệu văn phòng luật', desc: 'Một trang web tĩnh nghiêm túc, dữ liệu mẫu.', file: 'Không cần file.',
    text: 'Làm một trang web tĩnh (HTML, CSS, JS thuần) giới thiệu văn phòng luật tên "Văn phòng Luật Minh Bạch" (tên giả, dùng nội dung mẫu).\nCác mục: Giới thiệu, Lĩnh vực hành nghề (thẻ), Quy trình làm việc (4 bước), Câu hỏi thường gặp, Liên hệ (để trống).\nPhong cách nghiêm túc, xanh đậm và trắng, tiếng Việt, đọc tốt trên điện thoại. Cuối trang có dòng "Thông tin chỉ mang tính tham khảo, không thay thế tư vấn pháp lý".\nChỉ tạo file trong thư mục này; làm xong mở thử và chụp màn hình cho mình xem.' },
  { cat: 'Trang web', title: 'Trang hỏi đáp pháp lý (FAQ)', desc: 'Câu hỏi thường gặp về một chủ đề, có ô tìm kiếm.', file: 'Đính kèm: tài liệu về chủ đề (nếu có).',
    text: 'Làm trang web tĩnh (HTML, CSS, JS thuần) hỏi đáp pháp lý về chủ đề: [GHI CHỦ ĐỀ, ví dụ hợp đồng lao động]. Dùng tài liệu mình đính kèm nếu có.\nCó 12 câu hỏi dạng bấm mở / đóng, ô tìm kiếm lọc câu hỏi, chia nhóm theo chủ đề nhỏ, mỗi câu trả lời ngắn gọn dễ hiểu kèm tên văn bản căn cứ.\nCuối trang ghi "Chỉ mang tính tham khảo". Tiếng Việt, đọc tốt trên điện thoại.' },
  { cat: 'Trang web', title: 'Trang quiz ôn tập tương tác', desc: 'Làm bài trắc nghiệm trên web, chấm điểm ngay.', file: 'Đính kèm: tài liệu để ra câu hỏi.',
    text: 'Từ tài liệu mình đính kèm, làm một trang web quiz ôn tập (HTML, CSS, JS thuần): 15 câu trắc nghiệm, mỗi lần một câu, chọn đáp án thì hiện ngay đúng / sai kèm giải thích ngắn, có thanh tiến độ, cuối bài hiện điểm và danh sách câu làm sai để làm lại.\nTiếng Việt, đẹp và đọc tốt trên điện thoại. Làm xong mở thử và chụp màn hình cho mình xem.' },
  { cat: 'Trang web', title: 'CV / portfolio sinh viên luật', desc: 'Trang cá nhân gọn gàng để gửi nhà tuyển dụng.', file: 'Đính kèm: CV hiện tại của bạn.',
    text: 'Từ CV mình đính kèm, làm trang web portfolio cá nhân (HTML, CSS, JS thuần): giới thiệu ngắn, học vấn, kinh nghiệm / thực tập, kỹ năng, hoạt động ngoại khoá, liên hệ.\nPhong cách tối giản, chuyên nghiệp, có nút tải CV. Không đưa số điện thoại hay địa chỉ nhà lên trang, chỉ để email. Tiếng Việt, đọc tốt trên điện thoại.' },

  // ---- Google Flow
  { cat: 'Google Flow', title: 'Kịch bản video giải thích pháp luật', desc: 'Chia cảnh 8 giây, mỗi cảnh có lời thoại và prompt cho Flow.', file: 'Cần: ghi chủ đề vào chỗ trống.',
    text: 'Mình cần video 40 giây giải thích cho người dân: "[GHI CHỦ ĐỀ, ví dụ Hợp đồng miệng có giá trị pháp lý không?]".\nChia thành 5 cảnh, mỗi cảnh khoảng 8 giây. Mỗi cảnh viết: lời thoại tiếng Việt (1–2 câu dễ hiểu) và 1 prompt tiếng Anh cho Google Flow theo công thức chủ thể + hành động + bối cảnh + góc máy + ánh sáng / phong cách.\nGiữ phong cách hoạt hình 2D nhất quán giữa các cảnh. Ghi kèm văn bản pháp luật làm căn cứ để mình đối chiếu. Lưu vào kich-ban.md.' + '\nLưu ý: nội dung pháp lý phải được người có chuyên môn kiểm tra trước khi đăng.' },
  { cat: 'Google Flow', title: 'Prompt ảnh minh hoạ / infographic', desc: '5 prompt tạo hình minh hoạ cho bài thuyết trình.', file: 'Cần: ghi chủ đề vào chỗ trống.',
    text: 'Mình làm bài thuyết trình về "[GHI CHỦ ĐỀ]". Hãy viết 5 prompt tiếng Anh để tạo hình minh hoạ bằng Google Flow, mỗi hình cho một ý chính của bài.\nPhong cách thống nhất: phẳng, tối giản, bảng màu xanh đậm – trắng – vàng, không có chữ trong ảnh, nền đơn giản để dễ chèn vào slide. Mỗi prompt kèm 1 dòng tiếng Việt nói hình dùng cho ý nào. Lưu vào prompt-anh.md.' },
  { cat: 'Google Flow', title: 'Video giới thiệu câu lạc bộ / văn phòng', desc: 'Kịch bản 30 giây, hình ảnh nghiêm túc, không dùng mặt người thật.', file: 'Đính kèm: tài liệu giới thiệu (nếu có).',
    text: 'Dựa trên tài liệu giới thiệu mình đính kèm (nếu có), viết kịch bản video 30 giây giới thiệu đơn vị của mình, gồm 4 cảnh, mỗi cảnh có lời dẫn tiếng Việt và 1 prompt tiếng Anh cho Google Flow.\nHình ảnh nghiêm túc, ấm áp, dùng biểu tượng và cảnh minh hoạ, KHÔNG mô phỏng người thật hay logo có thật. Lưu vào kich-ban-gioi-thieu.md.' },

  // ---- Công việc
  { cat: 'Công việc', title: 'Kế hoạch ôn thi theo ngày', desc: 'Lịch học thực tế dựa trên ngày thi và tài liệu.', file: 'Đính kèm: đề cương / danh sách chương.',
    text: 'Dựa trên đề cương mình đính kèm, lập kế hoạch ôn thi theo ngày. Mình sẽ cho thông tin ở dòng dưới, nếu thiếu hãy hỏi lại:\n- Ngày thi: [GHI NGÀY]\n- Số giờ học mỗi ngày: [GHI SỐ GIỜ]\nChia chương theo độ khó, xen kẽ ôn lại, mỗi tuần có 1 buổi làm đề thử, 2 ngày cuối chỉ ôn lại điểm yếu. Xuất dạng bảng, lưu vào ke-hoach-on-thi.pdf.' },
  { cat: 'Công việc', title: 'Chuẩn bị câu hỏi cho buổi gặp khách', desc: 'Danh sách câu cần hỏi và giấy tờ cần xin trước buổi tư vấn.', file: 'Cần: ghi loại vụ việc vào chỗ trống.',
    text: 'Mình sắp có buổi gặp khách hàng đầu tiên về vụ việc loại: [GHI LOẠI VỤ VIỆC, ví dụ tranh chấp hợp đồng thuê nhà].\nHãy lập: (1) danh sách 15 câu hỏi cần hỏi, nhóm theo chủ đề, (2) danh sách giấy tờ nên xin khách cung cấp, (3) 5 điều cần nói rõ với khách về phạm vi tư vấn và bảo mật. Lưu vào cau-hoi-gap-khach.docx.' + R }
];

module.exports = { R: R, FEATURED: FEATURED, P: P };
