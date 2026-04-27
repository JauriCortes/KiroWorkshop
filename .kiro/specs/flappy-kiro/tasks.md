# Implementation Plan: Flappy Kiro

## Overview

Implementación incremental del juego Flappy Kiro usando HTML5 Canvas API, CSS y JavaScript vanilla sin dependencias externas. La arquitectura usa módulos como objetos literales (`PhysicsEngine`, `PipeManager`, `ScoreManager`, `AudioManager`, `Renderer`, `InputHandler`, `GameState`). Los tests se ejecutan con Vitest y fast-check para property-based testing.

## Tasks

- [ ] 1. Estructura base del proyecto y configuración de tests
  - Crear `index.html` con el elemento `<canvas>` de 480×640px, el `<title>` "Flappy Kiro" y el escalado CSS para mantener relación de aspecto 3:4
  - Crear `game.js` con las constantes globales (`CANVAS_WIDTH`, `CANVAS_HEIGHT`, `HUD_HEIGHT`, `PLAY_HEIGHT`) y el esqueleto vacío de cada módulo
  - Crear `package.json` con Vitest y fast-check como devDependencies
  - Crear `vitest.config.js` con entorno `jsdom` para poder importar los módulos desde los tests
  - Crear la estructura de carpetas `tests/unit/` y `tests/property/`
  - _Requirements: 1.1, 1.2, 10.2, 10.3_

- [ ] 2. GameState y carga de assets
  - Implementar el objeto `GameState` con todos sus campos iniciales (`phase`, `ghosty`, `pipes`, `frameCount`, `score`, `highScore`, `clouds`, `assets`)
  - Implementar `AudioManager.init()` con carga de `assets/jump.wav` y `assets/game_over.wav` usando `HTMLAudioElement`, con manejo de error `onerror` que registra en consola y continúa
  - Implementar `AudioManager.play()` con reset de `currentTime` y `.catch(() => {})` para la política de autoplay
  - Cargar `assets/ghosty.png` con fallback a rectángulo de color si la imagen no carga
  - _Requirements: 1.3, 1.4, 8.1, 8.2, 8.3_

- [ ] 3. PhysicsEngine — gravedad, flap y posición
  - Implementar `PhysicsEngine.update(state)`: aplicar `GRAVITY` (0.5) a `vy`, clamp a `MAX_FALL_SPEED` (12), actualizar `state.ghosty.y += vy`
  - Implementar `PhysicsEngine.flap(state)`: establecer `state.ghosty.vy = FLAP_VELOCITY` (−8) y llamar `AudioManager.play(state.assets.jumpSound)`
  - Exportar `PhysicsEngine` de forma que sea importable en los tests sin DOM

  - [ ] 3.1 Test unitario: Ghosty inicia en posición central al resetear
    - Verificar que tras reset `ghosty.y === 320` y `ghosty.vy === 0`
    - _Requirements: 7.3_

  - [ ]* 3.2 Property test — Property 1: La física aplica gravedad con clamp correcto
    - **Property 1: gravity applies with clamp**
    - Genera `vy` aleatorio en `[-20, 20]` con `fc.float({ min: -20, max: 20 })`
    - Aplica un frame de `PhysicsEngine.update` sin flap
    - Verifica que la nueva `vy === Math.min(vy + 0.5, 12)`
    - **Validates: Requirements 3.1, 3.3**

  - [ ]* 3.3 Property test — Property 2: El flap establece velocidad ascendente fija
    - **Property 2: flap sets fixed velocity**
    - Genera `vy` arbitrario con `fc.float({ min: -20, max: 20 })`
    - Ejecuta `PhysicsEngine.flap(state)`
    - Verifica que `state.ghosty.vy === -8` independientemente del valor previo
    - **Validates: Requirements 3.2**

  - [ ]* 3.4 Property test — Property 3: La posición se actualiza correctamente cada frame
    - **Property 3: position updates correctly per frame**
    - Genera `(y, vy)` aleatorios con `fc.float` dentro de rangos válidos
    - Aplica un frame de `PhysicsEngine.update`
    - Verifica que `state.ghosty.y === y + vy` (usando la velocidad antes del clamp del frame)
    - **Validates: Requirements 3.5**

- [ ] 4. Checkpoint — Física verificada
  - Asegurarse de que todos los tests de física pasan. Consultar al usuario si hay dudas.

