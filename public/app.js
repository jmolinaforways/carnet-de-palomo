/* =========================================================================
   Carnet de Palomo — lógica de la interfaz.
   La foto nunca se sube: vive solo en el canvas del navegador.
   Al servidor solo va el nombre, para que firme el token de verificación.
   ========================================================================= */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  var SITIO = 'https://palomos.com.do';
  var PHOTO_W = 400, PHOTO_H = 500;
  var EXPORT_SCALE = 2;   // 2024x1276: de sobra para el QR y pesa la mitad

  var state = {
    photo: null,      // canvas 400x500 con la foto recortada
    stream: null,
    carnet: null,     // datos emitidos por el servidor
    blob: null,       // PNG listo para descargar/compartir
    familia: 'carnet',
    exp: 'A',
    prevStep: 'step-form',
    tipo: 'palomo',
    estilo: 'oficial'
  };

  /* ---------------- navegación ---------------- */

  function go(id) {
    var steps = document.querySelectorAll('.step');
    var i;
    for (i = 0; i < steps.length; i++) { steps[i].removeAttribute('data-active'); }
    $(id).setAttribute('data-active', '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------------- portada: carnet de muestra ---------------- */

  // Una silueta genérica. No es la foto de nadie.
  function fotoDemo() {
    var cv = document.createElement('canvas');
    cv.width = PHOTO_W;
    cv.height = PHOTO_H;
    var c = cv.getContext('2d');

    var g = c.createLinearGradient(0, 0, 0, PHOTO_H);
    g.addColorStop(0, '#d3e0ee');
    g.addColorStop(1, '#a9bdd4');
    c.fillStyle = g;
    c.fillRect(0, 0, PHOTO_W, PHOTO_H);

    c.fillStyle = '#7e95b2';
    c.beginPath();
    c.arc(PHOTO_W / 2, PHOTO_H * 0.36, PHOTO_W * 0.21, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.ellipse(PHOTO_W / 2, PHOTO_H * 1.04, PHOTO_W * 0.37, PHOTO_H * 0.42, 0, 0, Math.PI * 2);
    c.fill();

    return cv;
  }

  // Los diseños se dibujan aquí, con datos de muestra: la portada no le
  // pide ni un carnet al servidor, que gastaría números del contador.
  // A escala reducida: son miniaturas, y a tamano completo serian veinte
  // lienzos de casi un millon de pixeles cada uno nada mas abrir la pagina.
  function miniatura(tipo, estilo, escala) {
    var cv = document.createElement('canvas');
    window.Carnet.render(cv, window.Carnet.datosMuestra(tipo, estilo, fotoDemo()), escala || 0.42, estilo);
    var url = cv.toDataURL('image/jpeg', 0.8);
    cv.width = cv.height = 0;   // el lienzo ya no hace falta
    return url;
  }

  // Cuatro diseños por lámina. Cada uno se encaja entero en su hueco,
  // que es la única forma de enseñar juntos un carnet apaisado, un
  // solapín vertical y un cuadrado sin deformar ninguno.
  var POR_LAMINA = 4;

  function pintarSlider() {
    var cont = $('slider');
    var puntos = $('puntos');
    if (!cont || !window.Carnet) { return; }
    cont.innerHTML = '';
    if (puntos) { puntos.innerHTML = ''; }

    var todos = window.Carnet.catalogo();
    var laminas = Math.ceil(todos.length / POR_LAMINA);

    for (var i = 0; i < laminas; i++) {
      var lam = document.createElement('div');
      lam.className = 'lamina';
      todos.slice(i * POR_LAMINA, (i + 1) * POR_LAMINA).forEach(function (c) {
        var fig = document.createElement('figure');
        var img = new Image();
        img.src = miniatura(c.tipo, c.estilo);
        img.alt = c.nombre + ', ' + c.familia + ' de ' + c.tipo;
        img.loading = 'lazy';
        img.decoding = 'async';
        fig.appendChild(img);
        lam.appendChild(fig);
      });
      cont.appendChild(lam);

      if (puntos) {
        var p = document.createElement('button');
        p.type = 'button';
        p.className = 'punto' + (i ? '' : ' on');
        p.setAttribute('aria-label', 'Diseños ' + (i + 1) + ' de ' + laminas);
        (function (n) {
          p.addEventListener('click', function () {
            cont.scrollTo({ left: cont.clientWidth * n, behavior: 'smooth' });
          });
        })(i);
        puntos.appendChild(p);
      }
    }

    // Tocar un diseño de la portada lleva directo al formulario: quien
    // toca ya decidió, y hacerle buscar el botón es tiempo perdido. Se
    // distingue el toque del arrastre, o deslizar abriría el formulario.
    (function () {
      var x0 = 0, y0 = 0, arrastro = false;
      cont.addEventListener('pointerdown', function (e) {
        x0 = e.clientX; y0 = e.clientY; arrastro = false;
      });
      cont.addEventListener('pointermove', function (e) {
        if (Math.abs(e.clientX - x0) > 8 || Math.abs(e.clientY - y0) > 8) { arrastro = true; }
      });
      cont.addEventListener('click', function () {
        if (!arrastro) { go('step-form'); }
      });
    })();

    // Las flechas del escritorio avanzan una lámina entera.
    (function () {
      var atras = $('sliderAtras'), alante = $('sliderAlante');
      if (!atras || !alante) { return; }

      function estado() {
        atras.disabled = cont.scrollLeft < 8;
        alante.disabled = cont.scrollLeft > cont.scrollWidth - cont.clientWidth - 8;
      }
      function mover(d) {
        cont.scrollBy({ left: cont.clientWidth * d, behavior: 'smooth' });
      }
      atras.onclick = function () { mover(-1); };
      alante.onclick = function () { mover(1); };
      cont.addEventListener('scroll', estado, { passive: true });
      estado();
    })();

    if (puntos) {
      cont.addEventListener('scroll', function () {
        var n = Math.round(cont.scrollLeft / Math.max(1, cont.clientWidth));
        for (var k = 0; k < puntos.children.length; k++) {
          puntos.children[k].classList.toggle('on', k === n);
        }
      }, { passive: true });
    }
  }

  /* ---------------- el experimento ---------------- */

  // Dos ramas: A enseña los diez diseños, B enseña uno solo y sin
  // elección. Lo que se compara es la elección, no un diseño concreto:
  // por eso en B el que sale es igual de aleatorio que en A.
  //
  // La rama se queda en el navegador de cada quien. No viaja ningún
  // identificador de persona: al servidor solo llega la letra.
  function ramaDelExperimento() {
    var guardada = null;
    try { guardada = localStorage.getItem('palomos.exp'); } catch (e) { /* modo privado */ }
    if (guardada === 'A' || guardada === 'B') { return guardada; }
    var nueva = Math.random() < 0.5 ? 'A' : 'B';
    try { localStorage.setItem('palomos.exp', nueva); } catch (e) { /* da igual */ }
    return nueva;
  }

  // Marca que este navegador ya paso por aqui. Devuelve true solo la
  // primera vez. Si el navegador no deja escribir -modo privado-,
  // devuelve false siempre: mejor no contar que contar de mas.
  function primeraVez(que) {
    var clave = 'palomos.hito.' + que;
    try {
      if (localStorage.getItem(clave)) { return false; }
      localStorage.setItem(clave, '1');
      return true;
    } catch (e) {
      return false;
    }
  }

  function yaPaso(que) {
    try { return !!localStorage.getItem('palomos.hito.' + que); } catch (e) { return true; }
  }

  function marcar(que) {
    try { localStorage.setItem('palomos.hito.' + que, '1'); } catch (e) { /* da igual */ }
  }

  function anotarPaso(paso) {
    var cuerpo = JSON.stringify({ exp: state.exp, paso: paso });
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/paso', new Blob([cuerpo], { type: 'application/json' }));
        return;
      }
    } catch (e) { /* seguimos por fetch */ }
    fetch('/api/paso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: cuerpo,
      keepalive: true
    }).catch(function () { /* una métrica no puede romper nada */ });
  }

  // El que viene marcado de serie se lleva la mitad de las elecciones
  // sin que nadie lo elija. Rotándolo, el sesgo se reparte entre los
  // diez y en unos días la medición sirve para algo.
  function disenoDeSalida() {
    var todos = window.Carnet.estilos();
    return todos[Math.floor(Math.random() * todos.length)];
  }

  function deLaFamilia() {
    return window.Carnet.estilos().filter(function (e) {
      return e.familia === state.familia;
    });
  }

  function marcarElegido() {
    var cont = $('disenos');
    var nombre = $('disenoNombre');
    if (!cont) { return; }
    for (var i = 0; i < cont.children.length; i++) {
      var b = cont.children[i];
      var suyo = b.getAttribute('data-estilo') === state.estilo;
      b.classList.toggle('elegido', suyo);
      b.setAttribute('aria-pressed', suyo ? 'true' : 'false');
      if (suyo && nombre) { nombre.textContent = b.getAttribute('data-nombre'); }
    }
  }

  // La miniatura del selector lleva sus propios datos, no los de muestra.
  // Se dibuja en su teléfono, así que verlas todas no gasta ningún número
  // del contador: eso solo pasa al emitir.
  function miniaturaPropia(estilo) {
    var d = window.Carnet.datosMuestra(state.tipo, estilo, state.photo || fotoDemo());
    var nombre = cleanName($('inNombre').value);
    if (nombre) { d.nombre = nombre.toLocaleUpperCase('es'); }
    var lugar = cleanName($('inLugar').value);
    if (lugar) { d.lugar = lugar.toLocaleUpperCase('es'); }
    var c = $('inConcepto') ? $('inConcepto').value.trim() : '';
    if (c) { d.concepto = c; }

    var cv = document.createElement('canvas');
    window.Carnet.render(cv, d, 0.42, estilo);
    var url = cv.toDataURL('image/jpeg', 0.8);
    cv.width = cv.height = 0;
    return url;
  }

  function pintarSelector(centrar) {
    var cont = $('disenos');
    if (!cont || !window.Carnet) { return; }

    var lista = deLaFamilia();
    if (!lista.length) { return; }

    // Al cambiar de formato, el estilo elegido puede no existir ya en la
    // familia nueva: se toma el primero para que el botón siga vivo.
    var sigue = lista.some(function (e) { return e.id === state.estilo; });
    if (!sigue) { state.estilo = lista[0].id; }

    // En la rama B no hay nada que elegir: sale el suyo y ya.
    if (state.exp === 'B') { lista = lista.filter(function (e) { return e.id === state.estilo; }); }

    cont.innerHTML = '';
    lista.forEach(function (e) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'diseno';
      b.setAttribute('data-estilo', e.id);
      b.setAttribute('data-nombre', e.nombre);
      b.setAttribute('aria-label', 'Diseño ' + e.nombre);
      b.innerHTML = '<span class="caja"><img src="' + miniaturaPropia(e.id) + '" alt=""></span>';
      b.addEventListener('click', function () {
        state.estilo = e.id;
        marcarElegido();
        flechasSelector();
        b.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      });
      cont.appendChild(b);
    });

    marcarElegido();

    // El carrusel abria siempre en el primero, asi que el diseno
    // elegido podia quedar fuera de pantalla: se marcaba uno y se
    // ensenaba otro. Y de paso el primero de la lista se llevaba
    // elecciones por estar delante, no por gustar mas.
    if (centrar !== false) {
      var i = 0;
      lista.forEach(function (e, n) { if (e.id === state.estilo) { i = n; } });
      if (cont.children[i]) {
        cont.children[i].scrollIntoView({ block: 'nearest', inline: 'center' });
      }
    }

    flechasSelector();
  }

  // Aquí la flecha no solo desplaza: cambia el diseño elegido, que es
  // lo que se espera de un selector.
  function moverSeleccion(paso) {
    var lista = deLaFamilia();
    var i = 0;
    lista.forEach(function (e, n) { if (e.id === state.estilo) { i = n; } });
    var j = Math.max(0, Math.min(lista.length - 1, i + paso));
    if (j === i) { return; }

    state.estilo = lista[j].id;
    marcarElegido();
    flechasSelector();

    var cont = $('disenos');
    if (cont && cont.children[j]) {
      cont.children[j].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  function flechasSelector() {
    var atras = $('disenoAtras'), alante = $('disenoAlante');
    if (!atras || !alante) { return; }
    var lista = deLaFamilia();
    var i = 0;
    lista.forEach(function (e, n) { if (e.id === state.estilo) { i = n; } });
    atras.disabled = i <= 0;
    alante.disabled = i >= lista.length - 1;
  }

  function elegirFamilia(f) {
    state.familia = f;
    $('famCarnet').classList.toggle('activo', f === 'carnet');
    $('famCredencial').classList.toggle('activo', f === 'credencial');
    pintarSelector();
  }

  function elegirTipo(t) {
    state.tipo = t;
    $('tipoPalomo').classList.toggle('activo', t === 'palomo');
    $('tipoPariguayo').classList.toggle('activo', t === 'pariguayo');
    pintarSelector();
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
    // La ciudad es opcional; aceptar los términos no lo es.
    var ok = nombre.length >= 2 && !!state.photo && $('inAcepto').checked;
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

    var btn = $('btnSeguir');
    btn.disabled = true;
    btn.textContent = 'Emitiendo…';
    // El aviso va en la pantalla donde esta la persona, que ya no es
    // la de los datos sino la de los disenos.
    hideError('estiloError');

    fetch('/api/emitir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: cleanName($('inNombre').value),
        lugar: cleanName($('inLugar').value),
        concepto: ($('inConcepto') ? $('inConcepto').value : ''),
        exp: state.exp,
        expPrimera: !yaPaso('emitido'),
        tipo: state.tipo,
        estilo: state.estilo
      })
    }).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok || !j.ok) { throw new Error(j.error || 'Falló la emisión'); }
        return j;
      });
    }).then(function (j) {
      // Solo al salir bien: si la emision falla, el navegador sigue
      // contando como que no ha emitido nunca.
      marcar('emitido');
      state.carnet = j;
      return drawResult(j);
    }).then(function () {
      go('step-result');
    }).catch(function (err) {
      showError('estiloError', 'No se pudo emitir el carnet: ' + err.message + '. Intenta de nuevo.');
    }).finally(function () {
      btn.disabled = false;
      btn.textContent = 'Emitir mi carnet';
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
    return Promise.all([loadFonts(), window.Carnet.loadAssets()]).then(function () {
      var data = Object.assign({}, j, {
        qrUrl: j.verifyUrl,
        photo: state.photo
      });

      window.Carnet.render($('carnetCanvas'), data, EXPORT_SCALE, j.estilo || state.estilo);

      $('secuencial').textContent = 'Eres el ' + (j.tipo || 'palomo') + ' número ' +
        Number(j.secuencial).toLocaleString('es-DO');

      $('verifyLink').href = j.verifyUrl;
      $('verifyLink').textContent = j.verifyUrl;

      return new Promise(function (resolve) {
        $('carnetCanvas').toBlob(function (b) {
          state.blob = b;
          resolve();
        }, 'image/png');
      });
    });
  }

  /* ---------------- visor a pantalla completa ---------------- */

  // En el teléfono el carnet se ve diminuto. Al tocarlo se abre a pantalla
  // completa, girado, que es como se lee de verdad.
  function abrirVisor() {
    if (!state.blob) { return; }
    var img = $('visorImg');
    if (img.src) { URL.revokeObjectURL(img.src); }
    img.src = URL.createObjectURL(state.blob);
    $('visor').setAttribute('data-open', '');
    document.body.style.overflow = 'hidden';
  }

  function cerrarVisor() {
    $('visor').removeAttribute('data-open');
    document.body.style.overflow = '';
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

  // El carnet con su texto debajo.
  //
  // A Instagram y a TikTok no se les puede mandar una imagen desde una
  // web: no existe enlace ni API que lo permita. La única vía es la hoja
  // de compartir del sistema, donde esas apps aparecen como destino. Por
  // eso los tres botones abren la misma hoja: es lo máximo que la
  // plataforma deja hacer, no una simplificación nuestra.
  //
  // Facebook sí acepta un enlace, y lo usamos donde no haya hoja nativa.

  function textoCompartir() {
    return [
      'Ya soy palomo certificado.',
      '',
      'Ahora saca el tuyo: ' + SITIO
    ].join('\n');
  }

  function archivoCarnet() {
    return new File([state.blob], fileName(), { type: 'image/png' });
  }

  function puedeCompartirArchivo() {
    if (!navigator.canShare || !state.blob) { return false; }
    try {
      return navigator.canShare({ files: [archivoCarnet()] });
    } catch (e) { return false; }
  }

  function pista(msg) {
    var el = $('shareHint');
    el.textContent = msg;
    el.hidden = false;
  }

  function compartir(red) {
    if (!state.blob) { return; }
    $('shareHint').hidden = true;

    var texto = textoCompartir();

    // Con hoja nativa va la imagen y el texto juntos, a la app que elijan.
    if (puedeCompartirArchivo()) {
      navigator.share({ files: [archivoCarnet()], text: texto })
        .catch(function () { /* el usuario canceló */ });
      return;
    }

    // Sin hoja nativa (escritorio), solo el enlace, y solo donde se pueda.
    if (red === 'whatsapp') {
      window.open('https://wa.me/?text=' + encodeURIComponent(texto), '_blank', 'noopener');
      return;
    }
    if (red === 'facebook') {
      window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(SITIO),
                  '_blank', 'noopener');
      return;
    }

    pista('Instagram y TikTok no dejan publicar desde el navegador. ' +
          'Descarga el carnet y súbelo desde la app, o abre esta página en tu teléfono.');
  }

  /* ---------------- arranque ---------------- */

  function reset() {
    state.photo = null;
    state.carnet = null;
    state.blob = null;
    $('inNombre').value = '';
    $('inLugar').value = '';
    $('inAcepto').checked = false;
    $('photoPreview').classList.remove('has-photo');
    if ($('inConcepto')) { $('inConcepto').value = ''; }
    if ($('cuentaConcepto')) { $('cuentaConcepto').textContent = '80'; }
    go('step-form');
    $('fileInput').value = '';
    validate();
  }

  function init() {
    state.exp = ramaDelExperimento();

    // Sale un diseño distinto en cada visita, y en la rama B ese es el
    // único que se ve.
    (function () {
      var d = disenoDeSalida();
      state.estilo = d.id;
      state.familia = d.familia;
    })();

    if (state.exp === 'B') {
      var tabs = document.querySelectorAll('.tipos-sm');
      for (var i = 0; i < tabs.length; i++) { tabs[i].hidden = true; }
      var f1 = $('disenoAtras'), f2 = $('disenoAlante');
      if (f1) { f1.hidden = true; }
      if (f2) { f2.hidden = true; }
      var pista = document.querySelector('#step-estilo .hint');
      if (pista) { pista.textContent = 'Este es el tuyo, ya con tu cara y tu nombre.'; }
    }

    // La bandera es un archivo y tarda. Se pide aqui y, cuando llega,
    // se repinta lo que la lleva.
    //
    // Antes la unica llamada a loadAssets() estaba dentro de
    // drawResult, asi que la bandera solo existia en el carnet ya
    // emitido: en la portada y en el selector salia el hueco vacio.
    window.Carnet.loadAssets();
    window.Carnet.alLlegarLaBandera(function () {
      pintarSlider();
      pintarSelector(false);
    });

    loadFonts().then(function () {
      pintarSlider();
      // elegirFamilia y no pintarSelector: el diseno de salida es
      // aleatorio y su pestana de formato tiene que venir marcada.
      elegirFamilia(state.familia);
    });

    $('btnStart').addEventListener('click', function () { go('step-form'); });
    $('tipoPalomo').addEventListener('click', function () { elegirTipo('palomo'); });
    $('tipoPariguayo').addEventListener('click', function () { elegirTipo('pariguayo'); });
    $('famCarnet').addEventListener('click', function () { elegirFamilia('carnet'); });
    $('famCredencial').addEventListener('click', function () { elegirFamilia('credencial'); });
    $('disenoAtras').addEventListener('click', function () { moverSeleccion(-1); });
    $('disenoAlante').addEventListener('click', function () { moverSeleccion(1); });
    $('btnSeguir').addEventListener('click', emitir);

    document.querySelectorAll('[data-back]').forEach(function (b) {
      var destino = b.getAttribute('data-back') || 'step-intro';
      b.addEventListener('click', function () {
        go(destino);
        if (destino === 'step-estilo') { pintarSelector(false); }
      });
    });

    (function () {
      var c = $('inConcepto'), n = $('cuentaConcepto');
      if (!c || !n) { return; }
      c.addEventListener('input', function () {
        n.textContent = String(80 - c.value.length);
      });
    })();

    $('inNombre').addEventListener('input', validate);
    $('inAcepto').addEventListener('change', validate);
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

    // Del paso de datos se pasa a elegir, y las vistas previas se
    // redibujan para que salgan con la foto y el nombre recién puestos.
    $('btnGenerar').addEventListener('click', function () {
      if (!validate()) { return; }
      go('step-estilo');
      pintarSelector();
      anotarPaso('elegir');
      // Y una vez por navegador, que es lo que de verdad se compara.
      if (primeraVez('elegir')) { anotarPaso('elegir-unico'); }
    });
    $('btnDescargar').addEventListener('click', descargar);
    $('btnWhatsapp').addEventListener('click', function () { compartir('whatsapp'); });
    $('shInstagram').addEventListener('click', function () { compartir('instagram'); });
    $('shFacebook').addEventListener('click', function () { compartir('facebook'); });
    $('shTiktok').addEventListener('click', function () { compartir('tiktok'); });
    $('btnOtro').addEventListener('click', reset);

    $('carnetStage').addEventListener('click', abrirVisor);
    $('visorCerrar').addEventListener('click', cerrarVisor);
    $('visor').addEventListener('click', function (e) {
      if (e.target === $('visor')) { cerrarVisor(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { cerrarVisor(); }
    });

    window.addEventListener('pagehide', closeCamera);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
