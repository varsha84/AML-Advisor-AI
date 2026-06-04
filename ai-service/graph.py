from langgraph.graph import StateGraph, END
from agents.state          import AdvisorState
from agents.data_collector  import data_collector_agent
from agents.rag_retrieval   import rag_retrieval_agent
from agents.pattern_analysis import pattern_analysis_agent
from agents.explainability  import explainability_agent


# AML Advisor AI — LangGraph Multi-Agent Pipeline
#
# Four agents wired as a StateGraph:
#
#   DataCollectorAgent
#         │
#         ▼
#   RAGRetrievalAgent       ← LangChain + ChromaDB + Ollama embeddings
#         │
#         ▼
#   PatternAnalysisAgent
#         │
#         ▼
#   ExplainabilityAgent     ← LangChain PromptTemplate + Ollama llama3
#         │
#        END

def build_advisor_graph() -> StateGraph:
    graph = StateGraph(AdvisorState)

    graph.add_node("data_collector",   data_collector_agent)
    graph.add_node("rag_retrieval",    rag_retrieval_agent)
    graph.add_node("pattern_analysis", pattern_analysis_agent)
    graph.add_node("explainability",   explainability_agent)

    graph.set_entry_point("data_collector")

    graph.add_edge("data_collector",   "rag_retrieval")
    graph.add_edge("rag_retrieval",    "pattern_analysis")
    graph.add_edge("pattern_analysis", "explainability")
    graph.add_edge("explainability",   END)

    return graph.compile()


# Single compiled graph instance — reused across all requests
advisor_graph = build_advisor_graph()
