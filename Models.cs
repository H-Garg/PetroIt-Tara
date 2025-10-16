using System.Collections.Concurrent;

public enum RunStatus { Queued, Running, Passed, Failed }
public enum StageStatus { Queued, Running, Passed, Failed }

public record Stage(
    string Name,
    StageStatus Status,
    TimeSpan? Duration = null
);

public record PipelineRun(
    int Id,
    string Branch,
    string Commit,
    string Title,
    string Author,
    DateTimeOffset StartedAt,
    RunStatus Status,
    List<Stage> Stages
);

public static class InMemoryRunStore
{
    private static int _id = 840;
    private static readonly ConcurrentDictionary<int, PipelineRun> _runs = new();

    static InMemoryRunStore()
    {
        // Seed data
        Add(new PipelineRun(
            Id: NextId(),
            Branch: "main",
            Commit: "1e9a7c2",
            Title: "align logs",
            Author: "akshat",
            StartedAt: DateTimeOffset.UtcNow.AddMinutes(-6),
            Status: RunStatus.Running,
            Stages: new()
            {
                new("Checkout", StageStatus.Passed, TimeSpan.FromSeconds(12)),
                new("Build", StageStatus.Passed, TimeSpan.FromSeconds(65)),
                new("Test", StageStatus.Running, TimeSpan.FromSeconds(39)),
                new("Deploy", StageStatus.Queued, null),
                new("Verify", StageStatus.Queued, null),
            }
        ));

        Add(new PipelineRun(
            Id: NextId(),
            Branch: "main",
            Commit: "8b2f4aa",
            Title: "bump envoy",
            Author: "neha",
            StartedAt: DateTimeOffset.UtcNow.AddMinutes(-30),
            Status: RunStatus.Passed,
            Stages: new()
            {
                new("Checkout", StageStatus.Passed, TimeSpan.FromSeconds(10)),
                new("Build", StageStatus.Passed, TimeSpan.FromSeconds(55)),
                new("Test", StageStatus.Passed, TimeSpan.FromSeconds(76)),
                new("Deploy", StageStatus.Passed, TimeSpan.FromSeconds(52)),
                new("Verify", StageStatus.Passed, TimeSpan.FromSeconds(45)),
            }
        ));

        Add(new PipelineRun(
            Id: NextId(),
            Branch: "main",
            Commit: "d4c5b10",
            Title: "fix canary ingress",
            Author: "tushar",
            StartedAt: DateTimeOffset.UtcNow.AddMinutes(-55),
            Status: RunStatus.Failed,
            Stages: new()
            {
                new("Checkout", StageStatus.Passed, TimeSpan.FromSeconds(11)),
                new("Build", StageStatus.Passed, TimeSpan.FromSeconds(50)),
                new("Test", StageStatus.Passed, TimeSpan.FromSeconds(70)),
                new("Deploy", StageStatus.Failed, TimeSpan.FromSeconds(38)),
                new("Verify", StageStatus.Queued, null),
            }
        ));
    }

    public static IEnumerable<PipelineRun> All() => _runs.Values.OrderByDescending(r => r.StartedAt);

    public static PipelineRun? Get(int id) => _runs.TryGetValue(id, out var r) ? r : null;

    public static PipelineRun Add(PipelineRun run)
    {
        _runs[run.Id] = run;
        return run;
    }

    public static bool UpdateStatus(int id, RunStatus status)
    {
        return _runs.AddOrUpdate(id, _ => null!, (k, v) => v with { Status = status }) is not null;
    }

    public static int NextId() => Interlocked.Increment(ref _id);
}
