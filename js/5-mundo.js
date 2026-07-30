// ============================================================
// 5-MUNDO.JS
// Decide QUÉ aparece y CUÁNDO: los obstáculos (todos en el suelo,
// se saltan todos) y las plataformas con café (arriba, solo se
// alcanzan con el salto doble). Las distancias se piensan en
// SEGUNDOS, no en píxeles: así el hueco da siempre el mismo tiempo
// de reacción, aunque el juego vaya más rápido con el tiempo.
// ============================================================

const Mundo = (() => {
  // Los 4 obstáculos van siempre en el suelo: todos se esquivan saltando.
  const TIPOS_OBSTACULO = [
    { tipo: 'despertador', ancho: 34, alto: 36 },
    { tipo: 'monstruo', ancho: 50, alto: 58 },
    { tipo: 'bandeja', ancho: 70, alto: 30 },
    { tipo: 'pizza', ancho: 42, alto: 30 },
  ];

  let obstaculos = [];
  let plataformas = [];
  let cafes = [];

  let tiempoTranscurrido = 0;
  let proximoObstaculoEnSegundos = 0;
  let proximaPlataformaEnSegundos = 0;
  let bloqueoObstaculosHasta = 0;
  let tiempoUltimoObstaculo = -Infinity;
  let ultimoTipo = null;

  function reiniciar() {
    obstaculos = [];
    plataformas = [];
    cafes = [];
    tiempoTranscurrido = 0;
    proximoObstaculoEnSegundos = AJUSTES.generador.sinObstaculosAlEmpezarSegundos;
    proximaPlataformaEnSegundos = AJUSTES.plataforma.primeraEnSegundos;
    bloqueoObstaculosHasta = 0;
    tiempoUltimoObstaculo = -Infinity;
    ultimoTipo = null;
  }

  function elegirTipoObstaculo() {
    let candidato;
    do {
      candidato = TIPOS_OBSTACULO[Math.floor(Math.random() * TIPOS_OBSTACULO.length)];
    } while (candidato.tipo === ultimoTipo && Math.random() < 0.7);
    ultimoTipo = candidato.tipo;
    return candidato;
  }

  function generarObstaculo() {
    const def = elegirTipoObstaculo();
    obstaculos.push({
      tipo: def.tipo,
      ancho: def.ancho,
      alto: def.alto,
      x: AJUSTES.anchoLogico + 40,
      y: AJUSTES.alturaSuelo - def.alto,
    });
    tiempoUltimoObstaculo = tiempoTranscurrido;
    const { separacionMinimaSegundos, separacionMaximaSegundos } = AJUSTES.generador;
    const hueco = separacionMinimaSegundos + Math.random() * (separacionMaximaSegundos - separacionMinimaSegundos);
    proximoObstaculoEnSegundos = tiempoTranscurrido + hueco;
  }

  function generarPlataforma(velocidadMundo) {
    const p = AJUSTES.plataforma;
    const plataforma = {
      x: AJUSTES.anchoLogico + 60,
      y: AJUSTES.alturaSuelo - p.alturaSobreSuelo,
      ancho: p.ancho,
      grosor: p.grosor,
    };
    plataformas.push(plataforma);

    const nCafes = AJUSTES.cafe.porPlataforma;
    for (let i = 0; i < nCafes; i++) {
      cafes.push({
        x: plataforma.x + 26 + i * ((p.ancho - 52) / (nCafes - 1)),
        y: plataforma.y - 30,
        radio: AJUSTES.cafe.radio,
        recogido: false,
      });
    }

    // Mientras la plataforma esté en pantalla y un poco después de que
    // salga por la izquierda, no generamos obstáculos de suelo: es la
    // "zona de caída limpia" para quien sube a por el café.
    const duracionEnPantallaSegundos = (plataforma.x - (-plataforma.ancho)) / velocidadMundo;
    bloqueoObstaculosHasta = tiempoTranscurrido + duracionEnPantallaSegundos + 0.6;
    proximoObstaculoEnSegundos = Math.max(proximoObstaculoEnSegundos, bloqueoObstaculosHasta);

    const { separacionMinimaSegundos, separacionMaximaSegundos } = p;
    proximaPlataformaEnSegundos = tiempoTranscurrido +
      separacionMinimaSegundos + Math.random() * (separacionMaximaSegundos - separacionMinimaSegundos);
  }

  function actualizar(paso, velocidadMundo) {
    tiempoTranscurrido += paso;

    for (const o of obstaculos) o.x -= velocidadMundo * paso;
    obstaculos = obstaculos.filter(o => o.x + o.ancho > -80);

    for (const p of plataformas) p.x -= velocidadMundo * paso;
    plataformas = plataformas.filter(p => p.x + p.ancho > -80);

    for (const c of cafes) c.x -= velocidadMundo * paso;
    cafes = cafes.filter(c => !c.recogido && c.x > -60);

    if (tiempoTranscurrido >= proximoObstaculoEnSegundos && tiempoTranscurrido >= bloqueoObstaculosHasta) {
      generarObstaculo();
    }
    if (tiempoTranscurrido >= proximaPlataformaEnSegundos) {
      // No generamos la plataforma pegada a un obstáculo reciente: hace
      // falta una recta despejada para poder preparar el salto doble.
      const margen = AJUSTES.plataforma.margenSeguridadTrasObstaculoSegundos;
      const tiempoLibreDesdeUltimoObstaculo = tiempoTranscurrido - tiempoUltimoObstaculo;
      if (tiempoLibreDesdeUltimoObstaculo < margen) {
        proximaPlataformaEnSegundos = tiempoUltimoObstaculo + margen;
      } else {
        generarPlataforma(velocidadMundo);
      }
    }
  }

  return {
    reiniciar,
    actualizar,
    obtenerObstaculos: () => obstaculos,
    obtenerPlataformas: () => plataformas,
    obtenerCafes: () => cafes,
  };
})();
