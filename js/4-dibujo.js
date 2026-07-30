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

  // ---------- FONDO CON PROFUNDIDAD (parallax) ----------
  function dibujarFondo(ctx, distanciaMundo) {
    const ancho = AJUSTES.anchoLogico;
    const alto = AJUSTES.altoLogico;
    const suelo = AJUSTES.alturaSuelo;

    // Cielo
    const gradienteCielo = ctx.createLinearGradient(0, 0, 0, suelo * 0.6);
    gradienteCielo.addColorStop(0, C.cieloArriba);
    gradienteCielo.addColorStop(1, C.cieloAbajo);
    ctx.fillStyle = gradienteCielo;
    ctx.fillRect(0, 0, ancho, alto);

    // Sol
    ctx.fillStyle = C.sol;
    ctx.beginPath();
    ctx.arc(120, 70, 34, 0, Math.PI * 2);
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

    // Sombra de contacto
    if (!estado.enAire) {
      ctx.fillStyle = 'rgba(14,42,51,0.22)';
      ctx.beginPath();
      ctx.ellipse(ancho * 0.4, alto + 4, ancho * 0.42, 5, 0, 0, Math.PI * 2);
      ctx.fill();
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

    // Polvo al correr (fuera del translate, en coordenadas de mundo)
    if (!estado.enAire && cicloPasos === 0) {
      ctx.fillStyle = 'rgba(233,207,168,0.5)';
      ctx.beginPath();
      ctx.arc(x - 4, y + alto - 2, 4, 0, Math.PI * 2);
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
    const t = performance.now();
    const flotacion = Math.sin(t / 220 + cafe.x * 0.05) * 4;
    const cx = cafe.x;
    const cy = cafe.y + flotacion;

    ctx.save();
    ctx.translate(cx, cy);

    // Halo
    const pulso = 2 + Math.sin(t / 260) * 1.5;
    const halo = ctx.createRadialGradient(0, 0, 4, 0, 0, 16 + pulso);
    halo.addColorStop(0, C.cafeHalo);
    halo.addColorStop(1, 'rgba(255,213,79,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, 18 + pulso, 0, Math.PI * 2);
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
      trazarForma(ctx, () => rectRedondeado(ctx, 0, alto * 0.45, ancho, alto * 0.55, 3), C.bandejaCuerpo);
      for (let i = 0; i < 4; i++) {
        ctx.save();
        ctx.translate(ancho * 0.5, alto * 0.4 - i * 7);
        ctx.rotate((i % 2 === 0 ? -1 : 1) * 0.12);
        ctx.fillStyle = C.bandejaSobres;
        rectRedondeado(ctx, -ancho * 0.36, -4, ancho * 0.72, 8, 2);
        ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = C.contorno; ctx.stroke();
        ctx.restore();
      }
      ctx.beginPath();
      ctx.arc(ancho * 0.88, alto * 0.15, 8, 0, Math.PI * 2);
      ctx.fillStyle = C.bandejaBadge;
      ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = C.contorno; ctx.stroke();
    }

    ctx.restore();
  }

  // ---------- HUD ----------
  function dibujarChip(ctx, x, y, w, h) {
    rectRedondeado(ctx, x, y, w, h, 10);
    ctx.fillStyle = C.chipFondo;
    ctx.fill();
  }

  function dibujarHUD(ctx, estadoJuego) {
    const { puntuacion, record, energia, energiaMax, cafes } = estadoJuego;

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

  return { dibujarFondo, dibujarDino, dibujarObstaculo, dibujarPlataforma, dibujarCafe, dibujarHUD };
})();
