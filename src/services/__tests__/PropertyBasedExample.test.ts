import * as fc from 'fast-check';

describe('Property-Based Testing Setup', () => {
  test('fast-check is properly configured', () => {
    // Simple property: reversing a string twice returns the original
    fc.assert(
      fc.property(fc.string(), (str) => {
        const reversed = str.split('').reverse().join('');
        const doubleReversed = reversed.split('').reverse().join('');
        return doubleReversed === str;
      }),
      { numRuns: 100 }
    );
  });

  test('array length is preserved after map operation', () => {
    // Property: mapping over an array preserves its length
    fc.assert(
      fc.property(fc.array(fc.integer()), (arr) => {
        const mapped = arr.map(x => x * 2);
        return mapped.length === arr.length;
      }),
      { numRuns: 100 }
    );
  });
});
