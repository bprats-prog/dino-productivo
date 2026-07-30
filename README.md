# Dino Productivo

Un "dino run" con obstáculos de oficina: un despertador, un monstruo con sueño,
una pizza voladora y una bandeja de correos desbordada. Salta simple con un
toque/espacio, salto doble con un segundo toque en el aire. La energía baja
con el tiempo y con los choques; si llega a cero, se acaba la partida.

## Cómo probarlo en tu ordenador

No hace falta instalar nada ni compilar nada. Dos formas:

1. **La más simple:** haz doble clic en `index.html`. Se abre en el navegador
   y ya se puede jugar (aunque algunos estilos se ven mejor con la opción 2).
2. **La más fiel a como se verá publicado:** abre una terminal en esta
   carpeta y ejecuta:
   ```bash
   npx serve .
   ```
   Luego abre en el navegador la dirección que te indique (normalmente
   `http://localhost:3000`).

## Cómo se juega

- **Espacio** o **tocar la pantalla**: saltar. Pulsa otra vez mientras estás
  en el aire para el salto doble.
- **P** o el botón de pausa: pausar / reanudar.
- **M** o el botón de sonido: silenciar.
- **Enter**: reiniciar tras perder.
- La pizza vuela: no hay que saltarla, se pasa corriendo por debajo.

## Estructura del proyecto

- `index.html` — el esqueleto de la página y el orden de carga de los scripts.
- `estilos.css` — el aspecto y la adaptación a móvil.
- `js/1-ajustes.js` — **todos** los números que definen la dificultad y los
  colores. Si quieres que el juego vaya más rápido, salte más alto, etc.,
  se cambia aquí.
- `js/2-sonido.js` — los efectos de sonido (generados por el propio
  navegador, no hay archivos de audio).
- `js/3-entradas.js` — teclado y toques en pantalla.
- `js/4-dibujo.js` — todo lo que se dibuja (el dino, los obstáculos, el HUD).
- `js/5-mundo.js` — qué obstáculo aparece y cuándo.
- `js/6-juego.js` — el bucle del juego: física, colisiones, energía,
  puntuación.
- `js/7-records.js` — guarda el récord. De momento en el propio navegador;
  cuando conectemos Supabase, solo se tocará este archivo.

## Publicar los cambios (cuando ya tengamos GitHub + Vercel)

```bash
git add .
git commit -m "Describe aquí qué has cambiado"
git push
```

Vercel publica automáticamente cada vez que se hace `push`. Si al publicar
ves la versión antigua del juego, prueba a recargar con Ctrl+F5 (fuerza que
el navegador no use una copia guardada en caché).

## Fases del proyecto

1. **Fase 1 (actual):** correr, saltar simple y doble, 4 obstáculos, energía,
   puntuación por distancia, sonido, bosque, móvil y ordenador.
2. **Fase 2:** plataformas en altura + tacitas de café que recargan energía
   y dan puntos extra.
3. **Fase 3:** récords compartidos guardados en Supabase.
