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

The frontend defaults to `http://localhost:3000` for the API. Set `VITE_API_URL` if your backend runs somewhere else.
