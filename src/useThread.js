import { useState, useEffect, useCallback, useRef } from 'react';
import { api, DEMO_THREAD_ID } from './api.js';
import { adaptCockpit } from './adapt.js';

const POLL_MS = 20000; // re-fetch cadence while a thread is still in progress

// Loads a thread's projected state + audit + validation and adapts it to the
// cockpit view model. Auto-seeds the bundled scenario log into the demo thread
// the first time it's opened empty. While the thread isn't decided yet, it
// silently re-fetches on an interval so out-of-band agent contributions
// (clistahermes) appear without a manual refresh.
export function useThread(threadId) {
  const [s, setS] = useState({ loading: true, error: null, vm: null, empty: false, agent: { requested: false } });
  // True once the thread reaches a recorded decision — stops the poll.
  const decidedRef = useRef(false);

  // silent=true → background poll: don't flip to the loading spinner and keep
  // the current view on transient errors (just try again next tick).
  const load = useCallback(async (silent = false) => {
    if (!silent) setS((p) => ({ ...p, loading: true, error: null }));
    try {
      let v = await api.validate(threadId);
      if (v.ok && v.data.event_count === 0 && threadId === DEMO_THREAD_ID) {
        await api.seedDemo(threadId);
        v = await api.validate(threadId);
      }
      const [st, au, ag] = await Promise.all([api.state(threadId), api.audit(threadId), api.agentStatus(threadId)]);
      if (!st.ok) throw new Error(st.data.error || 'failed to load thread state');
      const empty = !v.data.event_count;
      const vm = empty ? null : adaptCockpit(st.data, au.data, v.data);
      const agent = ag.ok ? ag.data : { requested: false };
      decidedRef.current = !!(vm && vm.status === 'decided');
      setS({ loading: false, error: null, vm, empty, agent });
    } catch (e) {
      if (!silent) setS({ loading: false, error: String(e.message || e), vm: null, empty: false, agent: { requested: false } });
    }
  }, [threadId]);

  useEffect(() => {
    decidedRef.current = false;
    load();
  }, [load]);

  // Background poll: only while not decided and the tab is visible.
  useEffect(() => {
    const t = setInterval(() => {
      if (!decidedRef.current && document.visibilityState === 'visible') load(true);
    }, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  return { ...s, reload: load };
}
