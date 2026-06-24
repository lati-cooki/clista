// Proves adaptCockpit surfaces participant positions with their A2A channel
// provenance — the cosmetic gap the Raft live test exposed: a harvested
// PositionTaken (e.g. the owner's Raft "#all" reply attested as a position)
// showed only in the audit chain, with no via-Raft / via-moltbook badge. The
// view model now carries a `positions` list, each tagged via channelFromSource.
import test from 'node:test';
import assert from 'node:assert/strict';
import { adaptCockpit, channelFromSource } from '../src/adapt.js';

// A minimal projection slice: two stances on a claim, one harvested off Raft
// (carries a `source`), one composed directly by a human (no source).
const state = {
  thread: { id: 'thd_x', question: 'Should agents run agent-to-agent?', status: 'active', createdAt: '2026-06-24T00:00:00.000Z' },
  identityState: {
    participants: [
      { id: 'par_lati', name: 'Troy Latimer', role: 'decision_owner' },
      { id: 'par_agent_clistahermes', name: 'clistahermes', role: 'contributor' },
    ],
  },
  reasoningState: {
    claims: [{ id: 'clm_1', text: 'A2A is feasible', evidenceIds: [], assumptionIds: [] }],
    positions: [
      {
        id: 'pos_raft_troy_decided_state',
        participantId: 'par_lati',
        targetObjectId: 'clm_1',
        stance: 'support',
        reason: 'Yes, this is the decided state',
        source: 'raft workspace #all:1800456c — message 0bf0bb6f',
      },
      {
        id: 'pos_human_direct',
        participantId: 'par_agent_clistahermes',
        targetObjectId: 'clm_1',
        stance: 'support',
        reason: 'Composed in-app, no back-channel',
      },
    ],
  },
};

test('channelFromSource maps a raft source to the raft channel', () => {
  assert.equal(channelFromSource('raft workspace #all:1800456c — message 0bf0bb6f'), 'raft');
  assert.equal(channelFromSource('moltbook u/clistahermes — reply comment abc'), 'moltbook');
  assert.equal(channelFromSource(''), null);
  assert.equal(channelFromSource(undefined), null);
});

test('adaptCockpit surfaces positions with channel provenance', () => {
  const vm = adaptCockpit(state, { auditTrail: [] }, {});
  assert.equal(vm.positions.length, 2);

  const harvested = vm.positions.find((p) => p.id === 'pos_raft_troy_decided_state');
  assert.equal(harvested.channel, 'raft', 'harvested Raft position must carry the raft channel for its badge');
  assert.equal(harvested.who, 'Troy Latimer');
  assert.equal(harvested.role, 'decision_owner');
  assert.equal(harvested.stance, 'support');
  assert.equal(harvested.text, 'Yes, this is the decided state');
  assert.equal(harvested.target, 'clm_1');

  const direct = vm.positions.find((p) => p.id === 'pos_human_direct');
  assert.equal(direct.channel, null, 'a directly-composed position carries no channel badge');
});
