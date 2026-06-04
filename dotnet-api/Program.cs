using AmlAdvisorAI.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddHttpClient();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new()
    {
        Title       = "AML Advisor AI",
        Version     = "v1",
        Description = "Fully local AML detection system — LangGraph + LangChain RAG + ChromaDB + Ollama + .NET 8. Built for Nordic banks."
    });
});

builder.Services.AddScoped<PatternDetectionService>();
builder.Services.AddScoped<RiskScoringService>();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "AML Advisor AI v1");
    c.DocumentTitle = "AML Advisor AI";
});

app.UseCors();
app.MapControllers();

app.Run("http://localhost:5000");
