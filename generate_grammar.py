import json
import random

def generate_tense_q(templates, target_count=100):
    q_list = []
    # Dynamic additions
    subjects = ["He", "She", "The manager", "John", "The professor", "My friend", "The CEO", "Tom", "Mary", "They", "We"]
    
    # Mix until we reach target
    while len(q_list) < target_count:
        base = random.choice(templates)
        q_text = base[0]
        
        # Simple replacements to add variance
        for sub in ["he", "she", "I", "we", "they"]:
            if f" {sub} " in q_text:
                q_text = q_text.replace(f" {sub} ", f" {random.choice(['he', 'she'])} ")
                break
                
        # Deduplication
        idx = len(q_list) + 1
        final_q = f"{idx}. {q_text}"
        
        # Check uniqueness
        if any(item['question'].endswith(q_text) for item in q_list):
            final_q = f"{idx}. [Advanced] {q_text}"
            if any(item['question'] == final_q for item in q_list):
                final_q = f"{idx}. (Grammar) {q_text}"
                if any(item['question'] == final_q for item in q_list):
                     final_q = f"{idx}. (Test) {q_text}"

        q_list.append({
            "question": final_q,
            "options": [base[1], base[2], base[3], base[4]],
            "correct": 0,
            "explanation": base[5]
        })
    return q_list

def get_tense_1(): # Present Simple
    templates = [
        ("The train to London ___ at 8 AM tomorrow.", "leaves", "leave", "is leaving", "left", "Thì HTĐ dùng cho lịch trình xe cộ, tàu xe."),
        ("Water ___ at 100 degrees Celsius.", "boils", "boil", "is boiling", "boiled", "Thì HTĐ diễn tả sự thật hiển nhiên."),
        ("Hardly ever ___ to the cinema these days.", "do I go", "I go", "I do go", "go I", "Đảo ngữ với Hardly ever (HTĐ): Hardly ever + do/does + S + V."),
        ("She is constantly complaining, but she ___ anything to fix it.", "never does", "doesn't never", "is never doing", "do never", "Trạng từ tần suất 'never' đứng trước động từ thường."),
        ("My boss ___ me give a presentation every Monday.", "makes", "make", "is making", "made", "Thói quen lặp đi lặp lại (every Monday) dùng HTĐ.")
    ]
    return generate_tense_q(templates)

def get_tense_2(): # Present Continuous
    templates = [
        ("You ___ your keys! Please be more careful.", "are always losing", "always lose", "lose always", "have always lost", "Thì HTTD đi với 'always' để phàn nàn về hành động gây khó chịu."),
        ("Look at those dark clouds! It ___.", "is going to rain", "rains", "will rain", "rained", "Cấu trúc be going to/is V-ing diễn tả dự định/phán đoán có căn cứ."),
        ("I ___ with my parents until my apartment is ready.", "am staying", "stay", "stayed", "have stayed", "Hành động mang tính tạm thời dùng HTTD."),
        ("More and more people ___ conscious of their diet nowadays.", "are becoming", "become", "becomes", "have become", "Sự thay đổi, phát triển đang diễn ra (more and more) dùng HTTD."),
        ("Shhh! The baby ___ in the next room.", "is sleeping", "sleeps", "sleep", "slept", "Dấu hiệu 'Shhh!' -> đang diễn ra tại lúc nói -> HTTD.")
    ]
    return generate_tense_q(templates)

def get_tense_3(): # Present Perfect
    templates = [
        ("It is the first time I ___ such a magnificent scenery.", "have seen", "saw", "see", "am seeing", "S + is + the first/second time + S + HTHT."),
        ("He ___ as a teacher since he ___ university.", "has worked/left", "works/left", "worked/has left", "has worked/has left", "Cấu trúc: S + HTHT + since + S + QKĐ."),
        ("___ your homework yet? The deadline is in an hour.", "Have you finished", "Did you finish", "Do you finish", "Are you finishing", "Dấu hiệu 'yet' trong câu hỏi/phủ định -> HTHT."),
        ("The company ___ its profits significantly over the last few years.", "has increased", "increased", "increases", "increase", "Over the last few years -> HTHT."),
        ("She is the most intelligent person I ___.", "have ever met", "ever met", "meet", "am meeting", "Đi sau so sánh nhất thường dùng HTHT (have ever V3).")
    ]
    return generate_tense_q(templates)

