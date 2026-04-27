import { describe, it, expect } from 'vitest';
import {
  GameState,
  PhysicsEngine,
  PipeManager,
  ScoreManager,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  HUD_HEIGHT,
  PLAY_HEIGHT,
} from '../../game.js';

describe('Setup verification', () => {
  it('should export constants correctly', () => {
    expect(CANVAS_WIDTH).toBe(480);
    expect(CANVAS_HEIGHT).toBe(640);
    expect(HUD_HEIGHT).toBe(40);
    expect(PLAY_HEIGHT).toBe(600);
  });

  it('should export all modules', () => {
    expect(GameState).toBeDefined();
    expect(PhysicsEngine).toBeDefined();
    expect(PipeManager).toBeDefined();
    expect(ScoreManager).toBeDefined();
  });
});
