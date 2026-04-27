# Requirements Document

## Introduction

Flappy Kiro es un juego retro de tipo endless scroller que corre completamente en el browser sin dependencias externas (HTML + CSS + JavaScript vanilla / Canvas API). El jugador controla a un fantasmita llamado Ghosty que cae por gravedad y sube al hacer clic, tap o presionar la barra espaciadora. El objetivo es atravesar la mayor cantidad de pares de tuberías verdes posible sin colisionar con ellas ni con los bordes de la pantalla. El juego lleva registro del puntaje actual y el puntaje máximo histórico.

---

## Glossary

- **Game**: El sistema de juego completo que corre en el browser.
- **Ghosty**: El personaje principal del jugador, representado por el sprite `assets/ghosty.png`.
- **Pipe**: Par de tuberías verdes (superior e inferior) con un hueco central por el que Ghosty debe pasar.
- **Gap**: El espacio libre entre la tubería superior e inferior de un par de Pipes.
- **Score**: Contador de pares de Pipes que Ghosty ha atravesado exitosamente en la partida actual.
- **High_Score**: El puntaje máximo alcanzado en todas las partidas, persistido en `localStorage`.
- **Canvas**: El elemento HTML `<canvas>` sobre el que se renderiza el juego.
- **Game_Loop**: El ciclo de actualización y renderizado del juego ejecutado mediante `requestAnimationFrame`.
- **Gravity**: La aceleración descendente constante aplicada a Ghosty en cada frame.
- **Flap**: La acción de impulso ascendente aplicada a Ghosty al recibir input del jugador.
- **Collision**: El contacto de Ghosty con un Pipe o con los bordes superior/inferior del Canvas.
- **HUD**: La barra inferior oscura que muestra Score y High_Score durante el juego.
- **Start_Screen**: La pantalla inicial que muestra el título y las instrucciones para comenzar.
- **Game_Over_Screen**: La pantalla que se muestra al producirse una Collision, con el Score final y opción de reiniciar.
- **Renderer**: El módulo responsable de dibujar todos los elementos visuales en el Canvas.
- **Physics_Engine**: El módulo responsable de aplicar Gravity, Flap y detectar Collisions.
- **Pipe_Manager**: El módulo responsable de generar, mover y eliminar Pipes.
- **Input_Handler**: El módulo responsable de capturar eventos de teclado, mouse y touch.
- **Audio_Manager**: El módulo responsable de reproducir los efectos de sonido del juego.
- **Score_Manager**: El módulo responsable de actualizar Score, High_Score y persistir en `localStorage`.

---

## Requirements

### Requirement 1: Inicialización y estructura del juego

**User Story:** Como jugador, quiero que el juego cargue en el browser sin instalar nada, para poder jugar inmediatamente desde cualquier dispositivo.

#### Acceptance Criteria

1. THE Game SHALL ejecutarse completamente en el browser usando únicamente HTML, CSS y JavaScript vanilla sin dependencias externas ni bundlers.
2. THE Game SHALL renderizar todos los elementos visuales sobre un elemento `<canvas>` de dimensiones fijas de 480×640 píxeles.
3. THE Game SHALL cargar el sprite `assets/ghosty.png` y los archivos de audio `assets/jump.wav` y `assets/game_over.wav` al iniciar.
4. IF un asset de audio no puede cargarse, THEN THE Audio_Manager SHALL continuar la ejecución del juego sin reproducir ese sonido.
5. THE Game_Loop SHALL actualizarse usando `requestAnimationFrame` para sincronizar la lógica y el renderizado con la tasa de refresco del navegador.

---

### Requirement 2: Pantalla de inicio

**User Story:** Como jugador, quiero ver una pantalla de inicio clara, para saber cómo comenzar a jugar.

#### Acceptance Criteria

1. WHEN el juego carga por primera vez, THE Game SHALL mostrar la Start_Screen antes de iniciar el Game_Loop activo.
2. THE Start_Screen SHALL mostrar el título "Flappy Kiro" y las instrucciones "Press Space / Click to Start".
3. THE Start_Screen SHALL mostrar a Ghosty centrado en el Canvas con una animación de flotación vertical suave.
4. WHEN el jugador presiona la barra espaciadora, hace clic en el Canvas o realiza un tap en pantalla táctil, THE Game SHALL iniciar la partida y activar el Game_Loop.

