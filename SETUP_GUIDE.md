# Hướng Dẫn Chạy Hệ Thống Plagiarism Checker

## Tổng Quan
Hệ thống được tách thành 2 phần rõ ràng:
1. **backend/** (Flask API): Xử lý detection sử dụng model đã train
2. **frontend/** (React): Giao diện web để người dùng nhập/upload văn bản

## Yêu Cầu Hệ Thống
- Python 3.9+
- Node.js 16+
- Các file model đã train (đặt trong `backend/data`):
  - `vn_plagiarism_corpus.json`
  - `vn_plagiarism_queries.json`
  - `corpus_chunks.pkl`
  - `chunk_embeddings_normalized.npy`
  - `chunk_faiss_index.faiss`
  - `chunk_metadata.pkl`

## Cài Đặt và Chạy

### 1. Cài Đặt Backend (Flask API)

```bash
# Di chuyển vào thư mục project
cd path/to/React-Checker

# Cài đặt dependencies cho Python
pip install -r backend/api/requirements.txt

# Hoặc nếu dùng notebook environment đã có:
# Đảm bảo các thư viện sau đã được cài:
# Flask, flask-cors, sentence-transformers, faiss-cpu, numpy, pandas, scikit-learn, torch
```

### 2. Chạy Flask API Server

```bash
# Từ thư mục gốc của project
python backend/api/plagiarism_api.py
```

Server sẽ chạy tại: `http://localhost:5000`

**Lưu ý**: Đảm bảo các file model (`.pkl`, `.npy`, `.faiss`, `.json`) nằm trong thư mục `backend/data`.

### 3. Cài Đặt và Chạy Frontend (React)

Mở terminal mới (giữ Flask server chạy):

```bash
# Cài đặt dependencies
cd frontend
npm install

# Chạy development server (CRA)
npm start
```

Frontend sẽ chạy tại: `http://localhost:3000` (hoặc port khác nếu 3000 bị chiếm)

## Sử Dụng Hệ Thống

### Luồng Hoạt Động:

1. **Truy cập website**: Mở `http://localhost:5173` trên browser
2. **Vào trang Checker**: Click "Checker" trên navigation
3. **Nhập văn bản**:
   - **Tab "Text"**: Paste văn bản trực tiếp
   - **Tab "Upload"**: Upload file .txt (PDF/DOC cần implement thêm)
   - **Tab "Samples"**: Chọn văn bản mẫu để test
4. **Click "Check for Plagiarism"**: Hệ thống sẽ gửi văn bản đến Flask API
5. **Xem kết quả**: Trang Results hiển thị:
   - **Trạng thái**: Đạo văn hay Không
   - **Điểm Confidence**: % chắc chắn về kết quả (càng cao càng chắc là đạo văn)
   - **Văn bản với highlight**:
     - 🔴 Đỏ: Confidence cao (≥70%) - Rất nghi ngờ
     - 🟠 Cam: Confidence trung bình (50-70%) - Khá nghi ngờ
     - 🟡 Vàng: Confidence thấp (30-50%) - Hơi nghi ngờ
     - ⚪ Không màu: Nguyên bản
   - **Nguồn tham khảo**: Danh sách các văn bản tương đồng với link nguồn

## Cấu Trúc API Response

### Endpoint: POST `/api/check-plagiarism`

**Request:**
```json
{
  "text": "Văn bản cần kiểm tra..."
}
```

**Response:**
```json
{
  "is_plagiarism": true/false,
  "confidence": 0.75,
  "threshold": 0.6,
  "original_probability": 0.25,
  "best_match": {
    "doc_id": "corpus_123",
    "title": "Tiêu đề văn bản nguồn",
    "url": "https://...",
    "final_score": 0.85
  },
  "top_matches": [
    {
      "doc_id": "corpus_123",
      "title": "...",
      "url": "...",
      "score": 0.85,
      "num_chunks": 5
    }
  ],
  "sentence_analysis": [
    {
      "sentence": "Câu văn...",
      "index": 0,
      "word_count": 15,
      "is_suspicious": true,
      "confidence": 0.75,
      "best_doc_id": "corpus_123",
      "source_url": "https://...",
      "source_title": "..."
    }
  ],
  "stats": {
    "query_words": 250,
    "query_chunks": 5,
    "corpus_matches": 100,
    "detection_time": 2.5,
    "analysis_time": 1.2,
    "total_time": 3.7
  }
}
```

## Giải Thích Kết Quả

### Confidence Score (Điểm Chắc Chắn)
- **0.0 - 0.3**: Văn bản nguyên bản, không đạo văn
- **0.3 - 0.5**: Có một vài phần tương đồng, cần xem xét
- **0.5 - 0.7**: Có dấu hiệu đạo văn rõ ràng
- **0.7 - 1.0**: Rất cao, gần như chắc chắn là đạo văn

### Original Probability
- = 1 - Confidence
- Thể hiện xác suất văn bản là nguyên bản

## Troubleshooting

### Lỗi: "API error: 500"
- Kiểm tra Flask server có đang chạy không
- Kiểm tra console của Flask server xem có lỗi gì
- Đảm bảo các file model đã có đầy đủ

### Lỗi: "Connection refused"
- Đảm bảo Flask server đang chạy trên port 5000
- Kiểm tra firewall không block port 5000

### Lỗi: "Module not found"
- Cài đặt lại dependencies: `pip install -r api/requirements.txt`

### Frontend không connect được API
- Kiểm tra URL API trong `src/lib/plagiarism-checker.js`: `http://localhost:5000/api`
- Đảm bảo CORS được enable (đã có trong Flask server)

## File Structure

```
React-Checker/
├── backend/
│   ├── api/
│   │   ├── plagiarism_api.py       # Flask API server
│   │   └── requirements.txt        # Python dependencies
│   ├── data/                       # Model & index files
│   │   ├── vn_plagiarism_corpus.json
│   │   ├── vn_plagiarism_queries.json
│   │   ├── corpus_chunks.pkl
│   │   ├── chunk_embeddings_normalized.npy
│   │   ├── chunk_faiss_index.faiss
│   │   └── chunk_metadata.pkl
│   └── notebooks/
│       └── Plagiarism_check_final.ipynb
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── test-upload.html
├── start.bat                      # Script khởi động cả backend + frontend (Windows)
└── start.sh                       # Script khởi động cả backend + frontend (Linux/Mac)
```

## Lưu Ý Quan Trọng

1. **Không chạy lại cells training**: Các model đã được train sẵn và lưu trong file `.pkl`, `.npy`, `.faiss`. Flask API sẽ load trực tiếp các file này.

2. **Threshold có thể điều chỉnh**: Trong `plagiarism_api.py`, dòng 449:
   ```python
   threshold=0.6  # Có thể thay đổi (0.0-1.0)
   ```

3. **Performance**: 
   - Lần đầu load model mất ~10-30 giây
   - Mỗi lần check văn bản mất ~2-5 giây tùy độ dài

4. **File size**: Các file model khá lớn (~100-500MB), cần đảm bảo đủ RAM

## Liên Hệ và Hỗ Trợ

Nếu gặp vấn đề, kiểm tra:
1. Console của Flask server (terminal chạy `python api/plagiarism_api.py`)
2. Console của browser (F12 -> Console tab)
3. Network tab trong browser để xem API request/response
