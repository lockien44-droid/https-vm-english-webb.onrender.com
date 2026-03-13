import urllib.request
import json
import os
import time

# ==========================================
# 🛑 HƯỚNG DẪN DÀNH CHO BẠN:
# 1. Đi tới trang: https://aistudio.google.com/app/apikey (Đăng nhập bằng Gmail)
# 2. Bấm "Create API key"
# 3. Copy đoạn mã key dài ngoằng đó và DÁN VÀO GIỮA DẤU NGOẶC KÉP Ở DÒNG DƯỚI ĐÂY:
# ==========================================

API_KEY = "YOUR_GEMINI_API_KEY_HERE"

# ==========================================


topics = [
    {"id": "number", "name": "Số đếm"},
    {"id": "time", "name": "Thời gian"},
    {"id": "weather", "name": "Thời tiết"},
    {"id": "nature", "name": "Thiên nhiên"},
    {"id": "city", "name": "Thành phố"},
    {"id": "job", "name": "Nghề nghiệp"},
    {"id": "sport", "name": "Thể thao"},
    {"id": "music", "name": "Âm nhạc"},
    {"id": "tech", "name": "Công nghệ"},
    {"id": "electronic", "name": "Thiết bị điện tử"},
    {"id": "travel", "name": "Du lịch"},
    {"id": "shopping", "name": "Mua sắm"},
    {"id": "dessert", "name": "Tráng miệng"},
    {"id": "cleaning", "name": "Dọn dẹp"},
    {"id": "game", "name": "Trò chơi"}
]

def generate_vocab(topic_id, topic_name):
    prompt = f"""
    Bạn là một chuyên gia ngôn ngữ Anh-Việt. Nhiệm vụ của bạn:
    Tạo CHÍNH XÁC MỘT MẢNG JSON hợp lệ. Không có DẤU BACKTICK (```json) hay bất kỳ văn bản giải thích nào khác. 
    Chỉ trả về trực tiếp Mảng JSON.
    Nội dung: 100 từ vựng tiếng Anh thông dụng nhất, cốt lõi nhất, có tính ứng dụng cao nhất thuộc chủ đề: '{topic_name}'.
    Cấu trúc bắt buộc:
    [
      {{"en": "từ tiếng anh", "vi": "nghĩa tiếng việt"}},
      {{"en": "từ tiếng anh 2", "vi": "nghĩa tiếng việt 2"}}
    ]
    """
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={API_KEY}"
    
    data = {"contents": [{"parts":[{"text": prompt}]}]}
    
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
    
    print(f"🔄 Đang nhờ AI soạn 100 từ cho chủ đề '{topic_name}'...")
    
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            text_response = result['candidates'][0]['content']['parts'][0]['text']
            
            # Làm sạch chuỗi JSON nếu AI vô tình bọc trong ```json
            text_response = text_response.replace("```json", "").replace("```", "").strip()
            
            # Parse để kiểm tra lỗi cú pháp
            json_data = json.loads(text_response)
            
            filepath = os.path.join("data", "topics", f"{topic_id}.json")
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(json_data, f, ensure_ascii=False, indent=2)
                
            print(f"✅ Xong! Đã lưu file: {filepath} ({len(json_data)} từ)\n")
            
    except Exception as e:
        print(f"❌ Lỗi khi tạo '{topic_name}'. Lý do: {e}")

if API_KEY == "YOUR_GEMINI_API_KEY_HERE" or API_KEY == "":
    print("❌ BẠN QUÊN CHƯA DÁN API KEY RỒI! Hãy mở file này ra và dán key vào biến API_KEY nhé.")
else:
    print("🚀 Bắt đầu quá trình Tự động tạo Siêu dữ liệu Từ vựng...\n")
    for topic in topics:
        generate_vocab(topic["id"], topic["name"])
        time.sleep(1) # Nghỉ 1 giây để tránh bị chặn API do call quá nhanh
        
    print("🎉 HOÀN TẤT TẤT CẢ 15 CHỦ ĐỀ! Bạn đã có thể F5 lại web và tận hưởng!")
