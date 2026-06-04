import json
import chromadb
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document

CHROMA_PATH = "./chroma_store"
OLLAMA_BASE = "http://localhost:11434"
COLLECTION  = "aml_advisor_knowledge"


def seed_knowledge_base():
    # Skip if already seeded
    client     = chromadb.PersistentClient(path=CHROMA_PATH)
    collection = client.get_or_create_collection(COLLECTION)

    if collection.count() > 0:
        print(f"[AML Advisor AI] ChromaDB ready — {collection.count()} documents loaded")
        return

    print("[AML Advisor AI] Seeding ChromaDB with AML knowledge...")
    print("[AML Advisor AI] Using Ollama embeddings — this takes ~30 seconds on first run")

    embeddings = OllamaEmbeddings(model="llama3", base_url=OLLAMA_BASE)
    docs       = []

    # Past AML cases — gives the LLM real precedent to cite
    with open("data/aml_cases.json") as f:
        for case in json.load(f):
            docs.append(Document(
                page_content=case["text"],
                metadata={"source": "case", "case_id": case["id"], "pattern": case["pattern"]}
            ))

    # AML typology descriptions — helps RAG find the right pattern definition
    with open("data/typologies.txt") as f:
        for i, chunk in enumerate(f.read().strip().split("\n\n")):
            if chunk.strip():
                docs.append(Document(
                    page_content=chunk.strip(),
                    metadata={"source": "typology", "index": i}
                ))

    # EU and Nordic regulation excerpts — gives the LLM the exact rule to cite
    with open("data/regulations.txt") as f:
        for i, chunk in enumerate(f.read().strip().split("\n\n")):
            if chunk.strip():
                docs.append(Document(
                    page_content=chunk.strip(),
                    metadata={"source": "regulation", "index": i}
                ))

    Chroma.from_documents(
        documents=docs,
        embedding=embeddings,
        collection_name=COLLECTION,
        persist_directory=CHROMA_PATH,
    )

    print(f"[AML Advisor AI] Seeded {len(docs)} documents into ChromaDB")
