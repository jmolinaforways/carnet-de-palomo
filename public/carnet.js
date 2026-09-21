/* =========================================================================
   Carnet de Palomo — renderizador del carnet.

   No lleva símbolos patrios: ni el Escudo ni la Bandera Nacional. El
   emblema del «Ministerio de Palomos» es el palomo, dibujado aquí mismo.
   El porqué está explicado más abajo, junto a loadAssets().

   Medidas lógicas: 1012 x 638 (proporción ID-1, la de una cédula).
   ========================================================================= */
(function (global) {
  'use strict';

  var W = 1012, H = 638;

  var SITIO = 'palomos.com.do';

  /* ---------- los estilos entre los que se elige ----------

     Cada uno es una paleta más un puñado de decisiones: si la cabecera es
     una línea fina o una banda con el título en grande, y qué institución
     lo emite. El dibujo es el mismo para todos.
     ------------------------------------------------------------------- */

  var ESTILOS = {
    oficial: {
      nombre: 'Oficial', familia: 'carnet', formato: 'credencial',
      cabecera: 'linea',
      bandaTinta: '#ffffff',
      bg1: '#fbfdff', bg2: '#e6eef7',
      navy: '#13294b', navy2: '#31507f',
      label: '#6b7c93', red: '#c8102e',
      line: 'rgba(19,41,75,.16)',
      guilloche: '#b9cde2', guillocheAlfa: 0.45,
      marcaAgua: 0.045,
      pie: 'rgba(255,255,255,.86)', pieTinta: 'rgba(19,41,75,.85)',
      suave: 'rgba(19,41,75,.25)', tenue: 'rgba(19,41,75,.12)'
    },

    institucional: {
      nombre: 'Institucional', familia: 'carnet', formato: 'credencial',
      cabecera: 'banda',
      banda: '#13294b',
      bandaTinta: '#ffffff',
      bg1: '#ffffff', bg2: '#e9eef5',
      navy: '#13294b', navy2: '#31507f',
      label: '#6b7c93', red: '#c8102e',
      line: 'rgba(19,41,75,.16)',
      guilloche: '#c3d2e2', guillocheAlfa: 0.4,
      marcaAgua: 0.05,
      pie: 'rgba(255,255,255,.86)', pieTinta: 'rgba(19,41,75,.85)',
      suave: 'rgba(19,41,75,.25)', tenue: 'rgba(19,41,75,.12)'
    },

    crema: {
      nombre: 'Crema', familia: 'carnet', formato: 'credencial',
      cabecera: 'banda',
      banda: '#a4122a',
      bandaTinta: '#fff6ec',
      bg1: '#fdfaf2', bg2: '#f0e6d2',
      navy: '#3a2416', navy2: '#7a4a2c',
      label: '#8a7157', red: '#a4122a',
      line: 'rgba(19,41,75,.16)',
      guilloche: '#d9c7a5', guillocheAlfa: 0.55,
      bandera: false,
      marcaAgua: 0.05,
      pie: 'rgba(255,255,255,.86)', pieTinta: 'rgba(19,41,75,.85)',
      suave: 'rgba(19,41,75,.25)', tenue: 'rgba(19,41,75,.12)'
    },

    carbon: {
      nombre: 'Carbón', familia: 'carnet', formato: 'credencial',
      cabecera: 'banda',
      banda: '#1a1d22',
      bandaTinta: '#f2f4f7',
      bg1: '#2a2f36', bg2: '#15181d',
      navy: '#f2f4f7', navy2: '#9aa7b8',
      label: '#8d97a5', red: '#ff5f74',
      line: 'rgba(255,255,255,.16)',
      guilloche: '#3c434d', guillocheAlfa: 0.5,
      bandera: false,
      marcaAgua: 0.07,
      pie: 'rgba(4,10,22,.5)', pieTinta: 'rgba(238,243,251,.88)',
      suave: 'rgba(255,255,255,.28)', tenue: 'rgba(255,255,255,.14)'
    },

    candela: {
      nombre: 'Candela', familia: 'carnet', formato: 'credencial',
      cabecera: 'banda',
      banda: '#c8102e',
      bandaTinta: '#ffffff',
      bg1: '#fff7f7', bg2: '#f6e3e5',
      navy: '#4a1016', navy2: '#8d2230',
      label: '#957075', red: '#c8102e',
      line: 'rgba(19,41,75,.16)',
      guilloche: '#e8c4c9', guillocheAlfa: 0.5,
      bandera: false,
      marcaAgua: 0.05,
      pie: 'rgba(255,255,255,.86)', pieTinta: 'rgba(19,41,75,.85)',
      suave: 'rgba(19,41,75,.25)', tenue: 'rgba(19,41,75,.12)'
    },

    solapin: {
      nombre: 'Solapín', familia: 'credencial', formato: 'solapin',
      cabecera: 'banda',
      grad: ['#1b3f80', '#0d2247'],
      bandaTinta: '#ffffff',
      bg1: '#fbfdff', bg2: '#e6eef7',
      navy: '#13294b', navy2: '#31507f',
      label: '#6b7c93', red: '#c8102e',
      line: 'rgba(19,41,75,.16)',
      guilloche: '#b9cde2', guillocheAlfa: 0.45,
      marcaAgua: 0.05,
      pie: 'rgba(255,255,255,.86)', pieTinta: 'rgba(19,41,75,.85)',
      suave: 'rgba(19,41,75,.25)', tenue: 'rgba(19,41,75,.12)'
    },

    asodopa: {
      nombre: 'ASODOPA', familia: 'credencial', formato: 'solapin',
      cabecera: 'banda',
      grad: ['#c8102e', '#7d0b1e'],
      bandaTinta: '#fff6ec',
      bg1: '#fdfaf2', bg2: '#f0e6d2',
      navy: '#3a2416', navy2: '#7a4a2c',
      label: '#8a7157', red: '#a4122a',
      line: 'rgba(19,41,75,.16)',
      guilloche: '#d9c7a5', guillocheAlfa: 0.55,
      marcaAgua: 0.05,
      pie: 'rgba(255,255,255,.86)', pieTinta: 'rgba(19,41,75,.85)',
      suave: 'rgba(19,41,75,.25)', tenue: 'rgba(19,41,75,.12)'
    },

    nocturno: {
      nombre: 'Nocturno', familia: 'credencial', formato: 'cuadrado',
      cabecera: 'banda',
      grad: ['#1b3a72', '#07132b'],
      bandaTinta: '#ffffff',
      bg1: '#16294d', bg2: '#0a1730',
      navy: '#eef3fb', navy2: '#7fb2ff',
      label: '#8ea2c4', red: '#ff5f74',
      line: 'rgba(255,255,255,.16)',
      guilloche: '#2f4c80', guillocheAlfa: 0.55,
      bandera: false,
      marcaAgua: 0.07,
      pie: 'rgba(4,10,22,.5)', pieTinta: 'rgba(238,243,251,.88)',
      suave: 'rgba(255,255,255,.28)', tenue: 'rgba(255,255,255,.14)'
    },

    tricolor: {
      nombre: 'Tricolor', familia: 'credencial', formato: 'cuadrado',
      cabecera: 'banda',
      grad: ['#002d62', '#ce1126'],
      bandaTinta: '#ffffff',
      bg1: '#ffffff', bg2: '#f2f5f9',
      navy: '#002d62', navy2: '#3a68a8',
      label: '#6f7f96', red: '#ce1126',
      line: 'rgba(19,41,75,.16)',
      guilloche: '#cfdcea', guillocheAlfa: 0.5,
      marcaAgua: 0.05,
      pie: 'rgba(255,255,255,.86)', pieTinta: 'rgba(19,41,75,.85)',
      suave: 'rgba(19,41,75,.25)', tenue: 'rgba(19,41,75,.12)'
    },

    esmeralda: {
      nombre: 'Esmeralda', familia: 'credencial', formato: 'cuadrado',
      cabecera: 'banda',
      grad: ['#0d6b4f', '#04281f'],
      bandaTinta: '#ffffff',
      bg1: '#0f5f47', bg2: '#052a20',
      navy: '#eafaf3', navy2: '#6fd8b0',
      label: '#9dc9b8', red: '#ffd166',
      line: 'rgba(255,255,255,.16)',
      guilloche: '#1d7a5c', guillocheAlfa: 0.5,
      bandera: false,
      marcaAgua: 0.07,
      pie: 'rgba(4,10,22,.5)', pieTinta: 'rgba(238,243,251,.88)',
      suave: 'rgba(255,255,255,.28)', tenue: 'rgba(255,255,255,.14)'
    }
  };

  // Diez estilos en dos familias, por dos categorías: veinte diseños.
  var ORDEN = ["oficial","institucional","crema","carbon","candela","solapin","asodopa","nocturno","tricolor","esmeralda"];

  function estiloDe(id) {
    return ESTILOS[id] || ESTILOS.oficial;
  }

  // Paleta activa. renderCarnet la cambia antes de dibujar.
  var C = ESTILOS.oficial;

  var F = {
    sans: "'Archivo', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    mono: "'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, monospace"
  };

  function font(weight, size, family) {
    return weight + ' ' + size + 'px ' + (family || F.sans);
  }

  /* ---------- utilidades ---------- */

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function tracked(ctx, text, x, y, spacing) {
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      ctx.fillText(ch, x, y);
      x += ctx.measureText(ch).width + spacing;
    }
    return x;
  }

  function trackedWidth(ctx, text, spacing) {
    var w = 0;
    for (var i = 0; i < text.length; i++) {
      w += ctx.measureText(text.charAt(i)).width + spacing;
    }
    return w - spacing;
  }

  function fitText(ctx, text, maxW, weight, startSize, minSize, family) {
    var size = startSize;
    ctx.font = font(weight, size, family);
    while (ctx.measureText(text).width > maxW && size > minSize) {
      size -= 1;
      ctx.font = font(weight, size, family);
    }
    return size;
  }

  function hash32(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return h >>> 0;
  }

  function deaccent(s) {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  /* ---------- símbolos patrios: aquí no hay ninguno ----------

     El carnet NO lleva el Escudo Nacional ni la Bandera Nacional, y es a
     propósito.

     La Ley 210-19 reserva el uso del Escudo en identificaciones e impresos
     a una lista cerrada de funcionarios públicos (art. 26) y lo declara
     irreverencia en promociones comerciales con fines de lucro (art. 28.3).
     De la Bandera prohíbe el uso en propaganda comercial y como distintivo
     característico de una organización privada (art. 24.5).

     Este carnet es una identificación emitida por una organización privada
     ficticia, y está previsto usarlo en promociones con negocios. Las dos
     cosas que la ley nombra. Por eso el emblema del Ministerio es el
     palomo y nada más.

     Si alguien piensa devolver los símbolos al carnet: no lo haga.
     ------------------------------------------------------------------- */

  // Nada que cargar: el carnet se dibuja entero con código.
  function loadAssets() {
    return Promise.resolve();
  }

  // El emblema del Ministerio: el palomo dentro de un sello.
  function drawEmblema(ctx, cx, cy, size, color) {
    var r = size / 2;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1.4, size * 0.045);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = Math.max(0.8, size * 0.018);
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.86, 0, Math.PI * 2);
    ctx.stroke();
    drawPalomo(ctx, cx, cy, size * 0.62, color);
    ctx.restore();
  }


  /* ---------- la bandera, pequeña y sin alterar ---------- */

  // Bandera civil de RD: sin escudo, con sus cuatro cuarteles en su sitio
  // y sus colores exactos. Va chiquita y en un costado, nunca de centro
  // ni recortada: es decoración, no el emblema del documento.
  // Ley 210-19 pide que no se altere; por eso aquí no se estiliza.
  function drawBandera(ctx, x, y, w) {
    var h = w * 0.625;            // proporción oficial 5:8
    var t = h * 0.17;             // grosor de la cruz
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x, y, w, h);

    var cx = x + w / 2 - t / 2, cy = y + h / 2 - t / 2;
    ctx.fillStyle = '#002D62';                          // azul ultramar
    ctx.fillRect(x, y, cx - x, cy - y);                 // superior izquierdo
    ctx.fillRect(cx + t, cy + t, x + w - cx - t, y + h - cy - t);
    ctx.fillStyle = '#CE1126';                          // rojo bermellón
    ctx.fillRect(cx + t, y, x + w - cx - t, cy - y);    // superior derecho
    ctx.fillRect(x, cy + t, cx - x, y + h - cy - t);

    ctx.strokeStyle = 'rgba(0,0,0,.22)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.restore();
    return h;
  }

  /* ---------- sello circular con texto en arco ---------- */

  function textoArco(ctx, texto, cx, cy, radio, desde, hasta, tam, abajo) {
    ctx.save();
    ctx.font = font(700, tam);
    ctx.textAlign = 'center';
    ctx.textBaseline = abajo ? 'top' : 'bottom';
    var n = texto.length;
    if (n < 2) { ctx.restore(); return; }
    var paso = (hasta - desde) / (n - 1);
    for (var i = 0; i < n; i++) {
      var a = desde + paso * i;
      ctx.save();
      ctx.translate(cx + Math.cos(a) * radio, cy + Math.sin(a) * radio);
      ctx.rotate(a + (abajo ? -Math.PI / 2 : Math.PI / 2));
      ctx.fillText(texto[i], 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawCorona(ctx, cx, cy, w, color) {
    var h = w * 0.62;
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, cy + h / 2);
    ctx.lineTo(cx - w / 2, cy - h * 0.18);
    ctx.lineTo(cx - w * 0.26, cy + h * 0.06);
    ctx.lineTo(cx, cy - h / 2);
    ctx.lineTo(cx + w * 0.26, cy + h * 0.06);
    ctx.lineTo(cx + w / 2, cy - h * 0.18);
    ctx.lineTo(cx + w / 2, cy + h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawLaurel(ctx, cx, cy, r, color) {
    ctx.save();
    ctx.fillStyle = color;
    [-1, 1].forEach(function (lado) {
      for (var i = 0; i < 7; i++) {
        var a = Math.PI / 2 + lado * (0.42 + i * 0.17);
        var px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(a + Math.PI / 2);
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.13, r * 0.055, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });
    ctx.restore();
  }

  function drawEstrella(ctx, cx, cy, r, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5;
      var d = i % 2 ? r * 0.44 : r;
      ctx[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * d, cy + Math.sin(a) * d);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // El sello redondo que llevan casi todos los carnets que circulan:
  // doble aro, texto curvo arriba y abajo, corona, laureles y el palomo.
  function drawSello(ctx, cx, cy, size, arriba, abajo, color) {
    var r = size / 2;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2, size * 0.022);
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = Math.max(1.2, size * 0.012);
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.88, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = Math.max(3, size * 0.03);
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.70, 0, Math.PI * 2); ctx.stroke();

    ctx.fillStyle = color;
    var radioAro = r * 0.79;
    function cuerpo(t, giro) {
      return Math.min(size * 0.082, (giro * radioAro * 0.82) / Math.max(1, t.length));
    }
    var arcoA = Math.PI * 0.96, arcoB = Math.PI * 0.62;
    textoArco(ctx, arriba, cx, cy, radioAro, -Math.PI * 0.98, -Math.PI * 0.02, cuerpo(arriba, arcoA), false);
    textoArco(ctx, abajo,  cx, cy, radioAro,  Math.PI * 0.81,  Math.PI * 0.19, cuerpo(abajo, arcoB), true);

    drawEstrella(ctx, cx - r * 0.60, cy + r * 0.02, size * 0.045, color);
    drawEstrella(ctx, cx + r * 0.60, cy + r * 0.02, size * 0.045, color);

    drawCorona(ctx, cx, cy - r * 0.40, size * 0.20, color);
    drawLaurel(ctx, cx, cy - r * 0.02, r * 0.56, color);
    drawPalomo(ctx, cx, cy + r * 0.04, size * 0.40, color);

    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1.6, size * 0.016);
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.30, cy + r * 0.44);
    ctx.lineTo(cx + r * 0.30, cy + r * 0.44);
    ctx.stroke();
    ctx.restore();
  }

  /* ---------- mosaico de texto al fondo ---------- */

  // El fondo repetido con el propio título, en azul muy claro: es la
  // textura que se repite en todos los carnets que se hicieron virales.
  function drawMosaico(ctx, w, h, texto, color, alfa, tam) {
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip();
    ctx.globalAlpha = alfa;
    ctx.fillStyle = color;
    ctx.font = font(800, tam);
    var t = texto + '  ';
    var anchoT = ctx.measureText(t).width;
    var fila = tam * 1.62;
    for (var y = tam, i = 0; y < h + fila; y += fila, i++) {
      var x = -((i * anchoT * 0.37) % anchoT);
      for (; x < w; x += anchoT) { ctx.fillText(t, x, y); }
    }
    ctx.restore();
  }

  /* ---------- código de barras decorativo ---------- */

  function drawBarras(ctx, x, y, w, h, seed, color) {
    ctx.save();
    ctx.fillStyle = color;
    var r = seed >>> 0, cx = x;
    while (cx < x + w) {
      r = (r * 1664525 + 1013904223) >>> 0;
      var ancho = 1 + (r % 4);
      if ((r >>> 8) % 3) { ctx.fillRect(cx, y, ancho, h); }
      cx += ancho + 1 + ((r >>> 16) % 3);
    }
    ctx.restore();
  }

  /* ---------- el palomo (emblema propio, no es símbolo patrio) ---------- */

  // Se pinta en coordenadas normalizadas, centrado en (0,0), ancho ~1.
  // Un palomo, no un pato: cabeza chica, cuello fino, pecho saliente y
  // cola ancha caída hacia atrás.
  function paintPalomo(o, fill) {
    o.fillStyle = fill;
    o.strokeStyle = fill;
    o.lineCap = 'round';
    o.lineJoin = 'round';

    // patas
    o.lineWidth = 0.026;
    [-0.01, 0.11].forEach(function (lx) {
      o.beginPath();
      o.moveTo(lx, 0.17);
      o.lineTo(lx - 0.014, 0.33);
      o.stroke();
      o.beginPath();
      o.moveTo(lx - 0.062, 0.343);
      o.lineTo(lx + 0.043, 0.343);
      o.stroke();
    });

    // cola: corta y abierta en abanico, caída hacia atrás
    o.beginPath();
    o.moveTo(-0.20, -0.04);
    o.lineTo(-0.52, 0.07);
    o.lineTo(-0.545, 0.14);
    o.lineTo(-0.49, 0.21);
    o.lineTo(-0.14, 0.17);
    o.closePath();
    o.fill();

    // cuerpo, cuello y pecho en un solo trazo: de ahí sale la silueta
    o.beginPath();
    o.moveTo(-0.27, -0.01);
    o.bezierCurveTo(-0.25, -0.19, -0.06, -0.25, 0.10, -0.20); // lomo
    o.bezierCurveTo(0.17, -0.25, 0.23, -0.27, 0.27, -0.23);   // nuca
    o.lineTo(0.30, -0.12);
    o.bezierCurveTo(0.29, 0.01, 0.24, 0.11, 0.15, 0.18);      // pecho
    o.bezierCurveTo(0.03, 0.26, -0.15, 0.23, -0.25, 0.13);    // panza
    o.closePath();
    o.fill();

    // cabeza, pequeña y alta
    o.beginPath();
    o.arc(0.278, -0.255, 0.102, 0, Math.PI * 2);
    o.fill();

    // pico corto, de paloma
    o.beginPath();
    o.moveTo(0.368, -0.286);
    o.lineTo(0.458, -0.253);
    o.lineTo(0.368, -0.220);
    o.closePath();
    o.fill();

    // El ala y el ojo se recortan de la silueta. Va al final y sobre el
    // lienzo aparte, para no agujerear el fondo del carnet.
    o.globalCompositeOperation = 'destination-out';

    o.lineWidth = 0.024;
    o.beginPath();
    o.moveTo(-0.21, -0.05);
    o.bezierCurveTo(-0.04, -0.15, 0.10, -0.05, 0.04, 0.11);
    o.stroke();

    o.beginPath();
    o.arc(0.306, -0.281, 0.025, 0, Math.PI * 2);
    o.fill();

    o.globalCompositeOperation = 'source-over';
  }

  // Lo pinta en un lienzo aparte y lo estampa, a la resolución real de salida.
  function drawPalomo(ctx, cx, cy, s, fill) {
    var m = ctx.getTransform ? ctx.getTransform() : null;
    var dpr = m ? Math.hypot(m.a, m.b) || 1 : 1;

    var box = s * 1.6;
    var px = Math.max(8, Math.ceil(box * dpr));

    var off = document.createElement('canvas');
    off.width = px;
    off.height = px;

    var o = off.getContext('2d');
    o.setTransform(px / box, 0, 0, px / box, 0, 0);
    o.translate(box / 2, box / 2);
    o.scale(s, s);
    paintPalomo(o, fill);

    ctx.drawImage(off, cx - box / 2, cy - box / 2, box, box);
  }

  /* ---------- fondo de seguridad ---------- */

  function drawGuilloche(ctx, x, y, w, h, seed) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    ctx.globalAlpha = C.guillocheAlfa;
    ctx.strokeStyle = C.guilloche;
    ctx.lineWidth = 0.8;

    for (var k = 0; k < 30; k++) {
      ctx.beginPath();
      var first = true;
      for (var t = 0; t <= 360; t += 2) {
        var a = t * Math.PI / 180;
        var r1 = 130 + k * 10;
        var r2 = 52 + (seed % 19);
        var px = x + w * 0.52 + Math.cos(a) * r1 + Math.cos(a * 7 + k * 0.26) * r2;
        var py = y + h * 0.5 + Math.sin(a) * r1 * 0.5 + Math.sin(a * 5 + k * 0.26) * r2 * 0.4;
        if (first) { ctx.moveTo(px, py); first = false; } else { ctx.lineTo(px, py); }
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ---------- firma ---------- */

  function drawSignature(ctx, x, y, w, h, seed) {
    var rnd = seed;
    function next() { rnd = (rnd * 1103515245 + 12345) >>> 0; return (rnd >>> 16) / 65535; }
    function jit(a) { return (next() - 0.5) * a; }

    var base = y + h * 0.68;

    ctx.save();
    ctx.strokeStyle = C.navy;
    ctx.lineWidth = 2.1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.85;

    ctx.beginPath();
    ctx.moveTo(x + w * 0.02, base);
    ctx.bezierCurveTo(
      x, y + h * 0.10 + jit(6),
      x + w * 0.17, y + jit(6),
      x + w * 0.15, y + h * 0.48
    );
    ctx.bezierCurveTo(
      x + w * 0.14, base + h * 0.26,
      x + w * 0.24, base + h * 0.22,
      x + w * 0.26, base - h * 0.10
    );

    var loops = 5;
    for (var i = 0; i < loops; i++) {
      var x0 = x + w * (0.26 + 0.36 * (i / loops));
      var x1 = x + w * (0.26 + 0.36 * ((i + 1) / loops));
      var up = y + h * (0.20 + jit(0.18));
      ctx.bezierCurveTo(
        x0 + (x1 - x0) * 0.25, up,
        x1 - (x1 - x0) * 0.25, up,
        x1, base - h * (0.04 + jit(0.14))
      );
    }

    ctx.bezierCurveTo(
      x + w * 0.74, y + h * 0.14 + jit(8),
      x + w * 0.88, y + h * 0.28,
      x + w * 0.99, y + h * 0.36
    );
    ctx.stroke();

    ctx.beginPath();
    ctx.lineWidth = 1.7;
    ctx.moveTo(x + w * 0.10, base + h * 0.32);
    ctx.bezierCurveTo(
      x + w * 0.38, base + h * 0.54,
      x + w * 0.66, base + h * 0.12,
      x + w * 0.95, base + h * 0.28
    );
    ctx.stroke();
    ctx.restore();
  }

  /* ---------- QR ---------- */

  function drawQR(ctx, text, x, y, size) {
    var qr = global.qrcode(0, 'M');
    qr.addData(text);
    qr.make();

    var n = qr.getModuleCount();
    var quiet = 2;
    var cell = size / (n + quiet * 2);

    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = '#101820';
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        if (qr.isDark(r, c)) {
          ctx.fillRect(
            Math.floor(x + (c + quiet) * cell),
            Math.floor(y + (r + quiet) * cell),
            Math.ceil(cell), Math.ceil(cell)
          );
        }
      }
    }
    ctx.restore();
  }

  /* ---------- nombre y MRZ ---------- */

  function partirNombre(nombre) {
    var partes = deaccent(nombre).toUpperCase().replace(/[^A-Z ]/g, '').trim().split(/\s+/);
    if (partes.length === 1) return { nombres: partes[0] || 'PALOMO', apellidos: 'DE TAL' };
    if (partes.length === 2) return { nombres: partes[0], apellidos: partes[1] };
    var corte = Math.ceil(partes.length / 2);
    return { nombres: partes.slice(0, corte).join(' '), apellidos: partes.slice(corte).join(' ') };
  }

  function mrzLines(data) {
    var p = partirNombre(data.nombre);
    function pad(s, n) {
      s = s.substring(0, n);
      while (s.length < n) s += '<';
      return s;
    }
    return [
      pad('PD<DOM' + p.apellidos.replace(/ /g, '<') + '<<' + p.nombres.replace(/ /g, '<'), 44),
      pad(deaccent(data.serial).toUpperCase().replace(/-/g, '') + '<DOM<PALOMO<CERTIFICADO', 44)
    ];
  }


  /* ---------- datos de muestra, solo para la portada ---------- */

  var MUESTRA = {
    palomo: {
      titulo: 'CARNET DE PALOMO', hashtag: 'palomos',
      nivelEtiqueta: 'Nivel de tigueraje', vence: 'DE POR VIDA',
      categoria: 'PALOMO CERTIFICADO', oficio: 'TRABAJAR Y EVITAR PROBLEMAS',
      antecedentes: 'NINGUNO, GRACIAS A DIOS',
      titulos: {
        oficial: 'CARNET DE PALOMO',
        institucional: 'CARNET DE PALOMO',
        crema: 'CERTIFICADO DE PALOMO',
        carbon: 'CARNET DE PALOMO',
        candela: 'CREDENCIAL DE PALOMO',
        solapin: 'CARNET DE PALOMO',
        asodopa: 'CERTIFICADO DE PALOMO',
        nocturno: 'CARNET DE PALOMO',
        tricolor: 'CERTIFICADO DE PALOMO',
        esmeralda: 'CREDENCIAL DE PALOMO'
      },
      emisores: {
        oficial: ['Ministerio de Palomos', 'MINPAL'],
        institucional: ['Dirección General del Palomaje', 'DGP'],
        crema: ['Instituto Nacional del Palomaje', 'INAPAL'],
        carbon: ['Consejo Superior de Palomos', 'CONSUPAL'],
        candela: ['Registro Nacional de Palomos', 'RENAPAL'],
        solapin: ['Federación Dominicana de Palomos', 'FEDOPAL'],
        asodopa: ['Asociación Dominicana de Palomos', 'ASODOPA'],
        nocturno: ['Cámara Dominicana de Palomos', 'CADOPAL'],
        tricolor: ['Asociación Nacional de Palomos', 'ANPC'],
        esmeralda: ['Junta Central de Palomos', 'JCP']
      },
      frases: {
        oficial: 'La paz también es una forma de éxito.',
        institucional: 'El que se queda en su casa, siempre gana.',
        crema: 'Aquí no andamos en gente.',
        carbon: 'El que no debe, duerme tranquilo.',
        candela: 'Mi casa, mi paz, mi gente.',
        solapin: 'No es un sueño, es un palomo certificado.',
        asodopa: 'Mejor tranquilo en mi casa que en líos en la calle.',
        nocturno: 'Sin líos, sin cuentos, sin maña.',
        tricolor: "Pa' los palomos de verdad.",
        esmeralda: 'Tranquilo en su casa, todo frío.'
      }
    },
    pariguayo: {
      titulo: 'CARNET DE PARIGUAYO', hashtag: 'pariguayos',
      nivelEtiqueta: 'Nivel de flow', vence: 'DE POR VIDA',
      categoria: 'PARIGUAYO CERTIFICADO', oficio: 'CUIDANDO LOS BULTOS',
      antecedentes: 'NINGUNO, NI BAILANDO',
      titulos: {
        oficial: 'CARNET DE PARIGUAYO',
        institucional: 'CARNET DE PARIGUAYO',
        crema: 'CERTIFICADO DE PARIGUAYO',
        carbon: 'CARNET DE PARIGUAYO',
        candela: 'CREDENCIAL DE PARIGUAYO',
        solapin: 'CARNET DE PARIGUAYO',
        asodopa: 'CERTIFICADO DE PARIGUAYO',
        nocturno: 'CARNET DE PARIGUAYO',
        tricolor: 'CERTIFICADO DE PARIGUAYO',
        esmeralda: 'CREDENCIAL DE PARIGUAYO'
      },
      emisores: {
        oficial: ['Ministerio de Pariguayos', 'MINPAR'],
        institucional: ['Dirección General del Pariguayaje', 'DGPAR'],
        crema: ['Instituto Nacional del Pariguayaje', 'INAPARI'],
        carbon: ['Consejo Superior de Pariguayos', 'CONSUPARI'],
        candela: ['Registro Nacional de Pariguayos', 'RENAPARI'],
        solapin: ['Federación Dominicana de Pariguayos', 'FEDOPARI'],
        asodopa: ['Asociación Dominicana de Pariguayos', 'ASODOPARI'],
        nocturno: ['Cámara Dominicana de Pariguayos', 'CADOPARI'],
        tricolor: ['Asociación Nacional de Pariguayos', 'ANPAR'],
        esmeralda: ['Junta Central de Pariguayos', 'JCPAR']
      },
      frases: {
        oficial: 'El que no baila, observa.',
        institucional: 'Yo no bailo, yo cuido los bultos.',
        crema: 'Yo vine fue a mirar.',
        carbon: 'El que graba no baila.',
        candela: 'Sosteniendo la pared desde siempre.',
        solapin: 'No es un sueño, es un pariguayo certificado.',
        asodopa: 'Llegué temprano y me quedé en la esquina.',
        nocturno: 'Buscando el hielo toda la noche.',
        tricolor: "Pa' los pariguayos de verdad.",
        esmeralda: 'Parado ahí, como siempre.'
      }
    }
  };

  function datosMuestra(tipo, estilo, foto) {
    var m = MUESTRA[tipo] || MUESTRA.palomo;
    var em = m.emisores[estilo] || m.emisores.oficial;
    var hoy = new Date();
    var dd = String(hoy.getDate()).padStart(2, '0');
    var mm = String(hoy.getMonth() + 1).padStart(2, '0');

    return {
      nombre: tipo === 'pariguayo' ? 'JUAN PARIGUAYO' : 'JUAN PALOMO',
      serial: (tipo === 'pariguayo' ? 'PAR' : 'PAL') + '-000001-7',
      nivel: 0,
      nivelEtiqueta: m.nivelEtiqueta,
      categoria: m.categoria,
      oficio: m.oficio,
      antecedentes: m.antecedentes,
      lugar: 'SANTO DOMINGO',
      emitido: dd + '/' + mm + '/' + hoy.getFullYear(),
      vence: m.vence,
      emisor: em[0], siglas: em[1],
      titulo: (m.titulos && m.titulos[estilo]) || m.titulo,
      frase: m.frases[estilo] || m.frases.oficial,
      hashtag: m.hashtag,
      qrUrl: 'https://palomos.com.do',
      photo: foto
    };
  }

  // Las diez combinaciones, en el orden en que se enseñan.
  function catalogo() {
    var lista = [];
    ['palomo', 'pariguayo'].forEach(function (t) {
      ORDEN.forEach(function (e) {
        lista.push({ tipo: t, estilo: e, nombre: ESTILOS[e].nombre, familia: ESTILOS[e].familia });
      });
    });
    return lista;
  }

  /* =======================================================================
     Render
     ======================================================================= */

  function renderCarnet(canvas, data, scale, estiloId) {
    C = estiloDe(estiloId || data.estilo);
    scale = scale || 1;
    if (C.formato === 'solapin')  { return renderSolapin(canvas, data, scale); }
    if (C.formato === 'cuadrado') { return renderCuadrado(canvas, data, scale); }
    return renderCredencial(canvas, data, scale);
  }

  function renderCredencial(canvas, data, scale) {
    canvas.width = W * scale;
    canvas.height = H * scale;

    var ctx = canvas.getContext('2d');
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.textBaseline = 'alphabetic';

    var seed = hash32(data.nombre + '|' + data.serial);
    var nom = partirNombre(data.nombre);

    /* --- fondo --- */
    var bg = ctx.createLinearGradient(0, 0, W * 0.8, H);
    bg.addColorStop(0, C.bg1);
    bg.addColorStop(1, C.bg2);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    drawGuilloche(ctx, 0, 0, W, H, seed);

    // Marca de agua. Muy tenue a propósito: si se nota, compite con los
    // datos y parece una mancha.
    ctx.save();
    ctx.globalAlpha = C.marcaAgua;
    drawPalomo(ctx, 700, 300, 460, C.navy);
    ctx.restore();

    /* --- cabecera --- */
    // Dos tratamientos: una línea fina y sobria, o una banda de color con
    // el título en grande, que es lo que más se comparte.
    var emisor = data.emisor || 'Ministerio de Palomos';
    var titulo = data.titulo || 'CARNET DE PALOMO';
    var siglas = data.siglas || 'MINPAL';
    var marca  = titulo.replace('CARNET DE ', '') + 'S';

    if (C.cabecera === 'banda') {
      if (C.bandaGrad) {
        var gb = ctx.createLinearGradient(0, 0, W, 0);
        gb.addColorStop(0, C.bandaGrad[0]);
        gb.addColorStop(1, C.bandaGrad[1]);
        ctx.fillStyle = gb;
      } else {
        ctx.fillStyle = C.banda;
      }
      ctx.fillRect(0, 0, W, 96);

      drawEmblema(ctx, 58, 48, 60, C.bandaTinta);

      ctx.fillStyle = C.bandaTinta;
      var tam = fitText(ctx, titulo, 520, 800, 40, 22);
      ctx.font = font(800, tam);
      ctx.fillText(titulo, 100, 46);

      ctx.font = font(600, 15);
      ctx.globalAlpha = 0.85;
      ctx.fillText(emisor, 100, 72);
      ctx.globalAlpha = 1;

      // Las siglas a la derecha, como el sello de la institución.
      ctx.font = font(800, 26);
      var sig = siglas;
      ctx.globalAlpha = 0.9;
      ctx.fillText(sig, W - 32 - ctx.measureText(sig).width, 58);
      ctx.globalAlpha = 1;

    } else {
      drawEmblema(ctx, 58, 46, 62, C.navy);

      ctx.font = font(800, 30);
      ctx.fillStyle = C.navy;
      ctx.fillText(marca + ' ', 100, 57);
      var anchoMarca = ctx.measureText(marca + ' ').width;
      ctx.fillStyle = C.red;
      ctx.fillText('RD', 100 + anchoMarca, 57);
      anchoMarca += ctx.measureText('RD').width;

      var divisor = 100 + anchoMarca + 26;
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(divisor, 18);
      ctx.lineTo(divisor, 74);
      ctx.stroke();

      ctx.fillStyle = C.red;
      ctx.font = font(700, 21);
      ctx.fillText(emisor, divisor + 20, 53);

      ctx.fillStyle = C.navy;
      ctx.font = font(700, 17);
      (function () {
        ctx.font = font(700, 17);
        var tw = trackedWidth(ctx, titulo, 1.6);
        tracked(ctx, titulo, W - 32 - tw, 46, 1.6);
        ctx.fillStyle = C.red;
        ctx.font = font(700, 11);
        var t2 = 'CERTIFICADO';
        var tw2 = trackedWidth(ctx, t2, 2.6);
        tracked(ctx, t2, W - 32 - tw2, 66, 2.6);
      })();

      (function () {
        var y = 89, x0 = 32, w = W - 64, h = 3;
        ctx.fillStyle = C.navy;
        ctx.fillRect(x0, y, w * 0.46, h);
        ctx.fillStyle = C.red;
        ctx.fillRect(x0 + w * 0.54, y, w * 0.46, h);
      })();
    }

    /* --- helpers de campo --- */
    function label(text, x, y) {
      ctx.fillStyle = C.label;
      ctx.font = font(600, 11);
      ctx.fillText(text, x, y);
    }
    function value(text, x, y, size, maxW, family, weight) {
      ctx.fillStyle = C.navy;
      var s = fitText(ctx, text, maxW, weight || 700, size, 11, family);
      ctx.font = font(weight || 700, s, family);
      ctx.fillText(text, x, y);
    }

    /* --- foto: lo primero que se mira, así que manda --- */
    var PX = 32, PY = 104, PW = 248, PH = 310;

    ctx.save();
    roundRect(ctx, PX, PY, PW, PH, 5);
    ctx.clip();
    if (data.photo) {
      ctx.drawImage(data.photo, PX, PY, PW, PH);
    } else {
      ctx.fillStyle = '#c3d2e2';
      ctx.fillRect(PX, PY, PW, PH);
    }
    ctx.restore();
    ctx.strokeStyle = C.suave;
    ctx.lineWidth = 1;
    roundRect(ctx, PX, PY, PW, PH, 5);
    ctx.stroke();

    /* --- firma bajo la foto --- */
    label('Firma', PX, 436);
    drawSignature(ctx, PX + 46, 424, 200, 52, seed);
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PX, 478);
    ctx.lineTo(PX + PW, 478);
    ctx.stroke();

    /* --- columna de datos --- */
    var BX = 306, FIELD_W = 344;

    label('Número de carnet', BX, 120);
    value(data.serial, BX, 152, 29, FIELD_W, F.mono, 700);

    label('Nombre', BX, 190);
    value(nom.nombres, BX, 214, 22, FIELD_W);

    label('Apellido', BX, 238);
    value(nom.apellidos, BX, 262, 22, FIELD_W);

    label('Estatus', BX, 286);
    value(data.categoria, BX, 310, 20, FIELD_W);

    label('Lugar de tranquilidad', BX, 334);
    value(data.lugar, BX, 358, 20, FIELD_W);

    label('Especialidad', BX, 382);
    value(data.oficio, BX, 406, 20, FIELD_W);

    label('Antecedentes', BX, 430);
    value(data.antecedentes || 'NINGUNO', BX, 454, 20, FIELD_W);

    /* --- columna derecha: el QR, en grande --- */
    var RX = 690;
    var QS = 200, QX = W - 32 - QS, QY = 104;

    ctx.fillStyle = '#fff';
    roundRect(ctx, QX - 7, QY - 7, QS + 14, QS + 14, 7);
    ctx.fill();
    ctx.strokeStyle = C.suave;
    ctx.lineWidth = 1;
    roundRect(ctx, QX - 7, QY - 7, QS + 14, QS + 14, 7);
    ctx.stroke();
    drawQR(ctx, data.qrUrl, QX, QY, QS);

    (function () {
      var cx = QX + QS / 2;

      ctx.fillStyle = C.label;
      ctx.font = font(600, 11);
      var t = 'ESCANEA PARA VERIFICAR';
      tracked(ctx, t, cx - trackedWidth(ctx, t, 1) / 2, QY + QS + 26, 1);

      ctx.fillStyle = C.red;
      ctx.font = font(700, 14);
      ctx.fillText(SITIO, cx - ctx.measureText(SITIO).width / 2, QY + QS + 46);
    })();

    // nivel de palomería
    label(data.nivelEtiqueta || 'Nivel de tigueraje', RX, 378);
    (function () {
      var bx = RX, by = 390, bw = 186, bh = 13;
      ctx.fillStyle = C.tenue;
      roundRect(ctx, bx, by, bw, bh, 6.5);
      ctx.fill();

      var pct = Math.max(0, Math.min(100, data.nivel)) / 100;
      var g = ctx.createLinearGradient(bx, 0, bx + bw, 0);
      g.addColorStop(0, C.navy2);
      g.addColorStop(1, C.red);
      ctx.fillStyle = g;
      roundRect(ctx, bx, by, Math.max(bh, bw * pct), bh, 6.5);
      ctx.fill();

      ctx.fillStyle = C.navy;
      ctx.font = font(700, 17, F.mono);
      ctx.fillText(Number(data.nivel).toFixed(1) + '%', bx + bw + 12, by + bh);
    })();

    label('Vigencia hasta', RX, 428);
    value(data.vence, RX, 452, 19, 290);

    // número vertical en el canto derecho
    ctx.save();
    ctx.translate(W - 13, 478);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = C.label;
    ctx.font = font(600, 14, F.mono);
    ctx.fillText(deaccent(data.serial).replace(/-/g, ' '), 0, 0);
    ctx.restore();

    /* --- pie: MRZ + invitación + avisos --- */
    var MY = 496;
    ctx.fillStyle = C.pie;
    ctx.fillRect(0, MY, W, H - MY);
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, MY);
    ctx.lineTo(W, MY);
    ctx.stroke();

    var lines = mrzLines(data);
    ctx.fillStyle = C.pieTinta;
    ctx.font = font(400, 25, F.mono);
    ctx.fillText(lines[0], 32, MY + 40);
    ctx.fillText(lines[1], 32, MY + 70);

    // La frase, que es lo que la gente cita cuando lo comparte.
    (function () {
      ctx.fillStyle = C.navy;
      ctx.font = 'italic ' + font(700, 17);
      var f = data.frase || '';
      ctx.fillText(f, 32, MY + 104);

      ctx.fillStyle = C.label;
      ctx.font = font(600, 11);
      var v = 'Verifica este carnet en ' + SITIO;
      ctx.fillText(v, W - 32 - ctx.measureText(v).width, MY + 104);
    })();

    ctx.fillStyle = C.label;
    ctx.font = font(600, 10.5);
    ctx.fillText('DOCUMENTO DE PARODIA · SIN VALIDEZ LEGAL · ES UN MEME', 156, MY + 126);

    ctx.fillStyle = C.red;
    ctx.font = font(700, 11.5);
    (function () {
      var t = 'MEME DE @javimolinax';
      ctx.fillText(t, W - 32 - ctx.measureText(t).width, MY + 126);
    })();

    // El hashtag, en dos tonos: azul y rojo, los colores de RD.
    (function () {
      var hx = 32, hy = MY + 126;
      ctx.font = font(800, 15);
      ctx.fillStyle = C.navy;
      ctx.fillText('#team', hx, hy);
      ctx.fillStyle = C.red;
      ctx.fillText(data.hashtag || 'palomos', hx + ctx.measureText('#team').width, hy);
    })();

    // El cuño del Ministerio, estampado encima del pie y girado, como si
    // lo hubieran puesto a mano después de imprimir.
    (function () {
      var sx = 906, sy = 552;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(-0.14);
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = C.red;

      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.arc(0, 0, 50, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(0, 0, 43, 0, Math.PI * 2);
      ctx.stroke();

      drawPalomo(ctx, 0, -9, 60, C.red);

      ctx.fillStyle = C.red;
      ctx.font = font(700, 8);
      var t = 'MINISTERIO DE PALOMOS';
      tracked(ctx, t, -trackedWidth(ctx, t, 0.6) / 2, 28, 0.6);
      ctx.restore();
    })();

    // Banda al pie, con los mismos colores y el mismo criterio que la regla.
    ctx.fillStyle = C.navy;
    ctx.fillRect(0, H - 7, W * 0.46, 7);
    ctx.fillStyle = C.red;
    ctx.fillRect(W * 0.54, H - 7, W * 0.46, 7);

    return canvas;
  }


  /* =======================================================================
     Solapín vertical — el de colgar del cuello, con su ranura arriba.
     ======================================================================= */

  function renderSolapin(canvas, data, scale) {
    var w = 760, h = 1060;
    canvas.width = w * scale;
    canvas.height = h * scale;

    var ctx = canvas.getContext('2d');
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.textBaseline = 'alphabetic';

    var seed = hash32(data.nombre + '|' + data.serial);
    var nom = partirNombre(data.nombre);
    var titulo = data.titulo || 'CARNET DE PALOMO';
    var PIE = 84;                       // alto de la banda del pie

    // Fondo claro con el mosaico de texto: el sello del formato.
    var g0 = ctx.createLinearGradient(0, 0, 0, h);
    g0.addColorStop(0, C.bg1);
    g0.addColorStop(1, C.bg2);
    ctx.fillStyle = g0;
    ctx.fillRect(0, 0, w, h);
    drawMosaico(ctx, w, h, titulo, C.guilloche, C.guillocheAlfa * 0.17, 46);

    // El palomo enorme y desvaído a la derecha.
    ctx.save();
    ctx.globalAlpha = C.marcaAgua * 1.3;
    drawPalomo(ctx, w * 0.80, 600, 450, C.navy);
    ctx.restore();

    // La ranura del cordón.
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.30)';
    roundRect(ctx, w / 2 - 62, 26, 124, 26, 13);
    ctx.fill();
    ctx.restore();

    /* --- título apilado en tres líneas, que es lo que se lee de lejos --- */
    var palabras = titulo.split(' ');
    var l1 = palabras[0];
    var l2 = palabras.slice(1).join(' ');
    var l3 = /CERTIFICADO/.test(titulo) ? 'OFICIAL' : 'CERTIFICADO';

    ctx.fillStyle = C.navy;
    var TMAX = 430;
    [[l1, 158], [l2, 224], [l3, 290]].forEach(function (par) {
      var z = fitText(ctx, par[0], TMAX, 800, 64, 30);
      ctx.font = font(800, z);
      ctx.fillText(par[0], 52, par[1]);
    });

    // Sello redondo arriba a la derecha.
    drawSello(ctx, w - 136, 190, 208, titulo, l3, C.navy);

    /* --- banderita y emisor, en un costado y en chiquito --- */
    var fy = 330;
    var fh = C.bandera === false ? 0 : drawBandera(ctx, 52, fy, 108);
    var tx = C.bandera === false ? 52 : 180;

    ctx.fillStyle = C.navy2;
    ctx.font = font(700, 17);
    var emis = fitText(ctx, data.emisor || '', w - tx - 48, 700, 17, 12);
    ctx.font = font(700, emis);
    ctx.fillText(data.emisor || '', tx, fy + 16);
    ctx.font = font(700, 17);
    ctx.fillText('(' + (data.siglas || '') + ')', tx, fy + 40);
    ctx.fillStyle = C.red;
    ctx.fillText('RD', tx, fy + 64);

    function label(t, x, y) {
      ctx.fillStyle = C.navy2;
      ctx.font = font(700, 15);
      ctx.fillText(t.toUpperCase() + ':', x, y);
    }
    function value(t, x, y, size, maxW) {
      ctx.fillStyle = C.navy;
      var z = fitText(ctx, t, maxW, 800, size, 13);
      ctx.font = font(800, z);
      ctx.fillText(t, x, y);
    }

    /* --- foto a la izquierda, con marco --- */
    var pw = 262, ph = 330, px = 52, py = 416;
    ctx.save();
    roundRect(ctx, px, py, pw, ph, 4);
    ctx.clip();
    if (data.photo) { ctx.drawImage(data.photo, px, py, pw, ph); }
    else { ctx.fillStyle = '#c3d2e2'; ctx.fillRect(px, py, pw, ph); }
    ctx.restore();
    ctx.strokeStyle = C.navy; ctx.lineWidth = 3;
    roundRect(ctx, px, py, pw, ph, 4); ctx.stroke();

    /* --- datos a la derecha --- */
    var bx = 342, bw = w - bx - 44;
    label('Nombre', bx, 434);
    value(nom.nombres + ' ' + nom.apellidos, bx, 466, 26, bw);

    label('Estatus', bx, 512);
    value(data.categoria, bx, 542, 22, bw);

    label(data.nivelEtiqueta || 'Nivel de tigueraje', bx, 590);
    value(Number(data.nivel).toFixed(1) + '%', bx, 620, 24, bw);

    label('Fecha de emisión', bx, 668);
    value(data.emitido || '', bx, 698, 23, bw);

    label('Vencimiento', bx, 744);
    value(data.vence, bx, 774, 21, bw);

    /* --- pie interior: número + barras, QR al centro, firma a la derecha --- */
    label('ID único', 52, 800);
    ctx.fillStyle = C.navy;
    ctx.font = font(800, 38, F.mono);
    ctx.fillText(data.serial, 52, 840);
    drawBarras(ctx, 52, 856, 262, 48, seed, C.navy);

    var qs = 150, qx = 352, qy = 806;
    ctx.fillStyle = '#fff';
    roundRect(ctx, qx - 8, qy - 8, qs + 16, qs + 16, 6); ctx.fill();
    ctx.strokeStyle = C.suave; ctx.lineWidth = 1;
    roundRect(ctx, qx - 8, qy - 8, qs + 16, qs + 16, 6); ctx.stroke();
    drawQR(ctx, data.qrUrl, qx, qy, qs);

    drawSignature(ctx, 540, 812, 176, 60, seed);
    ctx.strokeStyle = C.navy; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(534, 918); ctx.lineTo(716, 918); ctx.stroke();
    ctx.fillStyle = C.navy2; ctx.font = font(700, 14);
    var fa = 'FIRMA AUTORIZADA';
    ctx.fillText(fa, 716 - ctx.measureText(fa).width, 940);

    /* --- banda del pie con la frase --- */
    var g2 = ctx.createLinearGradient(0, 0, w, 0);
    g2.addColorStop(0, C.grad[0]); g2.addColorStop(1, C.grad[1]);
    ctx.fillStyle = g2;
    ctx.fillRect(0, h - PIE, w, PIE);

    ctx.fillStyle = C.bandaTinta || '#fff';
    var fr = (data.frase || '').toUpperCase();
    var zf = fitText(ctx, fr, w - 150, 800, 22, 12);
    ctx.font = 'italic ' + font(800, zf);
    var af = ctx.measureText(fr).width;
    ctx.fillText(fr, w / 2 - af / 2, h - PIE + 34);

    ctx.strokeStyle = C.bandaTinta || '#fff';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(w / 2 - af / 2 - 44, h - PIE + 27); ctx.lineTo(w / 2 - af / 2 - 14, h - PIE + 27);
    ctx.moveTo(w / 2 + af / 2 + 14, h - PIE + 27); ctx.lineTo(w / 2 + af / 2 + 44, h - PIE + 27);
    ctx.stroke();

    ctx.font = font(600, 11);
    ctx.globalAlpha = 0.86;
    var av = SITIO + ' · PARODIA, SIN VALIDEZ LEGAL · #team' + (data.hashtag || 'palomos');
    ctx.fillText(av, w / 2 - ctx.measureText(av).width / 2, h - 22);
    ctx.globalAlpha = 1;

    return canvas;
  }

  /* =======================================================================
     Cuadrado — pensado para Instagram, donde 1:1 ocupa toda la pantalla.
     ======================================================================= */

  function renderCuadrado(canvas, data, scale) {
    var w = 1000, h = 1000;
    canvas.width = w * scale;
    canvas.height = h * scale;

    var ctx = canvas.getContext('2d');
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.textBaseline = 'alphabetic';

    var seed = hash32(data.nombre + '|' + data.serial);
    var nom = partirNombre(data.nombre);

    // Todo el fondo en degradado.
    var g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, C.grad[0]);
    g.addColorStop(1, C.grad[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    drawGuilloche(ctx, 0, 0, w, h, seed);

    var tinta = C.bandaTinta || '#fff';

    ctx.save();
    ctx.globalAlpha = 0.08;
    drawPalomo(ctx, w * 0.72, h * 0.54, 720, tinta);
    ctx.restore();

    // Título arriba, en grande y apilado.
    var partes = (data.titulo || 'CARNET DE PALOMO').split(' ');
    var ultima = partes.pop();
    var primera = partes.join(' ');

    ctx.fillStyle = tinta;
    ctx.font = font(800, 50);
    ctx.fillText(primera, 60, 122);
    var tam = fitText(ctx, ultima, 820, 800, 124, 54);
    ctx.font = font(800, tam);
    ctx.fillText(ultima, 60, 226);

    ctx.font = font(700, 18);
    ctx.globalAlpha = 0.85;
    tracked(ctx, 'CERTIFICADO · ' + (data.siglas || ''), 62, 260, 4);
    ctx.fillText(data.emisor || '', 62, 292);
    ctx.globalAlpha = 1;

    drawEmblema(ctx, w - 110, 130, 128, tinta);

    function label(t, x, y) {
      ctx.globalAlpha = 0.72; ctx.fillStyle = tinta;
      ctx.font = font(600, 13); ctx.fillText(t, x, y); ctx.globalAlpha = 1;
    }
    function value(t, x, y, size, maxW) {
      ctx.fillStyle = tinta;
      var z = fitText(ctx, t, maxW, 700, size, 13);
      ctx.font = font(700, z);
      ctx.fillText(t, x, y);
    }

    // Foto a la izquierda.
    var pw = 300, ph = 375, px = 60, py = 320;
    ctx.save();
    roundRect(ctx, px, py, pw, ph, 8);
    ctx.clip();
    if (data.photo) { ctx.drawImage(data.photo, px, py, pw, ph); }
    else { ctx.fillStyle = '#c3d2e2'; ctx.fillRect(px, py, pw, ph); }
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 2;
    roundRect(ctx, px, py, pw, ph, 8); ctx.stroke();

    drawSignature(ctx, px + 10, py + ph + 14, 220, 56, seed);
    ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(px, py + ph + 76); ctx.lineTo(px + pw, py + ph + 76); ctx.stroke();
    label('Firma del titular', px, py + ph + 96);

    // Datos a la derecha.
    var bx = 404, bw = 420;
    label('Número de carnet', bx, 340);
    ctx.fillStyle = tinta; ctx.font = font(700, 32, F.mono);
    ctx.fillText(data.serial, bx, 378);

    label('Nombre', bx, 418);   value(nom.nombres + ' ' + nom.apellidos, bx, 446, 26, bw);
    label('Estatus', bx, 488);  value(data.categoria, bx, 514, 22, bw);
    label('Lugar de tranquilidad', bx, 556); value(data.lugar, bx, 582, 22, bw);
    label('Especialidad', bx, 624); value(data.oficio, bx, 650, 20, bw);
    label('Antecedentes', bx, 692); value(data.antecedentes || 'NINGUNO', bx, 718, 20, bw);

    label(data.nivelEtiqueta || 'Nivel de tigueraje', bx, 760);
    (function () {
      var bx2 = bx, by = 772, bw2 = 250, bh = 14;
      ctx.fillStyle = 'rgba(255,255,255,.22)';
      roundRect(ctx, bx2, by, bw2, bh, 7); ctx.fill();
      var pct = Math.max(0, Math.min(100, data.nivel)) / 100;
      ctx.fillStyle = tinta;
      roundRect(ctx, bx2, by, Math.max(bh, bw2 * pct), bh, 7); ctx.fill();
      ctx.font = font(700, 20, F.mono); ctx.fillStyle = tinta;
      ctx.fillText(Number(data.nivel).toFixed(1) + '%', bx2 + bw2 + 14, by + bh);
    })();
    label('Vigencia', bx, 828); value(data.vence, bx, 854, 22, bw);

    // QR abajo a la derecha. Antes pisaba la frase del pie: ahora cada
    // uno tiene su franja y no se tocan.
    var qs = 168, qx = w - 60 - qs, qy = h - 260;
    ctx.fillStyle = '#fff';
    roundRect(ctx, qx - 10, qy - 10, qs + 20, qs + 20, 10); ctx.fill();
    drawQR(ctx, data.qrUrl, qx, qy, qs);
    ctx.fillStyle = tinta; ctx.font = font(700, 14);
    ctx.fillText(SITIO, qx + qs / 2 - ctx.measureText(SITIO).width / 2, qy + qs + 30);

    // Frase y avisos al pie, dentro de su franja y sin pisar el QR.
    var libre = qx - 84;
    ctx.fillStyle = tinta;
    var zf = fitText(ctx, data.frase || '', libre, 700, 24, 14);
    ctx.font = 'italic ' + font(700, zf);
    ctx.fillText(data.frase || '', 60, h - 118);

    ctx.font = font(800, 22);
    ctx.globalAlpha = 0.95;
    ctx.fillText('#team' + (data.hashtag || 'palomos'), 60, h - 72);
    ctx.globalAlpha = 1;

    ctx.font = font(600, 12);
    ctx.globalAlpha = 0.7;
    ctx.fillText('DOCUMENTO DE PARODIA · SIN VALIDEZ LEGAL · MEME DE @javimolinax', 60, h - 40);
    ctx.globalAlpha = 1;

    return canvas;
  }

  global.Carnet = {
    render: renderCarnet,
    loadAssets: loadAssets,
    drawPalomo: drawPalomo,
    medidas: function (id) {
      var e = estiloDe(id);
      if (e.formato === 'solapin')  { return { w: 760, h: 1060 }; }
      if (e.formato === 'cuadrado') { return { w: 1000, h: 1000 }; }
      return { w: W, h: H };
    },
    estilos: function () {
      return ORDEN.map(function (id) {
        return { id: id, nombre: ESTILOS[id].nombre, familia: ESTILOS[id].familia };
      });
    },
    catalogo: catalogo,
    datosMuestra: datosMuestra,
    drawEmblema: drawEmblema,
    W: W,
    H: H
  };

})(window);
