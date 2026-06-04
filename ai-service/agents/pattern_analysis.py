from agents.state import AdvisorState


# AML Advisor AI — Agent 3: PatternAnalysisAgent
# Maps raw pattern keys into human-readable compliance descriptions.
# No LLM — deterministic lookup. Fast and fully auditable.
PATTERN_DESCRIPTIONS = {
    "structuring": (
        "Structuring (smurfing): multiple cash deposits just below the €10,000 "
        "mandatory reporting threshold, spread across branches or days to avoid detection."
    ),
    "rapid_fund_movement": (
        "Rapid fund movement: large amount received and immediately transferred out "
        "within 48 hours with no apparent business purpose — classic pass-through behaviour."
    ),
    "dormant_account_activation": (
        "Dormant account activation: account inactive for 90+ days suddenly receiving "
        "large transactions, a known indicator of pre-arranged money laundering use."
    ),
    "high_risk_country": (
        "High-risk country involvement: transaction counterparty located in a "
        "FATF-listed high-risk jurisdiction requiring enhanced due diligence under EU law."
    ),
    "money_mule_pattern": (
        "Money mule pattern: multiple inbound transfers from different sources "
        "consolidated and immediately forwarded as a single outbound payment."
    ),
}

# Ordered by severity — first match becomes the primary explanation lead
SEVERITY_ORDER = [
    "money_mule_pattern",
    "structuring",
    "rapid_fund_movement",
    "high_risk_country",
    "dormant_account_activation",
]


def pattern_analysis_agent(state: AdvisorState) -> AdvisorState:
    patterns = state.get("detected_patterns", [])

    descriptions = [
        PATTERN_DESCRIPTIONS[p]
        for p in patterns
        if p in PATTERN_DESCRIPTIONS
    ]

    highest = next(
        (p for p in SEVERITY_ORDER if p in patterns),
        patterns[0] if patterns else "none"
    )

    return {
        **state,
        "pattern_descriptions": descriptions,
        "highest_risk_pattern": highest,
    }
