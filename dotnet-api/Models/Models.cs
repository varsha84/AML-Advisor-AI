namespace AmlAdvisorAI.Models;

public class Transaction
{
    public string Id { get; set; } = "";
    public decimal Amount { get; set; }
    public string Type { get; set; } = "";       // cash_deposit, cash_withdrawal, wire_in, wire_out
    public DateTime Timestamp { get; set; }
    public string CounterpartyCountry { get; set; } = "";
    public string Description { get; set; } = "";
}

public class AnalyzeRequest
{
    public string CustomerId { get; set; } = "";
    public string Name { get; set; } = "";
    public string Country { get; set; } = "";
    public string AccountType { get; set; } = "personal";
    public int AccountAgeDays { get; set; } = 365;
    public int LastActivityDays { get; set; } = 0;
    public List<Transaction> Transactions { get; set; } = new();
}

public class AdvisorResult
{
    public string CustomerId { get; set; } = "";
    public string CustomerName { get; set; } = "";
    public int RiskScore { get; set; }
    public string RiskLevel { get; set; } = "";
    public string Decision { get; set; } = "";
    public List<string> DetectedPatterns { get; set; } = new();
    public string Explanation { get; set; } = "";
    public List<string> SimilarCases { get; set; } = new();
    public string RegulationReference { get; set; } = "";
    public string AdvisedBy { get; set; } = "AML Advisor AI — LangGraph + LangChain RAG + Ollama";
    public DateTime AnalyzedAt { get; set; } = DateTime.UtcNow;
}
