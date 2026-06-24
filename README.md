# India Tour Planner

A premium, full-stack travel advisory and itinerary planner built with FastAPI, React (Vite + Tailwind CSS), SQLite, and advanced Retrieval-Augmented Generation (RAG) powered by Gemini and Groq Cloud. 

The application compiles highly personalized day-wise travel plans, estimates costs, suggests budget-appropriate accommodations, visualizes maps, and integrates user authentication (including Phone OTP verification).

---

## Key Features
- **AI Itinerary Architect**: Dynamic travel route generation using local knowledge stores combined with real-time web weather data and safety alert scraping.
- **Smart Expense Estimator**: Generates immediate visual charts of estimated expenses (lodging, dining, transport, buffer) matching low, medium, or premium budgets.
- **Interactive Route Visualizer**: Dynamic map markers for sightseeing spots and route visualizer using Leaflet.
- **Authentication**: Supports standard Email/Password authentication as well as Firebase Phone Authentication (OTP verify).
- **History Portal**: Save, list, view, and delete previous travel dossiers.
- **Advisory Modal & Chatbot**: Interactive follow-up conversational agent and RAG search query dashboard.

---

## Tech Stack

### Backend
- **Core**: FastAPI (Python 3)
- **Database**: SQLite (relational storage)
- **Vector Search**: Custom SimpleVectorStore for cosine similarity text search
- **LLM Integrations**: Google Generative AI (Gemini 1.5 Flash) & Groq Cloud (Llama 3.3 70B)
- **Server**: Uvicorn

### Frontend
- **Framework**: React.js (Vite build system)
- **Styling**: Tailwind CSS (Glassmorphism design guidelines)
- **Mapping**: Leaflet + Leaflet MarkerCluster
- **Icons**: FontAwesome 6

---

## Project Structure
```text
India Tour/
├── backend/
│   ├── app/
│   │   ├── api/             # Auth, Trip, Hotel, and RAG routes
│   │   ├── core/            # Database config, migration & security
│   │   ├── data/            # Local travel seed database
│   │   ├── rag/             # Vector stores and prompt generators
│   │   ├── utils/           # Cost estimators and scrapers
│   │   └── main.py          # FastAPI application entry point
│   ├── scripts/             # Diagnostic, setup, and tunnel scripts
│   │   ├── diagnose.py      # Environment and DB check script
│   │   ├── verify_key.py    # Firebase/Google API key verification script
│   │   └── run_tunnel.js    # Localtunnel exposure script
│   ├── logs/                # Auto-generated application and tunnel logs
│   │   ├── error_log.txt    # Exception tracebacks
│   │   └── localtunnel.log  # Expose URL log
│   └── requirements.txt     # Python libraries
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Cards, Chatbot, Map, and Auth widgets
│   │   ├── context/         # AuthContext state store
│   │   ├── pages/           # Dashboard, MyTrips, and Profile views
│   │   ├── routes/          # Protected client-side routes
│   │   └── index.css        # Premium dark glassmorphic stylesheet
│   ├── index.html           # SPA entry page
│   ├── package.json         # Node scripts & dependencies
│   ├── vite.config.js       # Vite proxy configuration
│   └── vercel.json          # Vercel API proxy configuration
│
└── README.md
```

---

## Local Setup & Installation

### 1. Prerequisites
- Python 3.9+ installed
- Node.js v18+ installed

### 2. Backend Setup
1. Navigate into `/backend` folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows Command Prompt:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI API server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The backend will start running on `http://127.0.0.1:8000`.

### 3. Frontend Setup
1. Open a new terminal and navigate to `/frontend`:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Boot the Vite hot-reloading development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173/dashboard` in your browser.

---

## Production Deployment (Render Combined Setup)

The application is pre-configured to build the frontend and serve both the React client and FastAPI backend directly from a single Render Web Service:

1. Push your code to your GitHub repository.
2. Go to **Render.com** and create a new **Web Service**.
3. Set the following settings:
   - **Runtime**: `Python 3`
   - **Build Command**:
     ```bash
     cd frontend && npm install && npm run build && cd ../backend && pip install -r requirements.txt
     ```
   - **Start Command**:
     ```bash
     cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```
4. Click **Advanced** and add your Firebase credentials under **Environment Variables** (e.g. `VITE_FIREBASE_API_KEY`).
5. Click **Deploy Web Service**.