- [ ] 5. PipeManager — generación, movimiento y eliminación
  - Implementar `PipeManager.spawnPipe(state)`: crear un `PipeObject` con `gapY` aleatorio en `[MIN_GAP_Y, MAX_GAP_Y]` (60–450) y `x = CANVAS_WIDTH`
  - Implementar `PipeManager.update(state)`: mover todos los pipes `x -= PIPE_SPEED` (3), generar nuevo pipe cada `SPAWN_INTERVAL` (90) frames, eliminar pipes con `x < -PIPE_WIDTH` (−60)
  - Implementar `PipeManager.reset(state)`: vaciar `state.pipes` y resetear `state.frameCount`
  - Exportar `PipeManager` de forma que sea importable en los tests sin DOM

  - [ ] 5.1 Test unitario: Pipe fuera del canvas izquierdo es eliminado
    - Verificar que un pipe con `x = -61` es eliminado tras `PipeManager.update`
    - _Requirements: 4.5_

  - [ ]* 5.2 Property test — Property 4: Los pipes generados siempre tienen el gap dentro de los límites
    - **Property 4: pipe gap always within bounds**
    - Genera 1000 pipes llamando `PipeManager.spawnPipe` repetidamente
    - Verifica que para cada pipe: `gapY >= 60` y `gapY + 150 <= 600`
    - **Validates: Requirements 4.3**

  - [ ]* 5.3 Property test — Property 5: Los pipes se mueven exactamente 3 píxeles por frame
    - **Property 5: pipes move 3px per frame**
    - Genera pipes con `x` aleatorio en `[0, 480]` con `fc.integer({ min: 0, max: 480 })`
    - Aplica un frame de `PipeManager.update`
    - Verifica que `pipe.x === x_inicial - 3`
    - **Validates: Requirements 4.4**

- [ ] 6. Checkpoint — Pipes verificados
  - Asegurarse de que todos los tests de pipes pasan. Consultar al usuario si hay dudas.

- [ ] 7. PhysicsEngine — detección de colisiones
  - Implementar `PhysicsEngine.checkCollision(state)`: retornar `true` si Ghosty (con bounding box reducido por `COLLISION_MARGIN` de 4px) supera el borde superior (`y < 0`), el borde inferior (`y + height > PLAY_HEIGHT`), o se superpone con cualquier pipe activo
  - Integrar la llamada a `checkCollision` dentro de `PhysicsEngine.update`: si retorna `true`, cambiar `state.phase = 'GAME_OVER'` y llamar `AudioManager.play(state.assets.gameOverSound)`

  - [ ] 7.1 Test unitario: Game Over screen visible tras colisión
    - Verificar que tras una colisión `state.phase === 'GAME_OVER'`
    - _Requirements: 5.3_

  - [ ]* 7.2 Property test — Property 9: La colisión con bordes del Canvas es exhaustiva
    - **Property 9: border collision is exhaustive**
    - Genera posiciones `y < 0` con `fc.integer({ min: -200, max: -1 })` y `y > PLAY_HEIGHT` con `fc.integer({ min: 601, max: 800 })`
    - Verifica que `PhysicsEngine.checkCollision` retorna `true` en ambos casos, independientemente de los pipes activos
    - **Validates: Requirements 5.2**

- [ ] 8. ScoreManager — puntuación y persistencia
  - Implementar `ScoreManager.init(state)`: leer `highScore` de `localStorage` con try/catch (fallback a 0 si no disponible)
  - Implementar `ScoreManager.update(state)`: detectar si el centro X de Ghosty supera el centro X de un pipe con `scored === false`, incrementar `state.score` y marcar `pipe.scored = true`
  - Implementar `ScoreManager.save(state)`: persistir `highScore` en `localStorage` con try/catch
  - Implementar `ScoreManager.reset(state)`: resetear `state.score = 0`
  - Actualizar `highScore` cuando `score > highScore` dentro de `ScoreManager.update`
  - Llamar `ScoreManager.save` al transicionar a `GAME_OVER`

  - [ ] 8.1 Test unitario: Score se resetea a 0 al reiniciar
    - Verificar que tras `ScoreManager.reset`, `state.score === 0`
    - _Requirements: 7.3_

  - [ ] 8.2 Test unitario: Pipe marcado como `scored=true` no incrementa score de nuevo
    - Verificar que un pipe con `scored = true` no incrementa el score en frames posteriores
    - _Requirements: 6.1_

  - [ ] 8.3 Test unitario: localStorage indisponible no rompe el juego
    - Mockear `localStorage` para que lance excepción y verificar que `ScoreManager.init` opera con `highScore = 0`
    - _Requirements: 6.4_

  - [ ]* 8.4 Property test — Property 6: El score incrementa exactamente una vez por pipe cruzado
    - **Property 6: score increments exactly once per pipe**
    - Genera N pipes distintos con `fc.array(fc.record({ x: fc.integer() }), { minLength: 1, maxLength: 20 })`
    - Simula N cruces llamando `ScoreManager.update` con cada pipe
    - Verifica que `state.score === N`
    - **Validates: Requirements 6.1**

  - [ ]* 8.5 Property test — Property 7: El high score es siempre el máximo histórico
    - **Property 7: high score is historical maximum**
    - Genera secuencia de scores aleatorios con `fc.array(fc.integer({ min: 0, max: 1000 }), { minLength: 1 })`
    - Simula múltiples partidas actualizando `highScore` con cada score
    - Verifica que `highScore === Math.max(...scores)`
    - **Validates: Requirements 6.3, 6.4**

  - [ ]* 8.6 Property test — Property 8: Round-trip de persistencia del high score
    - **Property 8: high score persistence round-trip**
    - Genera `highScore` entero no negativo con `fc.integer({ min: 0, max: 100000 })`
    - Llama `ScoreManager.save` y luego `ScoreManager.init` con un mock de `localStorage`
    - Verifica que el valor leído es igual al guardado
    - **Validates: Requirements 6.4, 6.5**

