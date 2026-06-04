from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from graph import advisor_graph
from seeder import seed_knowledge_base


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        seed_knowledge_base()
    except Exception as e:
        print(f"[AML Advisor AI] Seeding skipped (Ollama may still be starting): {e}")
    yield


app = FastAPI(
    title="AML Advisor AI",
    description="LangGraph multi-agent AML detection — LangChain RAG + ChromaDB + Ollama. Built for Nordic banks.",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/analyse")
def analyse(payload: dict):
    request  = payload.get("request", {})
    patterns = payload.get("detected_patterns", [])

    # Initial state passed into the LangGraph pipeline
    initial_state = {
        "customer_id":         request.get("customerId", "unknown"),
        "customer_name":       request.get("name", ""),
        "transactions":        request.get("transactions", []),
        "detected_patterns":   patterns,
        "transaction_summary": "",
        "total_amount":        0.0,
        "transaction_count":   0,
        "countries_involved":  [],
        "similar_cases":       [],
        "similar_case_ids":    [],
        "regulation_context":  [],
        "pattern_descriptions": [],
        "highest_risk_pattern": "",
        "explanation":         "",
        "confidence_boost":    0,
        "recommendation":      "",
    }

    # LangGraph runs all 4 agents in sequence
    final_state = advisor_graph.invoke(initial_state)

    return {
        "explanation":      final_state["explanation"],
        "confidence_boost": final_state["confidence_boost"],
        "similar_cases":    final_state["similar_case_ids"],
        "recommendation":   final_state["recommendation"],
    }


@app.get("/health")
def health():
    return {
        "service":  "AML Advisor AI",
        "version":  "2.0.0",
        "status":   "running",
        "pipeline": "LangGraph StateGraph",
        "agents":   ["DataCollector", "RAGRetrieval", "PatternAnalysis", "Explainability"],
        "llm":      "Ollama llama3 (local — no cloud)",
        "vectordb": "ChromaDB (on-premise)",
        "rag":      "LangChain Chroma retriever + OllamaEmbeddings",
        "built_for": "Nordic banks — Danske Bank, Nordea",
    }
