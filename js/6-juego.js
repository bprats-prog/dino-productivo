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
    agachado: false,
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
  let rachaCafes = 0;
  let choquesEnPartida = 0;
  let usoSaltoDobleAlgunaVez = false;
  let record = Records.mejorPropio();

  // --- "Marcha atrás": el mundo retrocede unos segundos de vez en cuando ---
  let enReversa = false;
  let reversaHasta = 0;
  let velocidadGuardadaAntesDeReversa = 0;
  let proximaReversaEnSegundos = AJUSTES.mundo.reversaPrimeraEnSegundos;

  function multiplicadorRacha() {
    const c = AJUSTES.cafe;
    if (rachaCafes >= c.umbralRacha3) return 3;
    if (rachaCafes >= c.umbralRacha2) return 2;
    return 1;
  }

  function reiniciarPartida() {
    dino.y = AJUSTES.alturaSuelo - dino.alto;
    dino.velocidadY = 0;
    dino.enSuelo = true;
    dino.agachado = false;
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
    rachaCafes = 0;
    choquesEnPartida = 0;
    usoSaltoDobleAlgunaVez = false;
    enReversa = false;
    reversaHasta = 0;
    proximaReversaEnSegundos = AJUSTES.mundo.reversaPrimeraEnSegundos;
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
    if (dino.agachado) {
      // Se agacha "desde los pies": dino.y no cambia (los pies se quedan
      // donde estaban), solo baja el techo de la caja de colisión.
      const pies = dino.y + dino.alto;
      return {
        x: dino.x + m.margenHitboxLados,
        y: pies - m.altoAgachado + m.margenHitboxArribaAgachado,
        ancho: dino.ancho - m.margenHitboxLados * 2,
        alto: m.altoAgachado - m.margenHitboxArribaAgachado - m.margenHitboxAbajo,
      };
    }
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

  function recogerCafes(paso) {
    const c = AJUSTES.cafe;
    const cajaDino = cajaColisionDino();
    const centroDinoX = cajaDino.x + cajaDino.ancho / 2;
    const centroDinoY = cajaDino.y + cajaDino.alto / 2;

    for (const cafe of Mundo.obtenerCafes()) {
      if (cafe.recogido) continue;

      // Imán suave: dentro del radio de atracción, el café se deja llevar
      // hacia el dino en vez de exigir un toque exacto.
      const dx = centroDinoX - cafe.x;
      const dy = centroDinoY - cafe.y;
      const distancia = Math.hypot(dx, dy);
      if (distancia > 0.01 && distancia < c.radioAtraccion) {
        const avance = Math.min(c.velocidadAtraccion * paso, distancia);
        cafe.x += (dx / distancia) * avance;
        cafe.y += (dy / distancia) * avance;
      }

      const cajaCafe = {
        x: cafe.x - cafe.radio, y: cafe.y - cafe.radio,
        ancho: cafe.radio * 2, alto: cafe.radio * 2,
      };
      if (seTocan(cajaDino, cajaCafe)) {
        cafe.recogido = true;
        cafesRecogidos += 1;
        rachaCafes += 1;
        puntuacion += c.puntosQueDa * multiplicadorRacha() * (cafe.tipo === 'espresso' ? 2 : 1);
        if (cafe.tipo === 'espresso') {
          // Espresso doble: energía al máximo + unos segundos de invulnerabilidad.
          energia = AJUSTES.energia.maxima;
          dino.invulnerableHasta = Math.max(dino.invulnerableHasta, performance.now() + c.invulnerabilidadEspressoMs);
          Sonido.espresso();
        } else {
          energia = Math.min(AJUSTES.energia.maxima, energia + c.energiaQueDa);
          Sonido.cafe(rachaCafes);
        }
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
        usoSaltoDobleAlgunaVez = true;
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
    choquesEnPartida += 1;
    rachaCafes = 0;
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
    document.getElementById('fin-consejo').textContent = consejoParaEstaPartida();
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

  // Un consejo distinto según cómo haya ido la partida — el primero que
  // aplique, de más a menos importante para sobrevivir más la próxima vez.
  function consejoParaEstaPartida() {
    if (!usoSaltoDobleAlgunaVez) {
      return 'Prueba a pulsar otra vez en el aire: subes mucho más alto y llegas a los cafés de las plataformas.';
    }
    if (choquesEnPartida >= 3) {
      return 'Cada choque te cuesta como 1,5 cafés de energía. Esquivar sale más barato que aguantar.';
    }
    if (cafesRecogidos < 8) {
      return 'Sube a las plataformas: ahí arriba está casi todo el café.';
    }
    return 'Encadena cafés sin chocar: a partir de 10 seguidos doblas los puntos, y a partir de 25 los triplicas.';
  }

  // Decide si toca empezar o terminar una "marcha atrás", y devuelve la
  // velocidad del mundo para este subpaso (negativa mientras dura).
  function gestionarReversa(paso) {
    const g = AJUSTES.mundo;

    if (!enReversa && tiempoDePartida >= proximaReversaEnSegundos) {
      enReversa = true;
      velocidadGuardadaAntesDeReversa = velocidadMundo;
      reversaHasta = tiempoDePartida + g.reversaDuracionSegundos;
      Sonido.reversa();
    } else if (enReversa && tiempoDePartida >= reversaHasta) {
      enReversa = false;
      velocidadMundo = velocidadGuardadaAntesDeReversa; // se reanuda donde iba, sin castigo
      proximaReversaEnSegundos = tiempoDePartida +
        g.reversaSeparacionMinimaSegundos + Math.random() * (g.reversaSeparacionMaximaSegundos - g.reversaSeparacionMinimaSegundos);
    }

    if (enReversa) {
      velocidadMundo = -velocidadGuardadaAntesDeReversa * g.reversaFactorVelocidad;
    } else {
      velocidadMundo = Math.min(g.velocidadMaxima, velocidadMundo + g.aceleracionPorSegundo * paso);
    }
  }

  function actualizar(dt) {
    const PASO_MAXIMO = 1 / 120;
    let restante = dt;
    while (restante > 0) {
      const paso = Math.min(restante, PASO_MAXIMO);

      gestionarSalto(paso * 1000);
      moverDino(paso);
      // Solo se puede agachar en el suelo; en el aire no tiene sentido.
      dino.agachado = dino.enSuelo && entrada.agacharMantenido;

      gestionarReversa(paso);
      distanciaMundo += velocidadMundo * paso;
      dino.distanciaRecorrida += velocidadMundo * paso;

      Mundo.actualizar(paso, velocidadMundo);
      recogerCafes(paso);
      actualizarEnergia(paso);

      // Durante la marcha atrás (velocidad negativa) no se restan puntos.
      puntuacion += Math.max(0, velocidadMundo) * paso * AJUSTES.puntuacion.puntosPorPixel;
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

    Dibujo.dibujarFondo(ctx, distanciaMundo, tiempoDePartida / AJUSTES.dia.duracionSegundos);

    // Aviso flotante genérico "una sola vez en la vida": lo llevan tanto
    // la primera plataforma como el primer cable colgante que aparezcan.
    function dibujarAvisoSiToca(objeto, x, y, texto) {
      if (!objeto.avisoInicial) return;
      const transcurrido = performance.now() - objeto.creadaEnMs;
      let alpha = 0;
      if (transcurrido < 250) alpha = transcurrido / 250;
      else if (transcurrido < 2200) alpha = 1;
      else if (transcurrido < 2500) alpha = 1 - (transcurrido - 2200) / 300;
      Dibujo.dibujarAvisoFlotante(ctx, x, y, texto, alpha);
    }

    for (const p of Mundo.obtenerPlataformas()) {
      Dibujo.dibujarPlataforma(ctx, p);
      dibujarAvisoSiToca(p, p.x + p.ancho / 2, p.y - 14, '¡Doble salto para subir!');
    }
    for (const obs of Mundo.obtenerObstaculos()) {
      Dibujo.dibujarObstaculo(ctx, obs);
      dibujarAvisoSiToca(obs, obs.x + obs.ancho / 2, obs.y - 6, '¡Flecha abajo para agacharte!');
    }
    for (const cafe of Mundo.obtenerCafes()) {
      if (!cafe.recogido) Dibujo.dibujarCafe(ctx, cafe);
    }

    Dibujo.dibujarDino(ctx, {
      x: dino.x, y: dino.y, ancho: dino.ancho, alto: dino.alto,
      enAire: !dino.enSuelo,
      agachado: dino.agachado,
      mirandoAtras: enReversa,
      cayendo: dino.velocidadY > 0,
      invulnerable: performance.now() < dino.invulnerableHasta,
      distanciaRecorrida: dino.distanciaRecorrida,
    });

    if (enReversa) Dibujo.dibujarAvisoReversa(ctx);

    ctx.restore(); // el HUD no debe temblar con la sacudida

    Dibujo.dibujarHUD(ctx, {
      puntuacion, record, energia, energiaMax: AJUSTES.energia.maxima,
      cafes: cafesRecogidos, multiplicador: multiplicadorRacha(),
    });
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
      // Espacio también reanuda: si el juego se pausó solo (p. ej. al
      // cambiar de ventana) es lo primero que se pulsa sin pensar, y
      // antes no hacía nada — parecía que "no saltaba".
      if (entrada.pausaPulsada || entrada.saltarPulsadoEsteFrame) cambiarEstado('jugando');
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
