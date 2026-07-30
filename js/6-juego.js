// ============================================================
// 6-JUEGO.JS
// El "cerebro" del juego: el bucle principal, la física, las
// colisiones, la energía y la puntuación. Aquí es donde vive el
// estado que cambia fotograma a fotograma.
// ============================================================

(function () {
  const lienzo = document.getElementById('lienzo');
  const ctx = lienzo.getContext('2d');
  ctx.imageSmoothingEnabled = false; // el dino es pixel art: nada de difuminar sus bordes

  const pantallaPortada = document.getElementById('pantalla-portada');
  const pantallaPausa = document.getElementById('pantalla-pausa');
  const pantallaFin = document.getElementById('pantalla-fin');
  const botonSilencio = document.getElementById('boton-silencio');

  let estado = 'portada'; // "portada" | "jugando" | "pausa" | "fin"

  const dino = {
    x: AJUSTES.dino.x,
    y: 0,
    ancho: AJUSTES.dino.ancho,
    alto: AJUSTES.dino.alto,
    velocidadY: 0,
    enSuelo: true,
    saltosUsados: 0,
    coyoteRestanteMs: 0,
    bufferSaltoMs: 0,
    invulnerableHasta: 0,
    distanciaRecorrida: 0,
  };

  let velocidadMundo = AJUSTES.mundo.velocidadInicial;
  let distanciaMundo = 0;
  let tiempoDePartida = 0;
  let puntuacion = 0;
  let energia = AJUSTES.energia.maxima;
  let cafesRecogidos = 0;
  let record = Records.mejorPropio();

  function reiniciarPartida() {
    dino.y = AJUSTES.alturaSuelo - dino.alto;
    dino.velocidadY = 0;
    dino.enSuelo = true;
    dino.saltosUsados = 0;
    dino.coyoteRestanteMs = 0;
    dino.bufferSaltoMs = 0;
    dino.invulnerableHasta = 0;
    dino.distanciaRecorrida = 0;

    velocidadMundo = AJUSTES.mundo.velocidadInicial;
    distanciaMundo = 0;
    tiempoDePartida = 0;
    puntuacion = 0;
    energia = AJUSTES.energia.maxima;
    cafesRecogidos = 0;
    Mundo.reiniciar();
  }

  function cambiarEstado(nuevo) {
    estado = nuevo;
    pantallaPortada.classList.toggle('oculto', nuevo !== 'portada');
    pantallaPausa.classList.toggle('oculto', nuevo !== 'pausa');
    pantallaFin.classList.toggle('oculto', nuevo !== 'fin');
  }

  function desgastePorSegundoActual() {
    const { desgastePorSegundoInicial, desgastePorSegundoFinal, tiempoParaDesgasteFinal } = AJUSTES.energia;
    const t = Math.min(tiempoDePartida / tiempoParaDesgasteFinal, 1);
    return desgastePorSegundoInicial + (desgastePorSegundoFinal - desgastePorSegundoInicial) * t;
  }

  function seTocan(a, b) {
    return a.x < b.x + b.ancho && a.x + a.ancho > b.x &&
           a.y < b.y + b.alto && a.y + a.alto > b.y;
  }

  function cajaColisionDino() {
    const m = AJUSTES.dino;
    return {
      x: dino.x + m.margenHitboxLados,
      y: dino.y + m.margenHitboxArriba,
      ancho: dino.ancho - m.margenHitboxLados * 2,
      alto: dino.alto - m.margenHitboxArriba - m.margenHitboxAbajo,
    };
  }

  function moverDino(paso) {
    const m = AJUSTES.dino;
    const enSubida = dino.velocidadY < 0;
    const gravedad = enSubida ? m.gravedadSubiendo : m.gravedadBajando;

    const pieAntes = dino.y + dino.alto;

    dino.velocidadY += gravedad * paso;
    if (dino.velocidadY > m.velocidadCaidaMaxima) dino.velocidadY = m.velocidadCaidaMaxima;
    dino.y += dino.velocidadY * paso;

    const pieDespues = dino.y + dino.alto;
    let aterrizo = false;

    if (dino.velocidadY >= 0) {
      // Plataformas: colisión SOLO por arriba (se atraviesan desde abajo
      // y por los lados). Se detecta el CRUCE del plano, no el solape,
      // para que no haya "tunneling" aunque el dino caiga muy rápido.
      for (const p of Mundo.obtenerPlataformas()) {
        const hayCruceHorizontal = dino.x + dino.ancho > p.x && dino.x < p.x + p.ancho;
        const cruzoLaSuperficie = pieAntes <= p.y && pieDespues >= p.y;
        if (hayCruceHorizontal && cruzoLaSuperficie) {
          dino.y = p.y - dino.alto;
          dino.velocidadY = 0;
          aterrizo = true;
          break;
        }
      }
      if (!aterrizo && pieDespues >= AJUSTES.alturaSuelo) {
        dino.y = AJUSTES.alturaSuelo - dino.alto;
        dino.velocidadY = 0;
        aterrizo = true;
      }
    }

    if (aterrizo) {
      if (!dino.enSuelo) {
        dino.enSuelo = true;
        dino.saltosUsados = 0;
        dino.coyoteRestanteMs = m.coyoteTimeMs;
      }
    } else {
      if (dino.enSuelo) dino.coyoteRestanteMs = m.coyoteTimeMs;
      dino.enSuelo = false;
    }
  }

  function recogerCafes() {
    const cajaDino = cajaColisionDino();
    for (const cafe of Mundo.obtenerCafes()) {
      if (cafe.recogido) continue;
      const cajaCafe = {
        x: cafe.x - cafe.radio, y: cafe.y - cafe.radio,
        ancho: cafe.radio * 2, alto: cafe.radio * 2,
      };
      if (seTocan(cajaDino, cajaCafe)) {
        cafe.recogido = true;
        cafesRecogidos += 1;
        energia = Math.min(AJUSTES.energia.maxima, energia + AJUSTES.cafe.energiaQueDa);
        puntuacion += AJUSTES.cafe.puntosQueDa;
        Sonido.cafe();
      }
    }
  }

  function gestionarSalto(pasoMs) {
    const m = AJUSTES.dino;

    if (dino.enSuelo) dino.coyoteRestanteMs = m.coyoteTimeMs;
    else if (dino.coyoteRestanteMs > 0) dino.coyoteRestanteMs -= pasoMs;

    if (dino.bufferSaltoMs > 0) dino.bufferSaltoMs -= pasoMs;

    if (entrada.saltarPulsadoEsteFrame) {
      dino.bufferSaltoMs = m.bufferSaltoMs;
      // Se "consume" aquí mismo: actualizar() puede llamar a gestionarSalto()
      // más de una vez en el mismo fotograma (varios subpasos de física).
      // Si no lo apagáramos, esa misma pulsación se vería otra vez en el
      // segundo subpaso y se gastaría YA el salto doble sin que lo hayas
      // pulsado — justo el motivo de que el doble salto real no sirviera
      // luego para nada.
      entrada.saltarPulsadoEsteFrame = false;
    }

    if (dino.bufferSaltoMs > 0) {
      const puedeSaltoDeSuelo = dino.enSuelo || dino.coyoteRestanteMs > 0;
      if (puedeSaltoDeSuelo && dino.saltosUsados === 0) {
        dino.velocidadY = m.impulsoSaltoSimple;
        dino.enSuelo = false;
        dino.coyoteRestanteMs = 0;
        dino.saltosUsados = 1;
        dino.bufferSaltoMs = 0;
        Sonido.saltar();
      } else if (!dino.enSuelo && dino.saltosUsados === 1) {
        // Math.min (no asignación directa): si el primer salto todavía
        // sube más rápido que el impulso del doble, no lo frenamos. Si
        // ya se ha frenado (o está cayendo), el doble sí da un empujón
        // extra de verdad. Así pulsar rápido nunca deja el salto doble
        // más corto que uno simple.
        dino.velocidadY = Math.min(dino.velocidadY, m.impulsoSaltoDoble);
        dino.saltosUsados = 2;
        dino.bufferSaltoMs = 0;
        Sonido.saltoDoble();
      }
    }
  }

  function actualizarEnergia(paso) {
    energia -= desgastePorSegundoActual() * paso;
    const critica = energia <= 0.3 * AJUSTES.energia.maxima;
    if (critica && Math.random() < paso * 0.6) Sonido.energiaCritica();

    if (energia <= 0) {
      energia = 0;
      terminarPartida();
    }
  }

  function comprobarColisiones() {
    if (performance.now() < dino.invulnerableHasta) return;
    const cajaDino = cajaColisionDino();
    for (const obs of Mundo.obtenerObstaculos()) {
      const margen = 4;
      const cajaObs = {
        x: obs.x + margen, y: obs.y + margen,
        ancho: obs.ancho - margen * 2, alto: obs.alto - margen * 2,
      };
      if (seTocan(cajaDino, cajaObs)) {
        recibirChoque();
        break;
      }
    }
  }

  function recibirChoque() {
    energia -= AJUSTES.energia.danoPorChoque;
    dino.invulnerableHasta = performance.now() + AJUSTES.dino.invulnerabilidadMs;
    Sonido.choque();
    sacudirPantalla();
    if (energia <= 0) {
      energia = 0;
      terminarPartida();
    }
  }

  // --- Sacudida de pantalla ---
  let sacudidaHasta = 0;
  function sacudirPantalla() { sacudidaHasta = performance.now() + 220; }
  function offsetSacudida() {
    const restante = sacudidaHasta - performance.now();
    if (restante <= 0) return { x: 0, y: 0 };
    const intensidad = (restante / 220) * 6;
    return { x: (Math.random() - 0.5) * intensidad, y: (Math.random() - 0.5) * intensidad };
  }

  function terminarPartida() {
    // Cambio de estado SÍNCRONO e inmediato: si esto fuera async con un
    // `await` antes de cambiar `estado`, el bucle de física podría llamar
    // a esta función varias veces en el mismo fotograma (mientras la
    // energía sigue en 0 o menos) antes de que el estado se actualizara,
    // duplicando el sonido de fin de partida y el guardado del récord.
    if (estado !== 'jugando') return;
    cambiarEstado('fin');
    Sonido.finDePartida();
    const partida = {
      puntos: puntuacion,
      cafes: cafesRecogidos,
      segundos: tiempoDePartida,
    };
    Records.guardarPuntuacion(partida).then(() => {
      record = Records.mejorPropio();
      document.getElementById('fin-puntuacion').textContent = Math.floor(puntuacion);
      document.getElementById('fin-record').textContent = Math.floor(record);
    });
  }

  function actualizar(dt) {
    const PASO_MAXIMO = 1 / 120;
    let restante = dt;
    while (restante > 0) {
      const paso = Math.min(restante, PASO_MAXIMO);

      gestionarSalto(paso * 1000);
      moverDino(paso);

      velocidadMundo = Math.min(
        AJUSTES.mundo.velocidadMaxima,
        velocidadMundo + AJUSTES.mundo.aceleracionPorSegundo * paso
      );
      distanciaMundo += velocidadMundo * paso;
      dino.distanciaRecorrida += velocidadMundo * paso;

      Mundo.actualizar(paso, velocidadMundo);
      recogerCafes();
      actualizarEnergia(paso);

      puntuacion += velocidadMundo * paso * AJUSTES.puntuacion.puntosPorPixel;
      tiempoDePartida += paso;

      restante -= paso;
      if (estado !== 'jugando') break; // por si terminarPartida() cambió el estado a mitad de subpaso
    }
    if (estado === 'jugando') comprobarColisiones();
  }

  function dibujar() {
    ctx.clearRect(0, 0, AJUSTES.anchoLogico, AJUSTES.altoLogico);
    const off = offsetSacudida();
    ctx.save();
    ctx.translate(off.x, off.y);

    Dibujo.dibujarFondo(ctx, distanciaMundo);

    for (const p of Mundo.obtenerPlataformas()) {
      Dibujo.dibujarPlataforma(ctx, p);
    }
    for (const obs of Mundo.obtenerObstaculos()) {
      Dibujo.dibujarObstaculo(ctx, obs);
    }
    for (const cafe of Mundo.obtenerCafes()) {
      if (!cafe.recogido) Dibujo.dibujarCafe(ctx, cafe);
    }

    Dibujo.dibujarDino(ctx, {
      x: dino.x, y: dino.y, ancho: dino.ancho, alto: dino.alto,
      enAire: !dino.enSuelo,
      cayendo: dino.velocidadY > 0,
      invulnerable: performance.now() < dino.invulnerableHasta,
      distanciaRecorrida: dino.distanciaRecorrida,
    });

    ctx.restore(); // el HUD no debe temblar con la sacudida

    Dibujo.dibujarHUD(ctx, { puntuacion, record, energia, energiaMax: AJUSTES.energia.maxima, cafes: cafesRecogidos });
  }

  // ---------- Bucle principal ----------
  let tiempoAnterior = 0;

  function bucle(ahora) {
    requestAnimationFrame(bucle);
    let dt = (ahora - tiempoAnterior) / 1000;
    tiempoAnterior = ahora;
    if (!isFinite(dt) || dt < 0) dt = 0;
    if (dt > 0.05) dt = 0.05;

    if (entrada.silencioPulsado) {
      const silenciado = Sonido.alternarSilencio();
      botonSilencio.textContent = silenciado ? '🔇' : '🔊';
    }

    if (estado === 'jugando') {
      if (entrada.pausaPulsada) {
        cambiarEstado('pausa');
      } else {
        actualizar(dt);
      }
    } else if (estado === 'pausa') {
      if (entrada.pausaPulsada) cambiarEstado('jugando');
    } else if (estado === 'portada') {
      if (entrada.saltarPulsadoEsteFrame || entrada.reiniciarPulsado) {
        reiniciarPartida();
        cambiarEstado('jugando');
      }
    } else if (estado === 'fin') {
      if (entrada.saltarPulsadoEsteFrame || entrada.reiniciarPulsado) {
        reiniciarPartida();
        cambiarEstado('jugando');
      }
    }

    dibujar();
    limpiarEntradasDeUnFrame();
  }

  // Pausa automática si se cambia de pestaña o se pierde el foco
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && estado === 'jugando') cambiarEstado('pausa');
  });
  window.addEventListener('blur', () => {
    if (estado === 'jugando') cambiarEstado('pausa');
  });

  botonSilencio.textContent = Sonido.estaSilenciado() ? '🔇' : '🔊';
  document.getElementById('record-portada').textContent = Math.floor(record);

  reiniciarPartida();
  requestAnimationFrame((t) => { tiempoAnterior = t; requestAnimationFrame(bucle); });
})();
