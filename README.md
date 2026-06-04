# AML Advisor AI

A local AML investigation tool I built to explore how AI can help compliance analysts at Nordic banks work faster. It combines rule-based transaction detection in .NET with a multi-agent AI pipeline in Python — everything runs on your own machine, no cloud needed.

Built for Nordic banks — Danske Bank, Nordea.

---

## Why I built this

AML analysts at banks like Danske Bank and Nordea spend 20 to 40 minutes manually reviewing each suspicious transaction alert — reading transactions, looking up regulations, and writing reports by hand. I wanted to see if a local AI system could do that investigation automatically and hand the analyst a ready-made explanation to review and sign off on.

Give it a customer's transaction history and it tells you whether something looks suspicious, which AML pattern it matches, what regulation applies, and why — in plain English an auditor can read.

---

## What it does

You submit transactions through a React web interface. The system runs five compliance detection rules, searches a knowledge base of past AML cases and regulations, and uses a local AI model to write a three-sentence audit explanation. You get back a risk score, a decision, and the explanation — in under a minute. Everything runs locally. No data leaves your machine. No API keys. No internet needed after the initial model download.

---

## How the flow works

```
React Frontend — Browser (port 3000)
      │  Dashboard · Analyse Case · Alert Queue
      │  fill in customer details and transactions, click Run Analysis
      ▼
.NET 8 Web API (port 5000)
      │  runs 5 C# detection rules in milliseconds — no AI here
      │  calculates base risk score
      │  calls Python service with patterns added
      ▼
Python FastAPI (port 8000)
      │  receives data from .NET
      │  builds initial state and passes into LangGraph
      ▼
LangGraph — 4 agents run in sequence
      │
      ├── Agent 1 — DataCollector
      │     parses raw transactions into readable plain-text summary
      │     no LLM — pure Python logic
      │
      ├── Agent 2 — RAGRetrieval
      │     LangChain + ChromaDB + Ollama embeddings
      │     finds top 3 similar past AML cases and regulation excerpts
      │
      ├── Agent 3 — PatternAnalysis
      │     maps pattern codes to full compliance descriptions
      │     no LLM — deterministic lookup
      │
      └── Agent 4 — Explainability
            LangChain PromptTemplate + Ollama llama3 (local)
            generates 3-sentence GDPR-compliant audit explanation
            cites exact regulation, references past cases
      ▼
.NET combines rule score + AI confidence into final result
      ▼
React frontend displays result to analyst
      risk score · decision · explanation · regulation reference
      analyst clicks Approve / Monitor / Escalate
```

---

## The agent pipeline

```
.NET 8 Web API  →  C# pattern detection rules
                          │
                          ▼
            Python AI Service — LangGraph StateGraph
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
   Agent 1            Agent 2         Agent 3
DataCollector      RAGRetrieval    PatternAnalysis
Parses transactions  LangChain +    Maps patterns to
into plain-text      ChromaDB +     compliance descriptions
summary              Ollama embeds  and severity ranking
          │               │               │
          └───────────────┴───────────────┘
                          │
                          ▼
                      Agent 4
                  Explainability
              LangChain PromptTemplate
              + Ollama llama3 (local)
              Generates 3-sentence
              GDPR-compliant audit
              explanation
                          │
                          ▼
            .NET returns AdvisorResult to React frontend
```

---

## Detection rules

Five patterns checked in C# — no AI needed here:

- **Structuring** — 3+ cash deposits between €7,000–€9,999. Deliberately staying below the €10,000 reporting threshold.
- **Rapid fund movement** — large deposit then withdrawal within 48 hours with no business reason.
- **Dormant account** — inactive 90+ days then suddenly receives a large transaction.
- **High risk country** — counterparty in a FATF-listed jurisdiction like Nigeria, Iran, or North Korea.
- **Money mule** — 4+ inbound transfers from different sources, one matching outbound transfer.

---

## Tech stack

| Technology | Role |
|---|---|
| .NET 8 | Web API, pattern detection rules, risk scoring |
| React | Frontend — dashboard, analyse form, alert queue |
| Python FastAPI | AI service entry point |
| LangGraph | Multi-agent state machine — orchestrates 4 agents |
| LangChain | RAG chain, prompt templates, Ollama wrapper |
| ChromaDB | Vector database — AML cases, typologies, regulations |
| Ollama llama3 | Local LLM — embeddings + explanation generation |

