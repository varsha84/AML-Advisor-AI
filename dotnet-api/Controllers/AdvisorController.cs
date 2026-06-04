using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Json;
using AmlAdvisorAI.Models;
using AmlAdvisorAI.Services;

namespace AmlAdvisorAI.Controllers;

[ApiController]
[Route("api/advisor")]
public class AdvisorController : ControllerBase
{
    private readonly HttpClient _http;
    private readonly PatternDetectionService _patterns;
    private readonly RiskScoringService _scoring;
    private readonly ILogger<AdvisorController> _logger;

    public AdvisorController(
        IHttpClientFactory httpFactory,
        PatternDetectionService patterns,
        RiskScoringService scoring,
        ILogger<AdvisorController> logger)
    {
        _http     = httpFactory.CreateClient();
        _patterns = patterns;
        _scoring  = scoring;
        _logger   = logger;
    }

    /// <summary>
    /// Analyse a customer's transactions for AML risk.
    /// Runs C# pattern detection then sends to the LangGraph AI pipeline for explanation.
    /// </summary>
    [HttpPost("analyse")]
    public async Task<IActionResult> Analyse([FromBody] AnalyzeRequest request)
    {
        _logger.LogInformation(
            "[AML Advisor AI] Analysing customer {Id} — {Count} transactions",
            request.CustomerId, request.Transactions.Count);

        // Step 1: C# rule engine — fast, deterministic pattern detection
        var detectedPatterns = _patterns.Detect(request);

        // Step 2: LangGraph AI pipeline — RAG retrieval + LLM explanation
        AiAdvisorResult? aiResult = null;
        try
        {
            var aiResponse = await _http.PostAsJsonAsync(
                "http://localhost:8000/analyse",
                new { request, detected_patterns = detectedPatterns }
            );
            aiResult = await aiResponse.Content.ReadFromJsonAsync<AiAdvisorResult>();
        }
        catch (Exception ex)
        {
            // AI pipeline is best-effort — system works without it
            _logger.LogWarning("[AML Advisor AI] AI pipeline unavailable: {Msg}", ex.Message);
        }

        // Step 3: combine rule score + AI confidence boost into final result
        var (score, level, decision, regulation) =
            _scoring.Calculate(detectedPatterns, aiResult?.ConfidenceBoost ?? 0);

        var result = new AdvisorResult
        {
            CustomerId          = request.CustomerId,
            CustomerName        = request.Name,
            RiskScore           = score,
            RiskLevel           = level,
            Decision            = decision,
            DetectedPatterns    = detectedPatterns,
            Explanation         = aiResult?.Explanation ?? BuildFallbackExplanation(request, detectedPatterns, level),
            SimilarCases        = aiResult?.SimilarCases ?? new List<string>(),
            RegulationReference = regulation,
        };

        return Ok(result);
    }

    /// <summary>
    /// Health check — confirms AML Advisor AI is running.
    /// </summary>
    [HttpGet("health")]
    public IActionResult Health() => Ok(new
    {
        service = "AML Advisor AI",
        status  = "running",
        stack   = ".NET 8 + LangGraph + LangChain RAG + ChromaDB + Ollama"
    });

    private string BuildFallbackExplanation(
        AnalyzeRequest request, List<string> patterns, string level)
    {
        if (!patterns.Any())
            return $"AML Advisor AI found no suspicious patterns for customer {request.CustomerId}. Transaction behaviour appears normal.";

        var patternText = string.Join(", ", patterns).Replace("_", " ");
        return $"AML Advisor AI flagged customer {request.CustomerId} for: {patternText}. " +
               $"Risk level: {level}. Escalation to compliance analyst recommended.";
    }
}

// Shape of what the Python LangGraph service returns
public class AiAdvisorResult
{
    public string Explanation { get; set; } = "";
    public int ConfidenceBoost { get; set; }
    public List<string> SimilarCases { get; set; } = new();
    public string Recommendation { get; set; } = "";
}
