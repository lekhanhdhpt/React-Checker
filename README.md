# Vietnamese Plagiarism Checker

Hệ thống kiểm tra đạo văn tiếng Việt sử dụng Machine Learning và Bi-Encoder với giao diện web React.

## 🚀 Tính Năng

- ✅ Kiểm tra đạo văn cho văn bản tiếng Việt
- ✅ Highlight các câu nghi ngờ đạo văn với mã màu (đỏ, cam, vàng)
- ✅ Hiển thị điểm confidence (độ chắc chắn)
- ✅ Hiển thị nguồn tham khảo với link
- ✅ Hỗ trợ nhập text trực tiếp hoặc upload file
- ✅ Phân tích theo từng câu
- ✅ Sử dụng model đã train sẵn (không cần train lại)

## 📋 Yêu Cầu Hệ Thống

- **Python**: 3.9 hoặc cao hơn
- **Node.js**: 16 hoặc cao hơn
- **RAM**: Tối thiểu 8GB (model files khá lớn)
- **Disk**: ~2GB cho model files và dependencies

## 🔧 Cài Đặt Nhanh

### Windows

```bash
# 1. Clone repository
git clone <repository-url>
cd React-Checker

# 2. Cài đặt Python dependencies
pip install -r api/requirements.txt

# 3. Cài đặt Node dependencies
npm install

# 4. Chạy hệ thống
start.bat
```

### Linux/Mac

```bash
# 1. Clone repository
git clone <repository-url>
cd React-Checker

# 2. Cài đặt Python dependencies
pip install -r api/requirements.txt

# 3. Cài đặt Node dependencies
npm install

# 4. Chạy hệ thống
chmod +x start.sh
./start.sh
```

## 📖 Hướng Dẫn Chi Tiết

Xem file [SETUP_GUIDE.md](./SETUP_GUIDE.md) để có hướng dẫn chi tiết về:
- Cài đặt từng bước
- Cấu trúc API
- Troubleshooting
- Giải thích kết quả

## 🎯 Cách Sử Dụng

1. **Khởi động hệ thống**:
   - Chạy `start.bat` (Windows) hoặc `./start.sh` (Linux/Mac)
   - Hoặc chạy thủ công:
     - Terminal 1: `python api/plagiarism_api.py`
     - Terminal 2: `npm run dev`

2. **Truy cập website**:
   - Mở browser: `http://localhost:5173`

3. **Kiểm tra đạo văn**:
   - Click "Checker" trên menu
   - Nhập hoặc upload văn bản
   - Click "Check for Plagiarism"
   - Xem kết quả với highlight

## 🎨 Màu Highlight

- 🔴 **Đỏ**: Confidence ≥ 70% - Rất nghi ngờ đạo văn
- 🟠 **Cam**: Confidence 50-70% - Khá nghi ngờ đạo văn  
- 🟡 **Vàng**: Confidence 30-50% - Hơi nghi ngờ đạo văn
- ⚪ **Không màu**: Văn bản nguyên bản

## 📊 Kết Quả Hiển Thị

### 1. Trạng thái
- **Đạo văn** hoặc **Không đạo văn**

### 2. Điểm Confidence
- 0-30%: Nguyên bản
- 30-50%: Cần xem xét
- 50-70%: Có dấu hiệu đạo văn
- 70-100%: Rất cao khả năng đạo văn

### 3. Văn bản với Highlight
- Các câu được tô màu theo mức độ nghi ngờ
- Hover để xem thông tin nguồn

### 4. Danh sách nguồn
- Top các văn bản tương đồng nhất
- Link đến nguồn gốc (nếu có)

## 🏗️ Kiến Trúc Hệ Thống

```
┌─────────────────┐
│  React Frontend │  (Port 5173)
│  - CheckerPage  │
│  - ResultsPage  │
└────────┬────────┘
         │ HTTP Request
         ▼
┌─────────────────┐
│   Flask API     │  (Port 5000)
│  - Load Models  │
│  - Detection    │
│  - Analysis     │
└────────┬────────┘
         │ Load
         ▼
┌─────────────────┐
│  Model Files    │
│  - .pkl         │
│  - .npy         │
│  - .faiss       │
│  - .json        │
└─────────────────┘
```

## 📁 Cấu Trúc Thư Mục

```
React-Checker/
├── api/
│   ├── plagiarism_api.py       # Flask API server
│   └── requirements.txt         # Python dependencies
├── src/
│   ├── components/
│   │   ├── HighlightedText.jsx # Highlight component
│   │   └── ui/                  # UI components
│   └── pages/
│       ├── CheckerPage.jsx      # Input page
│       └── ResultsPage.jsx      # Results page
├── public/                      # Static assets
├── Model files:
│   ├── chunk_embeddings_normalized.npy
│   ├── chunk_faiss_index.faiss
│   ├── chunk_metadata.pkl
│   ├── corpus_chunks.pkl
│   ├── vn_plagiarism_corpus.json
│   └── vn_plagiarism_queries.json
├── package.json                 # Node dependencies
├── start.bat                    # Windows startup script
├── start.sh                     # Linux/Mac startup script
├── SETUP_GUIDE.md              # Detailed setup guide
└── README.md                    # This file
```

## 🔬 Technical Details

### Backend (Flask API)
- **Framework**: Flask với CORS support
- **Model**: Vietnamese Bi-Encoder (bkai-foundation-models)
- **Search**: FAISS for efficient similarity search
- **Features**: Document scoring, sentence-level analysis

### Frontend (React)
- **Framework**: React 18 + Vite
- **Routing**: React Router
- **Styling**: Tailwind CSS
- **Components**: Custom UI components

### Models
- **Bi-Encoder**: Pre-trained Vietnamese sentence transformer
- **Embeddings**: 768-dimensional vectors
- **Index**: FAISS IndexFlatIP for cosine similarity
- **Corpus**: Vietnamese plagiarism dataset

## ⚠️ Lưu Ý Quan Trọng

1. **Model files phải có đầy đủ**: Hệ thống cần tất cả 6 file model trong thư mục gốc
2. **Không train lại**: Model đã được train sẵn, chỉ cần load và sử dụng
3. **RAM**: Lần đầu khởi động cần ~10-30 giây để load model vào RAM
4. **Performance**: Mỗi lần check văn bản mất ~2-5 giây tùy độ dài

## 🐛 Troubleshooting

### API không khởi động
- Kiểm tra có đủ file model không
- Kiểm tra Python dependencies: `pip install -r api/requirements.txt`
- Xem log trong terminal chạy Flask

### Frontend không connect API
- Đảm bảo Flask đang chạy trên port 5000
- Kiểm tra CORS (đã được enable)
- Xem Console trong browser (F12)

### Out of Memory
- Đóng các ứng dụng khác
- Tăng RAM nếu có thể
- Giảm `max_query_chunks` trong detector config

## 📝 License

[Specify your license here]

## 👥 Contributors

[Add contributors here]

## 📧 Contact

[Add contact information]
