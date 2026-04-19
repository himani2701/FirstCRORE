# ₹ FirstCrore

> *Your first salary deserves a real plan.*

A financial clarity and smart FD investment platform built for India's first-time earners — the 23-year-olds with ₹40,000 sitting in a savings account losing silently to inflation, with no one to ask.

Built for the **Blostem "Hack to the Future" Hackathon 2026** — Open Track .

---

## The Problem Nobody Talks About

Every year, 5 million young Indians receive their first salary. Almost all of them do the same thing: open a savings account, let the money sit at 3.5%, and wonder why saving feels pointless.

Nobody teaches them:
- That inflation at 6% is eating their savings account returns alive
- That Fixed Deposits across multiple banks can give 7.5–8.5% with government-backed safety
- That the right way to invest depends entirely on *when* they need the money back
- That terms like "tenor," "p.a.," "DICGC," and "compounding" are not complicated — they just need one good explanation

**FirstCrore is that explanation. And then the action.**

---

## What I Built (MVP)

The working prototype covers a complete user journey — from emotional hook to actionable FD ladder.

### Feature 1 — The Salary Reality Shock
The landing page opens with a single, devastating truth: *"Your savings account is losing you ₹X every year."* The user enters their salary and instantly sees the rupee difference between doing nothing vs. investing in an FD ladder. This is the emotional hook that makes everything else matter.

### Feature 2 — Conversational Onboarding
A WhatsApp-style conversation — not a form — that collects what matters: monthly expenses, life goals (travel, bike, house, laptop), and risk appetite. This maps invisibly to the optimizer inputs. The user never feels like they're filling out a financial form.

### Feature 3 — Financial Health Score
Before jumping to solutions, the user sees an honest score (out of 100) across four dimensions: savings rate, emergency fund status, investing corpus, and goal clarity. Each weak area gets one specific, actionable fix. No generic advice.

### Feature 4 — The Smart FD Ladder *(the core)*
The optimizer distributes the investable corpus across real Indian banks and tenors based on:
- Goal timelines (money matures *when they need it*)
- DICGC ₹5 lakh insurance cap per bank (automatically enforced and explained)
- Risk appetite (safe: SBI/HDFC first; balanced: includes SFBs for higher rates)
- Diversification across multiple banks for any allocation above ₹2 lakh

Output: A visual ladder showing each bank, amount, tenor, rate, maturity date, maturity amount, and the goal it's serving. Every number is real. Every rate is sourced from public bank rate cards.

### Feature 5 — AI-Powered Jargon Buster
Every financial term across the app is tappable. One tap gives: a plain-English explanation, a real rupee example personalized to the user's numbers, and why it matters *right now* for a young earner. Powered by Claude (Anthropic API) with an offline fallback dictionary covering 8 core terms so the demo works without an API key.

### Feature 6 — Goal → Investment Path
For each goal, the app explains *why* a particular instrument was chosen — not just what. Short goals get FDs. Medium goals get FD + Debt MFs. Long-term goals get Index Fund SIPs. The monthly saving amount needed is calculated backwards from the target.

### Blostem Integration (The Architecture Point)
Every safe investment action in FirstCrore ends with a "Book via Blostem" CTA. In the prototype, this is a demo flow. The narrative to judges is explicit: in production, this single button routes the FD booking to the correct bank via Blostem's multi-bank API — handling KYC, rate lock, and confirmation in seconds. The user never sees the infrastructure. The user just sees it work.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| AI Layer | Anthropic Claude API (`claude-sonnet-4-20250514`) |
| Styling | Custom CSS with design tokens (no UI framework) |
| Charts/Viz | Custom SVG + CSS animations |
| Data | Hardcoded real Indian bank FD rates (8 banks, April 2025) |
| State | React component state (no Redux — intentional simplicity) |

---

## Project Structure

```
firstcrore/
├── client/                     # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Landing.jsx     # Salary shock + emotional hook
│   │   │   ├── Onboarding.jsx  # Conversational goal collection
│   │   │   ├── Dashboard.jsx   # Health score + plan preview
│   │   │   ├── FDLadder.jsx    # The ladder visualization (hero feature)
│   │   │   ├── JargonBuster.jsx # AI-powered term explainer
│   │   │   └── Loading.jsx     # Transition screen
│   │   ├── App.jsx             # Screen orchestrator
│   │   ├── main.jsx
│   │   └── index.css           # Design system + CSS variables
│   ├── index.html
│   └── package.json
│
├── server/                     # Express backend
│   ├── data/
│   │   └── banks.js            # 8 Indian banks, real FD rates
│   ├── routes/
│   │   ├── optimizer.js        # FD ladder optimization endpoint
│   │   └── jargon.js           # Claude API jargon explanation endpoint
│   ├── utils/
│   │   └── fdOptimizer.js      # Core allocation algorithm
│   ├── server.js
│   ├── .env.example
│   └── package.json
│
└── README.md
```

