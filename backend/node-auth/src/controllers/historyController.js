import asyncHandler from 'express-async-handler';
import historyRepo from '../repositories/historyRepository.js';
import reportRepo from '../repositories/reportRepository.js';

const countWords = (text = '') => (text.trim().length ? text.trim().split(/\s+/).length : 0);
const makeTitle = (text = '', maxWords = 10) => {
  const parts = text.trim().split(/\s+/).slice(0, maxWords);
  return parts.join(' ');
};

export const createHistoryWithReport = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { text, result, inputType = 'text' } = req.body || {};

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ message: 'Field "text" is required' });
  }
  if (!result || typeof result !== 'object') {
    return res.status(400).json({ message: 'Field "result" is required' });
  }

  const wordCount = countWords(text);
  const title = makeTitle(text, 12);

  const history = await historyRepo.create({
    user: userId,
    inputType,
    text,
    wordCount,
    title,
    status: 'completed',
  });

  const report = await reportRepo.create({
    history: history._id,
    isPlagiarism: !!result.is_plagiarism,
    confidence: Number(result.confidence ?? 0),
    threshold: Number(result.threshold ?? 0),
    bestMatch: result.best_match ?? null,
    topMatches: Array.isArray(result.top_matches) ? result.top_matches : [],
    sentenceAnalysis: Array.isArray(result.sentence_analysis) ? result.sentence_analysis : [],
    stats: result.stats ?? {},
    fullResponse: result,
  });

  return res.status(201).json({
    history: {
      id: history._id.toString(),
      title: history.title,
      wordCount: history.wordCount,
      createdAt: history.createdAt,
    },
    report: {
      id: report._id.toString(),
      confidence: report.confidence,
      isPlagiarism: report.isPlagiarism,
    },
  });
});

export const listHistory = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const items = await historyRepo.findByUser(userId);
  const mapped = items.map((h) => ({
    id: h._id.toString(),
    title: h.title,
    wordCount: h.wordCount,
    createdAt: h.createdAt,
    similarity: h?.report ? Number(((h.report.confidence || 0) * 100).toFixed(1)) : 0,
    reportId: h?.report?._id?.toString() || null,
  }));
  res.json({ items: mapped });
});

export const getReport = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  const history = await historyRepo.findByIdAndUser(id, userId);
  if (!history) return res.status(404).json({ message: 'Not found' });
  res.json({
    history: {
      id: history._id.toString(),
      title: history.title,
      text: history.text,
      wordCount: history.wordCount,
      createdAt: history.createdAt,
    },
    report: history.report,
  });
});