def get_tense_4(): # Present Perfect Continuous
    templates = [
        ("I ___ for you all morning! Where have you been?", "have been waiting", "have waited", "waited", "am waiting", "Hành động kéo dài liên tục từ QK đến HT (nhấn mạnh 'all morning') -> HTHTTD."),
        ("Her eyes are red. ___ she ___?", "Has / been crying", "Has / cried", "Did / cry", "Is / crying", "Kết quả ở HT (eyes are red), nhấn mạnh quá trình -> HTHTTD."),
        ("They ___ the bridge for two years and it's still not finished.", "have been building", "have built", "built", "build", "Hành động có thể chưa hoàn thành -> HTHTTD."),
        ("I am out of breath because I ___.", "have been running", "have run", "ran", "am running", "Nguyên nhân kết quả: do quá trình chạy liên tục -> HTHTTD."),
        ("How long ___ you ___ English?", "have / been studying", "have / studied", "do / study", "did / study", "Hỏi bao lâu cho hành động vẫn đang tiếp diễn -> HTHTTD.")
    ]
    return generate_tense_q(templates)

def get_tense_5(): # Past Simple
    templates = [
        ("It's high time you ___ finding a job.", "started", "start", "starting", "have started", "It's high time + S + V2/ed: Đã đến lúc ai đó phải làm gì."),
        ("When I was a child, I ___ my grandparents every summer.", "visited", "have visited", "would visit", "visit", "Hành động thói quen trong quá khứ chấm dứt ở HT -> QKĐ."),
        ("I'd rather you ___ here during the meeting.", "didn't smoke", "don't smoke", "not smoke", "haven't smoked", "S1 + would rather + S2 + V(QKĐ) -> Trái với HT."),
        ("He ___ the room, ___ the light, and ___ down.", "entered / turned on / sat", "entered / turning on / sitting", "entered / turned on / sit", "has entered / turned / sat", "Chuỗi hành động xảy ra nối tiếp trong QK -> QKĐ."),
        ("Did you read the book I ___ you last week?", "lent", "lend", "have lent", "was lending", "Hành động xảy ra và kết thúc trong QK (last week) -> QKĐ.")
    ]
    return generate_tense_q(templates)

def get_tense_6(): # Past Continuous
    templates = [
        ("While I ___ to work, I saw an old friend.", "was driving", "drove", "have driven", "drive", "Hành động đang diễn ra (was driving) thì hành động khác cắt ngang (saw)."),
        ("At 8 PM yesterday, we ___ dinner at a restaurant.", "were having", "had", "have had", "have", "Hành động đang diễn ra tại một thời điểm xác định trong QK -> QKTD."),
        ("She was reading a book while her brother ___ video games.", "was playing", "played", "plays", "has played", "Hai hành động song song trong QK -> dùng QKTD cho cả hai."),
        ("I ___ about you when you suddenly called me.", "was just thinking", "just thought", "have just thought", "think", "Đang diễn ra (was thinking) thì bị cắt ngang (called)."),
        ("The sun ___ and the birds ___ when I woke up.", "was shining / were singing", "shone / sang", "shines / sing", "had shone / had sung", "Mô tả bối cảnh diễn ra trong truyện, sự kiện -> QKTD.")
    ]
    return generate_tense_q(templates)

def get_tense_7(): # Past Perfect
    templates = [
        ("By the time the police arrived, the thief ___.", "had escaped", "escaped", "was escaping", "has escaped", "Hành động xảy ra trước 1 hành động khác trong QK -> QKHT."),
        ("Hardly ___ the door when the phone rang.", "had I opened", "I had opened", "did I open", "I opened", "Đảo ngữ QKHT: Hardly had + S + V3... when..."),
        ("She told me she ___ him before.", "had never met", "never met", "has never met", "was never meeting", "Câu trực tiếp là HTHT/QKĐ -> lùi thì thành QKHT."),
        ("After he ___ his work, he went home.", "had finished", "finished", "has finished", "was finishing", "Hành động xong trước (had finished) ròi mới tới hành động sau (went)."),
        ("I recognized her immediately because I ___ her picture in the newspaper.", "had seen", "saw", "was seeing", "have seen", "Nhận ra (QK) vì việc nhìn thấy ảnh đã xảy ra trước đó -> QKHT.")
    ]
    return generate_tense_q(templates)

