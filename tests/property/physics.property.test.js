import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { PhysicsEngine } from '../../game.js';

// Valid float generator — excludes NaN and Infinity from fast-check shrinking
const finiteFloat = (min, max) =>
  fc.float({ min, max }).filter(v => isFinite(v) && !isNaN(v));

describe('PhysicsEngine Property Tests', () => {
  describe('Property 1: gravity applies with clamp', () => {
    it('**Validates: Requirements 3.1, 3.3** - La física aplica gravedad con clamp correcto', () => {
      fc.assert(
        fc.property(finiteFloat(-20, 20), (initialVy) => {
          const state = {
            ghosty: { x: 100, y: 320, vy: initialVy, width: 40, height: 40, rotation: 0 },
            assets: { jumpSound: null, gameOverSound: null },
            phase: 'START',
            pipes: [],
          };

          const vyBefore = state.ghosty.vy;
          PhysicsEngine.update(state);

          const expectedVy = Math.min(vyBefore + PhysicsEngine.GRAVITY, PhysicsEngine.MAX_FALL_SPEED);
          expect(state.ghosty.vy).toBeCloseTo(expectedVy, 5);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 2: flap sets fixed velocity', () => {
    it('**Validates: Requirements 3.2** - El flap establece velocidad ascendente fija', () => {
      fc.assert(
        fc.property(finiteFloat(-20, 20), (initialVy) => {
          const state = {
            ghosty: { x: 100, y: 320, vy: initialVy, width: 40, height: 40, rotation: 0 },
            assets: { jumpSound: null, gameOverSound: null },
          };

          PhysicsEngine.flap(state);

          expect(state.ghosty.vy).toBe(PhysicsEngine.FLAP_VELOCITY);
          expect(state.ghosty.vy).toBe(-8);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 3: position updates correctly per frame', () => {
    it('**Validates: Requirements 3.5** - La posición se actualiza correctamente cada frame', () => {
      fc.assert(
        fc.property(
          finiteFloat(0, 600),
          finiteFloat(-20, 20),
          (initialY, initialVy) => {
            const state = {
              ghosty: { x: 100, y: initialY, vy: initialVy, width: 40, height: 40, rotation: 0 },
              assets: { jumpSound: null, gameOverSound: null },
              phase: 'START',
              pipes: [],
            };

            const yBefore = state.ghosty.y;
            const vyBefore = state.ghosty.vy;
            PhysicsEngine.update(state);

            const expectedY = yBefore + vyBefore;
            expect(state.ghosty.y).toBeCloseTo(expectedY, 5);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 9: border collision is exhaustive', () => {
    it('**Validates: Requirements 5.2** - La colisión con bordes del Canvas es exhaustiva', () => {
      // Above upper border
      fc.assert(
        fc.property(fc.integer({ min: -200, max: -1 }), (yAbove) => {
          const state = {
            ghosty: { x: 100, y: yAbove, vy: 0, width: 40, height: 40, rotation: 0 },
            pipes: [],
          };
          expect(PhysicsEngine.checkCollision(state)).toBe(true);
        }),
        { numRuns: 100 }
      );

      // Below lower border (PLAY_HEIGHT = 600, ghosty height = 40, so y + 40 > 600 → y > 560)
      fc.assert(
        fc.property(fc.integer({ min: 561, max: 800 }), (yBelow) => {
          const state = {
            ghosty: { x: 100, y: yBelow, vy: 0, width: 40, height: 40, rotation: 0 },
            pipes: [],
          };
          expect(PhysicsEngine.checkCollision(state)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });
});