---

## How to Run

### Prerequisites
- Node.js 18+
- npm

### 1. Start the backend

```bash
cd server
npm install

# Optional: add your Anthropic API key for the Jargon Buster
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

npm start
# Server runs on http://localhost:5001
```

### 2. Start the frontend

```bash
cd client
npm install
npm run dev
# App opens on http://localhost:3000
```

> The app works fully without an API key. The Jargon Buster falls back to a built-in offline dictionary covering the 8 most common FD terms. All other features (optimizer, health score, ladder visualization) are self-contained.

---

## The Optimizer Algorithm

The FD ladder optimizer (`server/utils/fdOptimizer.js`) runs a deterministic allocation engine:

1. **Emergency fund first** — calculates 3× monthly expenses and allocates to the highest-rate 3-month FD at a bank with available DICGC headroom
2. **Goal-sorted allocation** — sorts goals by timeline (shortest first), finds the best-matching tenor, selects the highest-rate eligible bank respecting risk appetite
3. **DICGC cap enforcement** — tracks per-bank allocation, never exceeds ₹5 lakh per bank
4. **Diversification split** — any allocation above ₹2 lakh is split 60/40 across two banks
5. **Residual corpus** — any remaining amount goes into the highest-rate 24-month FD for long-term growth
6. **Summary stats** — weighted average rate, total interest, inflation-adjusted real return, comparison against savings account baseline

---

## The Idea — Start, Now, and What's Next

### Where the idea started
The brief said "vernacular FD advisor for Gorakhpur." I kept thinking about the real person — the 23-year-old who doesn't know what an FD *is*, let alone a tenor or a small finance bank. The problem isn't jargon. The problem is the missing first chapter: "what do I even do with this money?"

### What I built for this prototype
A complete journey: shock → goals → score → ladder → education → booking intent. The goal was to make the infrastructure story (Blostem's multi-bank API) visible and tangible to a real user without ever explaining the infrastructure.

### What this could become with more time

**WhatsApp Integration** — meet the user in the app they already use. A WhatsApp bot that asks the same onboarding questions in Hindi or Bhojpuri and generates the same FD ladder, routed to Blostem for booking. Zero app download required.

**Actual Blostem API Integration** — replace the mock "Book via Blostem" button with a real API call. The backend already has the bank + tenor + amount — it's one integration away from being a real product.

**Salary Slip OCR** — upload your payslip, we parse CTC vs take-home automatically. No manual entry.

**Bank Account Linking (AA Framework)** — Account Aggregator integration to pull real transaction history and replace the manual expense input with actual spend analysis.

**Vernacular Layer** — Hindi UI for the onboarding flow. The conversational format is perfectly suited to localization — it's just text, no complex UI changes needed.

**SIP Recommendation Engine** — for goals beyond 3 years, integrate a mutual fund recommendation layer using public AMFI data. The goal-path cards already set up this architecture.

**Push Notifications** — remind users 30 days before an FD matures: "Your ₹50,000 is coming back in a month. Here's where to re-invest it."

**Credit Score Module** — building credit from zero using a secured credit card strategy. High value for young earners, completely absent from most personal finance tools.

---

## Banks Included

| Bank | Type | Sample 12M Rate |
|---|---|---|
| State Bank of India | Public Sector | 6.80% |
| HDFC Bank | Private | 7.00% |
| Axis Bank | Private | 7.10% |
| IDFC First Bank | Private | 7.75% |
| Suryoday Small Finance Bank | SFB | 8.50% |
| Jana Small Finance Bank | SFB | 8.25% |
| AU Small Finance Bank | SFB | 7.50% |
| Fincare Small Finance Bank | SFB | 8.10% |

*All SFB deposits are DICGC insured up to ₹5 lakh — same protection as SBI.*

---

## Why This, For Blostem

Blostem's infrastructure connects 30+ platforms to 10+ banks. FirstCrore is the consumer face that infrastructure was always meant to have — a product that acquires young earners at their most impressionable financial moment and routes every safe investment action through Blostem's API.

The user never knows they're using fintech infrastructure. They just know their money is finally working.

---

## Hackathon Context

**Event:** Blostem "Hack to the Future" Hackathon 2026  
**Track:** Open Track (Track 05)  
**Builder:** Solo  


---

*All FD rates are indicative, sourced from publicly available bank rate cards (April 2025). This is a planning tool and not financial advice.*
