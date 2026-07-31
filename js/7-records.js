// ============================================================
// 7-RECORDS.JS
// Guarda y consulta la puntuación. Solo tiene estas funciones;
// el resto del juego nunca toca localStorage ni Supabase directamente.
//
// FASE 3 (Supabase): el récord propio sigue en localStorage (es de
// este dispositivo), pero además, si ya tenemos un nombre guardado,
// cada partida se envía al ranking global a través de una función de
// base de datos que valida en el servidor que la puntuación sea
// plausible. Nunca se hace un INSERT directo — no hay permiso para eso.
// ============================================================

const Records = (() => {
  const CLAVE_RECORD = 'dino.record';
  const CLAVE_NOMBRE = 'dino.nombreJugador';

  function cabeceras() {
    return {
      apikey: AJUSTES.supabase.clavePublica,
      Authorization: `Bearer ${AJUSTES.supabase.clavePublica}`,
    };
  }

  function mejorPropio() {
    return Number(localStorage.getItem(CLAVE_RECORD) || 0);
  }

  function obtenerNombreGuardado() {
    return localStorage.getItem(CLAVE_NOMBRE) || null;
  }

  // Mismo filtro que la base de datos, para no depender de que el
  // servidor rechace algo que ya sabíamos que no iba a pasar.
  function nombreValido(nombre) {
    return /^[A-Za-z0-9ÁÉÍÓÚÑáéíóúñ ]{1,12}$/.test(nombre);
  }

  function guardarNombre(nombre) {
    const limpio = String(nombre || '').trim().slice(0, 12);
    const final = nombreValido(limpio) ? limpio : 'Anónimo';
    localStorage.setItem(CLAVE_NOMBRE, final);
    return final;
  }

  // No lanza nunca: sin conexión, el juego debe seguir funcionando igual,
  // simplemente esa partida no llega al ranking global.
  async function enviarPuntuacionRemota(nombre, partida) {
    try {
      const resp = await fetch(`${AJUSTES.supabase.url}/rest/v1/rpc/enviar_puntuacion`, {
        method: 'POST',
        headers: { ...cabeceras(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          p_nombre: nombre,
          p_puntos: Math.floor(partida.puntos),
          p_cafes: Math.floor(partida.cafes),
          p_segundos: Math.max(1, Math.floor(partida.segundos)),
        }),
      });
      return resp.ok;
    } catch (e) {
      return false;
    }
  }

  async function guardarPuntuacion(partida) {
    // partida = { puntos, cafes, segundos }
    const actual = mejorPropio();
    if (partida.puntos > actual) {
      localStorage.setItem(CLAVE_RECORD, String(Math.floor(partida.puntos)));
    }
    const nombre = obtenerNombreGuardado();
    if (nombre) await enviarPuntuacionRemota(nombre, partida);
    return true;
  }

  async function pedirMejores(cuantas) {
    try {
      const url = `${AJUSTES.supabase.url}/rest/v1/puntuaciones?select=nombre,puntos&order=puntos.desc&limit=${cuantas}`;
      const resp = await fetch(url, { headers: cabeceras() });
      if (!resp.ok) return [];
      return await resp.json();
    } catch (e) {
      return []; // sin conexión: el ranking simplemente no se muestra
    }
  }

  return {
    mejorPropio, obtenerNombreGuardado, guardarNombre,
    guardarPuntuacion, enviarPuntuacionRemota, pedirMejores,
  };
})();
