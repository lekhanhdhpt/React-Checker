import { Router } from 'express';
import { loginHandler, signupHandler, meHandler } from '../controllers/authController.js';

const router = Router();

router.post('/signup', signupHandler);
router.post('/login', loginHandler);
router.get('/me', meHandler);

export default router;
