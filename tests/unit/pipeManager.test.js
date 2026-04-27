import { describe, it, expect, beforeEach } from 'vitest';
import { PipeManager, CANVAS_WIDTH } from '../../game.js';

describe('PipeManager', () => {
  let state;

  beforeEach(() => {
    state = {
      pipes: [],
      frameCount: 0,
    };
  });

  it('Pipe fuera del canvas izquierdo es eliminado', () => {
    state.pipes.push({ x: -61, gapY: 200, width: 60, gapHeight: 150, scored: false });
    PipeManager.update(state);
    expect(state.pipes.length).toBe(0);
  });

  it('Pipe dentro del canvas no es eliminado', () => {
    state.pipes.push({ x: 100, gapY: 200, width: 60, gapHeight: 150, scored: false });
    PipeManager.update(state);
    // Pipe moved 3px left — still visible
    expect(state.pipes.length).toBe(1);
  });

  it('reset vacía los pipes y resetea frameCount', () => {
    state.pipes.push({ x: 100, gapY: 200, width: 60, gapHeight: 150, scored: false });
    state.frameCount = 50;
    PipeManager.reset(state);
    expect(state.pipes.length).toBe(0);
    expect(state.frameCount).toBe(0);
  });

  it('spawnPipe agrega un pipe en el borde derecho del canvas', () => {
    PipeManager.spawnPipe(state);
    expect(state.pipes.length).toBe(1);
    expect(state.pipes[0].x).toBe(CANVAS_WIDTH);
  });

  it('gapY de pipe generado está dentro de los límites', () => {
    for (let i = 0; i < 100; i++) {
      PipeManager.spawnPipe(state);
    }
    for (const pipe of state.pipes) {
      expect(pipe.gapY).toBeGreaterThanOrEqual(PipeManager.MIN_GAP_Y);
      expect(pipe.gapY + PipeManager.GAP_HEIGHT).toBeLessThanOrEqual(600);
    }
  });
});
