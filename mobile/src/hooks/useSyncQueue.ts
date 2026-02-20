import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useDeliveryStore } from '../store/deliveryStore';

const isTestEnv = typeof process !== 'undefined' && !!process.env.JEST_WORKER_ID;

export function useSyncQueue() {
  const { queue, syncQueue, isSyncing } = useDeliveryStore();

  useEffect(() => {
    if (isTestEnv) {
      return;
    }

    // 1. Sync on network change (offline -> online)
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable && queue.length > 0 && !isSyncing) {
        void syncQueue();
      }
    });

    // 2. Periodic sync attempt (every 1 minute) if queue is not empty
    const interval = setInterval(() => {
      if (queue.length > 0 && !isSyncing) {
        void syncQueue();
      }
    }, 60000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [queue.length, syncQueue, isSyncing]);
}