- [ ] 9. Checkpoint — Puntuación verificada
  - Asegurarse de que todos los tests de puntuación pasan. Consultar al usuario si hay dudas.

- [ ] 10. InputHandler y máquina de estados
  - Implementar `InputHandler.init(canvas, onAction)`: registrar listeners para `keydown` (Space), `mousedown` en canvas y `touchstart` en canvas
  - Implementar la lógica de transición de estados en `onAction`: `START → PLAYING`, `GAME_OVER → PLAYING` (con reset completo), y llamada a `PhysicsEngine.flap` durante `PLAYING`
  - Implementar la función de reset completo de partida: `ScoreManager.reset`, `PipeManager.reset`, reposicionar Ghosty en `(100, 320)` con `vy = 0`
  - _Requirements: 2.4, 7.3, 10.1_

- [ ] 11. Renderer — fondo, nubes y pipes
  - Implementar `Renderer.drawBackground(ctx, canvas)`: rellenar con `#5B8DD9`
  - Implementar `Renderer.drawSketchTexture(ctx, canvas)`: dibujar líneas blancas con opacidad 0.05
  - Inicializar `state.clouds` con 3–5 nubes con posiciones, tamaños y velocidad 0.5px/frame; implementar reciclado al salir por la izquierda
  - Implementar `Renderer.drawClouds(state, ctx)`: dibujar y mover las nubes
  - Implementar `Renderer.drawPipes(state, ctx)`: cuerpo verde `#4CAF50` con borde `#388E3C` de 6px
  - _Requirements: 4.6, 9.1, 9.2, 9.5_

- [ ] 12. Renderer — Ghosty, HUD y overlays
  - Implementar `Renderer.drawGhosty(state, ctx)`: dibujar sprite 40×40px con rotación proporcional a `vy` (máx 30° abajo, −20° arriba); fallback a rectángulo si imagen no cargó
  - Implementar `Renderer.drawHUD(state, ctx, canvas)`: barra `#1a1a2e` de 40px en la parte inferior con "Score: X" y "High: X" en blanco con fuente monoespaciada
  - Implementar `Renderer.drawStartScreen(state, ctx, canvas)`: título "Flappy Kiro" e instrucciones "Press Space / Click to Start" con Ghosty flotando
  - Implementar `Renderer.drawGameOverScreen(state, ctx, canvas)`: overlay semitransparente oscuro con "Game Over", score final, high score e instrucciones de reinicio
  - Implementar `Renderer.render(state, ctx, canvas)`: orquestar el orden correcto de llamadas (fondo → textura → nubes → pipes → Ghosty → HUD → overlay)
  - _Requirements: 2.1, 2.2, 2.3, 3.4, 6.2, 7.1, 7.2, 7.4, 9.3, 9.4_

- [ ] 13. Game Loop — integración final
  - Implementar la función `gameLoop(timestamp)` que llama en orden: `PhysicsEngine.update`, `PipeManager.update`, `ScoreManager.update`, `Renderer.render`, y se re-registra con `requestAnimationFrame` solo si `state.phase === 'PLAYING'`
  - Conectar `InputHandler.init` con el canvas y el callback de acción
  - Llamar `ScoreManager.init`, `AudioManager.init` y arrancar el loop inicial mostrando `START_SCREEN`
  - Verificar que el loop se pausa automáticamente al perder el foco de la pestaña (comportamiento nativo de `requestAnimationFrame`)
  - _Requirements: 1.5, 2.1, 5.3, 5.4_

- [ ] 14. Checkpoint final — Integración completa
  - Ejecutar la suite completa de tests con `npx vitest --run` y verificar que todos pasan
  - Verificar manualmente que el juego carga abriendo `index.html` en el browser
  - Asegurarse de que todos los tests pasan. Consultar al usuario si hay dudas.

## Notes

- Las sub-tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia los requisitos específicos para trazabilidad completa
- Los property tests usan `fc.assert(fc.property(...), { numRuns: 100 })` como mínimo
- Los módulos deben ser exportables/importables en entorno Node.js (sin DOM) para que Vitest pueda testearlos; usar `if (typeof module !== 'undefined') module.exports = ...` o estructura de módulo compatible
- Los checkpoints garantizan validación incremental antes de avanzar a la siguiente fase
