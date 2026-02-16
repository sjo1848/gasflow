// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => require('@react-native-community/netinfo/jest/netinfo-mock.js'));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Global Variables
global.__DEV__ = true;

// Mock Fetch
require('jest-fetch-mock').enableMocks();