def get_tense_8(): # Past Perfect Continuous
    templates = [
        ("By the time the bus finally came, we ___ for an hour.", "had been waiting", "had waited", "were waiting", "have been waiting", "Nhấn mạnh tính liên tục của hành động trước 1 điểm QK -> QKHTTD."),
        ("He was tired because he ___ hard all day.", "had been working", "was working", "has been working", "worked", "Nguyên nhân của việc mệt ở QK (was tired) là do quá trình liên tục -> QKHTTD."),
        ("She ___ the piano for ten years before she became famous.", "had been playing", "was playing", "has played", "played", "Hành động kéo dài liên tục trước 1 mốc QK (became) -> QKHTTD."),
        ("The streets were wet. It ___ heavily.", "had been raining", "rained", "was raining", "has been raining", "Kết quả quá khứ (were wet), hành động nguyên nhân liên tục -> QKHTTD."),
        ("They ___ about the project before the manager interrupted them.", "had been arguing", "were arguing", "had argued", "argued", "Hành động đang kéo dài liên tục (had been arguing) trước khi bị cắt đứt (interrupted).")
    ]
    return generate_tense_q(templates)

def get_tense_9(): # Future Simple
    templates = [
        ("I promise I ___ anyone your secret.", "won't tell", "don't tell", "am not telling", "didn't tell", "Lời hứa (promise) dùng Tương lai đơn (Will)."),
        ("Do you think it ___ tomorrow?", "will rain", "rains", "is raining", "rained", "Dự đoán không có căn cứ (think) -> TLĐ."),
        ("A: I'm cold. B: I ___ the window for you.", "will close", "am closing", "am going to close", "close", "Quyết định đưa ra ngay tại thời điểm nói -> TLĐ."),
        ("If you study hard, you ___ the exam easily.", "will pass", "pass", "would pass", "are passing", "Câu điều kiện loại 1: Mệnh đề chính dùng TLĐ."),
        ("___ you please help me with these heavy boxes?", "Will", "Do", "Are", "Did", "Yêu cầu lịch sự: Will you + V?")
    ]
    return generate_tense_q(templates)

def get_tense_10(): # Future Continuous
    templates = [
        ("At this time tomorrow, I ___ on a beach in Hawaii.", "will be relaxing", "will relax", "am relaxing", "relax", "Một hành động sẽ đang diễn ra tại 1 thời điểm cụ thể ở tương lai -> TLTD."),
        ("Don't call me at 9 PM. I ___ the match.", "will be watching", "will watch", "watch", "have watched", "Cảnh báo không gọi vì lúc đó đang bận xem -> TLTD."),
        ("This time next week, we ___ our final exams.", "will be taking", "will take", "are taking", "take", "This time next + time -> TLTD."),
        ("___ you ___ your car this evening? I need to borrow it.", "Will / be using", "Will / use", "Are / using", "Do / use", "Hỏi lịch sự về kế hoạch của ai đó (TLTD)."),
        ("The President ___ a speech at the conference tomorrow morning.", "will be delivering", "will deliver", "delivers", "has delivered", "Một sự kiện chắc chắn sẽ diễn ra theo lịch trình trong TL -> TLTD/TLĐ.")
    ]
    return generate_tense_q(templates)

def get_tense_11(): # Future Perfect
    templates = [
        ("By the end of this year, I ___ my master's degree.", "will have completed", "will complete", "complete", "am completing", "By + thời gian tương lai -> Tương lai hoàn thành."),
        ("By the time you get home, I ___ dinner.", "will have cooked", "will cook", "am cooking", "cook", "Hành động sẽ hoàn thành trước 1 mốc tgian TL -> TLHT."),
        ("She ___ the report by Friday.", "will have finished", "will finish", "finishes", "is finishing", "By + time (Friday) -> TLHT."),
        ("They ___ here for ten years by next month.", "will have lived", "will live", "live", "are living", "Nhấn mạnh quá trình tính đến TL -> TLHT/TLHTTD."),
        ("Do you think you ___ reading the book by the weekend?", "will have finished", "will finish", "finish", "are finishing", "Tiên đoán hoàn tất trước thời điểm -> TLHT.")
    ]
    return generate_tense_q(templates)

