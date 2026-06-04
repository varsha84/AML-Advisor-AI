using AmlAdvisorAI.Models;

namespace AmlAdvisorAI.Services;

// AML Advisor AI — Pattern Detection Service
// Pure C# rule engine. No AI needed here.
// These are the hard compliance rules that Nordic banks actually use.
public class PatternDetectionService
{
    private static readonly HashSet<string> HighRiskCountries = new()
    {
        "NG", "IR", "KP", "MM", "SY", "YE", "AF", "IQ", "LY", "SD"
    };

    public List<string> Detect(AnalyzeRequest request)
    {
        var patterns = new List<string>();

        if (IsStructuring(request.Transactions))
            patterns.Add("structuring");

        if (IsRapidFundMovement(request.Transactions))
            patterns.Add("rapid_fund_movement");

        if (IsDormantAccountActivation(request))
            patterns.Add("dormant_account_activation");

        if (IsHighRiskCountryInvolved(request.Transactions))
            patterns.Add("high_risk_country");

        if (IsMoneyMuleBehaviour(request.Transactions))
            patterns.Add("money_mule_pattern");

        return patterns;
    }

    // Structuring: multiple cash deposits just under the €10,000 reporting threshold
    private bool IsStructuring(List<Transaction> txs)
    {
        var suspicious = txs.Where(t =>
            t.Amount is > 7000 and < 10000 &&
            t.Type == "cash_deposit").ToList();

        return suspicious.Count >= 3;
    }

    // Rapid fund movement: large deposit then immediate withdrawal within 48 hours
    private bool IsRapidFundMovement(List<Transaction> txs)
    {
        var sorted = txs.OrderBy(t => t.Timestamp).ToList();

        for (int i = 0; i < sorted.Count - 1; i++)
        {
            var current = sorted[i];
            var next    = sorted[i + 1];

            bool inThenOut =
                current.Type is "wire_in" or "cash_deposit" &&
                next.Type    is "wire_out" or "cash_withdrawal";

            bool within48h = (next.Timestamp - current.Timestamp).TotalHours <= 48;
            bool largeAmount = current.Amount > 10000;

            if (inThenOut && within48h && largeAmount)
                return true;
        }

        return false;
    }

    // Dormant account: 90+ days inactive then sudden large transaction
    private bool IsDormantAccountActivation(AnalyzeRequest request)
    {
        bool wasDormant     = request.LastActivityDays >= 90;
        bool largeTransaction = request.Transactions.Any(t => t.Amount > 5000);
        return wasDormant && largeTransaction;
    }

    // High risk country: FATF-listed jurisdiction involved
    private bool IsHighRiskCountryInvolved(List<Transaction> txs)
    {
        return txs.Any(t =>
            HighRiskCountries.Contains(t.CounterpartyCountry.ToUpper()));
    }

    // Money mule: many small inbounds then one large matching outbound
    private bool IsMoneyMuleBehaviour(List<Transaction> txs)
    {
        var inbound  = txs.Where(t => t.Type is "wire_in"  or "cash_deposit").ToList();
        var outbound = txs.Where(t => t.Type is "wire_out" or "cash_withdrawal").ToList();

        bool manyInbound      = inbound.Count >= 4;
        bool oneLargeOutbound = outbound.Count == 1 && outbound[0].Amount > 5000;
        bool amountsMatch     = outbound.Count > 0 &&
            Math.Abs(outbound.Sum(t => t.Amount) - inbound.Sum(t => t.Amount)) < 1000;

        return manyInbound && oneLargeOutbound && amountsMatch;
    }
}
