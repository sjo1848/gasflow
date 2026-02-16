import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useDeliveryStore } from '../store/deliveryStore';

export function useSyncQueue() {
  const { queue, syncQueue, isSyncing } = useDeliveryStore();

  useEffect(() => {
    // 1. Sync on network change (offline -> online)
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable && queue.length > 0 && !isSyncing) {
        console.log('Network is up, starting sync...');
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