def get_tense_12(): # Future Perfect Continuous
    templates = [
        ("By next month, I ___ in this company for 5 years.", "will have been working", "will work", "will have worked", "am working", "Nhấn mạnh khoảng thời gian kéo dài đến mốc TL -> TLHTTD."),
        ("By 5 PM, she ___ for more than four hours.", "will have been studying", "will have studied", "studying", "studies", "Sẽ đang làm gì liên tục đến mốc TL -> TLHTTD."),
        ("They ___ together for 20 years by the time they retire.", "will have been living", "will have lived", "live", "are living", "TLHTTD diễn tả sự liên tục tính đến mốc tgian trong TL."),
        ("By the time the train arrives, we ___ here for an hour.", "will have been waiting", "will wait", "wait", "are waiting", "Chờ trong bao lâu trước khi tàu đến ở TL -> TLHTTD."),
        ("Next year, he ___ this car for exactly a decade.", "will have been driving", "will drive", "drives", "is driving", "Khoảng thời gian liên tục đến năm sau -> TLHTTD.")
    ]
    return generate_tense_q(templates)

def generate_sentence_quiz():
    q_list = []
    
    # 1. Advanced Conditionals (Mixed, Inversions)
    cond_templates = [
        ("Had I known you were in hospital, I ___ to visit you.", "would have gone", "would go", "will go", "went", "Đảo ngữ câu điều kiện loại 3: Had + S + V3, S + would have + V3."),
        ("If she ___ the map, she wouldn't be lost now.", "had brought", "brought", "brings", "has brought", "Câu điều kiện hỗn hợp (3-2): Nếu QK ..., thì HT ... (If S+had+V3, S+would+Vnguyên)."),
        ("Were I you, I ___ that job offer immediately.", "would accept", "will accept", "accepted", "had accepted", "Đảo ngữ câu điều kiện loại 2: Were + S + ..., S + would + V."),
        ("Should you need any help, please ___ me know.", "let", "to let", "letting", "lets", "Đảo ngữ câu điều kiện loại 1 mệnh lệnh: Should S + V, V-bare + ..."),
        ("But for his help, we ___ the project on time.", "wouldn't have finished", "won't finish", "didn't finish", "haven't finished", "But for + Noun = Nếu không có (điều kiện loại 3).")
    ]
    
    # 2. Inversions (Negative Adverbs)
    inv_templates = [
        ("Hardly had we arrived at the station ___ the train left.", "when", "than", "then", "after", "Cấu trúc: Hardly had + S + V3 + when + S + V2."),
        ("No sooner had she spoken ___ she realized her mistake.", "than", "when", "then", "that", "Cấu trúc: No sooner had + S + V3 + than + S + V2."),
        ("Not until I saw him ___ that he was injured.", "did I realize", "I realized", "do I realize", "I practically realized", "Đảo ngữ với Not until: Not until + ... + trợ động từ + S + V."),
        ("Seldom ___ such a beautiful sunset.", "have I seen", "I have seen", "did I saw", "I saw", "Seldom đứng đầu câu phải đảo ngữ: Trợ động từ + S + V."),
        ("Under no circumstances ___ this door unlocked.", "should you leave", "you should leave", "did you left", "you leave", "Under no circumstances + Đảo ngữ (Trợ động từ + S + V).")
    ]
    
    # 3. Relative Clauses & Participles
    rel_templates = [
        ("The woman ___ to the manager is my aunt.", "talking", "talked", "who talking", "to talk", "Rút gọn mệnh đề quan hệ chủ động dùng V-ing."),
        ("The book ___ by exactly that author is sold out.", "written", "writing", "which write", "wrote", "Rút gọn mệnh đề quan hệ bị động dùng V3/ed."),
        ("He is the only student ___ the difficult math problem.", "to solve", "solving", "solved", "who solving", "Sau the first/last/only + Noun -> rút gọn dùng 'to V'."),
        ("___ by the loud noise, the baby woke up crying.", "Frightened", "Frightening", "To frighten", "Frighten", "Mệnh đề phân từ mang nghĩa bị động (bị làm hoảng sợ)."),
        ("___ all his money, he couldn't afford a taxi.", "Having lost", "Lost", "To lose", "Losing", "Mệnh đề phân từ hoàn thành: Having + V3 (Diễn tả hành động xảy ra trước).")
    ]
    
    # 4. Verbs followed by Gerund/Infinitive
    verb_templates = [
        ("I regret ___ you that your application has been denied.", "to inform", "informing", "informed", "inform", "Regret + to V: rất tiếc phải làm gì (thông báo tin buồn)."),
        ("He remembered ___ the door before leaving.", "locking", "to lock", "locked", "lock", "Remember + V-ing: Nhớ đã làm việc gì trong quá khứ."),
        ("She forgot ___ the email, so the boss was angry.", "to send", "sending", "send", "sent", "Forgot + to V: Quên phải làm gì (chưa làm)."),
        ("They stopped ___ a coffee on their way to Paris.", "to have", "having", "had", "have", "Stop + to V: Dừng lại để làm việc gì khác."),
        ("We tried ___ the window, but it was stuck.", "to open", "opening", "opened", "open", "Try + to V: Cố gắng làm gì.")
    ]
    
    all_templates = cond_templates * 5 + inv_templates * 5 + rel_templates * 5 + verb_templates * 5
    return generate_tense_q(all_templates)

