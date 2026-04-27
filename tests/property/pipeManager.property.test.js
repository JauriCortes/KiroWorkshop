import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { PipeManager, CANVAS_WIDTH } from '../../game.js';

describe('PipeManager Property Tests', () => {
  describe('Property 4: pipe gap always within bounds', () => {
    it('**Validates: Requirements 4.3** - Los pipes generados tienen el gap dentro de los límites', () => {
      const state = { pipes: [], frameCount: 0 };
      for (let i = 0; i < 1000; i++) {
        PipeManager.spawnPipe(state);
      }
      for (const pipe of state.pipes) {
        expect(pipe.gapY).toBeGreaterThanOrEqual(PipeManager.MIN_GAP_Y);
        expect(pipe.gapY + PipeManager.GAP_HEIGHT).toBeLessThanOrEqual(600);
      }
    });
  });

  describe('Property 5: pipes move 3px per frame', () => {
    it('**Validates: Requirements 4.4** - Los pipes se mueven exactamente 3 píxeles por frame', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: CANVAS_WIDTH }), (initialX) => {
          const state = {
            pipes: [{ x: initialX, gapY: 200, width: 60, gapHeight: 150, scored: false }],
            frameCount: 1, // avoid triggering spawn at frame 0
          };
          // Make frameCount not divisible by SPAWN_INTERVAL to avoid spawning
          state.frameCount = 1;
          PipeManager.update(state);
          // Check that the pipe moved 3px (if it's still on screen)
          if (state.pipes.length > 0) {
            expect(state.pipes[0].x).toBe(initialX - PipeManager.PIPE_SPEED);
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
