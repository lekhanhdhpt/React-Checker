# Auth API (Node.js + Express + MongoDB)

Simple authentication backend providing signup and login endpoints for the React app.

## Endpoints

- POST /api/auth/signup
  - Body: { name, email, password }
  - 201 -> { user }
- POST /api/auth/login
  - Body: { email, password }
  - 200 -> { user, token }
- GET /api/auth/me
  - Header: Authorization: Bearer <token>
  - 200 -> { user }

## Setup

1. Copy `.env.example` to `.env` and adjust values.
2. Install dependencies:

```bash
cd backend/node-auth
npm install
```

3. Run in dev:

```bash
npm run dev
```

The server listens on `PORT` (default 5001).

## Notes
- Uses Mongoose with unique email index.
- Passwords are hashed with bcrypt.
- JWT tokens expire in 7 days.
