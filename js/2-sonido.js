// ============================================================
// 2-SONIDO.JS
// Todos los efectos de sonido se generan aquí mismo con el propio
// navegador (Web Audio API). No hace falta ningún archivo de audio.
// ============================================================

const Sonido = (() => {
  let contexto = null;
  let ganancia = null;
  let silenciado = localStorage.getItem('dino.silenciado') === 'true';

  function asegurarContexto() {
    if (!contexto) {
      contexto = new (window.AudioContext || window.webkitAudioContext)();
      ganancia = contexto.createGain();
      ganancia.gain.value = silenciado ? 0 : 0.3;
      ganancia.connect(contexto.destination);
    }
    if (contexto.state === 'suspended') contexto.resume();
  }

  // El primer sonido de cualquier tipo "despierta" el audio.
  // (iOS/Chrome exigen que sea en respuesta a un gesto del usuario)
  window.addEventListener('pointerdown', asegurarContexto, { once: true });
  window.addEventListener('keydown', asegurarContexto, { once: true });

  // Vibración táctil (móvil). Si el navegador no la soporta, no hace nada.
  function vibrar(patron) {
    if (navigator.vibrate) navigator.vibrate(patron);
  }

  function pitido({ frecuenciaInicial, frecuenciaFinal, duracion, forma = 'square', volumen = 0.2 }) {
    if (!contexto) return;
    const osc = contexto.createOscillator();
    const gan = contexto.createGain();
    osc.type = forma;
    osc.frequency.setValueAtTime(frecuenciaInicial, contexto.currentTime);
    if (frecuenciaFinal !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(frecuenciaFinal, 1), contexto.currentTime + duracion
      );
    }
    gan.gain.setValueAtTime(volumen, contexto.currentTime);
    gan.gain.exponentialRampToValueAtTime(0.001, contexto.currentTime + duracion);
    osc.connect(gan).connect(ganancia);
    osc.start();
    osc.stop(contexto.currentTime + duracion + 0.02);
  }

  return {
    saltar() {
      pitido({ frecuenciaInicial: 380, frecuenciaFinal: 620, duracion: 0.09, forma: 'square', volumen: 0.18 });
      vibrar(8);
    },
    saltoDoble() {
      pitido({ frecuenciaInicial: 620, frecuenciaFinal: 900, duracion: 0.08, forma: 'triangle', volumen: 0.2 });
      vibrar([10, 20, 10]);
    },
    // racha = cuántos cafés seguidos llevas sin chocar (1 = el primero).
    // El tono sube con la racha: recoger varios de seguido "suena" mejor.
    cafe(racha = 1) {
      const subida = Math.min((racha - 1) * 60, 480);
      pitido({ frecuenciaInicial: 880 + subida, frecuenciaFinal: 1320 + subida * 1.5, duracion: 0.09, forma: 'sine', volumen: 0.18 });
      vibrar(12);
    },
    choque() {
      pitido({ frecuenciaInicial: 220, frecuenciaFinal: 90, duracion: 0.22, forma: 'sawtooth', volumen: 0.22 });
      vibrar(35);
    },
    // Espresso doble: dos pitidos rápidos y más ricos que un café normal.
    espresso() {
      pitido({ frecuenciaInicial: 700, frecuenciaFinal: 1100, duracion: 0.1, forma: 'sawtooth', volumen: 0.16 });
      setTimeout(() => pitido({ frecuenciaInicial: 1000, frecuenciaFinal: 1600, duracion: 0.12, forma: 'sine', volumen: 0.2 }), 70);
      vibrar([15, 30, 15, 30, 15]);
    },
    energiaCritica() {
      pitido({ frecuenciaInicial: 220, duracion: 0.06, forma: 'sine', volumen: 0.12 });
    },
    // "Marcha atrás": un barrido hacia abajo, como un rebobinado.
    reversa() {
      pitido({ frecuenciaInicial: 500, frecuenciaFinal: 130, duracion: 0.35, forma: 'triangle', volumen: 0.18 });
      vibrar([20, 40, 20]);
    },
    finDePartida() {
      [523, 440, 349, 262].forEach((f, i) => {
        setTimeout(() => pitido({ frecuenciaInicial: f, duracion: 0.14, forma: 'triangle', volumen: 0.18 }), i * 140);
      });
    },
    alternarSilencio() {
      silenciado = !silenciado;
      localStorage.setItem('dino.silenciado', silenciado);
      if (ganancia) ganancia.gain.value = silenciado ? 0 : 0.3;
      return silenciado;
    },
    estaSilenciado() {
      return silenciado;
    },
  };
})();
