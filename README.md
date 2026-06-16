<div align="center">

# 🦭 Walrus
### *Your AI-Powered Study Companion*

(currently implemented only for 12th)

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Gemini](https://img.shields.io/badge/Google-Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)

**A full-stack, AI-driven study platform built exclusively for CBSE Class 11 & 12 students.**  
Ask doubts, take mock exams, review flashcards, track your syllabus, and collaborate with peers — all in one place.

---

[✨ Features](#-features) • [🛠 Tech Stack](#-tech-stack) • [🚀 Getting Started](#-getting-started) • [📁 Project Structure](#-project-structure) • [🔑 Environment Variables](#-environment-variables) • [🤝 Contributing](#-contributing)

</div>

---

## ✨ Features

### 🤖 AI Doubt Solver
- Chat with a **CBSE-specialized AI tutor** powered by Google Gemini
- Understands subject context (Physics, Chemistry, Maths, Biology, Economics)
- Beautifully rendered **LaTeX equations** and **Markdown** responses
- Maintains session history and **persists active chat states** across browser refreshes and tab switches

### 📝 CBSE Mock Test Engine & Simulator
- Generate **full-length board-pattern papers** on demand
- Smart duration-based marking system:
  | Duration | Marks | Paper Type |
  |----------|-------|------------|
  | 30 min   | 15    | MCQ Sprint |
  | 60 min   | 25    | Unit Test  |
  | 120 min  | 50    | Half Paper |
  | 180 min  | 80    | Full Board Simulation |
- All 5 CBSE section types — **MCQ, VSA, SA, Long Answer, Case Study**
- **Strict Exam Mode (Desktop)**: Runs exam in fullscreen. Switching tabs, minimizing the window, or exiting fullscreen triggers a warning. 3 warnings automatically submits the paper.
- Live countdown timer with auto-submit
- **AI-powered evaluation & scoring** with per-question feedback
- **Error Analysis Report** — identifies weak topics and generates a targeted study plan
- **Detailed Attempt Review**: Open an interactive panel reviewing past mock test attempts with section details, student answers (MCQs color-coded), and model solutions
- **Markdown Downloads**: Download attempted mock exams as clean `.md` documents including questions, answers, and AI markings

### ⚡ Quick Practice / PYQ Drill
- Pick chapters, question type, and count
- Instant CBSE-quality question sets with reveal-on-demand model answers
- Supports MCQ, Very Short, Short, and Long Answer formats

### 🃏 Spaced Repetition Flashcards
- **Leitner Box system** (Box 1 → 2 → 3) for scientifically optimized review
- AI-generates flashcards for any chapter with one click
- Manual card creation with Markdown/LaTeX support
- Persisted to MongoDB with offline localStorage fallback
- Filter by **Subject**, **Chapter**, and **Leitner Box**

### 📊 Syllabus Tracker & Analytics
- Mark chapters as **Not Started / In Progress / Completed**
- Visual heatmap of your subject-wise coverage
- Score history across all mock tests
- Analytics dashboard with performance trends

### 👥 Community Hub
- **Doubt Forum** — post and answer questions, upvote the best solutions
- **Share Notes** — upload CBSE notes with images, links, and descriptions
  - Click any image to open a **full-screen lightbox viewer**
  - One-click **download** of any shared image
- **Virtual Study Room** — synchronized Pomodoro timer + peer chat

### 📅 Planner & Productivity
- **AI Syllabus Calendar Builder**: Automatically generates custom weekly study schedules based on exam dates and completed chapters
- **Persistent Study Schedule**: Caches study schedules in browser storage until the target exam date passes, with validation checks and one-click schedule regeneration options
- Pomodoro timer integration

### 👤 Profile & Streaks
- Daily study streak tracker 🔥
- Personalized dashboard with recent activity

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 8, Vanilla CSS |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas (Mongoose ODM) |
| **AI** | Google Gemini API |
| **Auth** | JWT + bcryptjs |
| **OCR** | Tesseract.js |
| **Icons** | Lucide React |

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster
- A [Google Gemini API key](https://ai.google.dev)

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/walrus-study.git
cd walrus-study
```

### 2. Install frontend dependencies
```bash
npm install
```

### 3. Install backend dependencies
```bash
cd server
npm install
cd ..
```

### 4. Configure environment variables
Create a `.env` file in the **root** of the project:
```env
MONGODB_URI=your_mongodb_atlas_connection_string
GEMINI_API_KEY=your_google_gemini_api_key
JWT_SECRET=your_super_secret_jwt_key
PORT=5000
```

### 5. Run the app

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 — Frontend:**
```bash
npm run dev
```

The app will be live at **http://localhost:5173** 🎉

---

## 📁 Project Structure

```
walrus-study/
├── src/
│   ├── components/
│   │   ├── Auth.jsx              # Login & Signup
│   │   ├── Sidebar.jsx           # Navigation sidebar
│   │   ├── DoubtSolver.jsx       # AI Tutor chat
│   │   ├── PracticeEngine.jsx    # Mock tests, Quick Practice, Flashcards
│   │   ├── SyllabusTracker.jsx   # Chapter progress tracker
│   │   ├── Analytics.jsx         # Performance dashboard
│   │   ├── Community.jsx         # Forum, Notes, Study Room
│   │   ├── Planner.jsx           # Study planner
│   │   ├── ProfileView.jsx       # User profile & streaks
│   │   └── MarkdownRenderer.jsx  # LaTeX + Markdown renderer
│   ├── index.css                 # Global design system
│   ├── App.jsx                   # Root component & routing
│   └── config.js                 # API base URL config
│
└── server/
    ├── models/                   # Mongoose schemas
    │   ├── User.js
    │   ├── UserProgress.js
    │   ├── ChatSession.js
    │   ├── DoubtForum.js
    │   ├── Flashcard.js
    │   ├── MockTest.js
    │   ├── SharedNote.js
    │   └── StudyRoomMessage.js
    ├── routes/
    │   ├── ai.js                 # Gemini AI endpoints
    │   ├── auth.js               # Auth endpoints
    │   └── student.js            # Student data endpoints
    ├── controllers/
    ├── middleware/
    └── index.js                  # Express server entry point
```

---

## 🔑 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB Atlas connection string | ✅ |
| `GEMINI_API_KEY` | Google Gemini API key | ✅ |
| `JWT_SECRET` | Secret key for JWT signing | ✅ |
| `PORT` | Backend server port (default: 5000) | ❌ |

---

## 🎨 Design System

Walrus uses a hand-crafted design system with:
- **Warm Sand / Dark Slate** dual theme
- CSS custom properties for full theme switching
- 6 accent color options (selectable per user)
- Glassmorphism cards, smooth micro-animations
- Fully responsive layout

---

## 🗺 Roadmap

- [ ] Real-time study room via WebSockets
- [ ] PDF export for mock test papers
- [ ] Push notifications for spaced repetition reminders
- [ ] Mobile app (React Native)
- [ ] Teacher/parent dashboard

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'feat: add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">

Made with ❤️ for students everywhere

**[⬆ Back to top](#-walrus)**

</div>
