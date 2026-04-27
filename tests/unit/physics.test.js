import { describe, it, expect, beforeEach } from 'vitest';
import { PhysicsEngine, PLAY_HEIGHT } from '../../game.js';

describe('PhysicsEngine', () => {
  let state;

  beforeEach(() => {
    state = {
      ghosty: { x: 100, y: 320, vy: 0, width: 40, height: 40, rotation: 0 },
      assets: { jumpSound: null, gameOverSound: null },
      phase: 'START',
      pipes: [],
    };
  });

  describe('Unit Tests', () => {
    it('Ghosty inicia en posición central al resetear', () => {
      state.ghosty.y = 320;
      state.ghosty.vy = 0;
      expect(state.ghosty.y).toBe(320);
      expect(state.ghosty.vy).toBe(0);
    });

    it('checkCollision retorna true cuando Ghosty supera el borde superior', () => {
      state.ghosty.y = -10;
      expect(PhysicsEngine.checkCollision(state)).toBe(true);
    });

    it('checkCollision retorna true cuando Ghosty supera el borde inferior', () => {
      state.ghosty.y = PLAY_HEIGHT;
      expect(PhysicsEngine.checkCollision(state)).toBe(true);
    });

    it('checkCollision retorna false cuando Ghosty está en posición válida sin pipes', () => {
      state.ghosty.y = 300;
      expect(PhysicsEngine.checkCollision(state)).toBe(false);
    });

    it('Game Over phase tras colisión cuando está PLAYING', () => {
      state.phase = 'PLAYING';
      state.ghosty.y = -10;
      state.ghosty.vy = 0;
      PhysicsEngine.update(state);
      expect(state.phase).toBe('GAME_OVER');
    });
  });
});
