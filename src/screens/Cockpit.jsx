import { useState } from 'react';
import { css } from '../lib/css.js';
import { Svg } from '../lib/Svg.jsx';
import { Hoverable } from '../lib/Hoverable.jsx';
import { ico, octopus } from '../icons.js';
import { badgeFor, tabStyle, provBtnStyle, channelMeta, channelBadgeStyle, filterStyle } from '../styles.js';
import { useThread } from '../useThread.js';
import { channelLabel } from '../adapt.js';
import { api } from '../api.js';
import { InlineComposer } from '../lib/InlineComposer.jsx';
import { RefGroup } from '../lib/RefGroup.jsx';
import {
  rid, SEVERITIES, STANCES, CONFIDENCE, REVIEW_STATUSES, guard,
  buildObjection, buildAssumption, buildClaim, buildPosition, buildDecisionRequest, buildReview,
} from '../events.js';

const MONO = "font-family:'JetBrains Mono',monospace;";
const eyebrow = "font-family:'JetBrains Mono',monospace; font-size:11.5px; font-weight:600; letter-spacing:0.14em; text-transform:uppercase; color:#3a3a3a;";
const medallion = 'display:inline-flex; align-items:center; justify-content:center; width:30px; height:30px; border:1px solid #d8d8d6; border-radius:50%; color:#0a0a0a; flex:none;';
const sectionCard = 'background:#fff; border:1px solid #dcdcda; border-radius:7px; margin-bottom:18px; overflow:hidden;';
const provPanel = 'margin-top:13px; padding:14px 16px; background:#f7f7f6; border:1px solid #e8e8e6; border-radius:5px; animation:clistaFade 0.2s ease-out;';
const provLabel = "font-family:'JetBrains Mono',monospace; font-size:9.5px; font-weight:600; letter-spacing:0.14em; text-transform:uppercase; color:#a5a5a5; margin-bottom:11px;";
const audSig = { evidence: '#7f9cff', objection: '#d6a64a', decided: '#e8ebf2', ok: '#57c98a', fail: '#e0676d' };

const mergeInput = "width:100%; padding:11px 13px; font-family:'Inter Tight',sans-serif; font-size:14px; line-height:1.55; color:#1a1a1a; background:#fcfcfb; border:1px solid #d8d8d6; border-radius:5px; outline:none; resize:vertical;";
const mergeLabel = "display:block; font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:#6a6a6a; margin-bottom:7px;";

function Boundary() {
  return (
    <>
      <div style={css('display:flex; align-items:center; gap:14px; margin-top:26px;')}>
        <span style={css('flex:1; height:1px; background:#d4d4d2;')} />
        <span style={css(MONO + ' font-size:18px; color:#c4c4c2;')}>·</span>
        <span style={css('flex:1; height:1px; background:#d4d4d2;')} />
      </div>
      <p style={css('margin:16px auto 0; text-align:center; font-size:12px; line-height:1.6; color:#9a9a9a; max-width:560px; text-wrap:pretty;')}>
        ClisTa records the shape of a decision. It does not make the decision, rank truth, assign blame, or create consensus.
      </p>
    </>
  );
}

// Decision-rooted provenance trace panel — the engine's `provenance trace`,
// rendered as a tree. Shows how the decision rests on claims, and how each
// claim is grounded (evidence/assumptions) and contested (objections).
const provChip = (color) =>
  css(
    'display:inline-flex; align-items:center; ' +
      MONO +
      ' font-size:9px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:' +
      color +
      '; border:1px solid ' +
      color +
      '40; background:' +
      color +
      '12; border-radius:3px; padding:1px 6px; flex:none;'
  );
const provRow = 'display:flex; align-items:baseline; gap:9px; padding:3px 0; flex-wrap:wrap;';
const provConn = css(MONO + ' font-size:12px; color:#c4c4c2; flex:none;');
const provId = (color) => css(MONO + ' font-size:12px; color:' + color + '; flex:none;');
const provText = css('font-size:12px; color:#6a6a6a; text-wrap:pretty;');

// Small provenance badge marking which A2A deliberation channel an attested
// contribution entered through (Raft / moltbook). Renders nothing for input that
// carries no channel (e.g. directly composed by a human). Display-only.
function ChannelBadge({ channel }) {
  const m = channelMeta(channel);
  if (!m) return null;
  return <span style={channelBadgeStyle(m.color)}>{m.label}</span>;
}

