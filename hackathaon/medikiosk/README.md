# MediKiosk

**AI-Powered Pre-Consultation Clinical Intake Platform**  
*Smart India Hackathon 2026 Project Foundation*

---

## 📁 Directory Structure

```
medikiosk/
├── frontend/             # React + TypeScript + Vite + Tailwind CSS
├── backend/              # Python + FastAPI + Uvicorn
├── database/             # PostgreSQL init scripts & schemas
├── docs/                 # Documentation directory
├── sample-data/          # Sample clinical datasets
├── .env.example          # Root environment variables template
├── docker-compose.yml    # Multi-container orchestration (DB, API, Frontend)
└── README.md             # Project documentation and quickstart
```

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Backend**: Python 3.12, FastAPI, Uvicorn, Pydantic
- **Database**: PostgreSQL (Containerized via Docker Compose)
- **Deployment & Dev Ops**: Docker & Docker Compose

---

## 🚀 How to Run Backend & Frontend Independently

### 1. Backend Setup (FastAPI)

1. Open terminal and navigate to backend:
   ```bash
   cd medikiosk/backend
   ```
2. Create and activate a Python virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI backend server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
5. Verify API Health Endpoint:
   - Open browser or terminal: `http://localhost:8000/api/health`
   - Response: `{"status":"ok"}`

---

### 2. Frontend Setup (React + Vite + Tailwind)

1. Open a new terminal window and navigate to frontend:
   ```bash
   cd medikiosk/frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Access Frontend in Browser:
   - Open `http://localhost:5173`
   - Click **"Check Connection"** to verify communication with the FastAPI backend.

---

## 🐳 Optional: Running with Docker Compose

To spin up Frontend, FastAPI Backend, and PostgreSQL database simultaneously:

```bash
cd medikiosk
docker-compose up --build
```

- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:8000`
- **PostgreSQL**: `localhost:5432`

---

## ⚙️ Environment Variables

Copy `.env.example` files if modifying defaults:

- Root: `medikiosk/.env.example`
- Backend: `medikiosk/backend/.env.example`
- Frontend: `medikiosk/frontend/.env.example`
