import { useState, useEffect, useCallback } from 'react';
import { api, DEMO_THREAD_ID } from './api.js';
import { adaptCockpit } from './adapt.js';

// Loads a thread's projected state + audit + validation and adapts it to the
// cockpit view model. Auto-seeds the bundled scenario log into the demo thread
// the first time it's opened empty.
export function useThread(threadId) {
  const [s, setS] = useState({ loading: true, error: null, vm: null, empty: false, agent: { requested: false } });

  const load = useCallback(async () => {
    setS((p) => ({ ...p, loading: true, error: null }));
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
      setS({ loading: false, error: null, vm, empty, agent });
    } catch (e) {
      setS({ loading: false, error: String(e.message || e), vm: null, empty: false, agent: { requested: false } });
    }
  }, [threadId]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...s, reload: load };
}
