from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import OllamaEmbeddings
from langchain_core.documents import Document
from agents.state import AdvisorState

CHROMA_PATH = "./chroma_store"
OLLAMA_BASE = "http://localhost:11434"


# AML Advisor AI — Agent 2: RAGRetrievalAgent
# Uses LangChain's Chroma retriever with Ollama embeddings to find
# the most semantically similar past AML cases and regulation excerpts.
# This is the RAG step — Retrieval Augmented Generation.
def rag_retrieval_agent(state: AdvisorState) -> AdvisorState:
    query = _build_query(state)

    try:
        embeddings  = OllamaEmbeddings(model="llama3", base_url=OLLAMA_BASE)
        vectorstore = Chroma(
            collection_name="aml_advisor_knowledge",
            embedding_function=embeddings,
            persist_directory=CHROMA_PATH,
        )
        retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
        docs: list[Document] = retriever.invoke(query)

        case_docs = []
        case_ids  = []
        reg_docs  = []

        for doc in docs:
            source = (doc.metadata or {}).get("source", "")
            if source == "case":
                case_docs.append(doc.page_content)
                case_ids.append((doc.metadata or {}).get("case_id", "unknown"))
            else:
                reg_docs.append(doc.page_content)

        return {
            **state,
            "similar_cases":      case_docs,
            "similar_case_ids":   case_ids,
            "regulation_context": reg_docs,
        }

    except Exception as e:
        print(f"[AML Advisor AI] RAG retrieval warning: {e}")
        return {
            **state,
            "similar_cases":      [],
            "similar_case_ids":   [],
            "regulation_context": [],
        }


def _build_query(state: AdvisorState) -> str:
    patterns = ", ".join(state.get("detected_patterns", []))
    summary  = state.get("transaction_summary", "")
    return f"AML patterns: {patterns}. Transactions: {summary[:400]}"
