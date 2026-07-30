// ============================================================
// 7-RECORDS.JS
// Guarda y consulta la puntuación. Solo tiene estas funciones;
// el resto del juego nunca toca localStorage directamente.
//
// FASE 3 (futuro, con Supabase): solo hay que cambiar el CUERPO
// de estas funciones para que hablen con la base de datos en vez
// de con localStorage. Nada más del juego necesita cambiar.
// ============================================================

const Records = (() => {
  const CLAVE = 'dino.record';

  function mejorPropio() {
    return Number(localStorage.getItem(CLAVE) || 0);
  }

  async function guardarPuntuacion(partida) {
    // partida = { puntos, cafes, segundos }
    const actual = mejorPropio();
    if (partida.puntos > actual) {
      localStorage.setItem(CLAVE, String(Math.floor(partida.puntos)));
    }
    return true;
  }

  async function pedirMejores(cuantas) {
    // Sin servidor todavía: solo devolvemos el propio récord.
    return [{ nombre: 'Tú', puntos: mejorPropio() }].slice(0, cuantas);
  }

  return { mejorPropio, guardarPuntuacion, pedirMejores };
})();
