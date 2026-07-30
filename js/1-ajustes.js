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
  },

  // --- Generación de obstáculos (los 4 van SIEMPRE en el suelo, se saltan todos) ---
  generador: {
    separacionMinimaSegundos: 0.85, // nunca menos tiempo de reacción que esto
    separacionMaximaSegundos: 1.6,
    sinObstaculosAlEmpezarSegundos: 2.5,
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
    // Hueco mínimo respecto al último obstáculo generado, para que
    // siempre haya una recta despejada donde preparar el salto doble.
    margenSeguridadTrasObstaculoSegundos: 1.1,
  },

  cafe: {
    radio: 11,
    energiaQueDa: 20,
    puntosQueDa: 50,
    porPlataforma: 4,
  },

  // --- Puntuación ---
  puntuacion: {
    puntosPorPixel: 1 / 10, // 1 punto cada 10 px recorridos
  },

  // --- Paleta de color (formas planas, vibrantes) ---
  color: {
    cieloArriba: '#29C2F0',
    cieloAbajo: '#9BEBF7',
    sol: '#FFE066',
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

    bandejaCuerpo: '#2B3A55',
    bandejaFrontal: '#3E5273',
    bandejaSobres: '#FFF1D0',
    bandejaBadge: '#FF3B30',

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

    energiaLlena: '#17D9C4',
    energiaMedia: '#FFC93C',
    energiaCritica: '#FF3B30',

    textoPrincipal: '#FFF8E7',
    chipFondo: 'rgba(14,42,51,0.82)',
    dorado: '#FFD23F',
  },
};
