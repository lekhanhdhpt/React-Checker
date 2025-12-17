@echo off
REM Script to run both Flask API and React frontend on Windows

echo =========================================
echo Starting Plagiarism Checker System
echo =========================================

REM Check if in correct directory
if not exist "frontend\package.json" (
    echo Error: Please run this script from the React-Checker project root
    exit /b 1
)

REM Check if model files exist
echo Checking for required model files in backend\\data...
set "missing="

if not exist "backend\data\vn_plagiarism_corpus.json" set "missing=%missing% vn_plagiarism_corpus.json"
if not exist "backend\data\vn_plagiarism_queries.json" set "missing=%missing% vn_plagiarism_queries.json"
if not exist "backend\data\corpus_chunks.pkl" set "missing=%missing% corpus_chunks.pkl"
if not exist "backend\data\chunk_embeddings_normalized.npy" set "missing=%missing% chunk_embeddings_normalized.npy"
if not exist "backend\data\chunk_faiss_index.faiss" set "missing=%missing% chunk_faiss_index.faiss"
if not exist "backend\data\chunk_metadata.pkl" set "missing=%missing% chunk_metadata.pkl"

if defined missing (
    echo Error: Missing required model files:
    echo %missing%
    echo.
    echo Please ensure all model files are in the backend\data directory.
    exit /b 1
)

echo All model files found
echo.

REM Start Flask API in new window
echo Starting Flask API server...
start "Flask API Server" cmd /k "python backend\api\plagiarism_api.py"
echo Flask API started in new window
echo API will run at: http://localhost:5000
echo.

REM Wait for Flask to start
echo Waiting for API to initialize (this may take 10-30 seconds)...
timeout /t 5 /nobreak > nul

REM Start React frontend in new window
echo.
echo Starting React frontend...
start "React Frontend" cmd /k "cd frontend && npm start"
echo React frontend started in new window
echo.

echo =========================================
echo System is running!
echo =========================================
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000
echo.
echo Two terminal windows have been opened:
echo   1. Flask API Server (Python)
echo   2. React Frontend (npm)
echo.
echo Close both windows to stop the servers
echo.

pause
