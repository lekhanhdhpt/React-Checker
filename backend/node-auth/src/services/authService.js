import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import userRepo from '../repositories/userRepository.js';

const SALT_ROUNDS = 10;

export async function register({ name, email, password }) {
  const existing = await userRepo.findByEmail(email);
  if (existing) {
    const err = new Error('Email already registered');
    err.status = 409;
    throw err;
  }
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await userRepo.create({ name, email, passwordHash });
  return sanitize(user);
}

export async function login({ email, password }) {
  const user = await userRepo.findByEmail(email);
  if (!user) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }
  const token = createToken(user);
  return { user: sanitize(user), token };
}

export function verifyToken(token) {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return payload;
  } catch (e) {
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }
}

function createToken(user) {
  const payload = { sub: user._id.toString(), email: user.email };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function sanitize(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
