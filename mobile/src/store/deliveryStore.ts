import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerDelivery, registerFailedDelivery } from '../api/client';

export interface PendingDelivery {
  id: string; // Internal local ID
  type: 'SUCCESS' | 'FAILED';
  token: string;
  payload: any;
  timestamp: number;
}

interface DeliveryState {
  queue: PendingDelivery[];
  isSyncing: boolean;
  addToQueue: (delivery: Omit<PendingDelivery, 'id' | 'timestamp'>) => void;
  removeFromQueue: (id: string) => void;
  syncQueue: () => Promise<void>;
}

export const useDeliveryStore = create<DeliveryState>()(
  persist(
    (set, get) => ({
      queue: [],
      isSyncing: false,

      addToQueue: (delivery) => {
        const newEntry: PendingDelivery = {
          ...delivery,
          id: Math.random().toString(36).substring(7),
          timestamp: Date.now(),
        };
        set((state) => ({ queue: [...state.queue, newEntry] }));
      },

      removeFromQueue: (id) => {
        set((state) => ({ queue: state.queue.filter((d) => d.id !== id) }));
      },

      syncQueue: async () => {
        const { queue, isSyncing, removeFromQueue } = get();
        if (isSyncing || queue.length === 0) return;

        set({ isSyncing: true });
        
        for (const item of queue) {
          try {
            if (item.type === 'SUCCESS') {
              await registerDelivery(item.token, item.payload);
            } else {
              await registerFailedDelivery(item.token, item.payload);
            }
            removeFromQueue(item.id);
          } catch (error: any) {
            // If it's still a network error, stop syncing and wait for next time
            if (error.message === 'Network request failed' || error.message.includes('timeout')) {
              break;
            }
            // If it's a validation error (400, 401, etc.), we might want to log it and remove it
            // or keep it. For now, we stop to avoid infinite loops on bad data.
            console.error('Failed to sync delivery:', item.id, error);
            break; 
          }
        }

        set({ isSyncing: false });
      },
    }),
    {
      name: 'gasflow-delivery-queue',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
