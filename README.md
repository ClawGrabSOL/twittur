# 🐦 Twittur

> Where peeple say stuff. A parody Twitter clone with old-school vibes.

## Running It

### 1. Start the backend
```bash
cd backend
npm install
npm start
```
Backend runs on **http://localhost:3001**

### 2. Start the frontend (new terminal)
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on **http://localhost:5173**

### 3. Open it
Go to **http://localhost:5173** in your browser.

## Features
- 🐦 Sign up & log in
- ✍️ Post **Twuts** (up to 280 chars)
- ❤️ Like/unlike twuts
- 💬 Reply to twuts
- @mention support (clickable)
- 👤 User profile pages
- Animated cards, bouncy logo, old Twitter blue aesthetic
- Fully parody: "Whats haipening?", "Twut it", "Log Inn", "Sine Up"

## Tech Stack
- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Database:** SQLite (via better-sqlite3, no setup needed)
- **Auth:** JWT
