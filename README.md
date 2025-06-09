# LogisticsPlannerPro

Full-stack web app to plan truck loading layouts and visualize them.

## Architecture

- **Frontend:** React + TypeScript + Vite + TailwindCSS + Radix UI + Recharts
- **Backend:** Node.js (Express) + Drizzle ORM + PostgreSQL
- **Build Tool:** Vite
- **Authentication:** Passport.js (Local)

## Folder Structure

- /client → React app
- /server → Express API
- /components.json → UI component config
- /vite.config.ts → Vite config
- /tailwind.config.ts → Tailwind config
- /drizzle.config.ts → Drizzle ORM config

## Install & Run Locally

### 1️⃣ Install dependencies

```bash
npm install```

### 2️⃣ Run development server
```bash
npm run dev```

Frontend available at: http://localhost:5173

### 3️⃣ Build frontend for production
```bash
npm run build```

### 4️⃣ Start backend server
Backend server code is in the project → you may need to move it to /server explicitly for clean separation.

Run Express API:

```bash
node server.js```

## Deployment

