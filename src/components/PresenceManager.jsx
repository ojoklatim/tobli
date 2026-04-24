import { useEffect, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { useStore } from '../store/useStore';
import { insforge } from '../lib/insforge';

// Unique session ID per browser tab
const SESSION_ID = (() => {
  if (typeof window === 'undefined') return 'server';
  let id = sessionStorage.getItem('presence_session_id');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('presence_session_id', id);
  }
  return id;
})();

export default function PresenceManager() {
  const { session } = useAuthStore();
  const setLiveUsers = useStore(state => state.setLiveUsers);

  useEffect(() => {
    if (!insforge.realtime) {
      console.warn('InsForge Realtime not available');
      setLiveUsers({});
      return;
    }

    let isSubscribed = false;
    let heartbeatInterval;
    let cleanupInterval;

    const setupRealtime = async () => {
      try {
        await insforge.realtime.connect();
        const { ok } = await insforge.realtime.subscribe('global_presence');
        if (!ok) {
          console.warn('Failed to subscribe to global_presence. Ensure channel exists.');
          // Fallback: at least show ourselves
          setLiveUsers({ [SESSION_ID]: { lastSeen: Date.now(), userId: session?.user?.id } });
          return;
        }
        isSubscribed = true;

        insforge.realtime.on('heartbeat', (payload) => {
          const sid = payload.sessionId;
          if (!sid) return;
          
          setLiveUsers(prev => ({
            ...prev,
            [sid]: { 
              lastSeen: Date.now(), 
              userId: payload.userId || null 
            }
          }));
        });

        // Send heartbeat every 10s
        const sendHeartbeat = async () => {
          if (insforge.realtime.isConnected) {
            await insforge.realtime.publish('global_presence', 'heartbeat', {
              sessionId: SESSION_ID,
              userId: session?.user?.id || null
            });
          }
        };

        sendHeartbeat();
        heartbeatInterval = setInterval(sendHeartbeat, 10000);

        // Cleanup stale sessions every 15s
        cleanupInterval = setInterval(() => {
          const now = Date.now();
          setLiveUsers(prev => {
            let changed = false;
            const next = { ...prev };
            for (const [id, data] of Object.entries(next)) {
              // If no heartbeat for 25s, consider gone
              if (now - data.lastSeen > 25000) {
                delete next[id];
                changed = true;
              }
            }
            return changed ? next : prev;
          });
        }, 15000);

      } catch (err) {
        console.error('Realtime setup error:', err);
      }
    };

    setupRealtime();

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (cleanupInterval) clearInterval(cleanupInterval);
      if (isSubscribed && insforge.realtime) {
        insforge.realtime.unsubscribe('global_presence');
      }
    };
  }, [session, setLiveUsers]);

  return null;
}

