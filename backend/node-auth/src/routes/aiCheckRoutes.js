import { Router } from 'express';
import { checkAI } from '../controllers/aiCheckController.js';

const router = Router();

router.post('/', checkAI);

export default router;
