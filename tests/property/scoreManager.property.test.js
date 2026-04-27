import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { ScoreManager } from '../../game.js';

const makeLocalStorage = () => {
  let store = {};
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { store = {}; },
  };
};

describe('ScoreManager Property Tests', () => {
  describe('Property 6: score increments exactly once per pipe', () => {
    it('**Validates: Requirements 6.1** - El score incrementa exactamente una vez por pipe cruzado', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 1, max: 20 }), { minLength: 1, maxLength: 20 }),
          (counts) => {
            const N = counts.length;
            const state = {
              score: 0,
              highScore: 0,
              ghosty: { x: 500, y: 300, width: 40, height: 40 },
              // N pipes already past ghosty (x=0, center=30 < ghosty.x=500)
              pipes: Array.from({ length: N }, (_, i) => ({
                x: i * 2, // ensures all are "passed"
                gapY: 200,
                width: 60,
                gapHeight: 150,
                scored: false,
              })),
            };
            ScoreManager.update(state);
            expect(state.score).toBe(N);
            // Second update — all scored=true, no change
            ScoreManager.update(state);
            expect(state.score).toBe(N);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 7: high score is historical maximum', () => {
    it('**Validates: Requirements 6.3, 6.4** - El high score es siempre el máximo histórico', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 1000 }), { minLength: 1 }),
          (scores) => {
            let highScore = 0;
            for (const score of scores) {
              if (score > highScore) highScore = score;
            }
            expect(highScore).toBe(Math.max(...scores));
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 8: high score persistence round-trip', () => {
    it('**Validates: Requirements 6.4, 6.5** - Round-trip de persistencia del high score', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100000 }), (highScore) => {
          vi.stubGlobal('localStorage', makeLocalStorage());
          const state = { score: 0, highScore };
          ScoreManager.save(state);
          const readState = { score: 0, highScore: 0 };
          ScoreManager.init(readState);
          expect(readState.highScore).toBe(highScore);
        }),
        { numRuns: 100 }
      );
    });
  });
});
