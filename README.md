# TaskMan

TaskMan is a full-stack task manager built with React, Vite, Node.js, Express, MongoDB, and JWT authentication. Users can sign up, sign in, and manage personal tasks with create, edit, delete, complete, search, filter, and due-date features.

## Features

- JWT-based signup and signin
- User-scoped task CRUD
- Task completion, due dates, search, and filters
- Responsive React dashboard
- MongoDB database configured as `taskman`

## Tech Stack

- Frontend: React, Vite, Bootstrap
- Backend: Node.js, Express, Mongoose
- Database: MongoDB
- Auth: JSON Web Tokens

## Setup

1. Install backend dependencies:

```bash
cd server
npm install
```

2. Create `server/.env` from `server/.env.example` and update the values.

3. Start the backend:

```bash
npm run dev
```

4. Install frontend dependencies:

```bash
cd ../client
npm install
```

5. Start the frontend:

```bash
npm run dev
```

The frontend defaults to the deployed API at `https://task-man-gray.vercel.app`. Set `VITE_API_URL` in `client/.env.local` if you want to use a local backend.

## Deploy Frontend

This repo includes `vercel.json` for deploying the React client from the repo root. Vercel will install dependencies in `client`, run the Vite build, and serve `client/dist`.

If you deploy from the `client` directory instead, use the included `client/vercel.json` and set:

```env
VITE_API_URL=https://task-man-gray.vercel.app
```

For stricter backend CORS, set the backend `CLIENT_URL` environment variable to your deployed frontend URL.
