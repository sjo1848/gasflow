// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => require('@react-native-community/netinfo/jest/netinfo-mock.js'));

// Mock Safe Area Context (official mock compatible with React Navigation)
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Haptics to avoid async native side effects in tests
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'Light' },
  NotificationFeedbackType: {
    Success: 'Success',
    Warning: 'Warning',
    Error: 'Error',
  },
}));

// Mock Global Variables
global.__DEV__ = true;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Mock Fetch
require('jest-fetch-mock').enableMocks();

// React Query notifications should run inside act in tests.
const { notifyManager } = require('@tanstack/query-core');
notifyManager.setScheduler((callback) => {
  callback();
});

// Filter non-actionable noisy warnings from internal Animated/Navigation updates.
const originalConsoleError = console.error;
console.error = (...args) => {
  const firstArg = args[0];
  const text = typeof firstArg === 'string' ? firstArg : '';

  if (text.includes('not wrapped in act')) {
    return;
  }

  if (text.includes('not configured to support act')) {
    return;
  }

  originalConsoleError(...args);
};
