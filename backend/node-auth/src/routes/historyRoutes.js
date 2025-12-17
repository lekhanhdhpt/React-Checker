import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { createHistoryWithReport, listHistory, getReport } from '../controllers/historyController.js';

const router = Router();

router.post('/', requireAuth, createHistoryWithReport);
router.get('/', requireAuth, listHistory);
router.get('/:id', requireAuth, getReport);

export default router;