---

## Real examples I tested

**Example 1 — Structuring**

Lars Andersen made four cash deposits of €9,500 / €9,200 / €9,800 / €9,100 across different branches over five days.

```
Risk Score:  45
Risk Level:  MEDIUM
Decision:    MONITOR
Pattern:     structuring

Explanation: "Multiple cash deposits of €9,500 to €9,800 spread across
different branches with no apparent legitimate business purpose —
indicative of structuring (smurfing), prohibited by Danish FSA AML Rules
requiring reporting of cash transactions above DKK 50,000. Recommend
escalating and potentially filing a SAR within 2 business days."

Regulation:  FATF Recommendation 16 — cash threshold reporting
```

---

**Example 2 — Dormant account + rapid fund movement**

Erik Johansson had an account inactive for 210 days. Received €45,000 from Nigeria and transferred €44,500 to UAE within 8 hours.

```
Risk Score:  100
Risk Level:  HIGH
Decision:    ESCALATE
Patterns:    rapid_fund_movement + dormant_account_activation + high_risk_country

Explanation: "Customer C-8841 received a €45,000 wire transfer from Nigeria
followed by an immediate outbound transfer of €44,500 to the United Arab
Emirates. This rapid fund movement and dormant account activation pattern
is indicative of pre-arranged money laundering as specified in EBA Guidelines
on pass-through accounts. Recommend immediate ESCALATION and SAR filing."

Regulation:  EBA Guidelines on risk factors — pass-through accounts
```

---

**Example 3 — Clean customer**

Anna Sørensen — monthly salary, rent payment, small ATM withdrawal.

```
Risk Score:  0
Risk Level:  LOW
Decision:    APPROVE
Patterns:    none

Explanation: "No suspicious patterns detected for customer C-0021.
Transaction behaviour is consistent with normal retail banking activity.
Decision: APPROVE."
```

---

## Prerequisites

Install these once:

