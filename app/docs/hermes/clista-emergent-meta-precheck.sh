#!/bin/bash
# clista-emergent-meta-precheck.sh
#
# Cheap wake-gate for the `clistahermes-emergent-meta-seeder` cron job (Phase 4
# of the intake subsystem). Runs BEFORE the agent / moltbook skill is loaded.
# INSTALL: copy to ~/.hermes/scripts/ and reference it as the job's `script`.
#
# Contract (cron/scheduler.py::_parse_wake_gate): the LAST non-empty stdout line
# is read as a JSON gate. `{"wakeAgent": false}` => skip the LLM run entirely.
# Anything else => wake the agent with this script's full stdout injected as
# "## Script Output". MUST exit 0 (a non-zero exit is treated as an error and
# WAKES the agent) — so on any fetch/parse failure we fail CLOSED.
#
# THE GATE (load-bearing): wake ONLY when a CLUSTER of >= CLUSTER_MIN
# *independent* fresh moltbook posts maps to the SAME meta-topic theme. A single
# hit stays silent. This is what separates "high-signal canonical seeding" from
# spam. Themes proposed within COOLDOWN_HOURS are suppressed (one open proposal
# per theme). Posts are only marked "consumed" (seen) when their theme actually
# wakes — so signals ACCUMULATE across ticks until a cluster forms.
#
# The agent never posts here and never creates a thread: on wake it synthesises
# ONE proposal per waking theme and POSTs it to /api/agent/intake (a human then
# approves it in the cockpit, which creates the human-owned thread).

set -uo pipefail

CRED_FILE="$HOME/.config/moltbook/credentials.json"
STATE_FEED="$HOME/.hermes/cron/clista-emergent-feed-seen.tsv"   # consumed post ids
THEMES_TSV="$HOME/.hermes/cron/clista-emergent-themes.tsv"      # theme<TAB>last_proposed_at<TAB>last_itk<TAB>count
DELIB_TSV="$HOME/.hermes/cron/clista-app-deliberation.tsv"      # de-conflict: posts the deliberation loop owns
API_HOST="https://www.moltbook.com"

CLUSTER_MIN=2        # independent fresh posts on one theme required to wake
COOLDOWN_HOURS=72    # don't re-propose a theme within this window

# theme|term|term|...  — a post surfaced by any term belongs to that theme.
# Keep terms distinctive (distinctive vocabulary => silent ticks stay the norm).
THEME_TERMS=(
  "pre-thread-vs-shared|pre-thread|pre-threaded|shared thread|shared agent thread|siloed|threading model|one thread per"
  "agent-discovery|agent discovery|discover each other|find each other|agent registry"
  "provenance-audit|provenance|append-only|audit trail|accountable agent|preserved objection"
  "cross-pollination|cross-pollination|serendipity|cross-thread"
)

SILENT='{"wakeAgent": false}'
WAKE='{"wakeAgent": true}'
note() { echo "precheck: $1" >&2; }
silent_exit() { [ -n "${1:-}" ] && note "$1"; echo "$SILENT"; exit 0; }

command -v jq   >/dev/null 2>&1 || silent_exit "jq not found"
command -v curl >/dev/null 2>&1 || silent_exit "curl not found"
# Test hook: PRECHECK_FAKE_CANDIDATES feeds a candidate TSV
# (id<TAB>created<TAB>author<TAB>title<TAB>theme) instead of the moltbook search,
# so the gate logic is exercisable offline. Creds are only needed for live runs.
SELF_NAME="clistahermes"
if [ -z "${PRECHECK_FAKE_CANDIDATES:-}" ]; then
  API_KEY=$(jq -r '.api_key // empty' "$CRED_FILE" 2>/dev/null)
  [ -n "$API_KEY" ] || silent_exit "no api_key in $CRED_FILE"
  SELF_NAME=$(jq -r '.agent_name // "clistahermes"' "$CRED_FILE" 2>/dev/null)
fi
mkdir -p "$HOME/.hermes/cron"

now_epoch=$(date -u +%s)
iso_to_epoch() { date -j -u -f "%Y-%m-%dT%H:%M:%SZ" "$1" +%s 2>/dev/null || echo 0; }

COLD=0; [ -f "$STATE_FEED" ] || COLD=1

# Posts the deliberation loop already owns — never propose over them. Space-join
# (NOT newline) so it is safe to pass to `awk -v` below.
DELIB_POSTS=""
[ -f "$DELIB_TSV" ] && DELIB_POSTS=$(awk -F'\t' 'NF{print $2}' "$DELIB_TSV" 2>/dev/null | tr '\n' ' ')

# ---- Gather candidates: id<TAB>created<TAB>author<TAB>title<TAB>theme --------
CANDIDATES=""
if [ -n "${PRECHECK_FAKE_CANDIDATES:-}" ]; then
  CANDIDATES=$(cat "$PRECHECK_FAKE_CANDIDATES" 2>/dev/null)
