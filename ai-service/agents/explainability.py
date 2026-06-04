from langchain_community.llms import Ollama
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from agents.state import AdvisorState

OLLAMA_BASE = "http://localhost:11434"

# AML Advisor AI prompt — instructs Ollama to write like a compliance analyst,
# not like an AI. Specific, regulation-cited, audit-ready.
ADVISOR_PROMPT = PromptTemplate.from_template("""
You are a senior AML compliance analyst at a Nordic bank using AML Advisor AI.
Write a professional audit explanation for the compliance case below.

Customer ID: {customer_id}
Transactions:
{transaction_summary}

Detected AML patterns:
{pattern_descriptions}

Similar past cases from our compliance database:
{similar_cases}

Relevant regulations retrieved by AML Advisor AI:
{regulation_context}

Rules for your response:
- Maximum 3 sentences
- Sentence 1: describe exactly what the transactions show (amounts, dates, behaviour)
- Sentence 2: name the AML typology and cite the specific regulation
- Sentence 3: state the recommendation — ESCALATE, MONITOR, or APPROVE
- Do not use bullet points or headers
- Be specific — mention actual amounts and pattern names
- Write as a compliance professional, not as an AI assistant
""")


# AML Advisor AI — Agent 4: ExplainabilityAgent
# The most important agent in the pipeline.
# Uses a LangChain chain (PromptTemplate | Ollama | StrOutputParser)
# to generate a GDPR Article 22 compliant audit explanation.
def explainability_agent(state: AdvisorState) -> AdvisorState:
    patterns = state.get("detected_patterns", [])

    # Clean customer — skip LLM call entirely
    if not patterns:
        return {
            **state,
            "explanation":      f"AML Advisor AI found no suspicious patterns for customer {state['customer_id']}. Transaction behaviour is consistent with normal retail banking activity. Decision: APPROVE.",
            "confidence_boost": 0,
            "recommendation":   "APPROVE",
        }

    pattern_text = "\n".join(f"- {d}" for d in state.get("pattern_descriptions", []))
    cases_text   = "\n".join(f"- {c}" for c in state.get("similar_cases", [])) or "No similar cases found in database."
    reg_text     = "\n".join(f"- {r}" for r in state.get("regulation_context", [])) or "Standard AML monitoring applies."

    try:
        llm   = Ollama(model="llama3", base_url=OLLAMA_BASE, temperature=0.1)
        chain = ADVISOR_PROMPT | llm | StrOutputParser()

        explanation = chain.invoke({
            "customer_id":          state["customer_id"],
            "transaction_summary":  state["transaction_summary"],
            "pattern_descriptions": pattern_text,
            "similar_cases":        cases_text,
            "regulation_context":   reg_text,
        })

        return {
            **state,
            "explanation":      explanation.strip(),
            "confidence_boost": min(15, len(patterns) * 5 + (5 if state.get("similar_cases") else 0)),
            "recommendation":   _recommendation(patterns),
        }

    except Exception as e:
        print(f"[AML Advisor AI] LLM call failed, using fallback: {e}")
        return {
            **state,
            "explanation":      _fallback(state, patterns),
            "confidence_boost": len(patterns) * 5,
            "recommendation":   _recommendation(patterns),
        }


def _recommendation(patterns: list) -> str:
    high = {"structuring", "money_mule_pattern", "rapid_fund_movement"}
    if any(p in high for p in patterns):
        return "ESCALATE"
    if patterns:
        return "MONITOR"
    return "APPROVE"


def _fallback(state: AdvisorState, patterns: list) -> str:
    pattern_text = ", ".join(p.replace("_", " ") for p in patterns)
    return (
        f"AML Advisor AI detected {pattern_text} for customer {state['customer_id']} "
        f"based on {state['transaction_count']} transactions totalling €{state['total_amount']:,.0f}. "
        f"Pattern matches known AML typologies in the compliance database. "
        f"Recommendation: escalate to compliance officer for manual review."
    )
