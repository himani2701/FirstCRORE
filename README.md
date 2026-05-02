# FirstCrore — Financial Analytics Platform

> Built for the Blostem "Hack to the Future" Hackathon 2026

A financial analytics platform for India's first-time earners. Beyond basic expense tracking, FirstCrore surfaces spending patterns, scores financial health, and builds a personalised FD ladder.

## What's inside

### Analytics Layer
- **Spending breakdown** by category — pie/donut chart + horizontal bars
- **Monthly income vs expenses vs savings** — 6-month trend view
- **Rule-based Financial Health Score** — mirrors how banks flag at-risk customers
- **Python data pipeline** — pandas + matplotlib reports, CSV export

### FD Planner
- Smart FD Ladder optimised across 15+ banks
- Goal-based allocation (travel, bike, house, etc.)
- DICGC insurance awareness built in

### Jargon Buster (Gemini AI)
- Click any financial term → plain-English explanation
- Personalised to your salary

## Tech Stack

| Layer       | Tech                                  |
|-------------|---------------------------------------|
| Frontend    | React 18 + Vite (light theme)         |
| Backend     | Node.js + Express                     |
| AI          | Google Gemini 2.0 Flash (free tier)   |
| Analytics   | Python — pandas, matplotlib, pymongo  |
| DB (future) | MongoDB with aggregation pipelines    |

## Quick Start

### 1. Server
```bash
cd server
cp .env.example .env        # add your GEMINI_API_KEY
npm install
npm start
```

### 2. Client
```bash
cd client
npm install
npm run dev                 # → http://localhost:3000
```

### 3. Python Analytics Pipeline
```bash
cd analytics
pip install -r requirements.txt
python report_generator.py --demo --income 55000 --expenses 32000
# generates reports/demo_report.csv + charts
```

## Analytics API Endpoints

| Endpoint                      | Method | Description                    |
|-------------------------------|--------|--------------------------------|
| `/api/analytics/spending`     | GET    | Spending by category           |
| `/api/analytics/monthly`      | GET    | Monthly income/expense trend   |
| `/api/analytics/health-score` | POST   | Rule-based health score        |
| `/api/jargon/explain`         | POST   | Gemini AI jargon explainer     |
| `/api/optimize`               | POST   | FD ladder optimiser            |
| `/api/health`                 | GET    | Server health check            |

## Interview Description

> "FirstCrore is a financial analytics platform targeting India's first-time earners. I built an analytics layer using rule-based scoring to flag at-risk users (mirroring how ZS builds decision support tools), a spending breakdown dashboard with SVG charts, and a Python data pipeline using pandas that generates CSV reports and matplotlib visualisations — simulating real analytics workflows. The backend exposes REST APIs equivalent to MongoDB aggregation pipelines."