else
for entry in "${THEME_TERMS[@]}"; do
  theme="${entry%%|*}"; terms="${entry#*|}"
  IFS='|' read -ra TERMARR <<< "$terms"
  for term in "${TERMARR[@]}"; do
    RESP=$(curl -sS --max-time 15 -G "$API_HOST/api/v1/search" \
      -H "Authorization: Bearer $API_KEY" \
      --data-urlencode "q=$term" --data-urlencode "type=all" --data-urlencode "limit=25" 2>/dev/null) || continue
    RESP=$(printf '%s' "$RESP" | LC_ALL=C tr -d '\000-\037')   # drop control bytes
    printf '%s' "$RESP" | jq -e '.results | type=="array"' >/dev/null 2>&1 || continue
    LINES=$(printf '%s' "$RESP" | jq -r --arg self "$SELF_NAME" --arg theme "$theme" '
      .results[] | select(.type=="post")
      | select((.author.name // .author // "") != $self)
      | [ (.post_id // .id), (.created_at // ""), (.author.name // .author // "?"),
          ((.title // .content // "") | gsub("[⟦][/]?HL[⟧]";"") | .[0:70]), $theme ] | @tsv' 2>/dev/null)
    [ -n "$LINES" ] && CANDIDATES+="$LINES"$'\n'
  done
done
fi

# Dedup by post id (first theme wins); drop deliberation-owned posts.
CANDIDATES=$(printf '%s' "$CANDIDATES" | awk -F'\t' -v delib="$DELIB_POSTS" '
  BEGIN { n=split(delib,a," "); for(i=1;i<=n;i++) if(a[i]!="") d[a[i]]=1 }
  NF && !seen[$1]++ && !($1 in d)')

[ -n "$CANDIDATES" ] || silent_exit "no candidate posts"

# Cold start: baseline all current matches as consumed, do NOT wake.
if [ "$COLD" -eq 1 ]; then
  printf '%s\n' "$CANDIDATES" | cut -f1 > "$STATE_FEED"
  silent_exit "cold start — baselined $(printf '%s\n' "$CANDIDATES" | grep -c .) match(es), no wake"
fi

# ACTIVE = candidates not already consumed (these accumulate across ticks).
ACTIVE=""
while IFS=$'\t' read -r id created author title theme; do
  [ -n "$id" ] || continue
  grep -Fxq "$id" "$STATE_FEED" 2>/dev/null && continue
  ACTIVE+="$id"$'\t'"$created"$'\t'"$author"$'\t'"$title"$'\t'"$theme"$'\n'
done <<< "$CANDIDATES"
ACTIVE=$(printf '%s' "$ACTIVE" | awk 'NF')
[ -n "$ACTIVE" ] || silent_exit "no fresh posts (all already consumed)"

# Which themes have a cluster (>= CLUSTER_MIN active) and are NOT in cooldown?
WAKE_THEMES=""
for entry in "${THEME_TERMS[@]}"; do
  theme="${entry%%|*}"
  cnt=$(printf '%s' "$ACTIVE" | awk -F'\t' -v t="$theme" '$5==t{c++} END{print c+0}')
  [ "$cnt" -ge "$CLUSTER_MIN" ] || continue
  if [ -f "$THEMES_TSV" ]; then
    last=$(awk -F'\t' -v t="$theme" '$1==t{print $2}' "$THEMES_TSV" 2>/dev/null | tail -n1)
    if [ -n "$last" ]; then
      le=$(iso_to_epoch "$last")
      if [ "$le" -gt 0 ] && [ $(( (now_epoch - le) / 3600 )) -lt "$COOLDOWN_HOURS" ]; then
        note "theme $theme in cooldown"; continue
      fi
    fi
  fi
  WAKE_THEMES+="$theme"$'\n'
done
WAKE_THEMES=$(printf '%s' "$WAKE_THEMES" | awk 'NF')

[ -n "$WAKE_THEMES" ] || silent_exit "no theme reached the cluster threshold ($CLUSTER_MIN) outside cooldown"

# Consume ONLY the waking themes' posts (so non-waking signals keep accumulating).
while IFS= read -r theme; do
  [ -n "$theme" ] || continue
  printf '%s' "$ACTIVE" | awk -F'\t' -v t="$theme" '$5==t{print $1}' >> "$STATE_FEED"
done <<< "$WAKE_THEMES"
# Bound the consumed list.
if [ "$(wc -l < "$STATE_FEED" 2>/dev/null || echo 0)" -gt 1000 ]; then
  tail -n 800 "$STATE_FEED" > "$STATE_FEED.tmp" && mv "$STATE_FEED.tmp" "$STATE_FEED"
fi

# ---- Wake: present the clustered signals per waking theme --------------------
echo "Emergent meta-thread precheck — a signal cluster crossed the threshold."
echo "Propose at most ONE canonical thread per theme below, and ONLY if it is a genuinely new meta-topic. Otherwise [SILENT]."
echo
while IFS= read -r theme; do
  [ -n "$theme" ] || continue
  cnt=$(printf '%s' "$ACTIVE" | awk -F'\t' -v t="$theme" '$5==t{c++} END{print c+0}')
  echo "### theme: $theme  ($cnt independent fresh signals)"
  printf '%s' "$ACTIVE" | awk -F'\t' -v t="$theme" '$5==t{
    printf "- %s\n    by: %s | created: %s | post_id: %s\n    read: GET /api/v1/posts/%s/comments?sort=new&limit=20\n", $4, $3, $2, $1, $1 }'
  echo
done <<< "$WAKE_THEMES"
echo "$WAKE"
exit 0
