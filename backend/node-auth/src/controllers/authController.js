import asyncHandler from 'express-async-handler';
import { login, register, verifyToken } from '../services/authService.js';
import userRepo from '../repositories/userRepository.js';

export const signupHandler = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  const user = await register({ name, email, password });
  return res.status(201).json({ user });
});

export const loginHandler = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  const result = await login({ email, password });
  return res.json(result);
});

export const meHandler = asyncHandler(async (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  const payload = verifyToken(token);
  const user = await userRepo.findById(payload.sub);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  res.json({ user: { id: user._id.toString(), name: user.name, email: user.email } });
});
