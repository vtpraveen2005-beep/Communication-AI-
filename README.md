# CommAI — Agentic AI Communication Assessment
### Java Full-Stack Web Application

---

## Project Structure

```
D:\Communication AI Java\
├── backend/                        ← Java backend (port 8080)
│   ├── src/com/commai/
│   │   ├── Main.java               ← Server entry point
│   │   ├── HttpRouter.java         ← URL route registrar
│   │   ├── handlers/
│   │   │   ├── StaticHandler.java  ← Serves frontend files
│   │   │   ├── QuestionsHandler.java  ← GET /api/questions
│   │   │   ├── RubricsHandler.java    ← GET /api/rubrics
│   │   │   ├── ScoreHandler.java      ← POST /api/score
│   │   │   ├── FeedbackHandler.java   ← POST /api/feedback (Gemini)
│   │   │   ├── ReportHandler.java     ← POST /api/report
│   │   │   └── HealthHandler.java     ← GET /api/health
│   │   ├── engine/
│   │   │   ├── ScoringEngine.java  ← Java NLP scoring (20 criteria)
│   │   │   └── GeminiClient.java   ← Gemini AI integration (add key here)
│   │   └── util/
│   │       ├── JsonUtil.java       ← JSON builder/parser
│   │       └── CorsUtil.java       ← CORS headers
│   ├── data/
│   │   ├── questions.json          ← 15 exercises across 4 modules
│   │   └── rubrics.json            ← 20 scoring criteria
│   ├── compile.bat                 ← One-click compile
│   └── run.bat                     ← One-click run
│
└── frontend/                       ← Served by Java backend
    ├── index.html
    ├── css/styles.css
    └── js/
        ├── api.js                  ← Calls Java REST endpoints
        ├── app.js                  ← Main controller
        ├── report.js               ← Radar chart & report UI
        └── assessments/
            ├── oral.js
            ├── written.js
            ├── listening.js
            └── presentation.js
```

---

## How to Run

### Step 1 — Compile (first time only)
```
Double-click: D:\Communication AI Java\backend\compile.bat
```

### Step 2 — Start Server
```
Double-click: D:\Communication AI Java\backend\run.bat
```

### Step 3 — Open Browser
```
http://localhost:8080
```

---

## REST API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Frontend app |
| GET | `/api/health` | Server + Gemini status |
| GET | `/api/questions?type=oral&level=1` | Question bank |
| GET | `/api/rubrics` | Scoring rubrics |
| POST | `/api/score` | NLP scoring engine |
| POST | `/api/feedback` | AI feedback (Gemini/built-in) |
| POST | `/api/report` | Report generation |

---

## Adding Your Gemini API Key

1. Open: `D:\Communication AI Java\backend\src\com\commai\engine\GeminiClient.java`
2. Replace line:
   ```java
   private static final String API_KEY = "YOUR_GEMINI_API_KEY_HERE";
   ```
   with:
   ```java
   private static final String API_KEY = "AIza...your-actual-key...";
   ```
3. Recompile: run `compile.bat`
4. Restart: run `run.bat`
5. Check: `http://localhost:8080/api/health` → `"geminiConfigured": true`

---

## Technologies

- **Backend**: Pure Java 25 (no Maven/Gradle needed)
- **HTTP Server**: `com.sun.net.httpserver.HttpServer` (built-in Java)
- **AI Engine**: Java NLP scoring + Google Gemini API
- **Frontend**: HTML5 + Vanilla CSS + Vanilla JS
- **Charts**: Chart.js (CDN)
- **Fonts**: Google Fonts — Inter + Playfair Display
