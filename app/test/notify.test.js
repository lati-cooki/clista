// Unit tests for worker/notify.js (issue #21): current-owner resolution from
// projected identity state, and the guarded best-effort email alert. The module
// is pure (no cloudflare:* imports) so it runs under node:test with a fake env.
import test from 'node:test';
import assert from 'node:assert/strict';
import { currentDecisionOwner, buildReReviewEmail, sendReReviewAlert } from '../worker/notify.js';

const THREAD = 'thd_test';

const state = ({ authorities = [], participants = [] } = {}) => ({
  identityState: { activeAuthorities: authorities, participants },
});
const auth = (participantId, over = {}) => ({
  participantId,
  authority: 'decision_owner',
  scope: 'thread',
  threadId: THREAD,
  ...over,
});

test('currentDecisionOwner resolves the latest active thread-scoped grant', () => {
  const s = state({
    authorities: [auth('par_old'), auth('par_new')], // par_old revoked → absent in real state; here both active: last grant wins
    participants: [
      { id: 'par_old', name: 'Old', email: 'old@x.test' },
      { id: 'par_new', name: 'New', email: 'new@x.test' },
    ],
  });
  assert.equal(currentDecisionOwner(s, THREAD).id, 'par_new');
  assert.equal(currentDecisionOwner(s, THREAD).email, 'new@x.test');
});

test('currentDecisionOwner honors global scope, ignores other threads and other authorities', () => {
  const s = state({
    authorities: [
      auth('par_other_thread', { threadId: 'thd_other' }),
      auth('par_global', { scope: 'global', threadId: null }),
      auth('par_wrong_authority', { authority: 'something_else' }),
    ],
    participants: [{ id: 'par_global', name: 'G' }],
  });
  assert.equal(currentDecisionOwner(s, THREAD).id, 'par_global');
});

test('currentDecisionOwner returns null with no applicable authority, and a bare id for an undeclared holder', () => {
  assert.equal(currentDecisionOwner(state(), THREAD), null);
  assert.equal(currentDecisionOwner(null, THREAD), null);
  const undeclared = state({ authorities: [auth('par_ghost')] });
  assert.deepEqual(currentDecisionOwner(undeclared, THREAD), { id: 'par_ghost' });
});

test('buildReReviewEmail names the thread, decision, and objection', () => {
  const msg = buildReReviewEmail(
    { id: 'par_o', email: 'o@x.test' },
    { id: THREAD, title: 'Adopt the flow?' },
    { threadId: THREAD, decisionRecordId: 'dcr_1', triggeringObjectionId: 'obj_1', triggeredByParticipantId: 'par_j' },
    { from: { email: 'notify@clista.ai', name: 'ClisTa' } }
  );
  assert.equal(msg.to, 'o@x.test');
  assert.match(msg.subject, /Adopt the flow\?/);
  assert.match(msg.text, /dcr_1/);
  assert.match(msg.text, /obj_1/);
  assert.match(msg.text, /par_j/);
  assert.match(msg.text, /#thd_test/);
});

test('sendReReviewAlert: skipped without binding or owner email; sends when configured; never throws', async () => {
  const owner = { id: 'par_o', email: 'o@x.test' };
  const card = { id: THREAD, title: 'T' };
  const trigger = { threadId: THREAD, decisionRecordId: 'dcr_1' };

  // No binding → false, untouched.
  assert.equal(await sendReReviewAlert({}, owner, card, trigger), false);
  // Binding but the owner never declared an email → false, send not called.
  let calls = [];
  const env = { EMAIL: { send: async (m) => calls.push(m) }, EMAIL_FROM: 'alerts@clista.ai' };
  assert.equal(await sendReReviewAlert(env, { id: 'par_o' }, card, trigger), false);
  assert.equal(calls.length, 0);
  // Configured + owner email → sends with the configured sender.
  assert.equal(await sendReReviewAlert(env, owner, card, trigger), true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].to, 'o@x.test');
  assert.deepEqual(calls[0].from, { email: 'alerts@clista.ai', name: 'ClisTa' });
  // A throwing send is contained → false, not an exception.
  const broken = { EMAIL: { send: async () => { throw new Error('E_DELIVERY_FAILED'); } } };
  assert.equal(await sendReReviewAlert(broken, owner, card, trigger), false);
});
