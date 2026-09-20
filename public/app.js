/* =========================================================================
   Carnet de Palomo — lógica de la interfaz.
   La foto nunca se sube: vive solo en el canvas del navegador.
   Al servidor solo va el nombre, para que firme el token de verificación.
   ========================================================================= */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  var PHOTO_W = 400, PHOTO_H = 500;
  var EXPORT_SCALE = 2;   // 2024x1276: de sobra para el QR y pesa la mitad

  var state = {
    photo: null,      // canvas 400x500 con la foto recortada
    stream: null,
    carnet: null,     // datos emitidos por el servidor
    blob: null,       // PNG listo para descargar/compartir
    prevStep: 'step-form'
  };

  /* ---------------- navegación ---------------- */

  function go(id) {
    var steps = document.querySelectorAll('.step');
    var i;
    for (i = 0; i < steps.length; i++) { steps[i].removeAttribute('data-active'); }
    $(id).setAttribute('data-active', '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------------- portada: sello del Ministerio ---------------- */

  // El emblema del palomo, no el escudo nacional: los símbolos patrios
  // solo aparecen en el carnet, tal cual son.
  function paintHeroSeal() {
    var cv = $('heroSeal');
    if (!cv || !window.Carnet) { return; }

    var S = 260;
    var ctx = cv.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    cv.width = S * dpr;
    cv.height = S * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, S, S);

    var c = S / 2;
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(c, c, 116, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(c, c, 102, 0, Math.PI * 2);
    ctx.stroke();

    window.Carnet.drawPalomo(ctx, c, c - 10, 150, '#c9a227');

    ctx.fillStyle = '#c9a227';
    ctx.font = "700 13px 'Archivo', system-ui, sans-serif";
    var t = 'MINISTERIO DE PALOMOS';
    ctx.fillText(t, c - ctx.measureText(t).width / 2, c + 78);
  }

  /* ---------------- foto ---------------- */

  function cropToCanvas(source, sw, sh) {
    var cv = document.createElement('canvas');
    cv.width = PHOTO_W;
    cv.height = PHOTO_H;
    var ctx = cv.getContext('2d');

    // "cover": llena el marco sin deformar
    var targetRatio = PHOTO_W / PHOTO_H;
    var srcRatio = sw / sh;
    var cw, ch, cx, cy;

    if (srcRatio > targetRatio) {
      ch = sh;
      cw = sh * targetRatio;
      cx = (sw - cw) / 2;
      cy = 0;
    } else {
      cw = sw;
      ch = sw / targetRatio;
      cx = 0;
      cy = (sh - ch) / 2 * 0.72; // un pelín arriba: la cara queda mejor encuadrada
    }

    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, cx, cy, cw, ch, 0, 0, PHOTO_W, PHOTO_H);
    return cv;
  }

  function setPhoto(canvas) {
    state.photo = canvas;

    var prev = $('photoCanvas');
    prev.width = PHOTO_W;
    prev.height = PHOTO_H;
    prev.getContext('2d').drawImage(canvas, 0, 0);
    $('photoPreview').classList.add('has-photo');

    validate();
  }

  function handleFile(file) {
    if (!file) { return; }
    if (!/^image\//.test(file.type)) {
      showError('formError', 'Eso no parece una imagen. Prueba con una foto.');
      return;
    }

    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function () {
      setPhoto(cropToCanvas(img, img.naturalWidth, img.naturalHeight));
      URL.revokeObjectURL(url);
      hideError('formError');
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      showError('formError', 'No pudimos leer esa imagen. Prueba con otra.');
    };
    img.src = url;
  }

  /* ---------------- cámara ---------------- */

  function openCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // Sin cámara web: caemos al selector nativo, que en móvil abre la cámara.
      $('fileInput').setAttribute('capture', 'user');
      $('fileInput').click();
      return;
    }

    state.prevStep = 'step-form';
    hideError('camError');
    go('step-camera');

    navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 1600 } },
      audio: false
    }).then(function (stream) {
      state.stream = stream;
      var v = $('video');
      v.srcObject = stream;
      return v.play();
    }).catch(function () {
      showError('camError',
        'No pudimos abrir la cámara. Puede que la hayas bloqueado, o que este navegador no la permita. Usa «Subir foto».');
    });
  }

  function closeCamera() {
    if (state.stream) {
      state.stream.getTracks().forEach(function (t) { t.stop(); });
      state.stream = null;
    }
    $('video').srcObject = null;
  }

  function shoot() {
    var v = $('video');
    if (!v.videoWidth) { return; }

    // Espejamos para que coincida con lo que la persona ve en pantalla.
    var tmp = document.createElement('canvas');
    tmp.width = v.videoWidth;
    tmp.height = v.videoHeight;
    var tctx = tmp.getContext('2d');
    tctx.translate(tmp.width, 0);
    tctx.scale(-1, 1);
    tctx.drawImage(v, 0, 0);

    setPhoto(cropToCanvas(tmp, tmp.width, tmp.height));
    closeCamera();
    go('step-form');
  }

  /* ---------------- validación ---------------- */

  function cleanName(raw) {
    return raw.replace(/\s+/g, ' ').trim();
  }

  function validate() {
    var nombre = cleanName($('inNombre').value);
    var ok = nombre.length >= 2 && !!state.photo;
    $('btnGenerar').disabled = !ok;
    return ok;
  }

  function showError(id, msg) {
    var el = $(id);
    el.textContent = msg;
    el.hidden = false;
  }
  function hideError(id) { $(id).hidden = true; }

  /* ---------------- emisión ---------------- */

  function emitir() {
    if (!validate()) { return; }

    var btn = $('btnGenerar');
    btn.disabled = true;
    btn.textContent = 'Emitiendo…';
    hideError('formError');

    fetch('/api/emitir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: cleanName($('inNombre').value) })
    }).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok || !j.ok) { throw new Error(j.error || 'Falló la emisión'); }
        return j;
      });
    }).then(function (j) {
      state.carnet = j;
      return drawResult(j);
    }).then(function () {
      go('step-result');
    }).catch(function (err) {
      showError('formError', 'No se pudo emitir el carnet: ' + err.message + '. Intenta de nuevo.');
    }).finally(function () {
      btn.disabled = false;
      btn.textContent = 'Emitir carnet';
    });
  }

  function loadFonts() {
    if (!document.fonts || !document.fonts.load) { return Promise.resolve(); }
    return Promise.all([
      document.fonts.load("600 11px 'Archivo'"),
      document.fonts.load("700 17px 'Archivo'"),
      document.fonts.load("700 21px 'Archivo'"),
      document.fonts.load("800 19px 'Archivo'"),
      document.fonts.load("400 26px 'IBM Plex Mono'"),
      document.fonts.load("700 32px 'IBM Plex Mono'")
    ]).catch(function () { /* si fallan, canvas usa el fallback */ });
  }

  function drawResult(j) {
    // Los símbolos oficiales tienen que estar cargados antes de pintar,
    // si no el carnet sale sin escudo ni bandera.
    return Promise.all([loadFonts(), window.Carnet.loadAssets()]).then(function () {
      var data = {
        nombre: j.nombre,
        serial: j.serial,
        emitido: j.emitido,
        vence: j.vence,
        nivel: j.nivel,
        categoria: j.categoria,
        lugar: j.lugar,
        oficio: j.oficio,
        qrUrl: j.verifyUrl,
        photo: state.photo
      };

      window.Carnet.render($('carnetCanvas'), data, EXPORT_SCALE);

      $('secuencial').textContent = 'Eres el palomo número ' +
        Number(j.secuencial).toLocaleString('es-DO');

      $('verifyLink').href = j.verifyUrl;
      $('verifyLink').textContent = j.verifyUrl;

      setupWalletButtons(j);

      return new Promise(function (resolve) {
        $('carnetCanvas').toBlob(function (b) {
          state.blob = b;
          $('btnCompartir').hidden = !canShareFile();
          resolve();
        }, 'image/png');
      });
    });
  }

  /* ---------------- wallet ---------------- */

  function setupWalletButtons(j) {
    var w = j.wallet || {};
    var note = $('walletNote');
    var notes = [];

    var gBtn = $('btnGoogleWallet');
    gBtn.hidden = !w.google;
    if (w.google) {
      gBtn.onclick = function () {
        gBtn.disabled = true;
        fetch('/api/wallet/google?t=' + encodeURIComponent(j.token))
          .then(function (r) { return r.json(); })
          .then(function (res) {
            if (res.saveUrl) { window.location.href = res.saveUrl; }
            else { throw new Error(res.error || 'sin enlace'); }
          })
          .catch(function () {
            notes.push('Google Wallet no respondió. Descarga el PNG mientras tanto.');
            note.textContent = notes.join(' ');
          })
          .finally(function () { gBtn.disabled = false; });
      };
    }

    var aBtn = $('btnAppleWallet');
    aBtn.hidden = !w.apple;
    if (w.apple) {
      aBtn.onclick = function () {
        window.location.href = '/api/wallet/apple?t=' + encodeURIComponent(j.token);
      };
    }

    if (!w.google && !w.apple) {
      note.textContent = 'El pase de Wallet todavía no está activo. Por ahora descarga el carnet ' +
        'como imagen y guárdalo en tus fotos.';
    } else {
      note.textContent = '';
    }
  }

  /* ---------------- descargar / compartir ---------------- */

  function fileName() {
    var n = state.carnet ? state.carnet.nombre : 'palomo';
    return 'carnet-de-palomo-' +
      n.normalize('NFD').replace(/[̀-ͯ]/g, '')
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') +
      '.png';
  }

  function descargar() {
    if (!state.blob) { return; }
    var url = URL.createObjectURL(state.blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = fileName();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  function canShareFile() {
    if (!navigator.canShare || !state.blob) { return false; }
    try {
      return navigator.canShare({
        files: [new File([state.blob], fileName(), { type: 'image/png' })]
      });
    } catch (e) { return false; }
  }

  function compartir() {
    if (!state.blob) { return; }
    var file = new File([state.blob], fileName(), { type: 'image/png' });
    navigator.share({
      files: [file],
      title: 'Mi Carnet de Palomo',
      text: 'Ya soy palomo certificado por el Ministerio de Palomos. Saca el tuyo:'
    }).catch(function () { /* el usuario canceló */ });
  }

  /* ---------------- arranque ---------------- */

  function reset() {
    state.photo = null;
    state.carnet = null;
    state.blob = null;
    $('inNombre').value = '';
    $('photoPreview').classList.remove('has-photo');
    $('fileInput').value = '';
    validate();
    go('step-form');
  }

  function init() {
    paintHeroSeal();
    loadFonts().then(paintHeroSeal);   // se repinta cuando llega la tipografía
    window.Carnet.loadAssets();        // el escudo y la bandera, ya listos al emitir

    $('btnStart').addEventListener('click', function () { go('step-form'); });

    document.querySelectorAll('[data-back]').forEach(function (b) {
      b.addEventListener('click', function () { go('step-intro'); });
    });

    $('inNombre').addEventListener('input', validate);
    $('inNombre').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && validate()) { emitir(); }
    });

    $('btnUpload').addEventListener('click', function () {
      $('fileInput').removeAttribute('capture');
      $('fileInput').click();
    });
    $('btnCamera').addEventListener('click', openCamera);
    $('fileInput').addEventListener('change', function (e) { handleFile(e.target.files[0]); });

    $('btnShoot').addEventListener('click', shoot);
    $('btnCamCancel').addEventListener('click', function () {
      closeCamera();
      go(state.prevStep);
    });

    $('btnGenerar').addEventListener('click', emitir);
    $('btnDescargar').addEventListener('click', descargar);
    $('btnCompartir').addEventListener('click', compartir);
    $('btnOtro').addEventListener('click', reset);

    window.addEventListener('pagehide', closeCamera);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