function ProvTrace({ prov }) {
  if (!prov) return null;
  return (
    <section style={css('background:#fff; border:1px solid #dcdcda; border-radius:7px; box-shadow:0 1px 2px rgba(10,10,10,0.03); margin-bottom:18px; overflow:hidden;')}>
      <div style={css('display:flex; align-items:center; gap:11px; padding:16px 22px; border-bottom:1px solid #ededeb; background:#fcfcfb;')}>
        <Svg html={ico('fork')} style={css(medallion)} />
        <span style={css(eyebrow)}>Provenance Trace</span>
        <span style={css(MONO + ' font-size:11px; color:#a5a5a5;')}>·</span>
        <span style={css(MONO + ' font-size:11px; color:#9a9a9a;')}>{prov.decisionId}</span>
      </div>
      <div style={css('padding:18px 22px;')}>
        <div style={css(provRow)}>
          <span style={provId('#1c7a4f')}>{prov.decisionId}</span>
          <span style={provChip('#1c7a4f')}>decision</span>
          <span style={css('font-size:13px; color:#2a2a2a; text-wrap:pretty;')}>{prov.answer}</span>
        </div>
        {prov.claims.map((c, ci) => {
          const lastClaim = ci === prov.claims.length - 1;
          const kids = [
            ...c.evidence.map((e) => ({ ...e, kind: 'evidence', color: '#2c5f96' })),
            ...c.assumptions.map((a) => ({ ...a, kind: 'assumption', color: '#8a8a8a' })),
            ...c.objections.map((o) => ({ ...o, kind: 'objection', color: '#9a6b07' })),
          ];
          return (
            <div key={c.id}>
              <div style={css(provRow + ' padding-left:2px;')}>
                <span style={provConn}>{lastClaim ? '└' : '├'}</span>
                <span style={provId('#2a2a2a')}>{c.id}</span>
                <span style={provChip('#6a6a6a')}>claim</span>
                {c.status && <span style={provChip(c.status === 'contested' ? '#9a6b07' : '#5a5a5a')}>{c.status}</span>}
                <span style={css('font-size:12.5px; color:#5a5a5a; text-wrap:pretty;')}>{c.text}</span>
              </div>
              <div style={css('padding-left:24px;')}>
                {kids.map((k, ki) => (
                  <div key={k.id} style={css(provRow)}>
                    <span style={provConn}>{ki === kids.length - 1 ? '└' : '├'}</span>
                    <span style={provId(k.color)}>{k.id}</span>
                    <span style={provChip(k.color)}>{k.kind}</span>
                    {k.survived && <span style={provChip('#9a6b07')}>survived</span>}
                    {k.channel && <ChannelBadge channel={k.channel} />}
                    <span style={provText}>{k.text}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        <p style={css('margin:14px 0 0; ' + MONO + ' font-size:10.5px; color:#a5a5a5; letter-spacing:0.02em; text-wrap:pretty;')}>
          provenance is not truth ranking — it traces how the decision rests on claims, their grounding, and the objections that survived.
        </p>
      </div>
    </section>
  );
}

function Notice({ children }) {
  return (
    <div className="clista-screen" style={css('max-width:1080px; margin:0 auto; padding:48px 40px;')}>
      <div style={css(MONO + ' font-size:13px; color:#6a6a6a;')}>{children}</div>
    </div>
  );
}

export function Cockpit({ threadId, me, go }) {
  const { loading, error, vm, empty, agent, reload } = useThread(threadId);
  const [previewDegraded, setPreviewDegraded] = useState(false);
  const [prov, setProv] = useState(null);
  const [auditOpen, setAuditOpen] = useState(true);
  const [joining, setJoining] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [merging, setMerging] = useState(false);
  const [mergeResult, setMergeResult] = useState(null);
  const [mSummary, setMSummary] = useState('');
  const [mRationale, setMRationale] = useState('');
  const [mConditions, setMConditions] = useState('');
  // Which inline contribute form is open (one at a time): 'obj:<id>' | 'pos:<id>'
  // | 'add:assumption' | 'add:claim' | 'stage'. Mirrors the `prov` toggle idiom.
  const [act, setAct] = useState(null);

  if (loading) return <Notice>projecting reasoning state from the event log…</Notice>;
  if (error) return <Notice><span style={css('color:#b3343c;')}>state could not be loaded — {error}</span></Notice>;
  if (empty || !vm) return <Notice>No events in <span style={css(MONO)}>{threadId}</span> yet. The cockpit only renders what the log records.</Notice>;

  const isParticipant = !!(me && me.authenticated && (vm.participantIds || []).includes(me.actorId));
  const join = async () => {
    setJoining(true);
    await api.join(threadId, 'contributor');
    setJoining(false);
    reload();
  };

  // Hand the thread to the autonomous agent (clistahermes): it deliberates via
  // moltbook and records events back here on its next cron cycle. Human-only.
  const isHuman = !!(me && me.authenticated && (me.kind || 'human') === 'human');
  const ag = agent || {};
  const agentRequested = !!ag.requested;
  // The agent has reported live A2A deliberation status (channel / workspace /
  // responders / phase) back from Raft + moltbook.
  const agentLive = agentRequested && !!(ag.channel || ag.phase || ag.workspaceRef || typeof ag.responders === 'number');
  const agentResponders = typeof ag.responders === 'number' ? ag.responders : null;
  const canRequestAgent = isHuman && vm.status !== 'decided';
  const requestAgent = async () => {
    setRequesting(true);
    await api.requestAgent(threadId);
    setRequesting(false);
    reload();
  };

  // Decision-owner merge: when a proposal is staged (reviewed) and no decision is
  // recorded yet, the thread's decision owner records the DecisionMerged here.
  // The agent stages (DecisionRequestOpened + ReviewSubmitted); the merge is the
  // owner's — an agent contributor is governance-blocked from merging.
  const myRole = (vm.participants.find((p) => p.id === (me && me.actorId)) || {}).role || '';
  const isDecisionOwner = /decision owner/i.test(myRole);
  const proposal = vm.decisionRequest;
  // A proposal is "live" (awaiting a decision) when it was opened after the last
  // recorded decision. True for a fresh thread (no decision yet) AND for a
  // re-review thread where a new decision cycle has been opened to supersede the
  // flagged decision. Replaces the old `!vm.decision.id` proxy so re-deciding
  // works while a prior (now-questioned) decision still exists in the log.
  const decidedAtMs = vm.decision.id ? (Date.parse(vm.decision.decidedAt) || 0) : -1;
  const liveProposal = !!proposal && (Date.parse(proposal.openedAt) || 0) > decidedAtMs;
  const canMerge = isDecisionOwner && liveProposal && vm.status !== 'decided';
  // A decision requires supporting evidence + claims + assumptions (engine
  // governance). If the staged proposal left a set empty, fall back to the
  // thread's full substrate so a complete thread is still mergeable.
  const fallback = (set, all) => (set && set.length ? set : all.map((x) => x.id));
  const mergeMissingAssumptions = canMerge && !(proposal.supportingAssumptionIds.length || vm.assumptions.length);
  const recordDecision = async () => {
    if (mSummary.trim().length < 12) {
      setMergeResult({ ok: false, reason: 'A decision needs a summary (min 12 chars) — state what was decided.' });
      return;
    }
    const event = {
      event_type: 'DecisionMerged',
      payload: {
        decisionRecord: {
          id: rid('dcr'), object: 'decisionRecord', threadId,
          decisionRequestId: proposal.id, status: 'approved',
          summary: mSummary.trim(),
          rationale: mRationale.trim(),
          conditions: mConditions.split('\n').map((c) => c.trim()).filter(Boolean),
          supportingClaimIds: fallback(proposal.supportingClaimIds, vm.claims),
          supportingEvidenceIds: fallback(proposal.supportingEvidenceIds, vm.evidence),
          supportingAssumptionIds: fallback(proposal.supportingAssumptionIds, vm.assumptions),
          objectionIds: proposal.objectionIds,
          reviewIds: proposal.reviewIds,
          decidedByParticipantId: me.actorId,
          decidedAt: new Date().toISOString(),
        },
      },
    };
    setMerging(true);
    const res = await api.append(threadId, event);
    setMerging(false);
    if (res.ok && res.data.ok) {
      setMergeResult({ ok: true });
      reload();
    } else {
      const reasons = res.data.reasons || [];
      setMergeResult({ ok: false, reason: reasons.length ? reasons.map((r) => r.reason).join(' · ') : res.data.error || 'merge rejected, fail-closed.' });
    }
  };

  const isDegraded = !vm.verified || previewDegraded;
  const isDecided = !isDegraded;
  const sb = badgeFor(isDecided ? (vm.status === 'decided' ? 'decided' : vm.status) : 'degraded');
  const statusLabel = isDecided ? (vm.status ? vm.status[0].toUpperCase() + vm.status.slice(1) : 'Active') : 'Degraded';
  const toggleProv = (id) => () => setProv((p) => (p === id ? null : id));

  // ── Inline contribute affordances (objection/position/assumption/claim/stage) ──
  // Any participant may contribute while the thread is undecided. A signed-in
  // non-participant gets a join nudge instead of a dead, 422-bound form.
  const toggleAct = (key) => () => setAct((a) => (a === key ? null : key));
  const canContribute = isParticipant && vm.status !== 'decided';
  const canJoinToAct = !!(me && me.authenticated && !isParticipant && vm.status !== 'decided');
  // Stage-a-decision: any participant may open a proposal (DecisionRequestOpened)
  // and submit a review (ReviewSubmitted); the final DecisionMerged stays the
  // owner's (canMerge). Opening moves the thread to review and surfaces the
  // owner's merge panel.
  // Stage a decision when no proposal is awaiting one (fresh thread, or a
  // re-review thread before its supersede cycle is opened). Review when one is.
  const canStageOpen = canContribute && !liveProposal;
  const canReview = canContribute && liveProposal;
  const onWrote = () => { setAct(null); reload(); };
  const closeAct = () => setAct(null);

  const miniLabel = 'display:block; ' + MONO + ' font-size:9.5px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:#8a8a8a; margin:0 0 6px;';
  // A toggle-chip row over option values (strings, or {v,label} for confidence).
  const chipRow = (options, value, onPick) => (
    <div style={css('display:flex; flex-wrap:wrap; gap:7px;')}>
      {options.map((o) => {
        const v = typeof o === 'object' ? o.v : o;
        const label = typeof o === 'object' ? o.label : o;
        return <button key={String(v)} onClick={() => onPick(v)} style={filterStyle(value === v)}>{label}</button>;
      })}
    </div>
  );
  const draftArea = (d, set, ph) => (
    <textarea value={d.text || ''} onChange={(e) => set('text', e.target.value)} rows={2} placeholder={ph} style={css(mergeInput)} />
  );
  // Per-kind compact form bodies for the InlineComposer render-prop.
  const objectionBody = (d, set) => (
    <>
      {draftArea(d, set, 'State the objection precisely (min 12 chars).')}
      <div style={css('margin-top:11px;')}><label style={css(miniLabel)}>severity</label>{chipRow(SEVERITIES, d.severity, (v) => set('severity', v))}</div>
    </>
  );
  const positionBody = (d, set) => (
    <>
      <label style={css(miniLabel)}>stance</label>{chipRow(STANCES, d.stance, (v) => set('stance', v))}
      <div style={css('margin-top:11px;')}>{draftArea(d, set, 'Why you stand here (optional).')}</div>
    </>
  );
  const assumptionBody = (d, set) => (
    <>
      {draftArea(d, set, 'Declare the premise (min 12 chars).')}
      <div style={css('margin-top:11px;')}><label style={css(miniLabel)}>confidence</label>{chipRow(CONFIDENCE, d.confidence, (v) => set('confidence', v))}</div>
    </>
  );
  const claimBody = (d, set) => draftArea(d, set, 'State the claim precisely (min 12 chars).');

  // The trigger link for an inline form (matches the "trace provenance" buttons).
  const actLink = (label, key, icon) => (
    <Hoverable onClick={toggleAct(key)} base={provBtnStyle(act === key)} hover={css('color:#0a0a0a;')}>
      <Svg html={ico(icon, { size: 11 })} />{label}
    </Hoverable>
  );
  const joinNudge = (
    <Hoverable onClick={joining ? undefined : join} base={css(MONO + ' font-size:10.5px; color:#2c5f96; background:none; border:none; cursor:pointer; padding:0; display:inline-flex; align-items:center; gap:5px;')} hover={css('color:#0a0a0a;')}>
      <Svg html={ico('plus', { size: 11 })} />{joining ? 'joining…' : 'join to act'}
    </Hoverable>
  );
  // The objection + position contribute row shown under each claim. (Objecting to
  // a recorded decision is intentionally not offered — a decided thread is closed;
  // reopen with a new decision request rather than accreting onto the closed one.)
  const objectionComposer = (target) => (
    <InlineComposer threadId={threadId} accent="#9a6b07" initial={{ severity: 'major' }}
      build={(d) => buildObjection({ threadId, actorId: me.actorId, target, text: d.text })}
      validate={(d) => guard('objection', { target, text: d.text })}
      submitLabel="raise objection" onDone={onWrote} onCancel={closeAct}>
      {objectionBody}
    </InlineComposer>
  );
  const claimContributeRow = (c) => (
    <>
      {(canContribute || canJoinToAct) && (
        <div style={css('display:flex; align-items:center; gap:14px; flex-wrap:wrap; margin-top:9px;')}>
          {canContribute ? (<>{actLink('take position', 'pos:' + c.id, 'checkSquare')}{actLink('raise objection', 'obj:' + c.id, 'shield')}</>) : joinNudge}
        </div>
      )}
      {canContribute && act === 'pos:' + c.id && (
        <InlineComposer threadId={threadId} accent="#6a4ca5" initial={{ stance: 'support' }}
          build={(d) => buildPosition({ threadId, actorId: me.actorId, target: c.id, stance: d.stance || 'support', reason: d.text })}
          validate={(d) => guard('position', { target: c.id, text: d.text })}
          submitLabel="take position" onDone={onWrote} onCancel={closeAct}>
          {positionBody}
        </InlineComposer>
      )}
      {canContribute && act === 'obj:' + c.id && objectionComposer(c.id)}
    </>
  );

  return (
    <div className="clista-screen" style={css('max-width:1080px; margin:0 auto; padding:28px 40px 64px;')}>
      {/* breadcrumb + state toggle */}
      <div style={css('display:flex; align-items:center; gap:10px; margin-bottom:22px;')}>
        <Hoverable onClick={go('index')} base={css(MONO + ' font-size:11px; color:#8a8a8a; background:none; border:none; cursor:pointer; letter-spacing:0.04em; padding:0;')} hover={css('color:#0a0a0a;')}>threads</Hoverable>
        <span style={css('color:#c4c4c2; ' + MONO + ' font-size:11px;')}>/</span>
        <span style={css(MONO + ' font-size:11px; color:#4a4a4a; letter-spacing:0.04em;')}>{vm.threadId}</span>
        <div style={css('flex:1;')} />
        <div style={css('display:flex; align-items:center; gap:7px;')}>
          <span style={css(MONO + ' font-size:9.5px; letter-spacing:0.14em; text-transform:uppercase; color:#a5a5a5;')}>view</span>
          <div style={css('display:inline-flex; border:1px solid #dedede; border-radius:5px; overflow:hidden; background:#fff;')}>
            <button onClick={() => setPreviewDegraded(false)} style={tabStyle(!previewDegraded)}>live</button>
            <button onClick={() => setPreviewDegraded(true)} style={tabStyle(previewDegraded)}>degraded</button>
          </div>
        </div>
      </div>

      {/* identity / join affordance */}
      {me && me.authenticated && !isParticipant && (
        <div style={css('display:flex; align-items:center; gap:12px; padding:11px 16px; margin-bottom:18px; background:#fff; border:1px solid #e0e0de; border-radius:5px;')}>
          <Svg html={ico('helpCircle', { size: 16 })} style={css('color:#8a8a8a; flex:none;')} />
          <span style={css('font-size:13px; color:#4a4a4a;')}>
            You're viewing as <span style={css(MONO + ' font-size:12px; color:#2a2a2a;')}>{me.actorId}</span> — not yet a participant of this thread. Contributions are rejected fail-closed until you join.
          </span>
          <div style={css('flex:1;')} />
          <Hoverable onClick={joining ? undefined : join} base={css('display:inline-flex; align-items:center; gap:7px; padding:8px 14px; background:#0a0a0a; color:#fff; border:none; border-radius:5px; ' + MONO + ' font-size:11px; font-weight:500; letter-spacing:0.04em; cursor:' + (joining ? 'default' : 'pointer') + '; opacity:' + (joining ? '0.6' : '1') + '; flex:none;')} hover={css('background:#2a2a2a;')}>
            {joining ? 'joining…' : 'Join thread'}
          </Hoverable>
        </div>
      )}

      {/* autonomous-agent affordance — hand the thread to clistahermes */}
      {canRequestAgent && (
        <div style={css('display:flex; align-items:center; gap:12px; padding:11px 16px; margin-bottom:18px; background:' + (agentRequested ? '#f3f6f3' : '#fff') + '; border:1px solid ' + (agentRequested ? 'rgba(28,122,79,0.35)' : '#e0e0de') + '; border-radius:5px;')}>
          <Svg html={octopus} style={css('width:20px; height:20px; color:' + (agentRequested ? '#1c7a4f' : '#6a6a6a') + '; flex:none;')} />
          {agentRequested ? (
            agentLive ? (
              <span style={css('font-size:13px; color:#2f6a4a;')}>
                <span style={css(MONO + ' font-size:12px;')}>clistahermes</span> is deliberating
                {channelLabel(ag.channel) ? <> via <span style={css('font-weight:600;')}>{channelLabel(ag.channel)}</span></> : null}
                {ag.workspaceRef ? <> in workspace <span style={css(MONO + ' font-size:12px;')}>{ag.workspaceRef}</span></> : null}
                {agentResponders != null ? ` — ${agentResponders} ${agentResponders === 1 ? 'agent' : 'agents'} engaged` : ''}
                {ag.phase ? <> · <span style={css(MONO + ' font-size:11.5px;')}>{ag.phase}</span></> : null}
                {ag.detail ? <span style={css('display:block; margin-top:3px; font-size:12px; color:#5a7a66;')}>{ag.detail}</span> : null}
              </span>
            ) : (
              <span style={css('font-size:13px; color:#2f6a4a;')}>
                Handed to <span style={css(MONO + ' font-size:12px;')}>clistahermes</span> — it will take this to Raft + moltbook and record the deliberation back here on its next cycle.
              </span>
            )
          ) : (
            <span style={css('font-size:13px; color:#4a4a4a;')}>
              Stuck on what's next? Hand this thread to the autonomous agent — it puts the question to other agents (on Raft + moltbook) and records the deliberation back here.
            </span>
          )}
          <div style={css('flex:1;')} />
          {!agentRequested && (
            <Hoverable onClick={requesting ? undefined : requestAgent} base={css('display:inline-flex; align-items:center; gap:7px; padding:8px 14px; background:#1c7a4f; color:#fff; border:none; border-radius:5px; ' + MONO + ' font-size:11px; font-weight:500; letter-spacing:0.04em; cursor:' + (requesting ? 'default' : 'pointer') + '; opacity:' + (requesting ? '0.6' : '1') + '; flex:none;')} hover={css('background:#176440;')}>
              {requesting ? 'requesting…' : 'Have clistahermes deliberate'}
            </Hoverable>
          )}
        </div>
      )}

      {/* degraded banner */}
      {isDegraded && (
        <div style={css('display:flex; align-items:flex-start; gap:12px; padding:14px 16px; margin-bottom:18px; background:#f8eeee; border:1px solid rgba(179,52,60,0.28); border-left:3px solid #b3343c; border-radius:5px; animation:clistaFade 0.25s ease-out;')}>
          <Svg html={ico('alertTriangle', { size: 18 })} style={css('flex:none; color:#b3343c; margin-top:1px;')} />
          <div>
            <div style={css(MONO + ' font-size:11px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:#b3343c; margin-bottom:4px;')}>Replay diverged · state not provable</div>
            <div style={css('font-size:13px; color:#7a3a3d; line-height:1.5; text-wrap:pretty;')}>
              {previewDegraded
                ? 'Preview: this is how the cockpit renders when deterministic replay does not match the appended record. '
                : 'Deterministic replay does not match the appended record. '}
              The decision below is shown <span style={css('font-weight:600;')}>as last recorded</span> and must not be treated as verified until the chain re-validates. Fail-closed.
            </div>
          </div>
        </div>
      )}

      {/* re-review banner — a post-decision objection flagged the in-force
          decision for re-validation. The decision below stays in force (frozen
          snapshot) until the owner reaffirms or supersedes it via a new cycle. */}
      {vm.reReview && (
        <div style={css('padding:14px 16px; margin-bottom:18px; background:#fbf3e6; border:1px solid rgba(154,107,7,0.3); border-left:3px solid #c8841a; border-radius:5px; animation:clistaFade 0.25s ease-out;')}>
          <div style={css('display:flex; align-items:flex-start; gap:12px;')}>
            <Svg html={ico('alertTriangle', { size: 18 })} style={css('flex:none; color:#9a6b07; margin-top:1px;')} />
            <div style={css('flex:1;')}>
              <div style={css(MONO + ' font-size:11px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:#9a6b07; margin-bottom:4px;')}>Flagged for re-review · decision in force</div>
              <div style={css('font-size:13px; color:#7a5a12; line-height:1.5; text-wrap:pretty;')}>
                {vm.reReview.objections.length === 1 ? 'An objection was' : `${vm.reReview.objections.length} objections were`} raised after this decision was recorded. The decision below stands <span style={css('font-weight:600;')}>as recorded</span> until the decision owner reaffirms it or opens a new decision request to supersede it{isDecisionOwner ? ' — use “stage a decision” below.' : '.'}
              </div>
              {vm.reReview.objections.length > 0 && (
                <div style={css('margin-top:11px; display:flex; flex-direction:column; gap:8px;')}>
                  {vm.reReview.objections.map((o) => (
                    <div key={o.id} style={css('padding:9px 12px; background:#fff; border:1px solid rgba(154,107,7,0.22); border-radius:5px;')}>
                      <div style={css('font-size:12.5px; color:#2a2a2a; line-height:1.5; text-wrap:pretty;')}>{o.text}</div>
                      <div style={css(MONO + ' font-size:10px; color:#9a8a6a; margin-top:5px; letter-spacing:0.04em;')}>{o.who}{o.role ? ` · ${o.role}` : ''}{o.status === 'preserved' ? ' · preserved' : ''}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER BAND ── */}
      <div style={css('margin-bottom:24px;')}>
        <div style={css('display:flex; align-items:center; gap:10px; margin-bottom:14px;')}>
          <span style={css(MONO + ' font-size:11px; font-weight:500; letter-spacing:0.16em; text-transform:uppercase; color:#9a9a9a;')}>Decision Thread</span>
          <span style={css('color:#cfcfcd;')}>·</span>
          <span style={css(MONO + ' font-size:11px; color:#9a9a9a; letter-spacing:0.04em;')}>opened {vm.opened}</span>
        </div>
        <div style={css('display:flex; align-items:flex-start; gap:20px;')}>
          <h1 style={css("margin:0; font-family:'Inter Tight',sans-serif; font-size:30px; font-weight:600; line-height:1.22; letter-spacing:-0.018em; color:#0a0a0a; max-width:780px; text-wrap:pretty;")}>
            {vm.question}
          </h1>
          <div style={css('flex:none; margin-top:4px;')}>
            <span style={sb.badge}>
              <span style={sb.dot} />
              {statusLabel}
            </span>
          </div>
        </div>
        <div style={css('display:flex; flex-wrap:wrap; gap:8px; margin-top:18px;')}>
          {vm.participants.map((p) => (
            <div key={p.name} style={css('display:inline-flex; align-items:center; gap:8px; padding:5px 11px 5px 6px; background:#fff; border:1px solid #e5e5e5; border-radius:5px;')}>
              <span style={css("display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; border-radius:50%; background:#f1f1ef; font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:600; color:#4a4a4a; flex:none;")}>{p.initial}</span>
              <span style={css('font-size:12.5px; font-weight:500; color:#1a1a1a;')}>{p.name}</span>
              <span style={css(MONO + ' font-size:9px; font-weight:500; letter-spacing:0.1em; text-transform:uppercase; color:#a5a5a5;')}>{p.role}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── STAGE A DECISION (any participant opens a proposal) ── */}
      {canStageOpen && (
        <section style={css('background:#fff; border:1px solid rgba(28,122,79,0.4); border-radius:7px; margin-bottom:18px; overflow:hidden; box-shadow:0 1px 2px rgba(10,10,10,0.03);')}>
          <div style={css('display:flex; align-items:center; gap:11px; padding:16px 22px; border-bottom:1px solid #ededeb; background:#f6faf7;')}>
            <Svg html={ico('flag')} style={css(medallion + ' border-color:rgba(28,122,79,0.35); color:#1c7a4f;')} />
            <span style={css(eyebrow + ' color:#1c7a4f;')}>Stage a decision</span>
            <div style={css('flex:1;')} />
            <span style={css(MONO + ' font-size:10.5px; color:#a5a5a5;')}>opens a proposal for review → merge</span>
          </div>
          <div style={css('padding:18px 22px;')}>
            <p style={css('margin:0 0 14px; font-size:12.5px; line-height:1.55; color:#6a6a6a; text-wrap:pretty;')}>Propose what to decide and gather the claims, evidence, assumptions, and objections it must answer. This moves the thread into review; the decision owner records the final merge.</p>
            <InlineComposer threadId={threadId} accent="#1c7a4f" initial={{ claims: [], evidence: [], assumptions: [], objections: [] }}
              build={(d) => buildDecisionRequest({ threadId, actorId: me.actorId, proposal: d.text, refs: { claims: d.claims, evidence: d.evidence, assumptions: d.assumptions, objections: d.objections } })}
              validate={(d) => guard('decisionRequest', { text: d.text })}
              submitLabel="open decision request" onDone={onWrote}>
              {(d, set) => {
                const toggle = (bucket, id) => { const cur = d[bucket] || []; set(bucket, cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]); };
                return (
                  <>
                    <label style={css(miniLabel)}>proposal</label>
                    <textarea value={d.text || ''} onChange={(e) => set('text', e.target.value)} rows={2} placeholder="State precisely what is to be decided (min 12 chars)." style={css(mergeInput)} />
                    <div style={css('margin-top:14px;')}>
                      <RefGroup title="supporting claims" items={vm.refLists.claims} selected={d.claims || []} onToggle={(id) => toggle('claims', id)} />
                      <RefGroup title="supporting evidence" items={vm.refLists.evidence} selected={d.evidence || []} onToggle={(id) => toggle('evidence', id)} />
                      <RefGroup title="supporting assumptions" items={vm.refLists.assumptions} selected={d.assumptions || []} onToggle={(id) => toggle('assumptions', id)} />
                      <RefGroup title="objections it must answer" items={vm.refLists.objections} selected={d.objections || []} onToggle={(id) => toggle('objections', id)} />
                    </div>
                  </>
                );
              }}
            </InlineComposer>
          </div>
        </section>
      )}

      {/* ── SUBMIT A REVIEW (open proposal, any participant) ── */}
      {canReview && (
        <section style={css('background:#fff; border:1px solid #dcdcda; border-radius:7px; margin-bottom:18px; overflow:hidden; box-shadow:0 1px 2px rgba(10,10,10,0.03);')}>
          <div style={css('display:flex; align-items:center; gap:11px; padding:16px 22px; border-bottom:1px solid #ededeb; background:#fcfcfb;')}>
            <Svg html={ico('fileCheck')} style={css(medallion)} />
            <span style={css(eyebrow)}>Submit a review</span>
            <span style={css(MONO + ' font-size:11px; color:#a5a5a5;')}>·</span>
            <span style={css(MONO + ' font-size:11px; color:#9a9a9a;')}>{vm.decisionRequest.id}</span>
          </div>
          <div style={css('padding:18px 22px;')}>
            <p style={css('margin:0 0 14px; font-size:13px; line-height:1.55; color:#4a4a4a; text-wrap:pretty;')}>{vm.decisionRequest.proposal}</p>
            <InlineComposer threadId={threadId} accent="#3a6ea5" initial={{ status: 'approve_with_conditions' }}
              build={(d) => buildReview({ threadId, actorId: me.actorId, decisionRequestId: vm.decisionRequest.id, status: d.status || 'approve_with_conditions', conditions: d.conditions, comment: d.text })}
              validate={(d) => guard('review', { decisionRequest: vm.decisionRequest, text: d.text })}
              submitLabel="submit review" onDone={onWrote}>
              {(d, set) => (
                <>
                  <label style={css(miniLabel)}>verdict</label>
                  {chipRow(REVIEW_STATUSES, d.status, (v) => set('status', v))}
                  <div style={css('margin-top:11px;')}>
                    <label style={css(miniLabel)}>comment <span style={css('color:#b0b0b0; font-weight:500;')}>optional</span></label>
                    <textarea value={d.text || ''} onChange={(e) => set('text', e.target.value)} rows={2} placeholder="The verdict's reasoning." style={css(mergeInput)} />
                  </div>
                  <div style={css('margin-top:11px;')}>
                    <label style={css(miniLabel)}>conditions <span style={css('color:#b0b0b0; font-weight:500;')}>optional · one per line</span></label>
                    <textarea value={d.conditions || ''} onChange={(e) => set('conditions', e.target.value)} rows={2} placeholder="Carried-forward conditions, one per line." style={css(mergeInput)} />
                  </div>
                </>
              )}
            </InlineComposer>
          </div>
        </section>
      )}

      {/* ── RECORD THE DECISION (decision owner, staged proposal) ── */}
      {canMerge && (
        <section style={css('background:#fff; border:1px solid rgba(28,122,79,0.4); border-radius:7px; margin-bottom:18px; overflow:hidden; box-shadow:0 1px 2px rgba(10,10,10,0.03);')}>
          <div style={css('display:flex; align-items:center; gap:11px; padding:16px 22px; border-bottom:1px solid #ededeb; background:#f6faf7;')}>
            <Svg html={ico('checkSquare')} style={css(medallion + ' border-color:rgba(28,122,79,0.35); color:#1c7a4f;')} />
            <span style={css(eyebrow + ' color:#1c7a4f;')}>Record the decision</span>
            <span style={css(MONO + ' font-size:11px; color:#a5a5a5;')}>·</span>
            <span style={css(MONO + ' font-size:11px; color:#9a9a9a;')}>{proposal.id}</span>
            <div style={css('flex:1;')} />
            <span style={css(MONO + ' font-size:9.5px; letter-spacing:0.1em; text-transform:uppercase; color:#1c7a4f;')}>you · decision owner</span>
          </div>
          <div style={css('padding:20px 22px;')}>
            <p style={css('margin:0 0 16px; font-size:13px; line-height:1.55; color:#4a4a4a; text-wrap:pretty;')}>
              This proposal is reviewed and ready. The agent <span style={css(MONO + ' font-size:12px;')}>staged</span> it — recording the decision is yours alone. It merges the supporting claims, evidence, and the review into an accountable <span style={css(MONO + ' font-size:12px;')}>DecisionMerged</span>.
            </p>
            <div style={css('margin-bottom:14px; padding:11px 14px; background:#f7f7f6; border:1px solid #e8e8e6; border-radius:5px;')}>
              <div style={css(mergeLabel + ' margin-bottom:5px;')}>proposal</div>
              <p style={css('margin:0; font-size:13px; line-height:1.5; color:#2a2a2a; text-wrap:pretty;')}>{proposal.proposal}</p>
            </div>
            <div style={css('margin-bottom:16px;')}>
              <label style={css(mergeLabel)}>decision.summary <span style={css('color:#b3343c;')}>*</span></label>
              <textarea value={mSummary} onChange={(e) => { setMSummary(e.target.value); setMergeResult(null); }} rows={2} placeholder="State precisely what is decided." style={css(mergeInput)} />
            </div>
            <div style={css('margin-bottom:16px;')}>
              <label style={css(mergeLabel)}>decision.rationale <span style={css('color:#a5a5a5; font-weight:500;')}>optional</span></label>
              <textarea value={mRationale} onChange={(e) => { setMRationale(e.target.value); setMergeResult(null); }} rows={2} placeholder="Why this decision — what the claims, evidence, and review establish." style={css(mergeInput)} />
            </div>
            <div style={css('margin-bottom:18px;')}>
              <label style={css(mergeLabel)}>decision.conditions <span style={css('color:#a5a5a5; font-weight:500;')}>optional · one per line</span></label>
              <textarea value={mConditions} onChange={(e) => { setMConditions(e.target.value); setMergeResult(null); }} rows={2} placeholder={'Carried-forward conditions, one per line'} style={css(mergeInput)} />
            </div>
            {mergeMissingAssumptions && (
              <div style={css('margin-bottom:14px; padding:11px 14px; background:#f7f2e8; border:1px solid rgba(154,107,7,0.28); border-radius:5px;')}>
                <span style={css('font-size:12.5px; color:#7a5a07; line-height:1.5;')}>
                  This thread has no declared assumption — a decision requires at least one (evidence + claims + assumptions). Declare one in <span style={css(MONO + ' font-size:11.5px;')}>Compose → AssumptionDeclared</span> first, or the merge will be rejected fail-closed.
                </span>
              </div>
            )}
            <div style={css('display:flex; align-items:center; gap:12px;')}>
              <Hoverable onClick={merging ? undefined : recordDecision} base={css('display:inline-flex; align-items:center; gap:8px; padding:11px 18px; background:#1c7a4f; color:#fff; border:none; border-radius:5px; ' + MONO + ' font-size:12px; font-weight:500; letter-spacing:0.04em; cursor:' + (merging ? 'default' : 'pointer') + '; opacity:' + (merging ? '0.6' : '1') + ';')} hover={css('background:#176440;')}>
                <Svg html={ico('check', { size: 14, sw: 2 })} />{merging ? 'Recording…' : 'Record decision (merge)'}
              </Hoverable>
              <span style={css(MONO + ' font-size:10.5px; color:#a5a5a5;')}>fail-closed · validated before append · as {me && me.actorId}</span>
            </div>
            {mergeResult && !mergeResult.ok && (
              <div style={css('margin-top:14px; padding:12px 14px; background:#f8eeee; border:1px solid rgba(179,52,60,0.3); border-left:3px solid #b3343c; border-radius:5px;')}>
                <span style={css(MONO + ' font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#b3343c;')}>Merge rejected</span>
                <p style={css('margin:5px 0 0; font-size:13px; line-height:1.5; color:#7a3a3d; text-wrap:pretty;')}>{mergeResult.reason}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── DECISION RECORD ── */}
      <section style={css('background:#fff; border:1px solid #dcdcda; border-radius:7px; box-shadow:0 1px 2px rgba(10,10,10,0.03); margin-bottom:18px; overflow:hidden;')}>
        <div style={css('display:flex; align-items:center; gap:11px; padding:16px 22px; border-bottom:1px solid #ededeb; background:#fcfcfb;')}>
          <Svg html={ico('checkSquare')} style={css(medallion)} />
          <span style={css(eyebrow)}>Decision Record</span>
          <span style={css(MONO + ' font-size:11px; color:#a5a5a5;')}>·</span>
          <span style={css(MONO + ' font-size:11px; color:#9a9a9a;')}>{vm.decision.id}</span>
          <div style={css('flex:1;')} />
          {isDecided ? (
            <span style={css(MONO + ' display:inline-flex; align-items:center; gap:6px; font-size:10px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:#1c7a4f;')}>
              <Svg html={ico('check', { size: 13, sw: 2 })} />verified
            </span>
          ) : (
            <span style={css(MONO + ' display:inline-flex; align-items:center; gap:6px; font-size:10px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:#b3343c;')}>
              <Svg html={ico('x', { size: 13, sw: 2 })} />unverified
            </span>
          )}
        </div>
        <div style={css('padding:22px;')}>
          <div style={css('display:flex; align-items:baseline; gap:12px; margin-bottom:18px;')}>
            <span style={css(MONO + ' font-size:11px; font-weight:500; letter-spacing:0.12em; text-transform:uppercase; color:#9a9a9a; flex:none;')}>Decided</span>
            <span style={css("font-family:'Inter Tight',sans-serif; font-size:23px; font-weight:600; letter-spacing:-0.01em; color:#0a0a0a; line-height:1.2;")}>{vm.decision.summary}</span>
          </div>
          {isDegraded && (
            <div style={css('display:inline-flex; align-items:center; gap:8px; padding:6px 11px; margin-bottom:18px; background:#f7f2e8; border:1px solid rgba(154,107,7,0.28); border-radius:5px;')}>
              <Svg html={ico('alertTriangle', { size: 13, sw: 1.9 }).replace('currentColor', '#9a6b07')} />
              <span style={css(MONO + ' font-size:11px; color:#9a6b07; letter-spacing:0.02em;')}>shown as last recorded — not provable from the current chain</span>
            </div>
          )}
          <div style={css('display:grid; grid-template-columns:1fr 1fr; gap:24px 32px;')} className="clista-grid-2">
            <div>
              <div style={css(MONO + ' font-size:10px; font-weight:500; letter-spacing:0.14em; text-transform:uppercase; color:#a5a5a5; margin-bottom:7px;')}>Why</div>
              <p style={css('margin:0; font-size:14px; line-height:1.6; color:#2a2a2a; text-wrap:pretty;')}>{vm.decision.why}</p>
            </div>
            <div>
              <div style={css(MONO + ' font-size:10px; font-weight:500; letter-spacing:0.14em; text-transform:uppercase; color:#a5a5a5; margin-bottom:7px;')}>Scope</div>
              {vm.decision.conditions.length > 0 && (
                <div style={css('display:inline-flex; align-items:center; gap:7px; padding:3px 9px; background:#f7f2e8; border:1px solid rgba(154,107,7,0.26); border-radius:4px; margin-bottom:9px;')}>
                  <Svg html={ico('chevronUp', { size: 12, sw: 2 }).replace('currentColor', '#9a6b07')} />
                  <span style={css(MONO + ' font-size:9.5px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:#9a6b07;')}>Narrower than the question</span>
                </div>
              )}
              <ul style={css('margin:0; padding-left:18px; font-size:13.5px; line-height:1.6; color:#2a2a2a;')}>
                {(vm.decision.conditions.length ? vm.decision.conditions : [vm.decision.summary]).map((c, i) => (
                  <li key={i} style={css('text-wrap:pretty;')}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
          <div style={css('margin-top:24px; padding-top:20px; border-top:1px solid #ededeb;')}>
            <div style={css(MONO + ' font-size:10px; font-weight:500; letter-spacing:0.14em; text-transform:uppercase; color:#a5a5a5; margin-bottom:14px;')}>What happens next</div>
            <div style={css('display:flex; align-items:flex-start; gap:12px;')}>
              <span style={css(MONO + ' display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px; border:1px solid #d8d8d6; border-radius:50%; font-size:11px; font-weight:600; color:#3a3a3a; flex:none;')}>→</span>
              <span style={css('font-size:13.5px; line-height:1.5; color:#2a2a2a; padding-top:2px; text-wrap:pretty;')}>{vm.decision.nextAction}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROVENANCE TRACE ── */}
      <ProvTrace prov={vm.provenance} />

      {/* ── SURVIVING OBJECTION (signature) ── */}
      {vm.objection && (
        <section style={css('position:relative; background:#fff; border:1px solid rgba(154,107,7,0.4); border-radius:7px; margin-bottom:26px; overflow:hidden; box-shadow:0 1px 2px rgba(10,10,10,0.03);')}>
          <div style={css('position:absolute; left:0; top:0; bottom:0; width:3px; background:#9a6b07;')} />
          <div style={css('padding:18px 22px 18px 24px;')}>
            <div style={css('display:flex; align-items:center; gap:11px; margin-bottom:13px; flex-wrap:wrap;')}>
              <Svg html={ico('scale')} style={css('display:inline-flex; align-items:center; justify-content:center; width:30px; height:30px; border:1px solid rgba(154,107,7,0.35); border-radius:50%; color:#9a6b07; flex:none;')} />
              <span style={css(eyebrow)}>Objection</span>
              {vm.objection.survived && (
                <span style={css('display:inline-flex; align-items:center; gap:6px; padding:4px 10px; background:#f7f2e8; border:1px solid rgba(154,107,7,0.4); border-radius:4px; ' + MONO + ' font-size:10px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#9a6b07;')}>
                  <Svg html={ico('shield', { size: 12, sw: 2 })} />Survived approval
                </span>
              )}
              {vm.objection.channel && <ChannelBadge channel={vm.objection.channel} />}
              <div style={css('flex:1;')} />
              <span style={css(MONO + ' font-size:11px; color:#a5a5a5;')}>{vm.objection.id}</span>
            </div>
            <p style={css('margin:0 0 14px; font-size:15px; line-height:1.6; color:#1a1a1a; max-width:820px; text-wrap:pretty;')}>{vm.objection.text}</p>
            <div style={css('display:flex; align-items:center; gap:16px; flex-wrap:wrap; padding-top:13px; border-top:1px solid #ededeb;')}>
              <div style={css('display:flex; align-items:center; gap:8px;')}>
                <span style={css(MONO + ' display:inline-flex; align-items:center; justify-content:center; width:20px; height:20px; border-radius:50%; background:#f1f1ef; font-size:9px; font-weight:600; color:#4a4a4a;')}>{vm.objection.who.split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 2)}</span>
                <span style={css('font-size:12.5px; color:#2a2a2a; font-weight:500;')}>{vm.objection.who}</span>
                <span style={css(MONO + ' font-size:9px; letter-spacing:0.1em; text-transform:uppercase; color:#a5a5a5;')}>{vm.objection.role}</span>
              </div>
              <span style={css('color:#d8d8d6;')}>·</span>
              <span style={css('font-size:12.5px; color:#6a6a6a;')}>Recorded as <span style={css(MONO + ' font-size:11.5px; color:#9a6b07;')}>{vm.objection.status}</span>. Decision proceeded over this objection; it is carried forward as a residual risk.</span>
            </div>
          </div>
        </section>
      )}

      {/* ── EVIDENCE ── */}
      <section style={css(sectionCard)}>
        <div style={css('display:flex; align-items:center; gap:11px; padding:15px 22px; border-bottom:1px solid #ededeb;')}>
          <Svg html={ico('fileSearch')} style={css(medallion)} />
          <span style={css(eyebrow)}>Evidence</span>
          <span style={css('color:#cfcfcd;')}>·</span>
          <span style={css(MONO + ' font-size:11px; color:#9a9a9a;')}>{vm.evidence.length} sourced findings</span>
          <div style={css('flex:1;')} />
          <span style={css(MONO + ' font-size:10px; letter-spacing:0.08em; text-transform:uppercase; color:#b0b0b0;')}>confidence · hash · trace</span>
        </div>
        <div>
          {vm.evidence.map((e) => {
            const open = prov === e.id;
            return (
              <div key={e.id} style={css('padding:16px 22px; border-bottom:1px solid #f0f0ee;')}>
                <div style={css('display:flex; flex-direction:column; gap:7px;')}>
                  <span style={css(MONO + ' font-size:11px; color:#2c5f96; flex:none; padding-top:2px; min-width:42px;')}>{e.id}</span>
                  <div style={css('flex:1;')}>
                    <p style={css('margin:0 0 11px; font-size:14px; line-height:1.55; color:#1a1a1a; text-wrap:pretty;')}>{e.text}</p>
                    <div style={css('display:flex; align-items:center; gap:16px; flex-wrap:wrap;')}>
                      <span style={css(MONO + ' display:inline-flex; align-items:center; gap:6px; font-size:11px; color:#5a5a5a;')}>
                        <span style={css('width:6px; height:6px; border-radius:50%; background:#2c5f96; flex:none;')} />{e.source}
                      </span>
                      {e.channel && <ChannelBadge channel={e.channel} />}
                      {e.conf != null && (
                        <div style={css('display:flex; align-items:center; gap:8px;')}>
                          <span style={css(MONO + ' font-size:10px; letter-spacing:0.06em; text-transform:uppercase; color:#a5a5a5;')}>conf</span>
                          <span style={css('position:relative; width:54px; height:4px; background:#ececea; border-radius:2px; overflow:hidden;')}>
                            <span style={css('position:absolute; left:0; top:0; bottom:0; width:' + Math.round(e.conf * 100) + '%; background:#2c5f96; border-radius:2px;')} />
                          </span>
                          <span style={css(MONO + ' font-size:12px; font-weight:600; color:#2a2a2a;')}>{e.conf}</span>
                        </div>
                      )}
                      <span style={css(MONO + ' font-size:11px; color:#9a9a9a; overflow:hidden; text-overflow:ellipsis; max-width:220px; white-space:nowrap;')}>{e.hash}</span>
                      <div style={css('flex:1;')} />
                      <Hoverable onClick={toggleProv(e.id)} base={provBtnStyle(open)} hover={css('color:#0a0a0a;')}>
                        <Svg html={ico('fork', { size: 12 })} />trace provenance
                      </Hoverable>
                    </div>
                    {open && (
                      <div style={css(provPanel)}>
                        <div style={css(provLabel)}>Provenance trace</div>
                        <div style={css(MONO + ' display:grid; grid-template-columns:auto 1fr; gap:8px 16px; font-size:12px;')}>
                          <span style={css('color:#a5a5a5;')}>source.type</span><span style={css('color:#2a2a2a;')}>{e.sourceType}</span>
                          <span style={css('color:#a5a5a5;')}>introduced.by</span><span style={css('color:#2a2a2a;')}>{e.introducedBy}</span>
                          <span style={css('color:#a5a5a5;')}>committed.at</span><span style={css('color:#2a2a2a;')}>{e.committedAt}</span>
                          <span style={css('color:#a5a5a5;')}>content.hash</span><span style={css('color:#2a2a2a; overflow-wrap:anywhere;')}>{e.hash}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── ASSUMPTIONS + CLAIMS ── */}
      <div style={css('display:grid; grid-template-columns:1fr 1fr; gap:18px; margin-bottom:18px;')} className="clista-grid-2">
        <section style={css('background:#fff; border:1px solid #dcdcda; border-radius:7px; overflow:hidden;')}>
          <div style={css('display:flex; align-items:center; gap:11px; padding:15px 20px; border-bottom:1px solid #ededeb;')}>
            <Svg html={ico('helpCircle')} style={css(medallion)} />
            <span style={css(eyebrow)}>Assumptions</span>
            <span style={css('color:#cfcfcd;')}>·</span>
            <span style={css(MONO + ' font-size:11px; color:#9a9a9a;')}>{vm.assumptions.length}</span>
            <div style={css('flex:1;')} />
            {canContribute && actLink('add', 'add:assumption', 'plus')}
          </div>
          <div>
            {canContribute && act === 'add:assumption' && (
              <div style={css('padding:14px 20px 4px;')}>
                <InlineComposer threadId={threadId} accent="#3a6ea5" initial={{ confidence: 0.75 }}
                  build={(d) => buildAssumption({ threadId, actorId: me.actorId, text: d.text, confidence: d.confidence ?? 0.75 })}
                  validate={(d) => guard('assumption', { text: d.text })}
                  submitLabel="declare assumption" onDone={onWrote} onCancel={closeAct}>
                  {assumptionBody}
                </InlineComposer>
              </div>
            )}
            {vm.assumptions.map((a) => {
              const open = prov === a.id;
              return (
                <div key={a.id} style={css('padding:15px 20px; border-bottom:1px solid #f0f0ee;')}>
                  <div style={css('display:flex; flex-direction:column; gap:6px;')}>
                    <span style={css(MONO + ' font-size:11px; color:#9a9a9a; flex:none; padding-top:1px;')}>{a.id}</span>
                    <div style={css('flex:1;')}>
                      <p style={css('margin:0 0 8px; font-size:13.5px; line-height:1.55; color:#2a2a2a; text-wrap:pretty;')}>{a.text}</p>
                      <Hoverable onClick={toggleProv(a.id)} base={provBtnStyle(open)} hover={css('color:#0a0a0a;')}>
                        <Svg html={ico('fork', { size: 11 })} />trace provenance
                      </Hoverable>
                      {open && (
                        <div style={css('margin-top:11px; padding:12px 14px; background:#f7f7f6; border:1px solid #e8e8e6; border-radius:5px; animation:clistaFade 0.2s ease-out;')}>
                          <div style={css(provLabel)}>Provenance trace</div>
                          <div style={css(MONO + ' display:grid; grid-template-columns:auto 1fr; gap:7px 14px; font-size:11.5px;')}>
                            <span style={css('color:#a5a5a5;')}>source.type</span><span style={css('color:#2a2a2a;')}>{a.sourceType}</span>
                            <span style={css('color:#a5a5a5;')}>introduced.by</span><span style={css('color:#2a2a2a;')}>{a.introducedBy}</span>
                            <span style={css('color:#a5a5a5;')}>basis</span><span style={css('color:#4a4a4a;')}>{a.basis}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        <section style={css('background:#fff; border:1px solid #dcdcda; border-radius:7px; overflow:hidden;')}>
          <div style={css('display:flex; align-items:center; gap:11px; padding:15px 20px; border-bottom:1px solid #ededeb;')}>
            <Svg html={ico('claims')} style={css(medallion)} />
            <span style={css(eyebrow)}>Claims</span>
            <span style={css('color:#cfcfcd;')}>·</span>
            <span style={css(MONO + ' font-size:11px; color:#9a9a9a;')}>{vm.claims.length}</span>
            <div style={css('flex:1;')} />
            {canContribute && actLink('add', 'add:claim', 'plus')}
          </div>
          <div>
            {canContribute && act === 'add:claim' && (
              <div style={css('padding:14px 20px 4px;')}>
                <InlineComposer threadId={threadId} accent="#1c7a4f"
                  build={(d) => buildClaim({ threadId, actorId: me.actorId, text: d.text })}
                  validate={(d) => guard('claim', { text: d.text })}
                  submitLabel="create claim" onDone={onWrote} onCancel={closeAct}>
                  {claimBody}
                </InlineComposer>
              </div>
            )}
            {vm.claims.map((c) => {
              const open = prov === c.id;
              return (
                <div key={c.id} style={css('padding:15px 20px; border-bottom:1px solid #f0f0ee;')}>
                  <div style={css('display:flex; flex-direction:column; gap:6px;')}>
                    <span style={css(MONO + ' font-size:11px; color:#9a9a9a; flex:none; padding-top:1px;')}>{c.id}</span>
                    <div style={css('flex:1;')}>
                      <p style={css('margin:0 0 7px; font-size:13.5px; line-height:1.5; color:#2a2a2a; text-wrap:pretty;')}>{c.text}</p>
                      <div style={css('display:flex; align-items:center; gap:14px; flex-wrap:wrap;')}>
                        <span style={css(MONO + ' display:inline-flex; align-items:center; gap:6px; font-size:10.5px; color:#a5a5a5;')}>
                          <Svg html={ico('arrowRight', { size: 11, sw: 2 })} />built from {c.from}
                        </span>
                        <Hoverable onClick={toggleProv(c.id)} base={provBtnStyle(open)} hover={css('color:#0a0a0a;')}>
                          <Svg html={ico('fork', { size: 11 })} />trace
                        </Hoverable>
                      </div>
                      {open && (
                        <div style={css('margin-top:11px; padding:12px 14px; background:#f7f7f6; border:1px solid #e8e8e6; border-radius:5px; animation:clistaFade 0.2s ease-out;')}>
                          <div style={css(provLabel)}>Provenance trace</div>
                          <div style={css(MONO + ' display:grid; grid-template-columns:auto 1fr; gap:7px 14px; font-size:11.5px;')}>
                            <span style={css('color:#a5a5a5;')}>source.type</span><span style={css('color:#2a2a2a;')}>{c.sourceType}</span>
                            <span style={css('color:#a5a5a5;')}>introduced.by</span><span style={css('color:#2a2a2a;')}>{c.introducedBy}</span>
                            <span style={css('color:#a5a5a5;')}>built.from</span><span style={css('color:#4a4a4a;')}>{c.from}</span>
                          </div>
                        </div>
                      )}
                      {claimContributeRow(c)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* ── POSITIONS (stances on claims, with A2A channel provenance) ── */}
      {vm.positions.length > 0 && (
        <section style={css(sectionCard)}>
          <div style={css('display:flex; align-items:center; gap:11px; padding:15px 22px; border-bottom:1px solid #ededeb;')}>
            <Svg html={ico('checkSquare')} style={css(medallion)} />
            <span style={css(eyebrow)}>Positions</span>
            <span style={css('color:#cfcfcd;')}>·</span>
            <span style={css(MONO + ' font-size:11px; color:#9a9a9a;')}>{vm.positions.length} stances taken</span>
          </div>
          <div>
            {vm.positions.map((p) => (
              <div key={p.id} style={css('padding:15px 22px; border-bottom:1px solid #f0f0ee;')}>
                <div style={css('display:flex; flex-direction:column; gap:7px;')}>
                  <span style={css(MONO + ' font-size:11px; color:#6a4ca5; flex:none; padding-top:2px; min-width:42px;')}>{p.id}</span>
                  <div style={css('flex:1;')}>
                    <div style={css('display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:7px;')}>
                      <span style={css('font-size:12.5px; font-weight:600; color:#1a1a1a;')}>{p.who}</span>
                      {p.role && <span style={css(MONO + ' font-size:9px; letter-spacing:0.1em; text-transform:uppercase; color:#a5a5a5;')}>{p.role}</span>}
                      {p.stance && <span style={css(MONO + ' font-size:9.5px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:#6a4ca5; border:1px solid #6a4ca540; background:#6a4ca512; border-radius:3px; padding:1px 6px;')}>{p.stance}</span>}
                      {p.target && <span style={css(MONO + ' font-size:10.5px; color:#a5a5a5;')}>on {p.target}</span>}
                      {p.channel && <ChannelBadge channel={p.channel} />}
                    </div>
                    {p.text && <p style={css('margin:0; font-size:13.5px; line-height:1.55; color:#2a2a2a; text-wrap:pretty;')}>{p.text}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── REVIEWS + MINORITY REPORT ── */}
      <div style={css('display:grid; grid-template-columns:1fr 1fr; gap:18px; margin-bottom:18px;')} className="clista-grid-2">
        <section style={css('background:#fff; border:1px solid #dcdcda; border-radius:7px; overflow:hidden;')}>
          <div style={css('display:flex; align-items:center; gap:11px; padding:15px 20px; border-bottom:1px solid #ededeb;')}>
            <Svg html={ico('fileCheck')} style={css(medallion)} />
            <span style={css(eyebrow)}>Governance reviews</span>
            <span style={css('color:#cfcfcd;')}>·</span>
            <span style={css(MONO + ' font-size:11px; color:#9a9a9a;')}>{vm.reviews.length}</span>
          </div>
          <div>
            {vm.reviews.map((r) => (
              <div key={r.id} style={css('padding:15px 20px; border-bottom:1px solid #f0f0ee;')}>
                <div style={css('display:flex; align-items:center; gap:10px; margin-bottom:8px;')}>
                  <span style={css('font-size:12.5px; font-weight:600; color:#1a1a1a;')}>{r.who}</span>
                  <div style={css('flex:1;')} />
                  <span style={css(MONO + ' display:inline-flex; align-items:center; gap:5px; font-size:9.5px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:#1c7a4f;')}>
                    <Svg html={ico('check', { size: 11, sw: 2.2 })} />{r.verdict}
                  </span>
                </div>
                <p style={css('margin:0; font-size:13px; line-height:1.5; color:#4a4a4a; text-wrap:pretty;')}>{r.text}</p>
              </div>
            ))}
          </div>
        </section>
        {vm.minority && (
          <section style={css('background:#fcfbf8; border:1px solid #dcdcda; border-radius:7px; overflow:hidden;')}>
            <div style={css('display:flex; align-items:center; gap:11px; padding:15px 20px; border-bottom:1px solid #ededeb;')}>
              <Svg html={ico('flag')} style={css(medallion)} />
              <span style={css(eyebrow)}>Minority report</span>
              <span style={css('color:#cfcfcd;')}>·</span>
              <span style={css(MONO + ' font-size:11px; color:#9a9a9a;')}>preserved</span>
            </div>
            <div style={css('padding:16px 20px;')}>
              <p style={css('margin:0 0 13px; font-size:14px; line-height:1.6; color:#1a1a1a; font-style:italic; text-wrap:pretty;')}>“{vm.minority.text}”</p>
              <div style={css('display:flex; align-items:center; gap:9px; padding-top:12px; border-top:1px solid #ededeb;')}>
                <span style={css(MONO + ' display:inline-flex; align-items:center; justify-content:center; width:20px; height:20px; border-radius:50%; background:#f1f1ef; font-size:9px; font-weight:600; color:#4a4a4a;')}>{vm.minority.who.split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 2)}</span>
                <span style={css('font-size:12.5px; color:#2a2a2a; font-weight:500;')}>{vm.minority.who}</span>
                <span style={css(MONO + ' font-size:9px; letter-spacing:0.1em; text-transform:uppercase; color:#a5a5a5;')}>{vm.minority.role}</span>
                <div style={css('flex:1;')} />
                <span style={css(MONO + ' font-size:11px; color:#9a9a9a;')}>{vm.minority.id}</span>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* ── RESIDUAL RISKS ── */}
      {vm.risks.length > 0 && (
        <section style={css('background:#fff; border:1px solid #dcdcda; border-radius:7px; margin-bottom:26px; overflow:hidden;')}>
          <div style={css('display:flex; align-items:center; gap:11px; padding:15px 22px; border-bottom:1px solid #ededeb;')}>
            <Svg html={ico('alertCircle')} style={css(medallion)} />
            <span style={css(eyebrow)}>Residual risks</span>
            <span style={css('color:#cfcfcd;')}>·</span>
            <span style={css(MONO + ' font-size:11px; color:#9a9a9a;')}>{vm.risks.length} carried forward</span>
          </div>
          <div style={css('display:grid; grid-template-columns:1fr 1fr;')} className="clista-grid-2">
            {vm.risks.map((rk) => (
              <div key={rk.id} style={css('padding:16px 22px; border-bottom:1px solid #f0f0ee; border-right:1px solid #f0f0ee;')}>
                <div style={css('display:flex; align-items:center; gap:10px; margin-bottom:11px;')}>
                  <span style={css(MONO + ' font-size:11px; color:#9a6b07;')}>{rk.id}</span>
                  <span style={css('font-size:14px; font-weight:600; color:#1a1a1a;')}>{rk.text}</span>
                </div>
                <div style={css(MONO + ' display:grid; grid-template-columns:auto 1fr; gap:6px 14px; font-size:11.5px;')}>
                  <span style={css('color:#a5a5a5; text-transform:uppercase; letter-spacing:0.06em; font-size:10px;')}>owner</span>
                  <span style={css("color:#2a2a2a; font-family:'Inter Tight',sans-serif; font-size:13px;")}>{rk.owner}</span>
                  <span style={css('color:#a5a5a5; text-transform:uppercase; letter-spacing:0.06em; font-size:10px;')}>trigger</span>
                  <span style={css("color:#4a4a4a; font-family:'Inter Tight',sans-serif; font-size:13px; line-height:1.45;")}>{rk.trigger}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── AUDIT CHAIN (TERMINAL) ── */}
      <section className="clista-term" style={css('background:#0c0d12; border:1px solid #1c1e26; border-radius:7px; overflow:hidden; box-shadow:0 4px 18px rgba(10,10,10,0.18);')}>
        <div style={css('display:flex; align-items:center; gap:12px; padding:13px 18px; border-bottom:1px solid #1c1e26; background:#101117;')}>
          <Svg html={ico('terminal')} style={css('color:#7f9cff;')} />
          <span style={css(MONO + ' font-size:11.5px; font-weight:600; letter-spacing:0.14em; text-transform:uppercase; color:#cdd2dc;')}>Audit chain</span>
          <span style={css(MONO + ' font-size:11px; color:#5a6070;')}>append-only · {vm.audit.count} events</span>
          <div style={css('flex:1;')} />
          <span style={css(MONO + ' display:inline-flex; align-items:center; gap:6px; font-size:10px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:' + (vm.audit.validateOk ? '#57c98a' : '#e0676d') + '; border:1px solid ' + (vm.audit.validateOk ? '#57c98a40' : '#e0676d55') + '; border-radius:4px; padding:4px 9px;')}>
            validate <Svg html={ico(vm.audit.validateOk ? 'check' : 'x', { size: 12, sw: 2.4 })} />
          </span>
          <span style={css(MONO + ' display:inline-flex; align-items:center; gap:6px; font-size:10px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:' + (isDecided ? '#57c98a' : '#e0676d') + '; border:1px solid ' + (isDecided ? '#57c98a40' : '#e0676d55') + '; border-radius:4px; padding:4px 9px;')}>
            replay <Svg html={ico(isDecided ? 'check' : 'x', { size: 12, sw: 2.4 })} />
          </span>
          <Hoverable onClick={() => setAuditOpen((o) => !o)} base={css(MONO + ' font-size:13px; color:#8a90a0; background:none; border:none; cursor:pointer; padding:4px 6px; margin-left:4px;')} hover={css('color:#cdd2dc;')}>
            {auditOpen ? '▾' : '▸'}
          </Hoverable>
        </div>
        {auditOpen && (
          <div style={css('padding:8px 0; position:relative;')}>
            {vm.audit.events.map((ev) => {
              const c = audSig[ev.sig] || '#aeb4c0';
              const bold = ev.sig === 'decided';
              return (
                <div key={ev.id} style={css('display:flex; align-items:center; gap:14px; padding:6px 18px;')}>
                  <span style={css('width:6px; height:6px; border-radius:50%; flex:none; background:' + c + ';')} />
                  <span style={css(MONO + ' font-size:12px; font-weight:' + (bold ? '600' : '500') + '; color:' + c + '; min-width:210px;')}>{ev.t}</span>
                  <span style={css(MONO + ' font-size:11.5px; color:#6b7180; min-width:90px;')}>{ev.id}</span>
                  <span style={css(MONO + ' font-size:11.5px; color:#8a90a0; min-width:140px;')}>{ev.actor}</span>
                  <span style={css(MONO + ' font-size:11.5px; color:#5a6070;')}>{ev.ts}</span>
                </div>
              );
            })}
            <div style={css('margin:10px 18px 4px; padding-top:12px; border-top:1px solid #1c1e26;')}>
              <span style={css(MONO + ' font-size:11px; color:#5a6070; line-height:1.6;')}>// head {vm.audit.headHash || '—'} · state is provable from events. fail-closed: an unverifiable chain renders the decision <span style={css('color:#8a90a0;')}>unverified</span>, never silently trusted.</span>
            </div>
          </div>
        )}
      </section>

      <Boundary />
    </div>
  );
}
