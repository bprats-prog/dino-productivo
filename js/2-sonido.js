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
    },
    saltoDoble() {
      pitido({ frecuenciaInicial: 620, frecuenciaFinal: 900, duracion: 0.08, forma: 'triangle', volumen: 0.2 });
    },
    cafe() {
      pitido({ frecuenciaInicial: 880, frecuenciaFinal: 1320, duracion: 0.09, forma: 'sine', volumen: 0.18 });
    },
    choque() {
      pitido({ frecuenciaInicial: 220, frecuenciaFinal: 90, duracion: 0.22, forma: 'sawtooth', volumen: 0.22 });
    },
    energiaCritica() {
      pitido({ frecuenciaInicial: 220, duracion: 0.06, forma: 'sine', volumen: 0.12 });
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
