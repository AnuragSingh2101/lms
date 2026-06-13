# OpenCourse - Premium Full-Stack Learning Management System (LMS)

OpenCourse is a complete, production-ready, and highly interactive Learning Management System (LMS). It enables instructors to publish lectures, set up multiple-choice quizzes, create assignments, grade student work, and issue digital certificates. Students can watch YouTube video lectures, track their progress, participate in discussions, complete evaluations, and download completion certificates as PDFs. Administrators can moderate content and suspend or reactivate accounts.

---

## 🚀 Tech Stack

### Frontend
* **React.js (Vite)**: Modern fast build tooling
* **Tailwind CSS**: Glassmorphic styling and premium layout aesthetics
* **React Router Dom (v6)**: Secured role-based routing controls
* **Axios**: Token interceptors and network communication client
* **Recharts**: Responsive visual charts for dashboards
* **Lucide React**: Clean vector iconography
* **html2canvas & jsPDF**: Client-side certificate generation and PDF download

### Backend
* **Node.js & Express.js**: REST API endpoints mapping
* **JWT (JsonWebToken)**: Token signature and RBAC permissions
* **Bcrypt.js**: Secure hashing for passwords
* **Multer**: Static local uploads handler (thumbnails, notes, assignments)
* **Morgan**: HTTP logger for development environment

### Database
* **MongoDB & Mongoose**: Database models mapping

---

## 📂 Project Structure

```
lms/
├── backend/
│   ├── src/
│   │   ├── config/          # DB connection configuration
│   │   ├── controllers/     # API controllers (auth, course, progress, admin)
│   │   ├── middleware/      # Guards (auth, roles verification, uploads, errors)
│   │   ├── models/          # Schemas (User, Course, Lesson, Quiz, Attempts, Discussions)
│   │   ├── routes/          # Express route bindings
│   │   ├── services/        # Notifications helper dispatch
│   │   └── app.js           # Express app setup & configurations
│   ├── public/uploads/      # Static assets upload path
│   ├── .env                 # Port and Database credentials
│   ├── package.json
│   └── server.js            # Server entrypoint
├── frontend/
│   ├── src/
│   │   ├── context/         # Auth, Theme, and Notifications providers
│   │   ├── layouts/         # Responsive layouts shells
│   │   ├── pages/           # Pages (Auth, Study room, Dashboards, Profiles)
│   │   ├── services/        # Axios interceptors configuration
│   │   ├── routes/          # Route Protection wrappers
│   │   ├── index.css        # Tailwind directive and scrollbars rules
│   │   ├── App.jsx          # Route bindings
│   │   └── main.jsx         # Render wrapper
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   └── package.json
└── README.md
```

---

## 🔧 Installation & Setup

### Prerequisites
* [Node.js](https://nodejs.org/) installed
* A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) Cluster or MongoDB Local instance

### 1. Backend Setup
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm run dev
   ```
   The backend will start listening at `http://localhost:5000` and output `MongoDB Connected`.

### 2. Frontend Setup
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development build:
   ```bash
   npm run dev
   ```
   The application will start running at `http://localhost:5173`. Open this URL in your web browser.

---