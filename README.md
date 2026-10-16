# ⚡ ApexLead AI — Autonomous Lead Generation & Qualification MVP

An end-to-end AI-powered Lead Generation, Scoring, and Outreach platform built with **React**, **Vite**, **Tailwind CSS**, **Node.js/Express**, and Google's **Gemini AI API**.

---

## 🚀 3-Step Quickstart

### Step 1: Install Dependencies
Run from the root directory (uses npm workspaces to install both backend and frontend dependencies in one command):
```bash
npm install
```

### Step 2: Configure Gemini API Key
Copy the example environment file and add your Google AI Studio key:
```bash
cp .env.example .env
```
Open `.env` and set your key:
```ini
GEMINI_API_KEY=your_gemini_api_key_here
```
> *(You can also paste and test your key directly in the web UI via the **"Set Gemini Key"** top badge! Even without a key, the app includes intelligent offline heuristic fallback modes so you can test immediately without setup).*

### Step 3: Run the Application
Launch both the backend API and frontend dev server with a single command:
```bash
npm run dev
```

- **Frontend Application:** [http://localhost:5173](http://localhost:5173)
- **Backend API Server:** [http://localhost:5001](http://localhost:5001)

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 19 + Vite 8 | Fast HMR, responsive components, Lucide icons |
| **Styling** | Tailwind CSS v4 | Obsidian dark mode, glassmorphic cards, custom animations |
| **Backend** | Node.js + Express | RESTful API, structured JSON parsing, retry fallbacks |
| **AI Engine** | Gemini 2.0 / 1.5 Flash (`@google/generative-ai`) | Structured JSON mode, few-shot prompting, retrieval injection |
| **Storage** | Local JSON (`server/data/leads.json`) | Zero database configuration required, persistent on disk |
| **Runner** | `concurrently` | Synchronized colored terminal stream for client & server |

---

## 🧠 AI Concepts Demonstrated

1. **Structured Output (JSON Mode):**
   - Enforces strict schema returns (`{ score, reason, pain_points[], suggested_service }`) with regex code-fence fallbacks.
2. **Prompt Engineering with Few-Shot Rubrics:**
   - Evaluates leads against quantified operational signals (transaction volume, phone bottlenecks, digital friction, ticket size).
3. **Retrieval-Style Context Injection (RAG):**
   - The **AI Copilot** passes the entire current CRM database as real-time context to answer queries like *"Which leads should I contact first?"* or *"Summarize common pain points in Texas"*.
4. **Tone-Adaptive Personalization:**
   - Generates customized **WhatsApp messages** and **Cold Emails** tailored specifically to the lead's industry, city, and pain points in both **Friendly** and **Professional** tones.
5. **Fault Tolerance & Fallbacks:**
   - Multi-attempt exponential backoff with smart offline heuristic fallbacks if rate limits or API key omissions occur.

---

## 🌟 Core Features

- **Lead Intake:**
  - Manual single-lead form with real-time field validation and optional immediate auto-scoring.
  - **Bulk CSV Upload** with auto-column mapping and table preview before commit.
  - **Auto-Generate 10 Realistic Leads** button with 1-click industry/city presets.
- **Quantitative Lead Scoring (0–100):**
  - **🔥 Hot (75–100):** High intent, massive automation ROI.
  - **⚡ Warm (45–74):** Moderate digital friction, high nurture opportunity.
  - **❄️ Cold (<45):** Low transaction frequency or minimal digital leverage.
  - One-click **"Score All Unscored Leads"** batch processor.
- **AI Outreach Generator:**
  - Dedicated WhatsApp preview card with 1-click clipboard copy and **"Open in WhatsApp Web"**.
  - Cold email client view with subject line separation, body copy, and **"Open in Mailto"**.
  - Friendly vs. Professional tone switcher and instant copy regeneration.
- **Pipeline Dashboard & Analytics:**
  - Interactive **Score Distribution Bar Chart** (0-25, 26-50, 51-75, 76-100) with click-to-filter capability.
  - KPI Cards: Total Leads, Hot Leads, Pipeline Progress, Converted Clients.
  - Multi-parameter filters: Score tier, pipeline status (`New`, `Contacted`, `Replied`, `Converted`), industry, and city.
  - Toggle between **Table View** and **Card Grid View**.
- **AI Copilot Assistant:**
  - Slide-out assistant drawer with prompt suggestions.
  - Contextual awareness over all leads in the database.
- **Pre-Seeded Demo Data:**
  - Comes out of the box with 5 diverse real-world leads (Dental Clinic, Poultry Farm & Distributor, CrossFit Gym, Bespoke Cabinetmaker, and Restaurant/Catering).

---

## 📡 API Reference

- `GET /api/health` — Check server status & Gemini key configuration
- `GET /api/leads` — Retrieve leads with search, status, and category filters
- `GET /api/stats` — Metrics breakdown and score bucket distribution
- `POST /api/leads` — Create single lead
- `POST /api/leads/bulk` — Bulk import leads from CSV
- `PUT /api/leads/:id` — Update lead (e.g. status)
- `DELETE /api/leads/:id` — Delete lead
- `POST /api/leads/:id/score` — AI score specific lead
- `POST /api/leads/score-all` — AI score all unscored leads
- `POST /api/leads/:id/outreach` — Generate WhatsApp and Cold Email copy
- `POST /api/leads/auto-generate` — Synthesize 10 realistic leads for an industry + city
- `POST /api/chat` — Context-aware AI chat assistant
- `POST /api/leads/reset-demo` — Restore initial 5 demo leads

---

## 💻 Final Run Command

```bash
npm run dev
```
