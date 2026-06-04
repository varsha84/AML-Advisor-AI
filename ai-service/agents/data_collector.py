from agents.state import AdvisorState


# AML Advisor AI — Agent 1: DataCollectorAgent
# Parses raw transaction data into a structured plain-text summary.
# No LLM needed — pure data transformation.
# Other agents use this summary as their input context.
def data_collector_agent(state: AdvisorState) -> AdvisorState:
    transactions = state["transactions"]

    lines    = []
    total    = 0.0
    countries = set()

    for t in transactions:
        amount  = t.get("amount", 0)
        txtype  = t.get("type", "unknown").replace("_", " ")
        date    = str(t.get("timestamp", ""))[:10]
        country = t.get("counterpartyCountry", "")
        desc    = t.get("description", "")

        total += amount
        if country:
            countries.add(country)

        line = f"- {txtype} of €{amount:,.0f} on {date}"
        if country:
            line += f" (counterparty country: {country})"
        if desc:
            line += f" — {desc}"
        lines.append(line)

    return {
        **state,
        "transaction_summary": "\n".join(lines),
        "total_amount":        total,
        "transaction_count":   len(transactions),
        "countries_involved":  list(countries),
    }
