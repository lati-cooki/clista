#!/bin/bash
# Optional wrapper for the clistahermes-moltbook-live-engagement cron.
# Source your secrets here (or ensure they are already in the environment when Hermes cron runs).

# Example (do not commit real values):
# export CF_ACCESS_CLIENT_ID="398a39a665f1d0faeee372da7b67e360.access"
# export CF_ACCESS_CLIENT_SECRET="..."

cd /Users/troylatimer/Documents/clista-ai-app

# The main cron prompt now drives the full loop.
# This wrapper is only for ensuring env + working directory if your cron runner needs it.

exec "$@"
