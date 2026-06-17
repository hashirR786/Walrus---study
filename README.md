<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0F2027,50:4285F4,100:47A248&height=220&section=header&text=Walrus&fontSize=80&fontColor=ffffff&animation=fadeIn&fontAlignY=35&desc=Your%20AI-Powered%20Study%20Companion&descAlignY=55&descSize=20" width="100%" />

<img src="https://readme-typing-svg.demolab.com/?font=Fira+Code&size=20&pause=1500&color=4285F4&center=true&vCenter=true&width=700&lines=Ask+doubts.+Take+mock+exams.+Review+flashcards.;Track+your+syllabus.+Collaborate+with+peers.;Built+exclusively+for+CBSE+Class+11+%26+12.;Powered+by+Google+Gemini+AI.+%F0%9F%A6%AD" alt="Typing SVG" />

<sub>🚧 currently implemented only for 12th 🚧</sub>

<br/>

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Redis](https://img.shields.io/badge/Redis-Cache-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)
[![Gemini](https://img.shields.io/badge/Google-Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)

<br/>

![GitHub stars](https://img.shields.io/github/stars/hashirR786/walrus-study?style=for-the-badge&color=FFD43B&logo=github)
![GitHub forks](https://img.shields.io/github/forks/hashirR786/walrus-study?style=for-the-badge&color=4285F4&logo=github)
![GitHub issues](https://img.shields.io/github/issues/hashirR786/walrus-study?style=for-the-badge&color=FF6B6B&logo=github)
![Last commit](https://img.shields.io/github/last-commit/hashirR786/walrus-study?style=for-the-badge&color=47A248&logo=github)
![License](https://img.shields.io/badge/License-MIT-blueviolet?style=for-the-badge)

**A full-stack, AI-driven study platform built exclusively for CBSE Class 11 & 12 students.**
Ask doubts, take mock exams, review flashcards, track your syllabus, and collaborate with peers — all in one place.

<br/>

<a href="#-features">✨ Features</a> •
<a href="#-tech-stack">🛠 Tech Stack</a> •
<a href="#-getting-started">🚀 Getting Started</a> •
<a href="#-project-structure">📁 Structure</a> •
<a href="#-environment-variables">🔑 Env Vars</a> •
<a href="#-contributing">🤝 Contributing</a>

</div>

<br/>

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:4285F4,100:47A248&height=3&section=header" width="100%"/>

## 📸 Sneak Peek

<div align="center">
<table>
<tr>
<td width="50%" align="center"><i>Dashboard</i><br/><img src="./screenshots/dashboard.png" width="100%"/></td>
<td width="50%" align="center"><i>AI Doubt Solver</i><br/><img src="./screenshots/doubt-solver.png" width="100%"/></td>
</tr>
<tr>
<td width="50%" align="center"><i>Mock Test Simulator</i><br/><img src="./screenshots/mock-test.png" width="100%"/></td>
<td width="50%" align="center"><i>Flashcards</i><br/><img src="./screenshots/flashcards.png" width="100%"/></td>
</tr>
</table>

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:4285F4,100:47A248&height=3&section=header" width="100%"/>

## ✨ Features

<details open>
<summary><b>🤖 AI Doubt Solver</b></summary>
<br/>

- Chat with a **CBSE-specialized AI tutor** powered by Google Gemini (upgraded to `gemini-2.5-flash`)
- Understands subject context (Physics, Chemistry, Maths, Biology, Economics)
- Beautifully rendered **LaTeX equations** and **Markdown** responses
- Caches responses in **Redis** (Upstash in cloud, custom RedVER engine locally) for instant `<3ms` hits
- Maintains session history and **persists active chat states** across browser refreshes and tab switches
</details>

<details>
<summary><b>📝 CBSE Mock Test Engine & Simulator</b></summary>
<br/>

Generate **full-length board-pattern papers** on demand with a smart duration-based marking system:

| Duration | Marks | Paper Type |
|:--------:|:-----:|:-----------|
| 30 min   | 15    | MCQ Sprint |
| 60 min   | 25    | Unit Test  |
| 120 min  | 50    | Half Paper |
| 180 min  | 80    | Full Board Simulation |

- All 5 CBSE section types — **MCQ, VSA, SA, Long Answer, Case Study**
- 🔒 **Strict Exam Mode (Desktop)**: Runs exam in fullscreen. Switching tabs, minimizing the window, or exiting fullscreen triggers a warning — 3 warnings auto-submits the paper
- ⏱ Live countdown timer with auto-submit
- 🎯 **AI-powered evaluation & scoring** with per-question feedback
- 📉 **Error Analysis Report** — identifies weak topics and generates a targeted study plan
- 🔍 **Detailed Attempt Review** — interactive panel reviewing past attempts with color-coded MCQs and model solutions
- 📄 **Markdown Downloads** — export attempted mock exams as clean `.md` documents
</details>

<details>
<summary><b>⚡ Quick Practice / PYQ Drill</b></summary>
<br/>

- Pick chapters, question type, and count
- Instant CBSE-quality question sets with reveal-on-demand model answers
- Supports MCQ, Very Short, Short, and Long Answer formats
</details>

<details>
<summary><b>🃏 Spaced Repetition Flashcards</b></summary>
<br/>

- **Leitner Box system** (Box 1 → 2 → 3) for scientifically optimized review
- AI-generates flashcards for any chapter with one click
- Manual card creation with Markdown/LaTeX support
- Persisted to MongoDB with offline localStorage fallback
- Filter by **Subject**, **Chapter**, and **Leitner Box**
</details>

<details>
<summary><b>📊 Syllabus Tracker & Analytics</b></summary>
<br/>

- Mark chapters as **Not Started / In Progress / Completed**
- Visual heatmap of your subject-wise coverage
- Score history across all mock tests
- Analytics dashboard with performance trends
</details>

<details>
<summary><b>👥 Community Hub</b></summary>
<br/>

- **Doubt Forum** — post and answer questions, upvote the best solutions
- **Share Notes** — upload CBSE notes with images, links, and descriptions
  - Click any image to open a **full-screen lightbox viewer**
  - One-click **download** of any shared image
- **Virtual Study Room** — synchronized Pomodoro timer + peer chat
</details>

<details>
<summary><b>📅 Planner & Productivity</b></summary>
<br/>

- **AI Syllabus Calendar Builder** — automatically generates custom weekly study schedules based on exam dates and completed chapters
- **Persistent Study Schedule** — caches schedules in browser storage until the target exam date passes, with validation checks and one-click regeneration
- Pomodoro timer integration
</details>

<details>
<summary><b>👤 Profile & Streaks</b></summary>
<br/>

- Daily study streak tracker 🔥
- Personalized dashboard with recent activity
</details>

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:4285F4,100:47A248&height=3&section=header" width="100%"/>

## 🛠 Tech Stack

<div align="center">
<img src="https://skillicons.dev/icons?i=react,vite,nodejs,express,mongodb,redis,javascript,css,git&theme=dark" />
</div>

<br/>

| Layer | Technology |
|:------|:-----------|
| **Frontend** | React 19, Vite 8, Vanilla CSS |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas (Mongoose ODM) |
| **Cache** | Redis (Upstash Cloud / RedVER Local) |
| **AI** | Google Gemini API (gemini-2.5-flash) |
| **Auth** | JWT + bcryptjs |
| **OCR** | Tesseract.js |
| **Icons** | Lucide React |

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:4285F4,100:47A248&height=3&section=header" width="100%"/>

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster
- A Redis Cache server (Upstash Cloud or local RedVER engine)
- A [Google Gemini API key](https://ai.google.dev)

### 1️⃣ Clone the repository
```bash
git clone https://github.com/hashirR786/walrus-study.git
cd walrus-study
```

### 2️⃣ Install frontend dependencies
```bash
npm install
```

### 3️⃣ Install backend dependencies
```bash
cd server
npm install
cd ..
```

### 4️⃣ Configure environment variables
Create a `.env` file in the **root** of the project:
```env
MONGODB_URI=your_mongodb_atlas_connection_string
GEMINI_API_KEY=your_google_gemini_api_key
JWT_SECRET=your_super_secret_jwt_key
PORT=5000
REDIS_URL=redis://127.0.0.1:6379
```

### 5️⃣ Run the app

Open **two terminals**:

**Terminal 1 — Backend**
```bash
cd server
npm run dev
```

**Terminal 2 — Frontend**
```bash
npm run dev
```

<div align="center">

🎉 **The app will be live at [http://localhost:5173](http://localhost:5173)** 🎉

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:4285F4,100:47A248&height=3&section=header" width="100%"/>

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

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:4285F4,100:47A248&height=3&section=header" width="100%"/>

## 🔑 Environment Variables

| Variable | Description | Required |
|:---------|:-------------|:--------:|
| `MONGODB_URI` | MongoDB Atlas connection string | ✅ |
| `GEMINI_API_KEY` | Google Gemini API key | ✅ |
| `JWT_SECRET` | Secret key for JWT signing | ✅ |
| `REDIS_URL` | Redis connection URL (`redis://` or `rediss://`) | ✅ |
| `PORT` | Backend server port (default: 5000) | ❌ |

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:4285F4,100:47A248&height=3&section=header" width="100%"/>

## 🎨 Design System

Walrus uses a hand-crafted design system with:

- 🏖 **Warm Sand / 🌙 Dark Slate** dual theme
- CSS custom properties for full theme switching
- 6 accent color options (selectable per user)
- Glassmorphism cards, smooth micro-animations
- Fully responsive layout

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:4285F4,100:47A248&height=3&section=header" width="100%"/>

## 🗺 Roadmap

- [ ] Real-time study room via WebSockets
- [ ] PDF export for mock test papers
- [ ] Push notifications for spaced repetition reminders
- [ ] Mobile app (React Native)
- [ ] Teacher/parent dashboard

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:4285F4,100:47A248&height=3&section=header" width="100%"/>

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'feat: add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

<div align="center">

![Contributors](https://img.shields.io/github/contributors/hashirR786/walrus-study?style=for-the-badge&color=4285F4)

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:4285F4,100:47A248&height=3&section=header" width="100%"/>

## 📈 Star History

<div align="center">
<img src="https://api.star-history.com/svg?repos=hashirR786/walrus-study&type=Date" width="600"/>
</div>

## 📄 License

This project is licensed under the **MIT License**.

<br/>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:47A248,100:4285F4&height=150&section=footer" width="100%"/>

<div align="center">

Made with ❤️ for students everywhere

**[⬆ Back to top](#-walrus)**

</div>
