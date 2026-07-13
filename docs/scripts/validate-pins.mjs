#!/usr/bin/env node
// Provenance-pin validation — rule 5 of the canonical-source decision
// (ThreadHub thread canonical-source-designation, thd_c1a2a74df65b).
//
// Enforced (exit 1, blocks merge):
//   - every atlas page carries a "> **Provenance:**" line
//   - every pin token parses as <repo>@<40-hex-sha>
//   - <repo> is a known artifact repo (allowlist below)
//   - the pinned commit exists, wherever that is checkable (local sibling
//     checkout, or GitHub API — unauthenticated for public repos, with
//     GITHUB_TOKEN/PIN_VALIDATION_TOKEN for private ones)
// Disclosed (never fails): a staleness report comparing each pin to the
// referenced repo's current head. An UNVERIFIABLE commit (no local checkout,
// no API access) is also disclosed rather than failed, so local runs and CI
// degrade gracefully — but a commit that IS checkable and missing fails.
//
// Usage: node scripts/validate-pins.mjs   (from anywhere; repo-root aware)

import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const REPOS = {
  // Legacy pre-monorepo repos — kept so pins written in that era stay checkable.
  "clista-protocol": { github: "lati-club/ClisTa-Protocol", local: join(homedir(), "clista-protocol") },
  "ThreadHub":       { github: "lati-club/ThreadHub",       local: join(homedir(), "ThreadHub") },
  "clista-ai-app":   { github: "lati-club/clista-ai-app",   local: join(homedir(), "Documents", "clista-ai-app") },
  // Current era: the monorepo itself, and the prompt-studio workstream.
  "clista":          { github: "lati-cooki/clista",         local: join(homedir(), "Projects", "clista") },
  "prompt-studio":   { github: "lati-cooki/prompt-studio",  local: join(homedir(), "DevSwarmProjects", "Clista") },
};

const TOKEN = process.env.PIN_VALIDATION_TOKEN || process.env.GITHUB_TOKEN || "";

function pages() {
  // ROOT is docs/ itself (monorepo layout; this script lives in docs/scripts).
  // Walk it recursively — README/HANDOFF are inside the walk — skipping scripts/.
  const out = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir)) {
      const p = join(dir, e);
      if (statSync(p).isDirectory()) { if (p !== join(ROOT, "scripts")) walk(p); }
      else if (e.endsWith(".md")) out.push(p);
    }
  };
  walk(ROOT);
  return out;
}

function git(repoPath, args) {
  return execFileSync("git", ["-C", repoPath, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function localHas(repoPath, sha) {
  try { execFileSync("git", ["-C", repoPath, "cat-file", "-e", `${sha}^{commit}`], { stdio: "ignore" }); return true; }
  catch { return false; }
}

async function ghCommitExists(slug, sha) {
  const headers = { "User-Agent": "clista-atlas-pin-validator", Accept: "application/vnd.github+json" };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  // GitHub answers 404 (not 403) for private repos a token cannot see, so a
  // bare commit 404 conflates "commit missing" with "no API access". Check
  // repo visibility first: an invisible repo is UNVERIFIABLE (disclosed, per
  // the header contract), while a missing commit in a visible repo fails.
  const repo = await fetch(`https://api.github.com/repos/${slug}`, { headers });
  if (repo.status !== 200) return null; // repo not visible to this token → unverifiable
  const res = await fetch(`https://api.github.com/repos/${slug}/commits/${sha}`, { headers });
  if (res.status === 200) return true;
  if (res.status === 404 || res.status === 422) return false;
  return null; // 401/403/rate-limit → unverifiable
}

async function ghHead(slug) {
  const headers = { "User-Agent": "clista-atlas-pin-validator", Accept: "application/vnd.github+json" };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  const repo = await fetch(`https://api.github.com/repos/${slug}`, { headers });
  if (repo.status !== 200) return null;
  const branch = (await repo.json()).default_branch;
  const res = await fetch(`https://api.github.com/repos/${slug}/commits/${branch}`, { headers });
  if (res.status !== 200) return null;
  return (await res.json()).sha;
}

const errors = [];
const stale = [];
const unverifiable = [];

for (const file of pages()) {
  const rel = file.slice(ROOT.length + 1);
  const text = readFileSync(file, "utf8");
  const line = text.split("\n").find((l) => l.startsWith("> **Provenance:**"));
  if (!line) { errors.push(`${rel}: missing "> **Provenance:**" line`); continue; }
  const body = line.replace("> **Provenance:**", "").trim();
  const tokens = body.split("·").map((t) => t.trim()).filter(Boolean);
  if (!tokens.length) { errors.push(`${rel}: Provenance line has no pins`); continue; }
  for (const tok of tokens) {
    const m = /^([A-Za-z0-9_.-]+)@([0-9a-f]{40})$/.exec(tok);
    if (!m) { errors.push(`${rel}: malformed pin "${tok}" (want <repo>@<40-hex-sha>)`); continue; }
    const [, repo, sha] = m;
    const known = REPOS[repo];
    if (!known) { errors.push(`${rel}: unknown repo "${repo}" (allowlist: ${Object.keys(REPOS).join(", ")})`); continue; }

    let exists = null, head = null, via = null;
    if (existsSync(join(known.local, ".git"))) {
      exists = localHas(known.local, sha);
      try { head = git(known.local, ["rev-parse", "HEAD"]); } catch {}
      via = "local";
    } else {
      exists = await ghCommitExists(known.github, sha);
      head = await ghHead(known.github);
      via = "github";
    }
    if (exists === false) errors.push(`${rel}: ${repo}@${sha.slice(0, 12)} does not exist (checked via ${via})`);
    else if (exists === null) unverifiable.push(`${rel}: ${repo}@${sha.slice(0, 12)} (no local checkout, no API access)`);
    if (head && head !== sha) stale.push(`${rel}: ${repo} pinned ${sha.slice(0, 12)}, current head ${head.slice(0, 12)}`);
  }
}

console.log("Provenance pin validation (canonical-source rule 5)");
console.log("====================================================");
if (errors.length) { console.log("\nERRORS (blocking):"); for (const e of errors) console.log("  ✗ " + e); }
else console.log("\nAll pages pinned; all pins well-formed and resolvable where checkable.");
if (unverifiable.length) { console.log("\nUNVERIFIABLE (disclosed, not blocking):"); for (const u of unverifiable) console.log("  ? " + u); }
console.log("\nStaleness report (disclosed, not blocking):");
if (stale.length) for (const s of stale) console.log("  ~ " + s);
else console.log("  all pins match the referenced repos' current heads");
process.exit(errors.length ? 1 : 0);
