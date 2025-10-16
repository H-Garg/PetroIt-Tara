import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// --- Models ---
const RunStatus = { Queued: "Queued", Running: "Running", Passed: "Passed", Failed: "Failed" };
const StageStatus = { Queued: "Queued", Running: "Running", Passed: "Passed", Failed: "Failed" };

// --- In-memory store ---
let seq = 840;
const runs = new Map();

function addRun(run) { runs.set(run.id, run); return run; }
function seed() {
  addRun({
    id: ++seq, branch: "main", commit: "1e9a7c2", title: "align logs", author: "akshat",
    startedAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    status: RunStatus.Running,
    stages: [
      { name: "Checkout", status: StageStatus.Passed, durationSec: 12 },
      { name: "Build", status: StageStatus.Passed, durationSec: 65 },
      { name: "Test", status: StageStatus.Running, durationSec: 39 },
      { name: "Deploy", status: StageStatus.Queued },
      { name: "Verify", status: StageStatus.Queued }
    ]
  });
  addRun({
    id: ++seq, branch: "main", commit: "8b2f4aa", title: "bump envoy", author: "neha",
    startedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    status: RunStatus.Passed,
    stages: [
      { name: "Checkout", status: StageStatus.Passed, durationSec: 10 },
      { name: "Build", status: StageStatus.Passed, durationSec: 55 },
      { name: "Test", status: StageStatus.Passed, durationSec: 76 },
      { name: "Deploy", status: StageStatus.Passed, durationSec: 52 },
      { name: "Verify", status: StageStatus.Passed, durationSec: 45 }
    ]
  });
  addRun({
    id: ++seq, branch: "main", commit: "d4c5b10", title: "fix canary ingress", author: "tushar",
    startedAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
    status: RunStatus.Failed,
    stages: [
      { name: "Checkout", status: StageStatus.Passed, durationSec: 11 },
      { name: "Build", status: StageStatus.Passed, durationSec: 50 },
      { name: "Test", status: StageStatus.Passed, durationSec: 70 },
      { name: "Deploy", status: StageStatus.Failed, durationSec: 38 },
      { name: "Verify", status: StageStatus.Queued }
    ]
  });
}
seed();

// --- Helpers ---
const byNewest = (a, b) => new Date(b.startedAt) - new Date(a.startedAt);

// --- Routes ---
app.get("/", (_req, res) => res.json({ name: "PipeTrack API", docs: "/health, /api/runs" }));

// List runs with simple filters: ?status=Running&branch=main&author=akshat&q=term
app.get("/api/runs", (req, res) => {
  const { status, branch, author, q } = req.query;
  let list = [...runs.values()];
  if (status) list = list.filter(r => r.status.toLowerCase() === String(status).toLowerCase());
  if (branch) list = list.filter(r => r.branch.toLowerCase() === String(branch).toLowerCase());
  if (author) list = list.filter(r => r.author.toLowerCase() === String(author).toLowerCase());
  if (q) {
    const s = String(q).toLowerCase();
    list = list.filter(r => r.commit.toLowerCase().includes(s) || r.title.toLowerCase().includes(s));
  }
  res.json(list.sort(byNewest));
});

// Get single run
app.get("/api/runs/:id", (req, res) => {
  const run = runs.get(Number(req.params.id));
  if (!run) return res.status(404).json({ error: "Not found" });
  res.json(run);
});

// Creat