1. [.NET 8 SDK](https://dotnet.microsoft.com/download)
2. [Ollama](https://ollama.com)
3. Python 3.11 or 3.12 from python.org
4. [Node.js LTS](https://nodejs.org)

Pull the AI models once after installing Ollama:

```
ollama pull llama3
ollama pull nomic-embed-text
```

---

## How to run

Open 4 terminals in this exact order:

**Terminal 1 — Ollama (start first, always)**
```
ollama serve
```
Wait for: `Ollama is running on http://localhost:11434`

**Terminal 2 — Python AI service**
```
cd ai-service
pip install -r requirements.txt
uvicorn app:app --port 8000
```
First run seeds ChromaDB automatically:
```
[AML Advisor AI] Seeding ChromaDB with AML knowledge...
[AML Advisor AI] Seeded 18 documents into ChromaDB
```
This only runs once. After that it loads from disk instantly.

**Terminal 3 — .NET API**
```
cd dotnet-api
dotnet run
```
Wait for: `Now listening on: http://localhost:5000`

**Terminal 4 — React frontend**
```
cd frontend
npm install
npm start
```
Browser opens automatically at `http://localhost:3000`

Swagger UI also available at `http://localhost:5000/swagger` if you want to test the API directly without the frontend.

---

## API endpoint

```
POST http://localhost:5000/api/advisor/analyse
```

```json
{
  "customerId": "C-1042",
  "name": "Lars Andersen",
  "country": "DK",
  "accountType": "personal",
  "lastActivityDays": 5,
  "transactions": [
    { "id": "T-001", "amount": 9500, "type": "cash_deposit", "timestamp": "2024-03-01T09:00:00" },
    { "id": "T-002", "amount": 9200, "type": "cash_deposit", "timestamp": "2024-03-02T11:00:00" },
    { "id": "T-003", "amount": 9800, "type": "cash_deposit", "timestamp": "2024-03-04T14:00:00" },
    { "id": "T-004", "amount": 9100, "type": "cash_deposit", "timestamp": "2024-03-05T10:00:00" }
  ]
}
```

Example response:

```json
{
  "customerId": "C-1042",
  "customerName": "Lars Andersen",
  "riskScore": 45,
  "riskLevel": "MEDIUM",
  "decision": "MONITOR",
  "detectedPatterns": ["structuring"],
  "explanation": "Multiple cash deposits of €9,500 to €9,800 spread across different branches...",
  "similarCases": ["case_1042", "case_1145"],
  "regulationReference": "FATF Recommendation 16 — cash threshold reporting",
  "advisedBy": "AML Advisor AI — LangGraph + LangChain RAG + Ollama",
  "analyzedAt": "2024-03-15T10:32:00Z"
}
```

---

## Test scenarios (curl)

```bash
# Structuring — 4 cash deposits just under €10,000
curl -X POST http://localhost:5000/api/advisor/analyse \
  -H "Content-Type: application/json" \
  -d @test-inputs/scenario1_structuring.json

# Dormant account + wire from Nigeria to UAE
curl -X POST http://localhost:5000/api/advisor/analyse \
  -H "Content-Type: application/json" \
  -d @test-inputs/scenario2_dormant_rapid.json

# Money mule pattern
curl -X POST http://localhost:5000/api/advisor/analyse \
  -H "Content-Type: application/json" \
  -d @test-inputs/scenario3_money_mule.json

# Clean customer — should return LOW / APPROVE
curl -X POST http://localhost:5000/api/advisor/analyse \
  -H "Content-Type: application/json" \
  -d @test-inputs/scenario4_clean_customer.json
```

Or use the quick load buttons on the Analyse page in the React frontend — they pre-fill all four scenarios automatically.

---

## Project structure

```
aml-advisor-ai/
├── dotnet-api/
│   ├── Controllers/AdvisorController.cs      API endpoints
│   ├── Models/Models.cs                       request and response shapes
│   ├── Services/PatternDetectionService.cs    five AML rules in C#
│   ├── Services/RiskScoringService.cs         risk score calculation
│   ├── Program.cs                             startup
│   └── AmlAdvisorAI.csproj
│
├── ai-service/
│   ├── app.py                                 FastAPI entry point
│   ├── graph.py                               LangGraph pipeline
│   ├── seeder.py                              loads ChromaDB on first run
│   ├── requirements.txt
│   ├── agents/
│   │   ├── state.py                           shared data between agents
│   │   ├── data_collector.py                  Agent 1
│   │   ├── rag_retrieval.py                   Agent 2
│   │   ├── pattern_analysis.py                Agent 3
│   │   └── explainability.py                  Agent 4
│   └── data/
│       ├── aml_cases.json                     6 synthetic past AML cases
│       ├── typologies.txt                     AML pattern descriptions
│       └── regulations.txt                    EU and Nordic regulations
│
├── frontend/
│   ├── src/
│   │   ├── App.js                             routing
│   │   ├── api.js                             calls to .NET API
│   │   ├── components/
│   │   │   ├── Sidebar.js                     navigation
│   │   │   └── ResultPanel.js                 shows analysis result
│   │   └── pages/
│   │       ├── Dashboard.js                   overview and stats
│   │       ├── AnalysePage.js                 transaction form
│   │       └── AlertQueue.js                  past alerts table
│   └── package.json
│
└── test-inputs/
    ├── scenario1_structuring.json
    ├── scenario2_dormant_rapid.json
    ├── scenario3_money_mule.json
    └── scenario4_clean_customer.json
```

---

## What this is not

This is a proof of concept. The AML cases in ChromaDB are synthetic — written to demonstrate RAG retrieval, not real bank data. The detection rules are simplified versions of real compliance rules. A production system would need proper authentication, a real audit log database, more cases in the knowledge base, and integration with core banking systems.

The goal was to show the architecture — deterministic compliance rules combined with explainable local AI — and prove the explanation is specific and regulation-cited enough to be useful to a real compliance analyst.

---

## LinkedIn post

> Built **AML Advisor AI** — a fully local AML detection system using LangGraph multi-agent orchestration + LangChain RAG + ChromaDB + Ollama + .NET 8 + React. Four AI agents collaborate to analyse transactions, retrieve similar past cases, and generate GDPR-compliant audit explanations — all running on-premise with zero cloud dependency. Built for Nordic banks.

```
#AML #LangGraph #LangChain #RAG #Ollama #ChromaDB #DotNet #CSharp
#Python #React #AIEngineering #Compliance #FinTech #NordicBanking
#MachineLearning #GenerativeAI #VectorDatabase #LLM #AIAgents
```

---

Built with .NET 8, Python, LangGraph, LangChain, ChromaDB, Ollama, and React.