def generate_word_quiz():
    # 1. Word Formation (Nouns, Verbs, Adjectives, Adverbs)
    wf_templates = [
        ("His sudden ___ surprised everyone in the room.", "resignation", "resign", "resigned", "resignedly", "Sau tính từ 'sudden' cần một Danh từ."),
        ("We need to find a ___ solution to this problem.", "cost-effective", "cost-effectively", "effect", "effectively", "Trước cụm danh từ 'solution' cần một Tính từ bổ nghĩa."),
        ("The company is highly ___ in the Asian market.", "competitive", "competition", "compete", "competitor", "Sau 'highly' (trạng từ) và to be 'is' cần Tính từ."),
        ("She performed ___ well in the final interview.", "exceptionally", "exceptional", "exception", "except", "Bổ nghĩa cho trạng từ 'well' cần một Trạng từ khác."),
        ("He didn't meet the ___ for the advanced programming course.", "requirements", "require", "required", "requires", "Sau mạo từ 'the' cần một Danh từ số nhiều/số ít phù hợp ngữ cảnh.")
    ]
    
    # 2. Confusing words / Prepositional idioms
    confuse_templates = [
        ("I am totally opposed ___ the new highway construction.", "to", "against", "with", "for", "Opposed to: phản đối cái gì."),
        ("The manager is responsible ___ the entire IT department.", "for", "with", "to", "about", "Responsible for: chịu trách nhiệm về..."),
        ("She takes ___ her mother; they have the same smile.", "after", "over", "up", "in", "Take after: giống ai đó (về ngoại hình/tính cách)."),
        ("Please refrain ___ smoking in the hospital area.", "from", "of", "to", "for", "Refrain from + V-ing: tránh/kiêng làm gì."),
        ("He succeeded ___ passing the difficult entrance exam.", "in", "on", "at", "for", "Succeed in + V-ing: thành công trong việc gì.")
    ]
    
    # 3. Adjectives vs Adverbs & Comparatives
    adj_adv_templates = [
        ("The soup smells absolutely ___.", "delicious", "deliciously", "deliciousness", "more delicious", "Sau các động từ tri giác (smell, taste, look, feel...) dùng Tính từ."),
        ("He ran as ___ as he could to catch the train.", "fast", "fastly", "faster", "fastest", "Cấu trúc as...as kết hợp động từ thường (ran) -> dùng trạng từ 'fast' (luôn là fast, không có fastly)."),
        ("The ___ you study, the higher your grades will be.", "harder", "hardest", "more hard", "hardly", "So sánh kép: The + adj-er / more adj, The + adj-er / more adj."),
        ("It is ___ the most interesting book I have ever read.", "by far", "much", "very", "so", "Nhấn mạnh so sánh nhất dùng 'by far'."),
        ("The population of Tokyo is larger than ___ of Paris.", "that", "those", "this", "these", "'that' thay thế cho danh từ số ít (population) để tránh lặp từ.")
    ]
    
    # 4. Connectors / Conjunctions
    conn_templates = [
        ("___ the heavy rain, the football match was postponed.", "Due to", "Because", "Although", "In spite of", "Sau ô trống là một cụm danh từ (the heavy rain) chỉ nguyên nhân -> Due to / Because of."),
        ("He likes classical music, ___ his wife prefers jazz.", "whereas", "despite", "so that", "in case", "'Whereas' (trong khi đó) chỉ sự tương phản giữa hai mệnh đề."),
        ("___ exhausted she was, she managed to finish the report.", "Exhausted as", "Although exhausted", "Despite exhausted", "However exhausted", "Cấu trúc đảo ngữ nhượng bộ: Adj + as/though + S + V."),
        ("I took my umbrella ___ it rained later in the afternoon.", "in case", "unless", "provided that", "if", "'In case': phòng khi (hành động trước để đề phòng)."),
        ("No sooner ___ the house than it started pouring.", "had we left", "we had left", "did we left", "we left", "Đảo ngữ với No sooner: No sooner had + S + V3... than S + V2.")
    ]
    
    all_templates = wf_templates * 5 + confuse_templates * 5 + adj_adv_templates * 5 + conn_templates * 5
    return generate_tense_q(all_templates)