---

### Requirement 3: Física de Ghosty

**User Story:** Como jugador, quiero que Ghosty responda a mis inputs de forma precisa y predecible, para poder controlar su trayectoria con habilidad.

#### Acceptance Criteria

1. WHILE el Game_Loop está activo, THE Physics_Engine SHALL aplicar una aceleración de Gravity de 0.5 píxeles por frame² a la velocidad vertical de Ghosty en cada frame.
2. WHEN el jugador presiona la barra espaciadora, hace clic en el Canvas o realiza un tap, THE Physics_Engine SHALL aplicar un Flap que establece la velocidad vertical de Ghosty a −8 píxeles por frame (hacia arriba).
3. THE Physics_Engine SHALL limitar la velocidad vertical máxima descendente de Ghosty a 12 píxeles por frame.
4. WHILE el Game_Loop está activo, THE Renderer SHALL rotar el sprite de Ghosty proporcionalmente a su velocidad vertical, con rotación máxima de 30° hacia abajo y −20° hacia arriba.
5. THE Physics_Engine SHALL actualizar la posición vertical de Ghosty en cada frame sumando su velocidad vertical actual a su posición Y.

---

### Requirement 4: Generación y movimiento de tuberías

**User Story:** Como jugador, quiero que las tuberías aparezcan de forma continua y variada, para que el juego sea desafiante y no repetitivo.

#### Acceptance Criteria

