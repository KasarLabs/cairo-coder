// Increase timeout for all tests to 10 seconds
jest.setTimeout(10000);

// Silence console.log during tests
global.console = {
  ...global.console,
  // Keep error and warn for debugging tests
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Mock process.env for testing
process.env.NODE_ENV = 'test';

// Add custom matchers if needed
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});
