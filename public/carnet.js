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

  var C = {
    bg1:   '#fbfdff',
    bg2:   '#e6eef7',
    navy:  '#13294b',
    navy2: '#31507f',
    label: '#6b7c93',
    gold:  '#b8860f',
    red:   '#c8102e',
    line:  'rgba(19,41,75,.16)',
    ghost: '#9fb6d0'
  };

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

    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = '#b9cde2';
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
    ctx.fillStyle = C.navy;
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

  /* =======================================================================
     Render
     ======================================================================= */

  function renderCarnet(canvas, data, scale) {
    scale = scale || 1;
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
    ctx.globalAlpha = 0.045;
    drawPalomo(ctx, 655, 290, 330, C.navy);
    ctx.restore();

    /* --- cabecera --- */
    drawEmblema(ctx, 58, 46, 62, C.navy);

    ctx.fillStyle = C.navy;
    ctx.font = font(800, 30);
    ctx.fillText('PALOMOS RD', 100, 57);
    var anchoMarca = ctx.measureText('PALOMOS RD').width;

    var divisor = 100 + anchoMarca + 26;
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(divisor, 18);
    ctx.lineTo(divisor, 74);
    ctx.stroke();

    ctx.fillStyle = C.gold;
    ctx.font = font(700, 21);
    ctx.fillText('Ministerio de Palomos', divisor + 20, 53);

    ctx.fillStyle = C.navy;
    ctx.font = font(700, 17);
    (function () {
      var t = 'CARNET DE PALOMO';
      var tw = trackedWidth(ctx, t, 1.6);
      tracked(ctx, t, W - 32 - tw, 53, 1.6);
    })();

    // Regla bajo la cabecera, partida en azul y rojo con el papel de por medio.
    (function () {
      var y = 89, x0 = 32, w = W - 64, h = 3;
      ctx.fillStyle = C.navy;
      ctx.fillRect(x0, y, w * 0.46, h);
      ctx.fillStyle = C.red;
      ctx.fillRect(x0 + w * 0.54, y, w * 0.46, h);
    })();

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

    /* --- foto --- */
    var PX = 32, PY = 106, PW = 182, PH = 228;

    ctx.save();
    roundRect(ctx, PX, PY, PW, PH, 4);
    ctx.clip();
    if (data.photo) {
      ctx.drawImage(data.photo, PX, PY, PW, PH);
    } else {
      ctx.fillStyle = '#c3d2e2';
      ctx.fillRect(PX, PY, PW, PH);
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(19,41,75,.25)';
    ctx.lineWidth = 1;
    roundRect(ctx, PX, PY, PW, PH, 4);
    ctx.stroke();

    /* --- firma bajo la foto --- */
    label('Firma', PX, 364);
    drawSignature(ctx, PX + 46, 348, 136, 46, seed);
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PX, 398);
    ctx.lineTo(PX + PW, 398);
    ctx.stroke();

    label('Vigencia hasta', PX, 422);
    (function () {
      // «UN PALOMO NUNCA MUERE» no cabe en una línea sobre la foto.
      var palabras = String(data.vence).split(' ');
      var lineas = [], actual = '';
      ctx.font = font(700, 17);
      palabras.forEach(function (p) {
        var prueba = actual ? actual + ' ' + p : p;
        if (ctx.measureText(prueba).width > PW && actual) {
          lineas.push(actual);
          actual = p;
        } else {
          actual = prueba;
        }
      });
      if (actual) lineas.push(actual);

      ctx.fillStyle = C.navy;
      lineas.slice(0, 2).forEach(function (l, i) {
        ctx.fillText(l, PX, 446 + i * 21);
      });
    })();

    /* --- columna de datos --- */
    var BX = 242, BW = 420;

    label('Número de palomo', BX, 124);
    value(data.serial, BX, 160, 32, BW, F.mono, 700);

    label('Nombre', BX, 198);
    value(nom.nombres, BX, 224, 23, BW);

    label('Apellido', BX, 256);
    value(nom.apellidos, BX, 282, 23, BW);

    label('Condición', BX, 314);
    value(data.categoria, BX, 340, 21, BW);

    label('Lugar de tranquilidad', BX, 372);
    value(data.lugar, BX, 398, 21, BW);

    label('Ocupación u oficio', BX, 430);
    value(data.oficio, BX, 456, 21, BW);

    /* --- columna derecha --- */
    var RX = 692;

    // foto fantasma, teñida de azul como en los documentos reales
    var GW = 92, GH = 115;
    ctx.save();
    roundRect(ctx, RX, 106, GW, GH, 3);
    ctx.clip();
    if (data.photo) {
      ctx.globalAlpha = 0.5;
      ctx.drawImage(data.photo, RX, 106, GW, GH);
      ctx.globalAlpha = 0.38;
      ctx.fillStyle = '#2f6fb0';
      ctx.fillRect(RX, 106, GW, GH);
    } else {
      ctx.fillStyle = C.ghost;
      ctx.fillRect(RX, 106, GW, GH);
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(19,41,75,.2)';
    ctx.lineWidth = 1;
    roundRect(ctx, RX, 106, GW, GH, 3);
    ctx.stroke();

    // QR
    var QS = 142, QX = W - 32 - QS, QY = 106;
    ctx.fillStyle = '#fff';
    roundRect(ctx, QX - 6, QY - 6, QS + 12, QS + 12, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(19,41,75,.18)';
    ctx.lineWidth = 1;
    roundRect(ctx, QX - 6, QY - 6, QS + 12, QS + 12, 6);
    ctx.stroke();
    drawQR(ctx, data.qrUrl, QX, QY, QS);

    (function () {
      var cx = QX + QS / 2;

      ctx.fillStyle = C.label;
      ctx.font = font(600, 10);
      var t = 'ESCANEA PARA VERIFICAR';
      tracked(ctx, t, cx - trackedWidth(ctx, t, 0.9) / 2, QY + QS + 20, 0.9);

      ctx.fillStyle = C.gold;
      ctx.font = font(700, 12);
      var d = SITIO;
      ctx.fillText(d, cx - ctx.measureText(d).width / 2, QY + QS + 38);
    })();

    // nivel de palomería
    label('Nivel de palomería', RX, 302);
    (function () {
      var bx = RX, by = 314, bw = 196, bh = 12;
      ctx.fillStyle = 'rgba(19,41,75,.12)';
      roundRect(ctx, bx, by, bw, bh, 6);
      ctx.fill();

      var pct = Math.max(0, Math.min(100, data.nivel)) / 100;
      var g = ctx.createLinearGradient(bx, 0, bx + bw, 0);
      g.addColorStop(0, C.navy2);
      g.addColorStop(1, C.red);
      ctx.fillStyle = g;
      roundRect(ctx, bx, by, Math.max(bh, bw * pct), bh, 6);
      ctx.fill();

      ctx.fillStyle = C.navy;
      ctx.font = font(700, 17, F.mono);
      ctx.fillText(data.nivel + '%', bx + bw + 12, by + bh);
    })();

    label('Estado', RX, 356);
    value('TRANQUILO', RX, 382, 20, 130);

    // El hashtag, en dos tonos: azul y rojo, los colores de RD.
    (function () {
      // A esta altura el sello ya se estrecha, así que no se tocan.
      var hx = RX, hy = 460;
      ctx.font = font(800, 21);
      ctx.fillStyle = C.navy;
      ctx.fillText('#team', hx, hy);
      ctx.fillStyle = C.red;
      ctx.fillText('palomos', hx + ctx.measureText('#team').width, hy);
    })();

    // sello del Ministerio
    (function () {
      var sx = 898, sy = 428;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(-0.12);
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(0, 0, 54, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(0, 0, 46, 0, Math.PI * 2);
      ctx.stroke();

      drawPalomo(ctx, 0, -8, 66, C.red);

      ctx.fillStyle = C.red;
      ctx.font = font(700, 8.5);
      var t = 'MINISTERIO DE PALOMOS';
      var tw = trackedWidth(ctx, t, 0.7);
      tracked(ctx, t, -tw / 2, 32, 0.7);
      ctx.restore();
    })();

    // número vertical en el canto derecho
    ctx.save();
    ctx.translate(W - 13, 478);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = 'rgba(19,41,75,.42)';
    ctx.font = font(600, 14, F.mono);
    ctx.fillText(deaccent(data.serial).replace(/-/g, ' '), 0, 0);
    ctx.restore();

    /* --- pie: MRZ + invitación + avisos --- */
    var MY = 496;
    ctx.fillStyle = 'rgba(255,255,255,.82)';
    ctx.fillRect(0, MY, W, H - MY);
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, MY);
    ctx.lineTo(W, MY);
    ctx.stroke();

    var lines = mrzLines(data);
    ctx.fillStyle = 'rgba(19,41,75,.82)';
    ctx.font = font(400, 25, F.mono);
    ctx.fillText(lines[0], 32, MY + 40);
    ctx.fillText(lines[1], 32, MY + 70);

    // invitación al club
    ctx.fillStyle = C.navy;
    ctx.font = font(700, 13);
    ctx.fillText(
      'Invita a tus panas palomos al club. Verifica este carnet con su número en ' + SITIO,
      32, MY + 102
    );

    ctx.fillStyle = C.label;
    ctx.font = font(600, 10.5);
    ctx.fillText('DOCUMENTO DE PARODIA · SIN VALIDEZ LEGAL · ES UN MEME', 32, MY + 126);

    ctx.fillStyle = C.gold;
    ctx.font = font(700, 11.5);
    (function () {
      var t = 'MEME DE @javimolinax';
      ctx.fillText(t, W - 32 - ctx.measureText(t).width, MY + 126);
    })();

    // Banda al pie, con los mismos colores y el mismo criterio que la regla.
    ctx.fillStyle = C.navy;
    ctx.fillRect(0, H - 7, W * 0.46, 7);
    ctx.fillStyle = C.red;
    ctx.fillRect(W * 0.54, H - 7, W * 0.46, 7);

    return canvas;
  }

  global.Carnet = {
    render: renderCarnet,
    loadAssets: loadAssets,
    drawPalomo: drawPalomo,
    drawEmblema: drawEmblema,
    W: W,
    H: H
  };

})(window);
