// ============================================================
// 1-AJUSTES.JS
// Aquí viven TODOS los números que definen cómo se siente el juego.
// Si algún día quieres que vaya más rápido, que se salte más alto,
// que el café dé más energía, etc. — se cambia aquí y en ningún
// otro sitio. El resto del código lee estos valores, nunca los repite.
// ============================================================

const AJUSTES = {

  // --- Lienzo lógico (el juego siempre "piensa" en este tamaño,
  //     luego se escala a la pantalla real, ver 4-dibujo.js) ---
  anchoLogico: 960,
  altoLogico: 420,
  alturaSuelo: 356,      // "y" de la superficie del sendero

  // --- Física del dino ---
  dino: {
    // 50x60 = una rejilla de píxeles de 2.5px exacta (20 columnas x 24
    // filas: 18 de torso + 6 de piernas), calcada del SVG del T-Rex que
    // pasó la clienta (coordenadas exactas, no a ojo — ver 4-dibujo.js).
    ancho: 50,
    alto: 60,
    pixel: 2.5,                // tamaño de cada "píxel" del dino, en px lógicos
    x: 140,                    // el dino nunca se mueve en horizontal
    margenHitboxLados: 7,      // la caja de colisión es más pequeña que el dibujo
    margenHitboxArriba: 8,     // (para que el juego perdone los "casi")
    margenHitboxAbajo: 4,

    gravedadSubiendo: 2300,    // px/s²
    gravedadBajando: 2900,     // px/s² (un poco más fuerte: caída decidida)
    velocidadCaidaMaxima: 1500,// px/s (evita que se cuele por las plataformas)

    impulsoSaltoSimple: -720,  // px/s (negativo = hacia arriba)
    impulsoSaltoDoble: -620,   // px/s, SIEMPRE este valor, pase lo que pase

    coyoteTimeMs: 100,   // margen de gracia para saltar justo al dejar el suelo
    bufferSaltoMs: 120,  // si pulsas un poco antes de aterrizar, el salto no se pierde

    invulnerabilidadMs: 1200,  // tras un choque, no puedes chocar otra vez

    // Agacharse (flecha abajo / S / botón ⬇): solo cambia la caja de
    // colisión, nunca la física — los pies se quedan siempre en el mismo
    // sitio, es la "cabeza" la que baja. Solo vale estando en el suelo.
    altoAgachado: 32,
    margenHitboxArribaAgachado: 4,
  },

  // --- Energía (la "vida" del juego) ---
  energia: {
    maxima: 100,
    desgastePorSegundoInicial: 2.0,  // sube con el tiempo, ver curva abajo
    desgastePorSegundoFinal: 3.3,
    tiempoParaDesgasteFinal: 135,     // segundos hasta llegar al desgaste final
    danoPorChoque: 34,                // tres choques y te quedas sin energía
  },

  // --- Velocidad del mundo (scroll) ---
  mundo: {
    velocidadInicial: 340,     // px/s
    velocidadMaxima: 640,      // px/s
    aceleracionPorSegundo: 12, // px/s, hasta llegar al máximo

    // "Marcha atrás": de vez en cuando el mundo entero retrocede unos
    // segundos (algo tira de ti hacia atrás). No genera obstáculos nuevos
    // mientras dura, pero los que ya habían pasado pueden volver a
    // aparecer por detrás — es justo la gracia del evento.
    reversaPrimeraEnSegundos: 18,
    reversaSeparacionMinimaSegundos: 28,
    reversaSeparacionMaximaSegundos: 45,
    reversaDuracionSegundos: 3,
    reversaFactorVelocidad: 0.6, // va hacia atrás al 60% de la velocidad que llevaba
  },

  // --- Generación de obstáculos (los 4+2 van SIEMPRE en el suelo, se saltan todos) ---
  generador: {
    separacionMinimaSegundos: 0.85, // nunca menos tiempo de reacción que esto
    separacionMaximaSegundos: 1.6,
    sinObstaculosAlEmpezarSegundos: 2.5,

    // Un obstáculo no se borra en cuanto sale de pantalla por la
    // izquierda: se queda "esperando" ahí un margen amplio, para que la
    // marcha atrás pueda traerlo de vuelta (máximo alcance de una reversa:
    // 3s a 640*0.6=384px/s = 1152px; 1400 deja margen de sobra).
    margenBorradoObstaculosPx: 1400,

    // --- Tramos de dificultad por TIEMPO de partida, no solo por velocidad.
    // 0-30s: obstáculos sueltos. 30-75s: empiezan las parejas del mismo
    // tipo. 75s+: además parejas mezcladas y plataformas más seguidas.
    // 135s+: "hora punta" (ver horaPunta* abajo).
    tramo2Segundos: 30,
    tramo3Segundos: 75,
    tramo4Segundos: 135,

    // Huecos cortos DENTRO de una pareja/grupo (no confundir con la
    // separación de arriba, que es el hueco ENTRE grupos).
    huecoParejaSegundos: 0.35,
    huecoParejaMezclaSegundos: 0.45,

    // Hora punta: ciclo que se repite para siempre a partir de tramo4:
    // unos segundos de ráfaga intensa + un respiro con cafés de regalo.
    horaPuntaRafagaSegundos: 4,
    horaPuntaRespiroSegundos: 3,
    separacionMinimaHoraPuntaSegundos: 0.55,
    separacionMaximaHoraPuntaSegundos: 0.85,
  },

  // --- Plataformas en altura con cafés (solo se llega con salto doble) ---
  plataforma: {
    // Apex de un salto simple ≈ 113px. Apex de un doble ronda 145-196px
    // según cuándo se pulse la segunda vez (ver Math.min en 6-juego.js:
    // el doble ya no puede salir "más flojo" que el simple). 130px deja
    // margen de sobra por encima del simple y sigue exigiendo el doble.
    alturaSobreSuelo: 130,
    ancho: 200,
    grosor: 16,
    primeraEnSegundos: 4,
    separacionMinimaSegundos: 6,
    separacionMaximaSegundos: 9,
    // Desde el tramo 3 (75s), las plataformas se suceden más seguidas.
    separacionMinimaSegundosTardia: 4,
    separacionMaximaSegundosTardia: 6,
    // Hueco mínimo respecto al último obstáculo generado, para que
    // siempre haya una recta despejada donde preparar el salto doble.
    margenSeguridadTrasObstaculoSegundos: 1.1,
  },

  cafe: {
    radio: 11,
    energiaQueDa: 20,
    puntosQueDa: 50,
    porPlataforma: 4,
    // Imán suave: dentro de este radio, el café se deja atraer hacia el
    // dino en vez de exigir un toque exacto (perdona el "casi lo tengo").
    radioAtraccion: 34,
    velocidadAtraccion: 260, // px/s
    // Racha de cafés sin chocar: multiplica los puntos del café.
    umbralRacha2: 10,
    umbralRacha3: 25,
    // Espresso doble: un café raro (en vez de uno normal, en una plataforma)
    // que rellena la energía al máximo, da el doble de puntos y regala unos
    // segundos de invulnerabilidad. No desequilibra: es tan escaso que no
    // se puede planear alrededor de él, solo disfrutarlo si aparece.
    probabilidadEspresso: 0.12,
    invulnerabilidadEspressoMs: 2500,
  },

  // --- Puntuación ---
  puntuacion: {
    puntosPorPixel: 1 / 10, // 1 punto cada 10 px recorridos
  },

  // --- Ciclo de día completo (amanecer -> mediodía -> atardecer -> noche
  // -> vuelve a amanecer), en bucle para siempre según tiempo de partida.
  // Momentos en SEGUNDOS de partida, no fracciones: así "de noche al
  // minuto 1" es literal y no hay que hacer cuentas para tocarlo. ---
  dia: {
    amanecerEn: 0,
    mediodiaEn: 20,
    atardecerEn: 40,
    nocheEn: 60,            // de noche justo al minuto de partida, como se pidió
    empiezaAAclararEn: 75,  // se queda de noche un rato antes de volver a clarear
    duracionSegundos: 90,   // ahí se cierra el ciclo y vuelve a amanecer
  },

  // --- Paleta de color (formas planas, vibrantes) ---
  color: {
    // Cielo de mediodía (color base). Amanecer/atardecer se mezclan con
    // este según cuánto lleves de partida — ver dibujarFondo en 4-dibujo.js.
    cieloArriba: '#29C2F0',
    cieloAbajo: '#9BEBF7',
    cieloArribaAmanecer: '#8FD6F0',
    cieloAbajoAmanecer: '#FFD9C2',
    cieloArribaAtardecer: '#FF9966',
    cieloAbajoAtardecer: '#FFD3A6',
    cieloArribaNoche: '#0B1533',
    cieloAbajoNoche: '#2C3E6B',
    sol: '#FFE066',
    luna: '#E8EDF5',
    colinasLejanas: '#7FD1B5',
    copasLejanas: '#56BF8E',
    arbolesMedios: '#2F8F5B',
    muroBosque: '#14663D',
    muroBosqueSombra: '#0E4E2E',
    matorralFrente: '#0B4D2E',

    senderoFleco: '#2FA35F',
    senderoBorde: '#A9713A',
    senderoBase: '#D9A05B',
    senderoBanda: '#C98F4E',
    senderoSombra: '#8A5A2B',

    dinoCuerpo: '#17D9C4',
    dinoCuerpoSombra: '#12BFAE',
    dinoVientre: '#C8FFF4',
    dinoAcento: '#FF2E88',
    dinoCorbata: '#FFD23F',
    contorno: '#0E2A33',

    despertadorPrincipal: '#FF4D3D',
    despertadorEsfera: '#FFF8E7',
    despertadorBoton: '#FFC93C',

    monstruoCuerpo: '#9B5DE5',
    monstruoCareto: '#E8D9FF',
    monstruoOjeras: '#6B3FA0',
    monstruoZzz: '#CFF3FB',

    pizzaClaro: '#FFC244',
    pizzaOscuro: '#FFA92B',
    pizzaCorteza: '#C9702A',
    pizzaPepperoni: '#E8332B',

    // Bandeja de entrada = sobre estilo Gmail (icono que pasó la clienta)
    bandejaCuerpo: '#FFFFFF',
    bandejaPliegue: '#EA4335',
    bandejaPliegueOscuro: '#C5221F',
    bandejaBadge: '#FF3B30',

    slackCuerpo: '#7C3FE4',
    slackCuerpoApagado: '#B7A0EE',
    slackNotificacion: '#FF3B30',

    reunionCabecera: '#FF6B4A',
    reunionUrgencia: '#E63946',

    cableCuerpo: '#3E4A52',
    cableAviso: '#FFC93C',

    plataformaCara: '#E0B074',
    plataformaLuz: '#F2CE9A',
    plataformaCuerpo: '#A9713A',
    plataformaSombra: '#5C3A1A',

    cafeTaza: '#FFFFFF',
    cafePlatillo: '#FFE9A8',
    cafePlatilloBorde: '#E0A93B',
    cafeLiquido: '#6B3E1E',
    cafeFranja: '#17D9C4',
    cafeHalo: 'rgba(255,213,79,0.55)',
    cafeEspressoHalo: 'rgba(255,107,74,0.6)',
    cafeEspressoRayo: '#FFD23F',

    energiaLlena: '#17D9C4',
    energiaMedia: '#FFC93C',
    energiaCritica: '#FF3B30',

    textoPrincipal: '#FFF8E7',
    chipFondo: 'rgba(14,42,51,0.82)',
    dorado: '#FFD23F',
  },
};
