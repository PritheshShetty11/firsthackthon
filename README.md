Apna Family Tree 🌳

Overview

- Gmail-authenticated family tree platform with admin roles, read-only members, and mock subscription.
- Stack: React (Vite) + Tailwind + React Router + React Flow, Node.js/Express, MongoDB/Mongoose, Firebase Auth.
- Deploy: Frontend on Vercel, Backend on Render/Heroku, DB on MongoDB Atlas.

Monorepo Structure

```
backend/
frontend/
```

Quick Start (Local)

1) Backend

- Copy `backend/.env.example` to `backend/.env` and fill in values.
- Install deps and run:

```bash
cd backend
npm install
npm run dev
```

2) Frontend

- Copy `frontend/env.example` to `frontend/.env` and fill in values.
- Install deps and run:

```bash
cd frontend
npm install
npm run dev
```

Environment Variables

- Backend (`backend/.env`)
  - `MONGODB_URI` – MongoDB Atlas connection string
  - `PORT` – Server port (default 4000)
  - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` – Firebase Admin credentials
  - `ALLOWED_ORIGINS` – Comma-separated list for CORS (e.g., http://localhost:5173)

API Preview

- `GET /health` – Health check
- Authenticated routes (to be added): Families, Members, Payments

Deployment

- Frontend: Deploy `frontend` to Vercel. Set envs from `frontend/env.example`.
- Backend: Deploy `backend` to Render/Heroku. Set envs from `backend/env.example`.
- Database: Use MongoDB Atlas and put `MONGODB_URI` in backend env.
- CORS: Add your Vercel frontend URL to `ALLOWED_ORIGINS` in backend env.

License

MIT


