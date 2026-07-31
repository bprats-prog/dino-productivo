// ============================================================
// 5-MUNDO.JS
// Decide QUÉ aparece y CUÁNDO: los obstáculos (todos en el suelo,
// se saltan todos) y las plataformas con café (arriba, solo se
// alcanzan con el salto doble). Las distancias se piensan en
// SEGUNDOS, no en píxeles: así el hueco da siempre el mismo tiempo
// de reacción, aunque el juego vaya más rápido con el tiempo.
//
// La dificultad crece en TRAMOS por tiempo de partida (no solo por
// velocidad): obstáculos sueltos -> parejas del mismo tipo -> parejas
// mezcladas y plataformas más seguidas -> "hora punta" (ráfaga+respiro
// en bucle para siempre). Ver AJUSTES.generador para los números.
// ============================================================

const Mundo = (() => {
  // Los obstáculos van siempre en el suelo: todos se esquivan saltando.
  // "desdePx" = distancia recorrida a partir de la cual puede aparecer.
  const TIPOS_OBSTACULO = [
    { tipo: 'despertador', ancho: 34, alto: 36, desdePx: 0 },
    { tipo: 'monstruo', ancho: 50, alto: 58, desdePx: 0 },
    { tipo: 'bandeja', ancho: 42, alto: 40, desdePx: 0 },
    { tipo: 'pizza', ancho: 42, alto: 30, desdePx: 0 },
    { tipo: 'slack', ancho: 40, alto: 38, desdePx: 12000 },
    { tipo: 'reunion', ancho: 46, alto: 44, desdePx: 40000 },
    // "cable": el único que NO se salta, se pasa por debajo agachado.
    // yFija = posición absoluta (no depende del suelo, cuelga en el aire).
    { tipo: 'cable', ancho: 90, alto: 16, yFija: 298, desdePx: 3000 },
  ];

  let obstaculos = [];
  let plataformas = [];
  let cafes = [];

  let tiempoTranscurrido = 0;
  let distanciaAcumulada = 0;
  let proximoObstaculoEnSegundos = 0;
  let proximaPlataformaEnSegundos = 0;
  let bloqueoObstaculosHasta = 0;
  let tiempoUltimoObstaculo = -Infinity;
  let ultimoTipo = null;
  let ultimoCicloRespiroGenerado = -1;

  // Avisos "una sola vez en la vida del jugador en este navegador", nunca
  // más (no se resetean en reiniciar()).
  const CLAVE_AVISO_PLATAFORMA = 'dino.avisoPlataformaVisto';
  let avisoPlataformaPendiente = localStorage.getItem(CLAVE_AVISO_PLATAFORMA) !== 'true';
  const CLAVE_AVISO_AGACHAR = 'dino.avisoAgacharVisto';
  let avisoAgacharPendiente = localStorage.getItem(CLAVE_AVISO_AGACHAR) !== 'true';

  function reiniciar() {
    obstaculos = [];
    plataformas = [];
    cafes = [];
    tiempoTranscurrido = 0;
    distanciaAcumulada = 0;
    proximoObstaculoEnSegundos = AJUSTES.generador.sinObstaculosAlEmpezarSegundos;
    proximaPlataformaEnSegundos = AJUSTES.plataforma.primeraEnSegundos;
    bloqueoObstaculosHasta = 0;
    tiempoUltimoObstaculo = -Infinity;
    ultimoTipo = null;
    ultimoCicloRespiroGenerado = -1;
  }

  function tiposDisponibles() {
    return TIPOS_OBSTACULO.filter(t => distanciaAcumulada >= t.desdePx);
  }

  // excluirTipo: para que una pareja "mezclada" no salga con dos iguales.
  function elegirTipo(excluirTipo) {
    const disponibles = tiposDisponibles();
    let candidato;
    let intentos = 0;
    do {
      candidato = disponibles[Math.floor(Math.random() * disponibles.length)];
      intentos++;
    } while (
      intentos < 8 &&
      ((candidato.tipo === ultimoTipo && Math.random() < 0.7) ||
        (excluirTipo && candidato.tipo === excluirTipo))
    );
    ultimoTipo = candidato.tipo;
    return candidato;
  }

  // Decide qué grupo de 1 o 2 obstáculos toca generar ahora, según el
  // tramo de dificultad en el que esté la partida.
  function decidirGrupo() {
    const g = AJUSTES.generador;
    const t = tiempoTranscurrido;

    if (t < g.tramo2Segundos) {
      return [elegirTipo()];
    }
    if (t < g.tramo3Segundos) {
      if (Math.random() < 0.55) {
        const a = elegirTipo();
        return [a, a]; // pareja del mismo tipo, pegada
      }
      return [elegirTipo()];
    }
    // Tramo 3 (75-135s) y hora punta (135s+) comparten la misma mezcla de
    // grupos; lo que cambia en hora punta es el hueco ENTRE grupos (ver
    // generarObstaculo), no la composición de cada grupo.
    const dado = Math.random();
    if (dado < 0.4) {
      const a = elegirTipo();
      const b = elegirTipo(a.tipo);
      return [a, b]; // pareja mezclada
    }
    if (dado < 0.75) {
      const a = elegirTipo();
      return [a, a];
    }
    return [elegirTipo()];
  }

  function generarObstaculo(velocidadMundo) {
    const g = AJUSTES.generador;
    const grupo = decidirGrupo();

    const xInicial = AJUSTES.anchoLogico + 40;
    let x = xInicial;
    grupo.forEach((def, i) => {
      if (i > 0) {
        const mismoTipo = grupo[i - 1].tipo === def.tipo;
        x += (mismoTipo ? g.huecoParejaSegundos : g.huecoParejaMezclaSegundos) * velocidadMundo;
      }
      const y = def.yFija !== undefined ? def.yFija : AJUSTES.alturaSuelo - def.alto;
      const obstaculo = { tipo: def.tipo, ancho: def.ancho, alto: def.alto, x, y };
      if (def.tipo === 'cable' && avisoAgacharPendiente) {
        obstaculo.avisoInicial = true;
        obstaculo.creadaEnMs = performance.now();
        avisoAgacharPendiente = false;
        localStorage.setItem(CLAVE_AVISO_AGACHAR, 'true');
      }
      obstaculos.push(obstaculo);
      x += def.ancho;
    });
    const anchoGrupoPx = x - xInicial;

    tiempoUltimoObstaculo = tiempoTranscurrido;
    const enHoraPunta = tiempoTranscurrido >= g.tramo4Segundos;
    const sepMin = enHoraPunta ? g.separacionMinimaHoraPuntaSegundos : g.separacionMinimaSegundos;
    const sepMax = enHoraPunta ? g.separacionMaximaHoraPuntaSegundos : g.separacionMaximaSegundos;
    const hueco = sepMin + Math.random() * (sepMax - sepMin);
    // El hueco de reacción se cuenta desde que TERMINA el grupo, no desde
    // la primera pieza, para que dos piezas pegadas no "roben" reacción.
    proximoObstaculoEnSegundos = tiempoTranscurrido + (anchoGrupoPx / velocidadMundo) + hueco;
  }

  function generarPlataforma(velocidadMundo) {
    const p = AJUSTES.plataforma;
    const plataforma = {
      x: AJUSTES.anchoLogico + 60,
      y: AJUSTES.alturaSuelo - p.alturaSobreSuelo,
      ancho: p.ancho,
      grosor: p.grosor,
    };
    if (avisoPlataformaPendiente) {
      plataforma.avisoInicial = true;
      plataforma.creadaEnMs = performance.now();
      avisoPlataformaPendiente = false;
      localStorage.setItem(CLAVE_AVISO_PLATAFORMA, 'true');
    }
    plataformas.push(plataforma);

    const c = AJUSTES.cafe;
    const nCafes = c.porPlataforma;
    const indiceEspresso = Math.random() < c.probabilidadEspresso
      ? Math.floor(Math.random() * nCafes) : -1;
    for (let i = 0; i < nCafes; i++) {
      cafes.push({
        x: plataforma.x + 26 + i * ((p.ancho - 52) / (nCafes - 1)),
        y: plataforma.y - 30,
        radio: c.radio,
        recogido: false,
        tipo: i === indiceEspresso ? 'espresso' : 'normal',
      });
    }

    // Mientras la plataforma esté en pantalla y un poco después de que
    // salga por la izquierda, no generamos obstáculos de suelo: es la
    // "zona de caída limpia" para quien sube a por el café.
    const duracionEnPantallaSegundos = (plataforma.x - (-plataforma.ancho)) / velocidadMundo;
    bloqueoObstaculosHasta = tiempoTranscurrido + duracionEnPantallaSegundos + 0.6;
    proximoObstaculoEnSegundos = Math.max(proximoObstaculoEnSegundos, bloqueoObstaculosHasta);

    // A partir del tramo 3 las plataformas se suceden más seguidas.
    const enTramoTardio = tiempoTranscurrido >= AJUSTES.generador.tramo3Segundos;
    const sepMin = enTramoTardio ? p.separacionMinimaSegundosTardia : p.separacionMinimaSegundos;
    const sepMax = enTramoTardio ? p.separacionMaximaSegundosTardia : p.separacionMaximaSegundos;
    proximaPlataformaEnSegundos = tiempoTranscurrido + sepMin + Math.random() * (sepMax - sepMin);
  }

  // Regalo de "hora punta": al llegar el respiro de cada ciclo, unos
  // cafés a poca altura (se llegan con un salto simple, sin plataforma).
  function generarCafesRespiro() {
    const y = AJUSTES.alturaSuelo - 85;
    for (let i = 0; i < 3; i++) {
      cafes.push({
        x: AJUSTES.anchoLogico + 60 + i * 60,
        y, radio: AJUSTES.cafe.radio, recogido: false, tipo: 'normal',
      });
    }
  }

  function actualizar(paso, velocidadMundo) {
    tiempoTranscurrido += paso;
    // La distancia "para desbloquear cosas" nunca retrocede, aunque el
    // mundo vaya marcha atrás — lo desbloqueado se queda desbloqueado.
    if (velocidadMundo > 0) distanciaAcumulada += velocidadMundo * paso;

    for (const o of obstaculos) o.x -= velocidadMundo * paso;
    // Margen amplio (no los -80 de plataformas/cafés): así, durante una
    // marcha atrás, los obstáculos que ya habías pasado siguen "ahí
    // detrás" esperando y pueden volver a aparecer — los mismos, en el
    // mismo orden en que los pasaste, solo que ahora al revés.
    obstaculos = obstaculos.filter(o => o.x + o.ancho > -AJUSTES.generador.margenBorradoObstaculosPx);

    for (const p of plataformas) p.x -= velocidadMundo * paso;
    plataformas = plataformas.filter(p => p.x + p.ancho > -80);

    for (const c of cafes) c.x -= velocidadMundo * paso;
    cafes = cafes.filter(c => !c.recogido && c.x > -60);

    // Marcha atrás: solo se mueve lo que ya había (y puede volver a
    // amenazar desde atrás, esa es la gracia). No generamos nada nuevo.
    if (velocidadMundo < 0) return;

    const g = AJUSTES.generador;
    let enRespiroHoraPunta = false;
    if (tiempoTranscurrido >= g.tramo4Segundos) {
      const cicloSegundos = g.horaPuntaRafagaSegundos + g.horaPuntaRespiroSegundos;
      const enCiclo = (tiempoTranscurrido - g.tramo4Segundos) % cicloSegundos;
      enRespiroHoraPunta = enCiclo >= g.horaPuntaRafagaSegundos;
      if (enRespiroHoraPunta) {
        const numeroCiclo = Math.floor((tiempoTranscurrido - g.tramo4Segundos) / cicloSegundos);
        if (numeroCiclo !== ultimoCicloRespiroGenerado) {
          ultimoCicloRespiroGenerado = numeroCiclo;
          generarCafesRespiro();
        }
      }
    }

    if (!enRespiroHoraPunta && tiempoTranscurrido >= proximoObstaculoEnSegundos && tiempoTranscurrido >= bloqueoObstaculosHasta) {
      generarObstaculo(velocidadMundo);
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
