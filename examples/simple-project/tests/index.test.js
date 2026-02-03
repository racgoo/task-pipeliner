// Simple test file
const { greet } = require('../src/index.js');

console.log('Running tests...');
console.log('Test 1:', greet('World') === 'Hello, World!' ? 'PASS' : 'FAIL');
console.log('All tests complete');

