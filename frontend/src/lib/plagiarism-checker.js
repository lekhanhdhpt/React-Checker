// Flask API endpoint
const API_URL = 'http://localhost:5000/api';

// Main plagiarism check function - calls Flask backend
export async function checkPlagiarism(text) {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const response = await fetch(`${API_URL}/check-plagiarism`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    
    // Transform backend response to match frontend expectations
    return {
      overallSimilarity: Math.round(result.overallSimilarity * 10) / 10,
      originalPercentage: Math.round(result.originalPercentage * 10) / 10,
      plagiarizedPercentage: Math.round(result.plagiarizedPercentage * 10) / 10,
      matches: result.matches || [],
      analyzedText: result.analyzedText,
      isPlagiarism: result.isPlagiarism,
      confidence: result.confidence,
      threshold: result.threshold,
    };
  } catch (error) {
    console.error('Error checking plagiarism:', error);
    if (String(error).toLowerCase().includes('401')) {
      throw new Error('Unauthorized. Please sign in to continue.');
    }
    throw new Error('Failed to check plagiarism. Please make sure the backend server is running on port 5000.');
  }
}
