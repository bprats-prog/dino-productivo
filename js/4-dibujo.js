// ============================================================
// 4-DIBUJO.JS
// Todo lo que se pinta en el lienzo. Estas funciones NUNCA cambian
// el estado del juego, solo dibujan lo que 6-juego.js les pasa.
// ============================================================

const Dibujo = (() => {
  const C = AJUSTES.color;

  // Contorno + relleno estándar para que todo tenga el mismo estilo
  function trazarForma(ctx, dibujarPath, relleno, grosorContorno = 3) {
    dibujarPath();
    ctx.fillStyle = relleno;
    ctx.fill();
    ctx.lineJoin = 'round';
    ctx.lineWidth = grosorContorno;
    ctx.strokeStyle = C.contorno;
    ctx.stroke();
  }

  function rectRedondeado(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ---------- Micro-narrativa: el cielo cambia con el tiempo de partida ----------
  function hexARgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mezclarColor(hexA, hexB, t) {
    const a = hexARgb(hexA), b = hexARgb(hexB);
    const r = Math.round(a[0] + (b[0] - a[0]) * t);
    const g = Math.round(a[1] + (b[1] - a[1]) * t);
    const bl = Math.round(a[2] + (b[2] - a[2]) * t);
    return `rgb(${r},${g},${bl})`;
  }
  // progresoDia: cuánto lleva la partida, en fracción del ciclo (ver
  // AJUSTES.dia). Solo se usa su parte fraccionaria, así que el ciclo se
  // repite para siempre: amanecer -> mediodía -> atardecer -> noche ->
  // amanecer de nuevo ("otro día más en la oficina").
  // Cada tramo: [colorArribaInicial, colorAbajoInicial, colorArribaFinal,
  // colorAbajoFinal, intensidadNocheInicial, intensidadNocheFinal].
  const TRAMOS_DIA = [
    ['cieloArribaAmanecer', 'cieloAbajoAmanecer', 'cieloArriba', 'cieloAbajo', 0, 0],
    ['cieloArriba', 'cieloAbajo', 'cieloArribaAtardecer', 'cieloAbajoAtardecer', 0, 0],
    ['cieloArribaAtardecer', 'cieloAbajoAtardecer', 'cieloArribaNoche', 'cieloAbajoNoche', 0, 1],
    ['cieloArribaNoche', 'cieloAbajoNoche', 'cieloArribaNoche', 'cieloAbajoNoche', 1, 1],
    ['cieloArribaNoche', 'cieloAbajoNoche', 'cieloArribaAmanecer', 'cieloAbajoAmanecer', 1, 0],
  ];
  // Los puntos de corte vienen de AJUSTES.dia, en SEGUNDOS -> se pasan a
  // fracciones del ciclo una sola vez (son 5 puntos para los 5 tramos).
  function puntosDeCorteDia() {
    const d = AJUSTES.dia;
    return [d.amanecerEn, d.mediodiaEn, d.atardecerEn, d.nocheEn, d.empiezaAAclararEn, d.duracionSegundos]
      .map(s => s / d.duracionSegundos);
  }
  function colorYNocheDelCielo(progresoDia) {
    const t = progresoDia - Math.floor(progresoDia); // parte fraccionaria, en [0,1)
    const puntos = puntosDeCorteDia();
    let indice = TRAMOS_DIA.length - 1;
    for (let i = 0; i < TRAMOS_DIA.length; i++) {
      if (t < puntos[i + 1]) { indice = i; break; }
    }
    const span = puntos[indice + 1] - puntos[indice];
    const k = span > 0 ? (t - puntos[indice]) / span : 0;
    const [a1, a2, b1, b2, n1, n2] = TRAMOS_DIA[indice];
    return {
      arriba: mezclarColor(C[a1], C[b1], k),
      abajo: mezclarColor(C[a2], C[b2], k),
      noche: n1 + (n2 - n1) * k,
    };
  }
  const ESTRELLAS = [
    [40, 30, 1.4], [90, 55, 1], [160, 25, 1.2], [230, 60, 1],
    [300, 35, 1.5], [370, 20, 1], [60, 90, 1], [260, 95, 1.1],
  ];

  // ---------- FONDO CON PROFUNDIDAD (parallax) ----------
  // progresoDia: cuánto lleva la PARTIDA actual dividido por la duración
  // del ciclo — controla el cielo (ver AJUSTES.dia).
  function dibujarFondo(ctx, distanciaMundo, progresoDia = 0.15) {
    const ancho = AJUSTES.anchoLogico;
    const alto = AJUSTES.altoLogico;
    const suelo = AJUSTES.alturaSuelo;

    // Cielo (amanecer -> mediodía -> atardecer -> noche, en bucle)
    const cielo = colorYNocheDelCielo(progresoDia);
    const noche = cielo.noche;
    const gradienteCielo = ctx.createLinearGradient(0, 0, 0, suelo * 0.6);
    gradienteCielo.addColorStop(0, cielo.arriba);
    gradienteCielo.addColorStop(1, cielo.abajo);
    ctx.fillStyle = gradienteCielo;
    ctx.fillRect(0, 0, ancho, alto);

    // Estrellas (solo se ven de noche)
    if (noche > 0.1) {
      ctx.fillStyle = `rgba(255,255,255,${(noche * 0.9).toFixed(2)})`;
      for (const [ex, ey, er] of ESTRELLAS) {
        ctx.beginPath(); ctx.arc(ex, ey, er, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Sol de día, luna de noche: el mismo disco, cambia de color y encoge un poco.
    ctx.fillStyle = mezclarColor(C.sol, C.luna, noche);
    ctx.beginPath();
    ctx.arc(120, 70, 34 - noche * 6, 0, Math.PI * 2);
    ctx.fill();

    dibujarCapaParallax(ctx, distanciaMundo, 0.12, suelo - 60, 40, C.colinasLejanas, 90, 40);
    dibujarCapaParallax(ctx, distanciaMundo, 0.28, suelo - 40, 32, C.copasLejanas, 60, 30);
    dibujarCapaParallax(ctx, distanciaMundo, 0.55, suelo - 10, 46, C.arbolesMedios, 70, 40);

    // Muro de bosque (el telón oscuro justo detrás de la acción)
    ctx.fillStyle = C.muroBosque;
    ctx.fillRect(0, suelo - 46, ancho, 46);
    ctx.fillStyle = C.muroBosqueSombra;
    ctx.fillRect(0, suelo - 14, ancho, 14);

    // Sendero
    ctx.fillStyle = C.senderoFleco;
    ctx.fillRect(0, suelo, ancho, 6);
    ctx.fillStyle = C.senderoBase;
    ctx.fillRect(0, suelo + 6, ancho, 22);
    ctx.fillStyle = C.senderoBanda;
    ctx.fillRect(0, suelo + 28, ancho, 16);
    ctx.fillStyle = C.senderoSombra;
    ctx.fillRect(0, suelo + 44, ancho, alto - suelo - 44);

    // Velo nocturno: solo oscurece el FONDO (esto se dibuja antes que
    // obstáculos/dino/HUD en 6-juego.js), así nunca pierden legibilidad.
    if (noche > 0) {
      ctx.fillStyle = `rgba(8,12,35,${(noche * 0.32).toFixed(2)})`;
      ctx.fillRect(0, 0, ancho, alto);
    }
  }

  function dibujarCapaParallax(ctx, distanciaMundo, factor, yBase, alturaMax, color, periodo, radio) {
    const desplazamiento = -(distanciaMundo * factor) % periodo;
    ctx.fillStyle = color;
    for (let x = desplazamiento - periodo; x < AJUSTES.anchoLogico + periodo; x += periodo) {
      ctx.beginPath();
      ctx.arc(x, yBase, radio, Math.PI, 0);
      ctx.fill();
    }
  }

  // ---------- DINO (pixel art, calcado del T-Rex de internet) ----------
  // Rejilla de 20x18 "píxeles" (cada uno = AJUSTES.dino.pixel px lógicos),
  // sacada por coordenadas exactas del SVG que pasó la clienta (no a ojo):
  // cabeza con boca abierta a la derecha, ojo, cola serrada a la
  // izquierda con la puntita como acento, y un brazo pequeño asomando.
  // '.' hueco · B cuerpo · S sombra/vientre · A acento (puntita cola) · E ojo
  const REJILLA_DINO = [
    '...........BBBBBBBB.',
    '..........BBBBBBBBBB',
    '..........BBEBBBBBBB',
    '..........BBBBBBBBBB',
    '..........BBBBBBBBBB',
    '..........BBBBBBBBBB',
    '..........BBBBB.....',
    '..........BBBBBBBB..',
    'A........BBBBB......',
    'A.......BBBBBB......',
    'SS....BBBBBBBBBB....',
    'SSS..BBBBBBBBB.B....',
    'BBBBBBBBBBBBBB......',
    'BBBBBBBBBBBBBB......',
    '.BBBBBBBBBBBB.......',
    '..SSSSSSSSSSS.......',
    '...SSSSSSSSS........',
    '....SSSSSSS.........',
  ];

  // estado: { x, y, ancho, alto, enAire, cayendo, invulnerable, distanciaRecorrida }
  function dibujarDino(ctx, estado) {
    const { x, y, ancho, alto } = estado;
    const PX = AJUSTES.dino.pixel;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));

    if (estado.invulnerable) {
      const parpadea = Math.floor(performance.now() / 90) % 2 === 0;
      ctx.globalAlpha = parpadea ? 1 : 0.4;
    }

    // Marcha atrás: se gira físicamente y corre mirando al otro lado (todo
    // lo que se dibuje después queda espejado, cabeza incluida).
    if (estado.mirandoAtras) {
      ctx.translate(ancho, 0);
      ctx.scale(-1, 1);
    }

    // Sombra de contacto
    if (!estado.enAire) {
      ctx.fillStyle = 'rgba(14,42,51,0.22)';
      ctx.beginPath();
      ctx.ellipse(ancho * 0.4, alto + 4, ancho * 0.42, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Agachado: se aplasta todo el dibujo verticalmente, anclado en los
    // pies (nunca en la cabeza), para que se note que agacha la cabeza.
    if (estado.agachado) {
      const escalaY = 0.55;
      ctx.translate(0, alto * (1 - escalaY));
      ctx.scale(1, escalaY);
    }

    const cicloPasos = Math.floor((estado.distanciaRecorrida % 40) / 20); // 0 o 1

    dibujarPiernasDino(ctx, PX, estado, cicloPasos);

    // Pequeño cabeceo al subir/bajar: sube 1px al saltar, baja 1px al caer.
    const cabeceo = estado.enAire ? (estado.cayendo ? 1 : -1) : 0;
    const colorPorLetra = { B: C.dinoCuerpo, S: C.dinoCuerpoSombra, A: C.dinoAcento, E: C.contorno };

    for (let fila = 0; fila < REJILLA_DINO.length; fila++) {
      const linea = REJILLA_DINO[fila];
      for (let col = 0; col < linea.length; col++) {
        const letra = linea[col];
        if (letra === '.') continue;
        ctx.fillStyle = colorPorLetra[letra];
        ctx.fillRect(col * PX, fila * PX + cabeceo, PX, PX);
      }
    }

    ctx.restore();
    ctx.globalAlpha = 1;

    // Polvo al correr (fuera del translate, en coordenadas de mundo).
    // El polvo queda siempre "detrás": si va mirando atrás, detrás es a la derecha.
    if (!estado.enAire && cicloPasos === 0) {
      ctx.fillStyle = 'rgba(233,207,168,0.5)';
      ctx.beginPath();
      ctx.arc(x + (estado.mirandoAtras ? ancho + 4 : -4), y + alto - 2, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Piernas dibujadas aparte (no en la rejilla) para poder animarlas:
  // dos bloques por pierna (muslo+espinilla y pie), con el pie desplazado
  // ±1 "píxel" para simular la zancada. En el aire quedan más recogidas.
  function dibujarPiernasDino(ctx, PX, estado, cicloPasos) {
    const yCadera = 18 * PX; // justo debajo de la rejilla del torso (18 filas)
    const alturaPierna = 4 * PX;
    const alturaPie = 2 * PX;

    let desfaseTrasera = 0;
    let desfaseDelantera = 0;
    if (!estado.enAire) {
      desfaseTrasera = cicloPasos === 0 ? -1 : 1;
      desfaseDelantera = cicloPasos === 0 ? 1 : -1;
    }

    function dibujarUnaPierna(colUnidad, color, desfaseUnidades) {
      const baseX = colUnidad * PX;
      const h = estado.enAire ? alturaPierna - PX : alturaPierna;
      ctx.fillStyle = color;
      ctx.fillRect(baseX, yCadera + (alturaPierna - h), PX * 2, h);
      ctx.fillRect(baseX + desfaseUnidades * PX, yCadera + alturaPierna, PX * 3, alturaPie);
    }

    // Columnas de cadera tal cual salen en la rejilla (fila 17: cols 4-10).
    dibujarUnaPierna(5, C.dinoCuerpoSombra, desfaseTrasera);
    dibujarUnaPierna(9, C.dinoCuerpo, desfaseDelantera);
  }

  // ---------- PLATAFORMA ----------
  function dibujarPlataforma(ctx, plataforma) {
    const { x, y, ancho, grosor } = plataforma;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));

    ctx.fillStyle = C.plataformaCuerpo;
    ctx.fillRect(0, 0, ancho, grosor);
    ctx.fillStyle = C.plataformaLuz;
    ctx.fillRect(0, 0, ancho, 3);
    ctx.fillStyle = C.plataformaSombra;
    ctx.fillRect(0, grosor - 3, ancho, 3);
    ctx.lineWidth = 3;
    ctx.strokeStyle = C.contorno;
    ctx.strokeRect(1.5, 1.5, ancho - 3, grosor - 3);

    // Sombra en el suelo, para que se note la altura
    const distanciaAlSuelo = AJUSTES.alturaSuelo - (y + grosor);
    const alphaSombra = Math.max(0.05, 0.18 - distanciaAlSuelo / 1400);
    ctx.fillStyle = `rgba(14,42,51,${alphaSombra})`;
    ctx.beginPath();
    ctx.ellipse(ancho / 2, distanciaAlSuelo + grosor, ancho * 0.42, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ---------- CAFÉ ----------
  function dibujarCafe(ctx, cafe) {
    const esEspresso = cafe.tipo === 'espresso';
    const t = performance.now();
    const flotacion = Math.sin(t / 220 + cafe.x * 0.05) * 4;
    const cx = cafe.x;
    const cy = cafe.y + flotacion;

    ctx.save();
    ctx.translate(cx, cy);

    // Halo (el del espresso es más grande e intenso: se nota que es especial)
    const pulso = 2 + Math.sin(t / 260) * 1.5;
    const radioHalo = esEspresso ? 24 + pulso * 1.4 : 18 + pulso;
    const halo = ctx.createRadialGradient(0, 0, 4, 0, 0, radioHalo);
    halo.addColorStop(0, esEspresso ? C.cafeEspressoHalo : C.cafeHalo);
    halo.addColorStop(1, 'rgba(255,107,74,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, radioHalo, 0, Math.PI * 2);
    ctx.fill();

    // Platillo
    ctx.beginPath();
    ctx.ellipse(0, 9, 11, 3.2, 0, 0, Math.PI * 2);
    ctx.fillStyle = C.cafePlatillo;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = C.cafePlatilloBorde;
    ctx.stroke();

    // Taza
    ctx.beginPath();
    ctx.moveTo(-8, -4);
    ctx.lineTo(8, -4);
    ctx.lineTo(6, 6);
    ctx.quadraticCurveTo(0, 10, -6, 6);
    ctx.closePath();
    ctx.fillStyle = C.cafeTaza;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = C.contorno;
    ctx.stroke();

    // Franja de color
    ctx.beginPath();
    ctx.rect(-8, 0, 16, 2.5);
    ctx.clip();
    ctx.fillStyle = C.cafeFranja;
    ctx.fillRect(-8, 0, 16, 2.5);
    ctx.restore();
    ctx.save();
    ctx.translate(cx, cy);

    // Café (líquido)
    ctx.beginPath();
    ctx.ellipse(0, -4, 7, 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = C.cafeLiquido;
    ctx.fill();

    // Asa
    ctx.beginPath();
    ctx.arc(9, 1, 4, -1.2, 1.2);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = C.cafeTaza;
    ctx.stroke();

    // Rayo del espresso doble: lo distingue de un vistazo del café normal
    if (esEspresso) {
      const escala = 1 + Math.sin(t / 150) * 0.12;
      ctx.save();
      ctx.translate(0, -16);
      ctx.scale(escala, escala);
      ctx.beginPath();
      ctx.moveTo(1, -8); ctx.lineTo(-4, 1); ctx.lineTo(0, 1);
      ctx.lineTo(-1, 8); ctx.lineTo(4, -1); ctx.lineTo(0, -1);
      ctx.closePath();
      ctx.fillStyle = C.cafeEspressoRayo;
      ctx.fill();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = C.contorno;
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  // ---------- OBSTÁCULOS ----------
  function dibujarObstaculo(ctx, obs) {
    const { x, y, ancho, alto, tipo } = obs;
    ctx.save();
    ctx.translate(x, y);

    if (tipo === 'despertador') {
      ctx.fillStyle = C.despertadorPrincipal;
      ctx.beginPath(); ctx.arc(ancho * 0.2, 4, 6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(ancho * 0.8, 4, 6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      ctx.arc(ancho / 2, alto * 0.55, alto * 0.42, 0, Math.PI * 2);
      ctx.fillStyle = C.despertadorPrincipal;
      ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = C.contorno; ctx.stroke();
      ctx.beginPath();
      ctx.arc(ancho / 2, alto * 0.55, alto * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = C.despertadorEsfera;
      ctx.fill();
      ctx.lineWidth = 2; ctx.stroke();
      // agujas
      ctx.strokeStyle = C.contorno; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(ancho / 2, alto * 0.55); ctx.lineTo(ancho / 2, alto * 0.55 - 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ancho / 2, alto * 0.55); ctx.lineTo(ancho / 2 + 6, alto * 0.55 - 3); ctx.stroke();

    } else if (tipo === 'monstruo') {
      trazarForma(ctx, () => rectRedondeado(ctx, 0, alto * 0.18, ancho, alto * 0.82, ancho * 0.4), C.monstruoCuerpo);
      ctx.beginPath();
      ctx.ellipse(ancho / 2, alto * 0.5, ancho * 0.32, alto * 0.26, 0, 0, Math.PI * 2);
      ctx.fillStyle = C.monstruoCareto;
      ctx.fill();
      // ojos entrecerrados
      ctx.strokeStyle = C.monstruoOjeras; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(ancho * 0.32, alto * 0.46); ctx.lineTo(ancho * 0.42, alto * 0.46); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ancho * 0.58, alto * 0.46); ctx.lineTo(ancho * 0.68, alto * 0.46); ctx.stroke();
      // Zzz
      ctx.fillStyle = C.monstruoZzz;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('z', ancho * 0.75, alto * 0.05);

    } else if (tipo === 'pizza') {
      // Apoyada en el suelo por la corteza, con la punta hacia arriba.
      const grad = ctx.createLinearGradient(0, alto, 0, 0);
      grad.addColorStop(0, C.pizzaClaro);
      grad.addColorStop(1, C.pizzaOscuro);
      ctx.beginPath();
      ctx.moveTo(ancho * 0.08, alto - 4);
      ctx.lineTo(ancho * 0.92, alto - 4);
      ctx.lineTo(ancho * 0.5, 0);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = C.contorno; ctx.stroke();
      ctx.fillStyle = C.pizzaCorteza;
      rectRedondeado(ctx, 0, alto - 8, ancho, 8, 4); ctx.fill();
      ctx.fillStyle = C.pizzaPepperoni;
      [[0.32, 0.65], [0.62, 0.6], [0.48, 0.4]].forEach(([px, py]) => {
        ctx.beginPath(); ctx.arc(ancho * px, alto * py, 4.2, 0, Math.PI * 2); ctx.fill();
      });

    } else if (tipo === 'bandeja') {
      // Sobre único estilo Gmail (icono que pasó la clienta), con su
      // pliegue en V, los dos pliegues laterales y el badge rojo.
      trazarForma(ctx, () => rectRedondeado(ctx, ancho * 0.02, alto * 0.18, ancho * 0.96, alto * 0.72, ancho * 0.14), C.bandejaCuerpo, 2.5);
      ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = C.bandejaPliegue;
      ctx.beginPath();
      ctx.moveTo(ancho * 0.16, alto * 0.32);
      ctx.lineTo(ancho * 0.5, alto * 0.58);
      ctx.lineTo(ancho * 0.84, alto * 0.32);
      ctx.stroke();
      ctx.lineWidth = 2.2; ctx.strokeStyle = C.bandejaPliegueOscuro;
      ctx.beginPath(); ctx.moveTo(ancho * 0.15, alto * 0.74); ctx.lineTo(ancho * 0.4, alto * 0.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ancho * 0.85, alto * 0.74); ctx.lineTo(ancho * 0.6, alto * 0.5); ctx.stroke();
      // Badge de no leídos: puntitos en vez de texto, ilegible a este tamaño
      ctx.beginPath();
      ctx.arc(ancho * 0.76, alto * 0.2, alto * 0.16, 0, Math.PI * 2);
      ctx.fillStyle = C.bandejaBadge;
      ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = '#FFFFFF'; ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
      [-3.2, 0, 3.2].forEach(dx => {
        ctx.beginPath(); ctx.arc(ancho * 0.76 + dx, alto * 0.2, 1.3, 0, Math.PI * 2); ctx.fill();
      });

    } else if (tipo === 'slack') {
      // Notificación de chat que parpadea (urgencia intermitente).
      const encendido = Math.sin(performance.now() / 130) > 0;
      const colorCuerpo = encendido ? C.slackCuerpo : C.slackCuerpoApagado;
      // colita de la burbuja
      ctx.beginPath();
      ctx.moveTo(ancho * 0.1, alto * 0.62);
      ctx.lineTo(ancho * 0.04, alto * 0.92);
      ctx.lineTo(ancho * 0.32, alto * 0.68);
      ctx.closePath();
      ctx.fillStyle = colorCuerpo;
      ctx.fill();
      trazarForma(ctx, () => rectRedondeado(ctx, 0, 0, ancho * 0.92, alto * 0.7, ancho * 0.22), colorCuerpo, 2.5);
      // puntos de "escribiendo..."
      ctx.fillStyle = '#FFFFFF';
      [0.28, 0.46, 0.64].forEach(px => {
        ctx.beginPath(); ctx.arc(ancho * px, alto * 0.35, 2.4, 0, Math.PI * 2); ctx.fill();
      });
      // punto de notificación
      ctx.beginPath();
      ctx.arc(ancho * 0.82, alto * 0.14, alto * 0.15, 0, Math.PI * 2);
      ctx.fillStyle = C.slackNotificacion;
      ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = '#FFFFFF'; ctx.stroke();

    } else if (tipo === 'reunion') {
      // Invitación de calendario que "aparece" con un aviso de urgencia.
      const pulso = 0.85 + Math.sin(performance.now() / 150) * 0.15;
      trazarForma(ctx, () => rectRedondeado(ctx, 0, alto * 0.1, ancho, alto * 0.86, 5), '#FFFFFF', 2.5);
      ctx.fillStyle = C.reunionCabecera;
      rectRedondeado(ctx, 0, alto * 0.1, ancho, alto * 0.24, 5); ctx.fill();
      ctx.fillStyle = C.contorno;
      ctx.beginPath(); ctx.arc(ancho * 0.26, alto * 0.1, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(ancho * 0.74, alto * 0.1, 3, 0, Math.PI * 2); ctx.fill();
      ctx.save();
      ctx.translate(ancho * 0.5, alto * 0.64);
      ctx.scale(pulso, pulso);
      ctx.fillStyle = C.reunionUrgencia;
      rectRedondeado(ctx, -2.5, -12, 5, 15, 2); ctx.fill();
      ctx.beginPath(); ctx.arc(0, 8, 3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

    } else if (tipo === 'cable') {
      // El único obstáculo que NO se salta: cuelga fijo en el aire y hay
      // que pasar por debajo agachado. Rayas de aviso tipo "peligro".
      trazarForma(ctx, () => rectRedondeado(ctx, 0, 0, ancho, alto, alto * 0.4), C.cableCuerpo, 2.5);
      ctx.save();
      rectRedondeado(ctx, 0, 0, ancho, alto, alto * 0.4);
      ctx.clip();
      ctx.fillStyle = C.cableAviso;
      for (let fx = -alto; fx < ancho + alto; fx += alto * 1.4) {
        ctx.save();
        ctx.translate(fx, alto / 2);
        ctx.rotate(0.6);
        ctx.fillRect(-alto * 0.35, -alto * 1.5, alto * 0.7, alto * 3);
        ctx.restore();
      }
      ctx.restore();
      // Soportes en los extremos, como si colgara de algo fuera de pantalla
      ctx.fillStyle = C.contorno;
      ctx.fillRect(ancho * 0.05, -5, 5, alto + 10);
      ctx.fillRect(ancho * 0.95 - 5, -5, 5, alto + 10);
    }

    ctx.restore();
  }

  // ---------- AVISO FLOTANTE (onboarding diegético, una vez en la vida) ----------
  function dibujarAvisoFlotante(ctx, x, y, texto, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '800 14px "Segoe UI", sans-serif';
    const anchoTexto = ctx.measureText(texto).width;
    const padX = 12, padY = 7;
    const cajaAncho = anchoTexto + padX * 2;
    const cajaAlto = 14 + padY * 2;
    dibujarChip(ctx, x - cajaAncho / 2, y - cajaAlto, cajaAncho, cajaAlto);
    ctx.fillStyle = C.dorado;
    ctx.textAlign = 'center';
    ctx.fillText(texto, x, y - padY - 3);
    ctx.textAlign = 'left';
    ctx.restore();
  }

  // ---------- AVISO DE MARCHA ATRÁS ----------
  function dibujarAvisoReversa(ctx) {
    const cx = AJUSTES.anchoLogico / 2;
    const cy = 90;
    const bamboleo = Math.sin(performance.now() / 90) * 4;
    ctx.save();
    ctx.translate(cx + bamboleo, cy);
    ctx.font = '900 26px "Segoe UI", sans-serif';
    const texto = '¡MARCHA ATRÁS!';
    const anchoTexto = ctx.measureText(texto).width;
    dibujarChip(ctx, -anchoTexto / 2 - 18, -24, anchoTexto + 36, 48);
    ctx.textAlign = 'center';
    ctx.fillStyle = C.dorado;
    ctx.strokeStyle = C.contorno;
    ctx.lineWidth = 4;
    ctx.strokeText(texto, 0, 8);
    ctx.fillText(texto, 0, 8);
    ctx.textAlign = 'left';
    ctx.restore();
  }

  // ---------- HUD ----------
  function dibujarChip(ctx, x, y, w, h) {
    rectRedondeado(ctx, x, y, w, h, 10);
    ctx.fillStyle = C.chipFondo;
    ctx.fill();
  }

  function dibujarHUD(ctx, estadoJuego) {
    const { puntuacion, record, energia, energiaMax, cafes, multiplicador } = estadoJuego;

    // --- Barra de energía ---
    dibujarChip(ctx, 12, 10, 210, 40);
    ctx.font = '700 11px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,248,231,0.8)';
    ctx.fillText('ENERGÍA', 22, 24);

    const proporcion = Math.max(0, energia / energiaMax);
    const colorBarra = proporcion > 0.6 ? C.energiaLlena : proporcion > 0.3 ? C.energiaMedia : C.energiaCritica;
    const segmentos = 10;
    const anchoSegmento = 15;
    const separacion = 2;
    for (let i = 0; i < segmentos; i++) {
      const activo = i < Math.round(proporcion * segmentos);
      ctx.fillStyle = activo ? colorBarra : 'rgba(14,42,51,0.5)';
      rectRedondeado(ctx, 22 + i * (anchoSegmento + separacion), 28, anchoSegmento, 14, 3);
      ctx.fill();
    }
    if (proporcion < 0.3) {
      const pulso = Math.floor(performance.now() / 300) % 2 === 0;
      if (pulso) {
        ctx.strokeStyle = C.energiaCritica;
        ctx.lineWidth = 3;
        ctx.strokeRect(14, 12, 206, 36);
      }
    }

    // --- Contador de cafés ---
    dibujarChip(ctx, 12, 56, 90, 30);
    ctx.beginPath();
    ctx.ellipse(30, 71, 7, 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = C.cafePlatillo;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(24, 62); ctx.lineTo(36, 62); ctx.lineTo(34, 70);
    ctx.quadraticCurveTo(30, 73, 26, 70); ctx.closePath();
    ctx.fillStyle = C.cafeTaza;
    ctx.fill();
    ctx.font = '800 15px "Segoe UI", sans-serif';
    ctx.fillStyle = C.textoPrincipal;
    ctx.fillText('× ' + String(cafes ?? 0), 46, 76);

    // --- Multiplicador de racha (solo visible si es mayor que ×1) ---
    if (multiplicador > 1) {
      const pulso = 1 + Math.sin(performance.now() / 140) * 0.06;
      ctx.save();
      ctx.translate(108, 71);
      ctx.scale(pulso, pulso);
      ctx.font = '900 16px "Segoe UI", sans-serif';
      ctx.fillStyle = C.dorado;
      ctx.fillText('×' + multiplicador, 0, 5);
      ctx.restore();
    }

    // --- Puntuación y récord ---
    ctx.textAlign = 'right';
    ctx.font = '900 26px "Segoe UI", sans-serif';
    ctx.fillStyle = C.textoPrincipal;
    ctx.fillText(String(Math.floor(puntuacion)).padStart(5, '0'), AJUSTES.anchoLogico - 16, 34);

    ctx.font = '700 13px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,248,231,0.75)';
    ctx.fillText('REC ' + String(Math.floor(record)).padStart(5, '0'), AJUSTES.anchoLogico - 16, 52);
    ctx.textAlign = 'left';
  }

  return { dibujarFondo, dibujarDino, dibujarObstaculo, dibujarPlataforma, dibujarCafe, dibujarHUD, dibujarAvisoFlotante, dibujarAvisoReversa };
})();
