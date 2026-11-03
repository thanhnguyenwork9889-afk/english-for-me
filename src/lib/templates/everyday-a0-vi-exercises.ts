import type { TemplateExerciseInput } from "./build";

// Practice questions for the "Tiếng Anh giao tiếp cho người mất gốc" template, keyed by
// lesson title. Kept beside the lessons rather than inside them so the lesson file stays
// readable; a test asserts every lesson title here matches one in the template.
//
// Authoring rules:
//  • Prompts in Vietnamese, the English being tested in the prompt or the options.
//  • Multiple choice: the correct option is written FIRST (build.ts shuffles them).
//  • Typed answers: list every wording a learner might reasonably type, "a|b|c".
//    Grading ignores case, spacing, apostrophes and end punctuation.
//  • Never test an apostrophe with a typed answer (its / it's grade the same) — use mcq.

const E = (list: TemplateExerciseInput[]) => list;

export const everydayA0ViExercises: Record<string, TemplateExerciseInput[]> = {
  // ---------- Giai đoạn 1 · Phát âm & nền tảng ----------
  "Bảng chữ cái & đánh vần tên của bạn": E([
    {
      q: "Muốn người khác đánh vần lại, bạn nói gì?",
      opts: ["How do you spell that?", "How do you write that letter?", "What is spelling?"],
      a: 0,
      why: "spell = đánh vần. Đây là câu bạn sẽ dùng rất nhiều khi cho email hoặc tên.",
    },
    { q: "Điền từ còn thiếu: What's your ___? (Tên bạn là gì?)", a: "name" },
    {
      q: "Cặp chữ cái nào người Việt hay đọc lẫn nhau nhất?",
      opts: ["E và I", "B và P", "M và N"],
      a: 0,
      why: "E đọc /iː/ còn I đọc /aɪ/ — rất khác nhau, nhưng dễ lẫn vì giống tiếng Việt.",
    },
  ]),
  "Nguyên âm ngắn: /ɪ/ /e/ /æ/ /ʌ/ /ɒ/ /ʊ/": E([
    { q: "Từ nào có nguyên âm NGẮN /ɪ/?", opts: ["sit", "seat", "site"], a: 0, why: "seat là /iː/ (dài), site là /aɪ/." },
    { q: "cat /kæt/ và cup /kʌp/ khác nhau ở đâu?", opts: ["nguyên âm ở giữa", "phụ âm đầu", "phụ âm cuối"], a: 0 },
    { q: "Viết từ tiếng Anh nghĩa “quyển sách” (có âm /ʊ/):", a: "book" },
  ]),
  "Nguyên âm dài & nguyên âm đôi": E([
    { q: "Từ nào có nguyên âm DÀI /iː/?", opts: ["sheep", "ship", "shop"], a: 0, why: "sheep = con cừu, ship = con tàu." },
    { q: "day, my, go đều chứa âm gì?", opts: ["nguyên âm đôi", "nguyên âm ngắn", "phụ âm kép"], a: 0 },
    { q: "Viết từ tiếng Anh nghĩa “thức ăn” (âm /uː/):", a: "food" },
  ]),
  "Phụ âm khó với người Việt: /θ/ /ð/ /ʃ/ /ʒ/ /tʃ/ /dʒ/": E([
    { q: "“Thank you” bắt đầu bằng âm nào?", opts: ["/θ/ (vô thanh)", "/ð/ (hữu thanh)", "/t/"], a: 0 },
    { q: "“This” bắt đầu bằng âm nào?", opts: ["/ð/ (hữu thanh)", "/θ/ (vô thanh)", "/d/"], a: 0, why: "This, that, these, those đều là /ð/ — có rung ở cổ." },
    { q: "Điền: I ___ so. (Tôi nghĩ vậy)", a: "think" },
  ]),
  "Âm cuối – đừng 'nuốt' âm cuối": E([
    {
      q: "Vì sao phải đọc rõ âm cuối?",
      opts: ["Để phân biệt work – worked, like – liked", "Để nói nhanh hơn", "Vì ngữ pháp bắt buộc"],
      a: 0,
      why: "Mất âm cuối là người nghe không biết bạn nói hiện tại hay quá khứ, một hay nhiều.",
    },
    { q: "“-ed” trong “wanted” đọc là gì?", opts: ["/ɪd/ — thành một âm tiết riêng", "/t/", "/d/"], a: 0, why: "Sau /t/ và /d/ thì -ed đọc /ɪd/: wanted, needed." },
    { q: "Điền đúng dạng: He ___ (work) in a bank.", a: "works" },
  ]),
  "Trọng âm từ & âm schwa /ə/": E([
    { q: "“water” nhấn vào âm tiết nào?", opts: ["âm tiết thứ nhất (WA-ter)", "âm tiết thứ hai (wa-TER)", "cả hai như nhau"], a: 0 },
    { q: "Âm /ə/ (schwa) là âm thế nào?", opts: ["ngắn, nhẹ, ở âm tiết KHÔNG nhấn", "dài và rõ", "chỉ xuất hiện ở cuối câu"], a: 0 },
    { q: "Viết từ tiếng Anh nghĩa “giáo viên” (kết thúc bằng schwa):", a: "teacher" },
  ]),
  "Số đếm, tuổi & số điện thoại": E([
    { q: "Hỏi tuổi người khác:", opts: ["How old are you?", "How many years you?", "What is your old?"], a: 0 },
    { q: "Viết số 15 bằng chữ tiếng Anh:", a: "fifteen" },
    { q: "Điền: I ___ 25 years old.", a: "am", why: "Tiếng Anh dùng “be + tuổi”, không dùng “have” như tiếng Pháp." },
  ]),
  "Chào hỏi & tạm biệt": E([
    { q: "Buổi chiều (sau 12h trưa) bạn chào thế nào?", opts: ["Good afternoon", "Good evening", "Good night"], a: 0, why: "Good night là lời chào khi đi ngủ hoặc chia tay buổi khuya." },
    {
      q: "Ai đó nói “How are you?” — câu trả lời tự nhiên nhất:",
      opts: ["I'm fine, thanks. And you?", "Yes, I am.", "I'm 30 years old."],
      a: 0,
    },
    { q: "Tạm biệt khi mai gặp lại: See you ___!", a: "tomorrow" },
  ]),
  "50 từ vựng đầu tiên: đồ vật quanh nhà": E([
    { q: "Viết từ tiếng Anh: cái bàn", a: "table|desk" },
    { q: "Viết từ tiếng Anh: cái ghế", a: "chair" },
    { q: "“kitchen” nghĩa là gì?", opts: ["nhà bếp", "phòng ngủ", "nhà tắm"], a: 0 },
  ]),
  "Ôn tập tuần 1–2: tự giới thiệu 3 câu": E([
    { q: "Câu giới thiệu tên nào đúng ngữ pháp?", opts: ["My name is Thanh.", "My name Thanh.", "I name is Thanh."], a: 0 },
    { q: "Điền: I ___ from Vietnam.", a: "am" },
    { q: "Điền giới từ: I live ___ Hanoi.", a: "in", why: "in + thành phố, nước. on + đường. at + số nhà cụ thể." },
  ]),

  // ---------- Giai đoạn 2 · Giới thiệu bản thân & cuộc sống hằng ngày ----------
  "Động từ TO BE: am / is / are": E([
    { q: "She ___ a student.", opts: ["is", "am", "are"], a: 0 },
    { q: "Điền: They ___ my friends.", a: "are" },
    { q: "Điền: I ___ a teacher.", a: "am" },
  ]),
  "Thông tin cá nhân: quê quán, nơi sống, nghề nghiệp": E([
    { q: "Hỏi quê quán của ai đó:", opts: ["Where are you from?", "Where you from come?", "What are you from?"], a: 0 },
    { q: "Điền: I ___ in Ho Chi Minh City. (sống)", a: "live" },
    { q: "“What do you do?” hỏi về điều gì?", opts: ["nghề nghiệp", "sở thích", "sức khỏe"], a: 0, why: "Đây là cách hỏi nghề nghiệp thông dụng nhất, không phải hỏi “bạn đang làm gì”." },
  ]),
  "Gia đình: have / has & sở hữu 's": E([
    { q: "He ___ two brothers.", opts: ["has", "have", "is having"], a: 0, why: "He / She / It luôn đi với has." },
    { q: "Điền: I ___ one sister.", a: "have" },
    { q: "“Xe của bố tôi” dịch là:", opts: ["my father's car", "my father car", "the car of my father"], a: 0 },
  ]),
  "Nghề nghiệp & a / an": E([
    { q: "She is ___ engineer.", opts: ["an", "a", "the"], a: 0 },
    { q: "Điền a hoặc an: He is ___ doctor.", a: "a" },
    { q: "Dùng “an” khi từ ngay sau bắt đầu bằng gì?", opts: ["âm nguyên âm", "phụ âm", "chữ h"], a: 0, why: "Theo ÂM, không theo chữ: an hour (h câm), a university (đọc /juː/)." },
  ]),
  "Thì hiện tại đơn: thói quen hằng ngày": E([
    { q: "He ___ coffee every morning.", opts: ["drinks", "drink", "is drink"], a: 0 },
    { q: "Điền đúng dạng: She ___ (go) to work at 8.", a: "goes" },
    { q: "Điền đúng dạng: We ___ (study) English every day.", a: "study" },
  ]),
  "Câu hỏi & phủ định với do / does": E([
    { q: "___ she like coffee?", opts: ["Does", "Do", "Is"] , a: 0 },
    { q: "Phủ định: I ___ like fish. (không thích)", a: "don't|do not" },
    { q: "Phủ định: He ___ work on Sunday.", a: "doesn't|does not", why: "Có doesn't rồi thì động từ về nguyên mẫu: doesn't work, không phải doesn't works." },
  ]),
  "Giờ giấc, thứ, ngày tháng: at / on / in": E([
    { q: "___ Monday (vào thứ Hai)", opts: ["on", "at", "in"], a: 0 },
    { q: "Điền: The meeting is ___ 9 o'clock.", a: "at" },
    { q: "Điền: My birthday is ___ May.", a: "in", why: "at + giờ, on + ngày/thứ, in + tháng/năm." },
  ]),
  "Trạng từ tần suất: always, usually, sometimes, never": E([
    { q: "Câu nào đúng?", opts: ["She always drinks tea.", "She drinks always tea.", "Always she drink tea."], a: 0, why: "Trạng từ tần suất đứng TRƯỚC động từ thường, SAU động từ to be." },
    { q: "“never” nghĩa là gì?", opts: ["không bao giờ", "thỉnh thoảng", "thường xuyên"], a: 0 },
    { q: "Viết trạng từ tiếng Anh nghĩa “thỉnh thoảng”:", a: "sometimes" },
  ]),
  "Sở thích: like / love / hate + V-ing": E([
    { q: "I love ___ music.", opts: ["listening to", "listen", "to listening"], a: 0 },
    { q: "Điền đúng dạng: She hates ___ (get) up early.", a: "getting" },
    { q: "Điền đúng dạng: I like ___ (read) books.", a: "reading|to read", why: "Sau like có thể dùng V-ing hoặc to + V; sau hate/love cũng vậy." },
  ]),
  "Ôn tập tuần 3–4: một ngày của tôi": E([
    { q: "Điền: I get ___ at 6 a.m. (thức dậy)", a: "up" },
    { q: "Câu nào đúng trật tự?", opts: ["I have breakfast at 7.", "I at 7 have breakfast.", "At 7 I breakfast have."], a: 0 },
    { q: "Điền: I go ___ bed at 11 p.m.", a: "to" },
  ]),

  // ---------- Giai đoạn 3 · Mua sắm, ăn uống & đi lại ----------
  "There is / There are: mô tả căn phòng": E([
    { q: "___ three chairs in the room.", opts: ["There are", "There is", "It has"], a: 0 },
    { q: "Điền 2 từ: ___ ___ a book on the desk. (Có một quyển sách…)", a: "there is" },
    { q: "Phủ định: There ___ any milk in the fridge.", opts: ["isn't", "aren't", "not is"], a: 0, why: "milk không đếm được nên dùng số ít: there isn't any milk." },
  ]),
  "Đếm được / không đếm được; some / any": E([
    { q: "Từ nào KHÔNG đếm được?", opts: ["water", "apple", "book"], a: 0 },
    { q: "Điền some hoặc any: I need ___ water.", a: "some" },
    { q: "Điền some hoặc any: Do you have ___ questions?", a: "any", why: "some trong câu khẳng định, any trong câu hỏi và phủ định." },
  ]),
  "Mua sắm: hỏi giá, thử đồ, trả tiền": E([
    { q: "Hỏi giá một món đồ:", opts: ["How much is it?", "How many is it?", "What price it?"], a: 0, why: "how much + giá/thứ không đếm được; how many + thứ đếm được." },
    { q: "Điền: Can I ___ it on? (thử đồ)", a: "try" },
    { q: "“Can I pay by card?” nghĩa là gì?", opts: ["Tôi trả bằng thẻ được không?", "Thẻ của tôi ở đâu?", "Cái này giá bao nhiêu?"], a: 0 },
  ]),
  "Tính từ: màu sắc, kích cỡ, mô tả đồ vật": E([
    { q: "Trật tự tính từ nào đúng?", opts: ["a big red bag", "a red big bag", "a bag big red"], a: 0, why: "Kích cỡ đứng trước màu sắc: big red, không phải red big." },
    { q: "Viết từ trái nghĩa với “big”:", a: "small|little" },
    { q: "Viết từ tiếng Anh: màu đen", a: "black" },
  ]),
  "Gọi món ở quán cà phê & nhà hàng": E([
    { q: "Cách gọi món lịch sự nhất:", opts: ["I'd like a coffee, please.", "I want coffee.", "Give me coffee."], a: 0, why: "I'd like = I would like, lịch sự hơn I want rất nhiều." },
    { q: "Điền: Can I have the ___, please? (hoá đơn)", a: "bill|check" },
    { q: "“For here or to go?” nghĩa là gì?", opts: ["Dùng tại đây hay mang đi?", "Món này cho ai?", "Anh lấy mấy cái?"], a: 0 },
  ]),
  "Hỏi & chỉ đường": E([
    { q: "Hỏi đường lịch sự:", opts: ["Excuse me, how do I get to the station?", "Where station go?", "Which is station?"], a: 0 },
    { q: "Điền: Turn ___ at the traffic lights. (rẽ phải)", a: "right" },
    { q: "Điền: Go ___ for 200 metres. (đi thẳng)", a: "straight" },
  ]),
  "Giới từ vị trí: in, on, under, next to, between": E([
    { q: "The cat is ___ the table. (bên dưới)", opts: ["under", "on", "in"], a: 0 },
    { q: "Điền 2 từ: The bank is ___ ___ the post office. (bên cạnh)", a: "next to" },
    { q: "Điền: My house is ___ the bank and the school. (ở giữa hai cái)", a: "between" },
  ]),
  "Phương tiện đi lại & mua vé": E([
    { q: "Mua vé ở quầy:", opts: ["A ticket to Hue, please.", "I buy ticket Hue.", "Give ticket Hue."], a: 0 },
    { q: "Điền: I go to work ___ bus.", a: "by", why: "by bus, by train, by car — nhưng on foot (đi bộ)." },
    { q: "“Return ticket” là vé gì?", opts: ["vé khứ hồi", "vé một chiều", "vé trẻ em"], a: 0 },
  ]),
  "Can / Can't: khả năng & xin phép": E([
    { q: "Xin phép lịch sự:", opts: ["Can I open the window?", "I can open window?", "Open window can I?"], a: 0 },
    { q: "Điền: I ___ swim. (tôi không biết bơi)", a: "can't|cannot|can not" },
    { q: "Điền: She ___ speak three languages.", a: "can" },
  ]),
  "Ôn tập tuần 5–6: đóng vai 2 tình huống": E([
    { q: "Nhân viên hỏi “Anything else?” — bạn trả lời:", opts: ["No, thanks. That's all.", "Yes, I am.", "I don't know what."], a: 0 },
    { q: "Điền: How ___ is this shirt?", a: "much" },
    { q: "Điền: Excuse ___, where is the toilet?", a: "me" },
  ]),

  // ---------- Giai đoạn 4 · Kể chuyện quá khứ & kế hoạch tương lai ----------
  "Quá khứ của TO BE: was / were": E([
    { q: "I ___ at home yesterday.", opts: ["was", "were", "am"], a: 0 },
    { q: "Điền: They ___ very tired.", a: "were" },
    { q: "Điền: She ___ at school yesterday.", a: "was", why: "I / he / she / it → was. You / we / they → were." },
  ]),
  "Quá khứ đơn: động từ có quy tắc (-ed)": E([
    { q: "Quá khứ của “watch” là:", opts: ["watched", "watchd", "watching"], a: 0 },
    { q: "Điền đúng dạng: I ___ (study) English last night.", a: "studied", why: "Phụ âm + y → bỏ y, thêm -ied: study → studied." },
    { q: "Điền đúng dạng: We ___ (stop) at the shop.", a: "stopped", why: "Một nguyên âm + một phụ âm cuối → gấp đôi phụ âm: stop → stopped." },
  ]),
  "30 động từ bất quy tắc thông dụng nhất": E([
    { q: "Quá khứ của “go” là:", opts: ["went", "goed", "gone"], a: 0, why: "gone là quá khứ phân từ (V3), dùng với have/has." },
    { q: "Viết quá khứ của “eat”:", a: "ate" },
    { q: "Viết quá khứ của “buy”:", a: "bought" },
  ]),
  "Câu hỏi quá khứ: Did you…? What did you do?": E([
    { q: "___ you see the film?", opts: ["Did", "Do", "Was"], a: 0 },
    { q: "Điền: What did you ___ yesterday? (làm)", a: "do" },
    { q: "Câu nào đúng?", opts: ["Did she go to work?", "Did she went to work?", "Did she goes to work?"], a: 0, why: "Sau did, động từ luôn ở dạng nguyên mẫu." },
  ]),
  "Kể về cuối tuần vừa rồi": E([
    { q: "Điền đúng dạng: Last weekend I ___ (visit) my parents.", a: "visited" },
    { q: "“I had a great time” nghĩa là gì?", opts: ["Tôi đã có khoảng thời gian tuyệt vời", "Tôi có nhiều thời gian", "Tôi hết thời gian rồi"], a: 0 },
    { q: "Điền đúng dạng: I ___ (stay) at home all day.", a: "stayed" },
  ]),
  "Tương lai với 'be going to': kế hoạch": E([
    { q: "I ___ going to visit Hue next month.", opts: ["am", "will", "do"], a: 0 },
    { q: "Điền: She is going ___ buy a car.", a: "to" },
    { q: "“be going to” dùng cho điều gì?", opts: ["kế hoạch đã định trước", "quyết định ngay lúc đang nói", "thói quen hằng ngày"], a: 0 },
  ]),
  "Tương lai với 'will': quyết định, lời hứa": E([
    { q: "Trời lạnh quá. — “I ___ close the window.” (quyết định ngay lúc đó)", opts: ["will", "am going to", "do"], a: 0 },
    { q: "Điền: I ___ help you. (tôi sẽ giúp bạn)", a: "will" },
    { q: "“won't” là viết tắt của từ nào?", opts: ["will not", "want not", "would not"], a: 0 },
  ]),
  "Hiện tại tiếp diễn: đang làm gì & lịch hẹn": E([
    { q: "She ___ cooking now.", opts: ["is", "are", "does"], a: 0 },
    { q: "Điền 2 từ: I ___ ___ (watch) TV right now.", a: "am watching" },
    { q: "“I'm meeting John at 5” nói về điều gì?", opts: ["lịch hẹn đã sắp xếp", "việc đang làm ngay bây giờ", "thói quen"], a: 0, why: "Hiện tại tiếp diễn cũng dùng cho lịch hẹn đã chốt trong tương lai gần." },
  ]),
  "Rủ rê, mời, nhận lời & từ chối": E([
    { q: "Rủ bạn đi xem phim:", opts: ["Would you like to see a film?", "You like see film?", "Do you see film?"], a: 0 },
    { q: "Nhận lời: That ___ great! (nghe hay đấy)", a: "sounds" },
    { q: "Từ chối lịch sự:", opts: ["Sorry, I can't. Maybe next time.", "No.", "I don't want."], a: 0 },
  ]),
  "Ôn tập tuần 7–8: kể chuyện 'My last holiday'": E([
    { q: "Điền đúng dạng: I ___ (go) to Da Nang last summer.", a: "went" },
    { q: "Điền đúng dạng: The food ___ (be) delicious.", a: "was" },
    { q: "Câu mở đầu kể chuyện quá khứ tự nhiên nhất:", opts: ["Last year, I went to…", "Next year I go to…", "I am going to…"], a: 0 },
  ]),

  // ---------- Giai đoạn 5 · Giao tiếp theo tình huống ----------
  "Small talk: thời tiết, công việc, cuối tuần": E([
    { q: "Mở đầu small talk tự nhiên:", opts: ["Nice weather today, isn't it?", "How much money do you have?", "Why are you here?"], a: 0 },
    { q: "Điền: How was your ___? (cuối tuần của bạn thế nào?)", a: "weekend" },
    { q: "“Busy day?” là cách nói ngắn của câu nào?", opts: ["Have you had a busy day?", "Are you a busy person?", "Do you like being busy?"], a: 0 },
  ]),
  "Bày tỏ ý kiến: I think / In my opinion": E([
    { q: "Nêu ý kiến đúng ngữ pháp:", opts: ["I think it's a good idea.", "I thinking good idea.", "My think is good."], a: 0 },
    { q: "Điền: ___ my opinion, it's too expensive.", a: "in" },
    { q: "Cách nói “tôi đồng ý với bạn” đúng là:", opts: ["I agree with you.", "I am agree with you.", "I agree you."], a: 0, why: "agree là động từ thường, không cần “am”, và luôn đi với “with” khi đồng ý với người." },
  ]),
  "So sánh hơn & so sánh nhất": E([
    { q: "Hanoi is ___ than Da Lat.", opts: ["hotter", "hot", "more hot"], a: 0, why: "Tính từ ngắn thêm -er; tính từ dài mới dùng more." },
    { q: "Điền đúng dạng: This is the ___ (big) city in Vietnam.", a: "biggest" },
    { q: "Điền đúng dạng: My bag is more ___ (expensive) than yours.", a: "expensive" },
  ]),
  "Gọi điện thoại & để lại lời nhắn": E([
    { q: "Bắt đầu cuộc gọi:", opts: ["Hello, this is Thanh speaking.", "Hello, I am here Thanh.", "Hello, me Thanh."], a: 0, why: "Trên điện thoại người Anh/Mỹ nói “this is…”, không nói “I am…”." },
    { q: "Điền: Can I ___ a message? (để lại lời nhắn)", a: "leave" },
    { q: "“Hold on, please” nghĩa là gì?", opts: ["Vui lòng giữ máy", "Vui lòng gọi lại", "Vui lòng nói to hơn"], a: 0 },
  ]),
  "Đi khám bệnh: mô tả triệu chứng": E([
    { q: "Mô tả triệu chứng đúng:", opts: ["I have a headache.", "I am headache.", "My head is sick."], a: 0 },
    { q: "Điền: I have a sore ___. (đau họng)", a: "throat" },
    { q: "Bác sĩ hỏi “What's the matter?” nghĩa là gì?", opts: ["Bạn bị sao vậy?", "Vấn đề gì quan trọng?", "Bạn tên gì?"], a: 0 },
  ]),
  "Khách sạn & du lịch": E([
    { q: "Nhận phòng khách sạn:", opts: ["I have a reservation under Thanh.", "I booked room my name Thanh.", "My room is Thanh."], a: 0 },
    { q: "Điền: Is ___ included? (bữa sáng có bao gồm không?)", a: "breakfast" },
    { q: "“Check out” là gì?", opts: ["trả phòng", "nhận phòng", "đặt phòng"], a: 0 },
  ]),
  "Phàn nàn & giải quyết vấn đề lịch sự": E([
    { q: "Phàn nàn lịch sự:", opts: ["Excuse me, there's a problem with my order.", "This is bad! Change it!", "Why you do this?"], a: 0 },
    { q: "Điền: I'm ___, this isn't what I ordered. (xin lỗi)", a: "sorry" },
    { q: "“Could you change it, please?” là gì?", opts: ["một lời đề nghị lịch sự", "một câu hỏi về giá", "một lời cảm ơn"], a: 0 },
  ]),
  "Nhờ giúp đỡ, cảm ơn & xin lỗi lịch sự": E([
    { q: "Câu nhờ giúp lịch sự nhất:", opts: ["Could you help me, please?", "Help me.", "You help me now."], a: 0, why: "Could lịch sự hơn Can; thêm please là tốt nhất." },
    { q: "Viết một câu đáp lại “Thank you”:", a: "you're welcome|no problem|my pleasure|not at all" },
    { q: "Xin lỗi vì đến muộn:", opts: ["Sorry I'm late.", "Sorry for I late.", "I sorry late."], a: 0 },
  ]),
  "Khi không hiểu: xin nhắc lại & hỏi nghĩa": E([
    { q: "Xin nhắc lại lịch sự:", opts: ["Sorry, could you say that again?", "What? Again!", "Repeat."], a: 0 },
    { q: "Điền: Could you speak more ___, please? (chậm hơn)", a: "slowly" },
    { q: "Hỏi nghĩa của một từ:", opts: ["What does “bill” mean?", "What is mean “bill”?", "How mean “bill”?"], a: 0 },
  ]),
  "Ôn tập tuần 9–10: đóng vai 3 tình huống": E([
    { q: "Ở sân bay, hỏi cổng ra máy bay:", opts: ["Which gate is it, please?", "Where is my gate go?", "What gate I am?"], a: 0 },
    { q: "Điền: Excuse me, could you ___ me the way to the station? (chỉ cho tôi)", a: "show|tell" },
    { q: "Điền: I'd ___ to book a table for two. (muốn)", a: "like" },
  ]),

  // ---------- Giai đoạn 6 · Phản xạ & tổng ôn ----------
  "Kỹ thuật Shadowing: nói theo người bản xứ": E([
    { q: "Shadowing là gì?", opts: ["nghe và nói theo gần như cùng lúc", "dịch từng từ sang tiếng Việt", "học thuộc bảng từ vựng"], a: 0 },
    { q: "Khi shadowing nên chọn đoạn như thế nào?", opts: ["ngắn và bạn nghe hiểu được khoảng 80%", "dài và khó để tiến bộ nhanh", "toàn từ mới chưa biết"], a: 0 },
    { q: "Điền giới từ: I'm listening ___ a podcast.", a: "to" },
  ]),
  "Luyện nghe: hội thoại ngắn hằng ngày": E([
    { q: "Nghe không kịp thì nên làm gì?", opts: ["nghe lại 2–3 lần rồi mới xem phụ đề", "xem phụ đề ngay từ đầu", "bỏ qua, nghe bài khác"], a: 0 },
    { q: "Điền: Sorry, I didn't ___ that. (không nghe rõ)", a: "catch|hear|get" },
    { q: "“See you later” nghĩa là gì?", opts: ["Gặp lại sau nhé", "Nhìn tôi sau", "Muộn rồi"], a: 0 },
  ]),
  "Self-talk: tự nói tiếng Anh về việc đang làm": E([
    { q: "Self-talk là gì?", opts: ["tự nói tiếng Anh về việc mình đang làm", "nói chuyện với giáo viên", "đọc to một quyển sách"], a: 0 },
    { q: "Điền đúng dạng: I'm ___ (make) coffee now.", a: "making" },
    { q: "Điền: I'm going ___ wash the dishes.", a: "to" },
  ]),
  "Nối âm (linking): nói tự nhiên hơn": E([
    { q: "Nối âm là gì?", opts: ["âm cuối của từ trước nối vào âm đầu của từ sau", "nói to hơn ở cuối câu", "bỏ bớt từ trong câu"], a: 0 },
    { q: "“an apple” khi nói tự nhiên nghe gần như:", opts: ["a-napple", "an-a-ple", "ana ple"], a: 0 },
    { q: "Điền: Turn it ___. (bật lên)", a: "on" },
  ]),
  "Ngữ điệu câu hỏi: lên giọng & xuống giọng": E([
    { q: "Câu hỏi Yes/No (Do you…? Are you…?) thường có ngữ điệu:", opts: ["lên giọng ở cuối", "xuống giọng ở cuối", "giữ đều giọng"], a: 0 },
    { q: "Câu hỏi Wh- (What, Where, When…) thường có ngữ điệu:", opts: ["xuống giọng ở cuối", "lên giọng ở cuối", "không có ngữ điệu"], a: 0 },
    { q: "Điền từ hỏi: ___ do you live? (bạn sống ở đâu?)", a: "where" },
  ]),
  "Kiểm tra 100 từ thông dụng nhất": E([
    { q: "Viết từ tiếng Anh: nước (để uống)", a: "water" },
    { q: "Viết từ tiếng Anh: hôm nay", a: "today" },
    { q: "“because” nghĩa là gì?", opts: ["bởi vì", "nhưng", "hoặc"], a: 0 },
  ]),
  "Ôn ngữ pháp: hiện tại – quá khứ – tương lai": E([
    { q: "Hiện tại đơn: She ___ to school every day.", opts: ["goes", "went", "is going"], a: 0 },
    { q: "Quá khứ: Yesterday I ___ (see) a film.", a: "saw" },
    { q: "Tương lai: Tomorrow I ___ going to study. (điền 1 từ)", a: "am" },
  ]),
  "Viết đoạn văn giới thiệu bản thân (80–100 từ)": E([
    { q: "Câu mở đầu đoạn giới thiệu bản thân:", opts: ["My name is Thanh and I'm from Vietnam.", "I writing about me.", "Hello me Thanh is."], a: 0 },
    { q: "Điền đúng dạng: In my free time, I ___ (like) reading.", a: "like" },
    { q: "Điền: I live in Hanoi ___ my family. (với)", a: "with" },
  ]),
  "Hội thoại thử 10 phút": E([
    { q: "Bí từ giữa lúc đang nói thì nên làm gì?", opts: ["diễn đạt lại bằng từ đơn giản hơn", "dừng hẳn và im lặng", "chuyển sang tiếng Việt"], a: 0 },
    { q: "Điền: How do you ___ “cái ví” in English? (nói)", a: "say" },
    { q: "“Let me think for a second” dùng để làm gì?", opts: ["xin một chút thời gian suy nghĩ", "kết thúc hội thoại", "hỏi lại câu hỏi"], a: 0 },
  ]),
  "Tổng kết 12 tuần & mục tiêu tiếp theo": E([
    { q: "Sau A2, mục tiêu hợp lý tiếp theo là gì?", opts: ["B1: nói được vài phút về chủ đề quen thuộc", "thi IELTS 8.0 ngay", "học thuộc 10.000 từ trong 1 tháng"], a: 0 },
    { q: "Điền: I want ___ keep learning every day.", a: "to" },
    { q: "Cách giữ nhịp học bền nhất:", opts: ["học ít nhưng đều mỗi ngày", "học 5 tiếng dồn vào cuối tuần", "chỉ học khi có cảm hứng"], a: 0 },
  ]),
};