def generate_prepositions_quiz():
    prep_templates = [
        ("I'm sorry ___ the noise outside.", "about", "for", "at", "to", "Sorry about + Noun: xin lỗi vì một sự việc/tình huống khách quan (the noise, the news)."),
        ("She's sorry ___ not calling you back.", "for", "about", "with", "in", "Sorry for + V-ing/N: xin lỗi vì một hành động do mình gây ra (not calling)."),
        ("We're sorry ___ the bad weather today.", "about", "for", "on", "from", "Sorry about + Noun: xin lỗi vì việc ngoài ý muốn/khách quan."),
        ("He apologized ___ breaking the vase.", "for", "about", "to", "at", "Apologize for + V-ing/N: Xin lỗi vì hành động mình đã làm."),
        ("I am really sorry ___ what I said yesterday.", "for", "about", "to", "in", "Sorry for + what someone did (an action)."),
        ("Are you sorry ___ the situation?", "about", "for", "at", "with", "Sorry about + Noun/thời tiết/tình huống khách quan."),
        ("She feels sorry ___ him because he is sick.", "for", "about", "to", "with", "Feel sorry for somebody: Cảm thấy thương xót, tội nghiệp cho ai đó."),
        ("They are sorry ___ the delay in the flight.", "about", "for", "of", "in", "Sorry about + Noun/sự kiện ngoài ý muốn."),
        ("I must apologize ___ my late arrival.", "for", "about", "to", "in", "Apologize for + Noun (hành động của hành khách/sự chậm trễ chủ quan)."),
        ("He is sorry ___ missing your birthday party.", "for", "about", "to", "at", "Sorry for + V-ing (hành động do chính mình thực hiện).")
    ]
    return generate_tense_q(prep_templates * 10)

def main():
    data = {}
    data['tense_1'] = get_tense_1()
    data['tense_2'] = get_tense_2()
    data['tense_3'] = get_tense_3()
    data['tense_4'] = get_tense_4()
    data['tense_5'] = get_tense_5()
    data['tense_6'] = get_tense_6()
    data['tense_7'] = get_tense_7()
    data['tense_8'] = get_tense_8()
    data['tense_9'] = get_tense_9()
    data['tense_10'] = get_tense_10()
    data['tense_11'] = get_tense_11()
    data['tense_12'] = get_tense_12()
    
    # Mixed tenses: randomly mix from all tenses
    all_tenses = []
    for i in range(1, 13):
        all_tenses.extend(data[f'tense_{i}'])
        
    random.shuffle(all_tenses)
    # Pick 200 to give 'mixed_tenses' a big pool 
    data['mixed_tenses'] = all_tenses[:200]
    
    data['sentences'] = generate_sentence_quiz()
    data['words'] = generate_word_quiz()
    data['prepositions'] = generate_prepositions_quiz()

    # JS content
    js_content = "const grammarQuizData = " + json.dumps(data, indent=4, ensure_ascii=False) + ";"
    with open("data/grammar_data.js", "w", encoding='utf-8') as f:
        f.write(js_content)
    print("Generated advanced grammar questions in data/grammar_data.js")

if __name__ == "__main__":
    main()
