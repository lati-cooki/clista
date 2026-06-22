# clista-ai-app

The live **ClisTa Protocol** cockpit — the human-facing surface for the
accountability engine at
[`lati-club/ClisTa-Protocol`](https://github.com/lati-club/ClisTa-Protocol),
deployed to **app.clista.ai**.

> Here's a yes — now trace its shape.

## Status: placeholder

This repo is scaffolded ahead of implementation. The full build plan lives in
[`docs/PLAN.md`](docs/PLAN.md). UI design is in progress (Claude design tool) and
will land before Phase 0 scaffolding begins.

## What this becomes

A Cloudflare-native web app (Vite + React front-end; Worker + Durable Objects
back-end) where real people drive ClisTa: create a decision thread, commit
evidence, raise objections that survive a yes, request/review/record a decision,
and file a minority report — every action a validated, hash-chained ClisTa event.
One Durable Object per Thread holds that thread's append-only event log as the
source of truth.

See [`docs/PLAN.md`](docs/PLAN.md) for architecture, phases, and verification.
