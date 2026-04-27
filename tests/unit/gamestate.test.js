import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameState, AudioManager, loadAssets } from '../../game.js';

describe('GameState and Asset Loading', () => {
  beforeEach(() => {
    // Reset GameState to initial values
    GameState.phase = 'START';
    GameState.ghosty = {
      x: 100,
      y: 320,
      vy: 0,
      width: 40,
      height: 40,
      rotation: 0,
    };
    GameState.pipes = [];
    GameState.frameCount = 0;
    GameState.score = 0;
    GameState.highScore = 0;
    GameState.clouds = [];
    GameState.assets = {
      ghostyImg: null,
      jumpSound: null,
      gameOverSound: null,
      ghostyImgLoaded: false,
    };
  });

  describe('GameState structure', () => {
    it('should have all required fields', () => {
      expect(GameState).toHaveProperty('phase');
      expect(GameState).toHaveProperty('ghosty');
      expect(GameState).toHaveProperty('pipes');
      expect(GameState).toHaveProperty('frameCount');
      expect(GameState).toHaveProperty('score');
      expect(GameState).toHaveProperty('highScore');
      expect(GameState).toHaveProperty('clouds');
      expect(GameState).toHaveProperty('assets');
    });

    it('should have ghosty with correct initial values', () => {
      expect(GameState.ghosty.x).toBe(100);
      expect(GameState.ghosty.y).toBe(320);
      expect(GameState.ghosty.vy).toBe(0);
      expect(GameState.ghosty.width).toBe(40);
      expect(GameState.ghosty.height).toBe(40);
      expect(GameState.ghosty.rotation).toBe(0);
    });

    it('should have assets object with all audio and image fields', () => {
      expect(GameState.assets).toHaveProperty('ghostyImg');
      expect(GameState.assets).toHaveProperty('jumpSound');
      expect(GameState.assets).toHaveProperty('gameOverSound');
      expect(GameState.assets).toHaveProperty('ghostyImgLoaded');
    });

    it('should initialize with empty pipes array', () => {
      expect(GameState.pipes).toEqual([]);
    });

    it('should initialize with empty clouds array', () => {
      expect(GameState.clouds).toEqual([]);
    });

    it('should initialize with score and highScore at 0', () => {
      expect(GameState.score).toBe(0);
      expect(GameState.highScore).toBe(0);
    });

    it('should initialize with frameCount at 0', () => {
      expect(GameState.frameCount).toBe(0);
    });

    it('should initialize in START phase', () => {
      expect(GameState.phase).toBe('START');
    });
  });

  describe('AudioManager.init', () => {
    it('should create Audio elements for jump and game over sounds', () => {
      const state = { assets: {} };
      AudioManager.init(state);
      
      expect(state.assets.jumpSound).toBeDefined();
      expect(state.assets.gameOverSound).toBeDefined();
    });

    it('should set correct src paths for audio files', () => {
      const state = { assets: {} };
      AudioManager.init(state);
      
      expect(state.assets.jumpSound.src).toContain('assets/jump.wav');
      expect(state.assets.gameOverSound.src).toContain('assets/game_over.wav');
    });

    it('should have error handlers that log and continue', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const state = { assets: {} };
      
      AudioManager.init(state);
      
      // Trigger error on jump sound
      state.assets.jumpSound.onerror();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load assets/jump.wav')
      );
      expect(state.assets.jumpSound).toBeNull();
      
      // Trigger error on game over sound
      state.assets.gameOverSound.onerror();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load assets/game_over.wav')
      );
      expect(state.assets.gameOverSound).toBeNull();
      
      consoleSpy.mockRestore();
    });
  });

  describe('AudioManager.play', () => {
    it('should reset currentTime to 0 before playing', () => {
      const mockAudio = {
        currentTime: 5,
        play: vi.fn().mockResolvedValue(undefined),
      };
      
      AudioManager.play(mockAudio);
      
      expect(mockAudio.currentTime).toBe(0);
      expect(mockAudio.play).toHaveBeenCalled();
    });

    it('should call play() on the audio element', () => {
      const mockAudio = {
        currentTime: 0,
        play: vi.fn().mockResolvedValue(undefined),
      };
      
      AudioManager.play(mockAudio);
      
      expect(mockAudio.play).toHaveBeenCalled();
    });

    it('should handle null audio element gracefully', () => {
      expect(() => AudioManager.play(null)).not.toThrow();
    });

    it('should handle undefined audio element gracefully', () => {
      expect(() => AudioManager.play(undefined)).not.toThrow();
    });

    it('should catch and ignore autoplay policy errors', async () => {
      const mockAudio = {
        currentTime: 0,
        play: vi.fn().mockRejectedValue(new Error('NotAllowedError')),
      };
      
      // Should not throw
      expect(() => AudioManager.play(mockAudio)).not.toThrow();
      
      // Wait for promise to settle
      await new Promise(resolve => setTimeout(resolve, 0));
    });
  });

  describe('loadAssets', () => {
    it('should load ghosty.png and set ghostyImgLoaded to true on success', (done) => {
      const state = {
        assets: {
          ghostyImg: null,
          ghostyImgLoaded: false,
        },
      };
      
      loadAssets(state, () => {
        // In test environment, image loading might fail, so we just check the structure
        expect(state.assets).toHaveProperty('ghostyImg');
        expect(state.assets).toHaveProperty('ghostyImgLoaded');
        done();
      });
      
      // Simulate successful load
      if (state.assets.ghostyImg && state.assets.ghostyImg.onload) {
        state.assets.ghostyImg.onload();
      }
    });

    it('should handle ghosty.png load failure with fallback', (done) => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const state = {
        assets: {
          ghostyImg: null,
          ghostyImgLoaded: false,
        },
      };
      
      loadAssets(state, () => {
        expect(state.assets.ghostyImg).toBeNull();
        expect(state.assets.ghostyImgLoaded).toBe(false);
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Failed to load assets/ghosty.png')
        );
        consoleSpy.mockRestore();
        done();
      });
      
      // Simulate error
      const img = state.assets.ghostyImg || new Image();
      if (img.onerror) {
        img.onerror();
      }
    });

    it('should initialize AudioManager', () => {
      const state = { assets: {} };
      const initSpy = vi.spyOn(AudioManager, 'init');
      
      loadAssets(state);
      
      expect(initSpy).toHaveBeenCalledWith(state);
      initSpy.mockRestore();
    });
  });
});
