// ============================================================
// 3-ENTRADAS.JS
// Traduce teclado y toques en pantalla a un único objeto `entrada`
// que el resto del juego consulta. Así 6-juego.js no necesita saber
// si el jugador usa teclado, ratón o dedo.
// ============================================================

const entrada = {
  saltarPulsadoEsteFrame: false,  // flanco de pulsación (solo el instante en que se pulsa)
  saltarMantenido: false,          // se mantiene pulsado (para el salto sostenido)
  pausaPulsada: false,
  silencioPulsado: false,
  reiniciarPulsado: false,
};

(function () {
  let ultimoToqueMs = 0;

  function saltarDesde(origen) {
    entrada.saltarPulsadoEsteFrame = true;
    entrada.saltarMantenido = true;
  }

  function soltarSalto() {
    entrada.saltarMantenido = false;
  }

  // --- Teclado ---
  window.addEventListener('keydown', (ev) => {
    if (ev.repeat) return; // ignorar autorepetición: si no, mantener espacio = salto doble gratis

    if (ev.code === 'Space' || ev.code === 'ArrowUp' || ev.code === 'KeyW') {
      ev.preventDefault();
      saltarDesde('teclado');
    } else if (ev.code === 'KeyP' || ev.code === 'Escape') {
      entrada.pausaPulsada = true;
    } else if (ev.code === 'KeyM') {
      entrada.silencioPulsado = true;
    } else if (ev.code === 'Enter') {
      entrada.reiniciarPulsado = true;
    }
  });

  window.addEventListener('keyup', (ev) => {
    if (ev.code === 'Space' || ev.code === 'ArrowUp' || ev.code === 'KeyW') {
      soltarSalto();
    }
  });

  // --- Táctil / ratón (un único camino con Pointer Events) ---
  const lienzo = document.getElementById('lienzo');

  lienzo.addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    const ahora = performance.now();
    // Anti "dedos fantasma": ignorar un segundo toque casi simultáneo
    if (ahora - ultimoToqueMs < 70) return;
    ultimoToqueMs = ahora;
    saltarDesde('toque');
  });

  lienzo.addEventListener('pointerup', soltarSalto);
  lienzo.addEventListener('pointercancel', soltarSalto);
  lienzo.addEventListener('pointerleave', soltarSalto);

  // Las pantallas de portada y fin de partida se dibujan ENCIMA del
  // lienzo, así que un toque ahí no le llega al lienzo. Tocar esas
  // pantallas también debe iniciar / reiniciar la partida.
  document.getElementById('pantalla-portada').addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    saltarDesde('toque');
  });
  document.getElementById('pantalla-fin').addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    saltarDesde('toque');
  });
  // Tocar la pantalla de pausa reanuda, igual que el botón o la tecla P.
  document.getElementById('pantalla-pausa').addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    entrada.pausaPulsada = true;
  });

  // Botones del HUD (pausa / silencio) — deben "consumir" el evento
  // para que no dispare también un salto.
  document.getElementById('boton-pausa').addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    entrada.pausaPulsada = true;
  });
  document.getElementById('boton-silencio').addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    entrada.silencioPulsado = true;
  });
})();

// Se llama una vez al final de cada fotograma para limpiar los "flancos"
// (las cosas que solo deben detectarse una vez, no mientras se mantienen).
function limpiarEntradasDeUnFrame() {
  entrada.saltarPulsadoEsteFrame = false;
  entrada.pausaPulsada = false;
  entrada.silencioPulsado = false;
  entrada.reiniciarPulsado = false;
}
