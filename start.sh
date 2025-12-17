#!/bin/bash

# Script to run both Flask API and React frontend

echo "========================================="
echo "Starting Plagiarism Checker System"
echo "========================================="

# Check if in correct directory
if [ ! -f "frontend/package.json" ]; then
    echo "Error: Please run this script from the React-Checker project root"
    exit 1
fi

# Check if model files exist
echo "Checking for required model files in backend/data..."
required_files=(
    "backend/data/vn_plagiarism_corpus.json"
    "backend/data/vn_plagiarism_queries.json"
    "backend/data/corpus_chunks.pkl"
    "backend/data/chunk_embeddings_normalized.npy"
    "backend/data/chunk_faiss_index.faiss"
    "backend/data/chunk_metadata.pkl"
)

missing_files=()
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -ne 0 ]; then
    echo "Error: Missing required model files:"
    for file in "${missing_files[@]}"; do
        echo "  - $file"
    done
    echo ""
    echo "Please ensure all model files are in the backend/data directory."
    exit 1
fi

echo "✓ All model files found"
echo ""

# Start Flask API in background
echo "Starting Flask API server..."
python backend/api/plagiarism_api.py &
FLASK_PID=$!
echo "Flask API started (PID: $FLASK_PID)"
echo "API running at: http://localhost:5000"
echo ""

# Wait for Flask to start
echo "Waiting for API to initialize (this may take 10-30 seconds)..."
sleep 5

# Check if Flask is running
if ! ps -p $FLASK_PID > /dev/null; then
    echo "Error: Flask API failed to start"
    exit 1
fi

# Start React frontend
echo ""
echo "Starting React frontend..."
cd frontend && npm start &
REACT_PID=$!
echo "React frontend started (PID: $REACT_PID)"
echo ""

echo "========================================="
echo "System is running!"
echo "========================================="
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Handle Ctrl+C
trap "echo ''; echo 'Stopping servers...'; kill $FLASK_PID $REACT_PID; exit" INT

# Wait for processes
wait