1. WHILE el Game_Loop está activo, THE Pipe_Manager SHALL generar un nuevo par de Pipes cada 90 frames.
2. THE Pipe_Manager SHALL posicionar cada nuevo par de Pipes en el borde derecho del Canvas (x = 480).
3. THE Pipe_Manager SHALL calcular la posición vertical del Gap de cada par de Pipes de forma aleatoria, garantizando que el Gap tenga una altura fija de 150 píxeles y que ambas tuberías queden completamente dentro de los límites verticales del Canvas.
4. WHILE el Game_Loop está activo, THE Pipe_Manager SHALL mover todos los Pipes activos 3 píxeles hacia la izquierda en cada frame.
5. WHEN un par de Pipes sale completamente del borde izquierdo del Canvas (x < −60), THE Pipe_Manager SHALL eliminar ese par de Pipes de la lista activa.
6. THE Renderer SHALL dibujar cada tubería con un cuerpo verde sólido (#4CAF50) y un borde superior/inferior más oscuro (#388E3C) de 6 píxeles de alto para simular el estilo retro.

---

### Requirement 5: Detección de colisiones y fin de partida

**User Story:** Como jugador, quiero que el juego detecte con precisión cuándo Ghosty choca, para que las reglas sean justas y consistentes.

#### Acceptance Criteria

1. WHEN Ghosty colisiona con cualquier Pipe (superposición de bounding boxes con margen de tolerancia de 4 píxeles), THE Physics_Engine SHALL registrar una Collision.
2. WHEN Ghosty supera el borde superior del Canvas (y < 0) o el borde inferior del Canvas (y > 640), THE Physics_Engine SHALL registrar una Collision.
3. WHEN se registra una Collision, THE Game SHALL detener el Game_Loop activo y mostrar la Game_Over_Screen.
4. WHEN se registra una Collision, THE Audio_Manager SHALL reproducir el sonido `assets/game_over.wav`.

---

### Requirement 6: Sistema de puntuación

**User Story:** Como jugador, quiero ver mi puntaje en tiempo real y recordar mi mejor marca, para tener motivación de mejorar.

#### Acceptance Criteria

1. WHEN Ghosty cruza el eje X central de un par de Pipes (la posición X del Pipe es menor que la posición X de Ghosty), THE Score_Manager SHALL incrementar el Score en 1 punto.
2. WHILE el Game_Loop está activo, THE HUD SHALL mostrar "Score: [valor]" y "High: [valor]" en la barra inferior del Canvas.
3. WHEN el Score supera el High_Score almacenado, THE Score_Manager SHALL actualizar el High_Score al valor actual del Score.
4. THE Score_Manager SHALL persistir el High_Score en `localStorage` bajo la clave `flappy-kiro-high-score` al finalizar cada partida.
5. WHEN el juego carga, THE Score_Manager SHALL leer el High_Score desde `localStorage` y mostrarlo en el HUD desde el inicio.

---

### Requirement 7: Pantalla de Game Over

**User Story:** Como jugador, quiero ver mi resultado al morir y poder reiniciar rápidamente, para seguir jugando sin fricción.

#### Acceptance Criteria

1. THE Game_Over_Screen SHALL mostrar el texto "Game Over", el Score final de la partida y el High_Score actualizado.
2. THE Game_Over_Screen SHALL mostrar las instrucciones "Press Space / Click to Restart".
3. WHEN el jugador presiona la barra espaciadora, hace clic en el Canvas o realiza un tap mientras la Game_Over_Screen está visible, THE Game SHALL reiniciar la partida: resetear Score a 0, reposicionar a Ghosty en el centro izquierdo del Canvas, eliminar todos los Pipes activos y reactivar el Game_Loop.
4. THE Game_Over_Screen SHALL mostrar un fondo semitransparente oscuro sobre el Canvas para destacar el mensaje.

---

### Requirement 8: Efectos de sonido

**User Story:** Como jugador, quiero escuchar feedback sonoro al saltar y al morir, para que el juego sea más inmersivo.

#### Acceptance Criteria

1. WHEN el jugador ejecuta un Flap, THE Audio_Manager SHALL reproducir el sonido `assets/jump.wav`.
2. WHEN se registra una Collision, THE Audio_Manager SHALL reproducir el sonido `assets/game_over.wav`.
3. THE Audio_Manager SHALL reiniciar el tiempo de reproducción de un sonido al inicio antes de reproducirlo, para permitir reproducción rápida y repetida sin esperar a que el audio anterior termine.

---

### Requirement 9: Apariencia visual y fondo

**User Story:** Como jugador, quiero que el juego tenga una estética retro y coherente, para que la experiencia sea visualmente atractiva.

#### Acceptance Criteria

1. THE Renderer SHALL dibujar el fondo del Canvas con color azul (#5B8DD9) en cada frame antes de renderizar cualquier otro elemento.
2. THE Renderer SHALL dibujar entre 3 y 5 nubes decorativas blancas/azul claro en posiciones fijas del fondo, que se desplacen lentamente hacia la izquierda a 0.5 píxeles por frame para dar sensación de profundidad.
3. THE Renderer SHALL dibujar el sprite de Ghosty (`assets/ghosty.png`) centrado en su posición con dimensiones de 40×40 píxeles.
4. THE HUD SHALL renderizarse como una barra rectangular oscura (#1a1a2e) de 40 píxeles de alto en la parte inferior del Canvas, con el texto del Score en color blanco usando fuente monoespaciada.
5. THE Renderer SHALL dibujar una textura de líneas de boceto/sketch sutiles sobre el fondo para reforzar la estética retro, usando líneas semitransparentes de color blanco con opacidad 0.05.

---

### Requirement 10: Responsividad y accesibilidad básica

**User Story:** Como jugador en dispositivo móvil, quiero poder jugar con tap en la pantalla, para no necesitar teclado ni mouse.

#### Acceptance Criteria

1. THE Input_Handler SHALL capturar eventos `keydown` (barra espaciadora), `mousedown` en el Canvas y `touchstart` en el Canvas para ejecutar Flap o iniciar/reiniciar el juego.
2. THE Game SHALL escalar el Canvas visualmente mediante CSS para ajustarse al viewport del dispositivo manteniendo la relación de aspecto 3:4 (480×640), sin alterar las coordenadas internas del juego.
3. THE Game SHALL incluir un elemento `<title>` en el HTML con el texto "Flappy Kiro" para identificación básica en el browser.
