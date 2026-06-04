using AmlAdvisorAI.Models;

namespace AmlAdvisorAI.Services;

// AML Advisor AI — Risk Scoring Service
// Converts detected patterns into a 0-100 risk score.
// Weights are based on real AML risk frameworks used by Nordic banks.
public class RiskScoringService
{
    private static readonly Dictionary<string, int> PatternWeights = new()
    {
        { "structuring",                45 },
        { "rapid_fund_movement",        40 },
        { "dormant_account_activation", 30 },
        { "high_risk_country",          35 },
        { "money_mule_pattern",         50 },
    };

    private static readonly Dictionary<string, string> PatternRegulations = new()
    {
        { "structuring",                "FATF Recommendation 16 — cash threshold reporting" },
        { "rapid_fund_movement",        "EBA Guidelines on risk factors — pass-through accounts" },
        { "dormant_account_activation", "Danish FSA — unusual account reactivation monitoring" },
        { "high_risk_country",          "EU 6th AML Directive — enhanced due diligence" },
        { "money_mule_pattern",         "Europol — money mule typology" },
    };

    public (int score, string level, string decision, string regulation) Calculate(
        List<string> patterns, int aiConfidenceBoost = 0)
    {
        int score = patterns.Sum(p =>
            PatternWeights.TryGetValue(p, out int w) ? w : 0);

        score = Math.Min(100, score + aiConfidenceBoost);

        string level = score switch
        {
            >= 75 => "HIGH",
            >= 40 => "MEDIUM",
            _     => "LOW"
        };

        string decision = level switch
        {
            "HIGH"   => "ESCALATE",
            "MEDIUM" => "MONITOR",
            _        => "APPROVE"
        };

        string regulation = patterns
            .Where(p => PatternRegulations.ContainsKey(p))
            .Select(p => PatternRegulations[p])
            .FirstOrDefault() ?? "Standard AML monitoring";

        return (score, level, decision, regulation);
    }
}
