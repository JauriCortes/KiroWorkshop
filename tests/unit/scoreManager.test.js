import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScoreManager } from '../../game.js';

// In-memory localStorage mock for reliable test isolation
const makeLocalStorage = () => {
  let store = {};
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { store = {}; },
  };
};

describe('ScoreManager', () => {
  let state;

  beforeEach(() => {
    vi.stubGlobal('localStorage', makeLocalStorage());
    state = {
      score: 0,
      highScore: 0,
      ghosty: { x: 100, y: 320, width: 40, height: 40 },
      pipes: [],
    };
  });

  it('Score se resetea a 0 al reiniciar', () => {
    state.score = 15;
    ScoreManager.reset(state);
    expect(state.score).toBe(0);
  });

  it('Pipe marcado como scored=true no incrementa score de nuevo', () => {
    state.pipes.push({ x: 50, gapY: 200, width: 60, gapHeight: 150, scored: true });
    ScoreManager.update(state);
    expect(state.score).toBe(0);
  });

  it('Pipe cruzado incrementa el score exactamente una vez', () => {
    // Pipe center X = 50 + 30 = 80, ghosty.x = 100 → 100 > 80 → scored
    state.pipes.push({ x: 50, gapY: 200, width: 60, gapHeight: 150, scored: false });
    ScoreManager.update(state);
    expect(state.score).toBe(1);
    ScoreManager.update(state);
    expect(state.score).toBe(1);
  });

  it('localStorage indisponible no rompe el juego', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('unavailable'); },
      setItem: () => { throw new Error('unavailable'); },
    });
    ScoreManager.init(state);
    expect(state.highScore).toBe(0);
  });

  it('highScore se persiste y recupera correctamente', () => {
    state.highScore = 42;
    ScoreManager.save(state);
    state.highScore = 0;
    ScoreManager.init(state);
    expect(state.highScore).toBe(42);
  });

  it('highScore se actualiza cuando el score lo supera', () => {
    state.highScore = 5;
    state.score = 5;
    // Pipe center X = 80 < ghosty.x 100 → scored, score becomes 6
    state.pipes.push({ x: 50, gapY: 200, width: 60, gapHeight: 150, scored: false });
    ScoreManager.update(state);
    expect(state.score).toBe(6);
    expect(state.highScore).toBe(6);
  });
});
