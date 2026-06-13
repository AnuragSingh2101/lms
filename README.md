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
2. Configure environment variables. Edit `backend/.env` and replace `YOUR_PASSWORD_HERE` with your actual MongoDB database password:
   ```env
   PORT=5000
   MONGODB_URI=mongodb+srv://anuragiiitg_db_user:YOUR_PASSWORD_HERE@cluster0.xj2bqa6.mongodb.net/lms?retryWrites=true&w=majority
   JWT_SECRET=lms_super_secret_jwt_key_2026_antigravity
   JWT_EXPIRE=30d
   NODE_ENV=development
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
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

## 🧪 Step-by-Step Test Guide

Verify the entire feature set of the LMS by following this workflow:

### Step 1: Account Creation & Setup
1. Go to `http://localhost:5173/register`.
2. Register a new account as a **Teacher** (e.g. `teacher@opencourse.com`).
3. Register another new account as a **Student** (e.g. `student@opencourse.com`).

### Step 2: Instructor Curriculum Creation
1. Log in with your **Teacher** credentials at `http://localhost:5173/login`.
2. On the **Teacher Dashboard**, click **Create Course**.
3. Name it `"React Complete Syllabus"`, select a Category (e.g., `"Web Development"`), add a Description, and click **Create Draft**.
4. In the Course list, click the **Arrow Button (Manage)** next to your draft.
5. In the Study Room view, go to **Notes & PDFs** tab and use the **Curriculum Builder** form to add lessons:
   * Title: `React Hooks Explained`
   * Youtube Video ID: `LDB4uaJ8GHY`
   * Duration: `15 mins`
   * Upload an optional notes PDF.
   * Click **Add Lesson**. Add 1 or 2 more lessons if desired.
6. Under **Assignments** tab, fill the assignment form:
   * Title: `Hooks Lab Exercise`
   * Description: `Create a custom hooks fetch script.`
   * Due Date: *Pick a future date*
   * Total Marks: `100`
   * Click **Configure Assignment**.
7. Under **Quiz Module** tab, add a question:
   * Text: `What hook handles states in React?`
   * Options: `useEffect`, `useState`, `useContext`, `useReducer`
   * Correct Option: `Option 2` (useState)
   * Click **Add Question**. Set Quiz Time Limit to `10` mins and Total Marks to `50`. Click **Save & Publish Quiz**.
8. In the top progress ribbon of CourseView, update published state of the course to **Published** by saving the changes.

### Step 3: Student Learning Experience
1. Log out of the Teacher account. Log in with your **Student** credentials.
2. Go to **Browse Courses** tab in the sidebar.
3. Locate `"React Complete Syllabus"` and click **Enroll**.
4. Inside the Study Room:
   * Watch the YouTube video.
   * Click the **Checkbox** next to the active lesson in the right sidebar to mark it as complete. Watch the progress bar increment!
   * Go to **Discussion Forum** tab. Post a question: `"How does dependencies arrays work in useEffect?"`. The comment will update instantly.
   * Go to **Quiz Module** tab. Click **Begin Attempt**. Answer the MCQ within the countdown timer and click **Submit**. Check your score and attempts logs!
   * Go to **Assignments** tab. Select a PDF file under the Hooks Lab assignment and click **Submit**.

### Step 4: Instructor Evaluation & Grading
1. Log out of the Student account. Log back in as a **Teacher**.
2. On the dashboard, locate the **Submissions Grading Queue** on the right side.
3. You will see the student submission pending. Click **Grade Task**.
4. Review the PDF, input a score (e.g., `45`), write feedback (e.g., `"Excellent custom hook implementation!"`), and click **Grade & Notify Student**.

### Step 5: Claiming the Certificate
1. Log out of the Teacher account. Log back in as the **Student**.
2. Look at your dashboard. You will see your Average Grade has updated.
3. Open the `"React Complete Syllabus"` course study room.
4. If your lessons completed = 100%, quiz attempts passed, and assignment is graded, a gold **Claim Certificate** button will appear in the top ribbon!
5. Click **View Certificate** to open a completion certificate complete with your Name, Course name, a unique Certificate ID, and a validation QR code.
6. Click **Download PDF** to save the certificate directly as a PDF.

### Step 6: System Administration & Suspensions
1. For testing, an admin account can deactivate/activate users. 
2. Open a database manager or Mongoose shell, edit your student user document, and change its role from `"student"` to `"admin"`. (Or register an account and edit its role to `admin` in database).
3. Log in with this admin account.
4. You will see the **System Control Console** displaying platform-wide analytics and a **User Directory**.
5. Locate a user in the directory and click **Suspend User (Minus icon)**.
6. Log out. Attempt to log in with the suspended user's email. The login will be blocked and show an account deactivation notice.
7. Log back in as Admin and click **Activate User (Check icon)** to restore their access.
