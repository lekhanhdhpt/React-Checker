import asyncHandler from 'express-async-handler';

export const checkAI = asyncHandler(async (req, res) => {
  const { text } = req.body || {};

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ message: 'Field "text" is required' });
  }

  if (text.trim().length === 0) {
    return res.status(400).json({ message: 'Text cannot be empty' });
  }

  try {
    const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5000';
    
    const response = await fetch(`${FLASK_API_URL}/api/check-ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
      timeout: 60000,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: errorData.error || 'AI detection failed',
        message: errorData.message || `Flask API returned status ${response.status}`,
      });
    }

    const result = await response.json();

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('AI Check Error:', error);
    return res.status(500).json({
      error: 'Failed to check for AI content',
      message: error.message || 'Internal server error',
    });
  }
});
