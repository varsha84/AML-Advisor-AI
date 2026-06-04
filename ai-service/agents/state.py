from typing import TypedDict, List


# AML Advisor AI — Shared Agent State
# This TypedDict flows through every node in the LangGraph pipeline.
# Each agent reads from it and writes its output back into it.
class AdvisorState(TypedDict):

    # Input — set once when the graph starts
    customer_id:        str
    customer_name:      str
    transactions:       List[dict]
    detected_patterns:  List[str]

    # Set by DataCollectorAgent (Agent 1)
    transaction_summary: str
    total_amount:        float
    transaction_count:   int
    countries_involved:  List[str]

    # Set by RAGRetrievalAgent (Agent 2)
    similar_cases:       List[str]
    similar_case_ids:    List[str]
    regulation_context:  List[str]

    # Set by PatternAnalysisAgent (Agent 3)
    pattern_descriptions: List[str]
    highest_risk_pattern: str

    # Set by ExplainabilityAgent (Agent 4)
    explanation:         str
    confidence_boost:    int
    recommendation:      str
