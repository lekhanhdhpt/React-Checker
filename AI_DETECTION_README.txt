AI DETECTION FEATURE - SETUP & USAGE GUIDE
==========================================

OVERVIEW
--------
This feature adds AI content detection capability to your plagiarism checker application.
It analyzes Vietnamese text to determine if it was written by AI or humans.

ARCHITECTURE
------------
1. Python Flask API (plagiarism_api.py):
   - Endpoint: POST /api/check-ai
   - Loads PhoBERT-based detector model
   - Returns combined_prob_ai (confidence score) and combined_label

2. Node.js Backend (aiCheckController.js):
   - Route: POST /api/ai-check
   - Acts as proxy to Flask API
   - Handles authentication and history saving

3. React Frontend:
   - CheckerPage.jsx: Added "Check for AI" button
   - ResultsPage.jsx: New AICheckResultsPage component for displaying results

SETUP INSTRUCTIONS
------------------

1. Install Python Dependencies:
   cd backend/api
   pip install -r requirements.txt

2. Ensure AI Model is Available:
   - Model path: backend/model/detector_phobert/
   - The model should contain:
     * config.json
     * model.safetensors
     * tokenizer files (vocab.txt, bpe.codes, etc.)

3. Start Flask API Server:
   cd backend/api
   python plagiarism_api.py
   
   Server runs on: http://localhost:5000

4. Start Node.js Backend:
   cd backend/node-auth
   npm start
   
   Server runs on: http://localhost:5001

5. Start React Frontend:
   cd frontend
   npm start
   
   App runs on: http://localhost:3000

USAGE
-----

1. Navigate to Checker page
2. Enter Vietnamese text or upload a file
3. Click "Check for AI" button (next to "Check for Plagiarism")
4. View results showing:
   - Diem confident (Confidence Score): 0-100%
   - Label classification:
     * 0-40%: "Nguoi viet" (Human written)
     * 40-60%: "Nghi van" (Suspicious)
     * 60-80%: "Co dau hieu AI" (AI indicators)
     * 80-100%: "AI viet" (AI written)
   - Highlighted suspicious sentences
   - Sentence-by-sentence analysis

TECHNICAL DETAILS
-----------------

Model Processing:
- Text is split into sentences
- Each sentence is tokenized using PhoBERT tokenizer
- Sliding window approach (256 tokens) for long sentences
- Per-sentence AI probability calculated
- Overall score = mean of all window scores

Response Format:
{
  "combined_prob_ai": 0.75,
  "combined_label": "Co dau hieu AI",
  "sentence_count": 10,
  "suspicious_count": 5,
  "sentence_analysis": [...],
  "high_risk_sentences": [...],
  "stats": {
    "total_sentences": 10,
    "avg_confidence": 0.65,
    "max_confidence": 0.88
  }
}

NOTES
-----
- First request may be slow as model loads into memory
- Subsequent requests are faster (model cached)
- Requires GPU for optimal performance (CPU works but slower)
- Vietnamese text works best (model trained on Vietnamese)
- Minimum 5 words per sentence for analysis

TROUBLESHOOTING
---------------

Problem: "AI model not found" error
Solution: Check that backend/model/detector_phobert/ exists and contains model files

Problem: Slow performance
Solution: 
  - Use GPU if available
  - Reduce max_windows parameter
  - Process shorter texts

Problem: Node.js cannot connect to Flask API
Solution:
  - Ensure Flask server is running on port 5000
  - Check FLASK_API_URL environment variable
  - Verify CORS is enabled

Problem: Frontend shows error
Solution:
  - Check browser console for details
  - Verify Node.js server is running
  - Check network tab for API call failures
