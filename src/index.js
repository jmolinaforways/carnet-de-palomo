/* =========================================================================
   Carnet de Palomo — Cloudflare Worker.

     POST /api/emitir        toma un secuencial, firma el carnet y lo devuelve
     GET  /v/<token>         página de verificación
     GET  /api/wallet/google pase de Google Wallet (si hay credenciales)
     GET  /api/wallet/apple  pase de Apple Wallet (si hay credenciales)
     resto                   archivos estáticos

   No guardamos carnets ni fotos. Lo único con estado es el contador de
   secuenciales, que vive en un Durable Object y solo sabe cuántos carnets
   se han emitido: ni un nombre, ni una foto, ni una IP.

   El resto del carnet viaja firmado con HMAC dentro del propio QR, así que
   verificar no requiere consultar nada.
   ========================================================================= */

const CATEGORIAS = [
  'PALOMO CERTIFICADO',
  'PALOMO DE PRIMERA',
  'PALOMO VITALICIO',
  'TRANQUILO DE SU CASA',
  'PALOMO SIN UNA MAÑA',
  'PALOMO DE CONFIANZA',
  'PALOMO HOMOLOGADO'
];

// El palomo elige el suyo; si no elige, se saca del nombre.
// En el token viaja el nombre del lugar, no su posición en esta lista,
// para que reordenarla o ampliarla no invalide los carnets ya emitidos.
const LUGARES = [
  'AZUA', 'BANÍ', 'BARAHONA', 'BÁVARO', 'BOCA CHICA', 'BONAO',
  'CABARETE', 'COMENDADOR', 'CONSTANZA', 'COTUÍ', 'DAJABÓN',
  'EL SEIBO', 'ESPERANZA', 'HATO MAYOR', 'HIGÜEY', 'JARABACOA',
  'JIMANÍ', 'LA ROMANA', 'LA VEGA', 'LAS MATAS DE FARFÁN',
  'LAS TERRENAS', 'MAO', 'MOCA', 'MONTE CRISTI', 'MONTE PLATA',
  'NAGUA', 'NAVARRETE', 'NEIBA', 'NUEVA YORK', 'PEDERNALES',
  'PUERTO PLATA', 'SABANETA', 'SAMANÁ', 'SAN CRISTÓBAL',
  'SAN FRANCISCO DE MACORÍS', 'SAN JOSÉ DE OCOA',
  'SAN JUAN DE LA MAGUANA', 'SAN PEDRO DE MACORÍS', 'SANTIAGO',
  'SANTO DOMINGO', 'SOSÚA', 'TAMBORIL', 'VILLA ALTAGRACIA'
];

const OFICIOS = [
  'TRANQUILO DE SU CASA',
  'DE LA CASA AL TRABAJO',
  'CASA, COLMADO Y CASA',
  'SIN MAÑA ALGUNA',
  'SERENO DE SU CASA',
  'NI FU NI FA',
  'EN SU CASA TEMPRANO'
];

/* ---------------- Durable Object: el contador ---------------- */

export class Secuencia {
  constructor(state) {
    this.state = state;
  }

  // Cada Durable Object atiende una petición a la vez, así que el
  // incremento es atómico sin necesidad de bloqueos.
  async fetch(request) {
    const actual = (await this.state.storage.get('n')) || 0;

    // /peek solo mira el contador; sirve para verificar sin emitir.
    if (new URL(request.url).pathname === '/peek') {
      return new Response(JSON.stringify({ n: actual }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const siguiente = actual + 1;
    await this.state.storage.put('n', siguiente);
    return new Response(JSON.stringify({ n: siguiente }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/* ---------------- base64url ---------------- */

const b64u = {
  encode(bytes) {
    let bin = '';
    for (const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  },
  decode(str) {
    const pad = str.length % 4 ? '='.repeat(4 - (str.length % 4)) : '';
    const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/') + pad);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  },
  encodeText(s) { return b64u.encode(new TextEncoder().encode(s)); },
  decodeText(s) { return new TextDecoder().decode(b64u.decode(s)); }
};

/* ---------------- firma ---------------- */

const SIG_BYTES = 16; // HMAC-SHA256 truncado; de sobra para un meme

async function sign(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return new Uint8Array(mac);
}

// Comparación en tiempo constante: no filtra en qué byte difieren.
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function makeToken(secret, payload) {
  const body = b64u.encodeText(JSON.stringify(payload));
  const mac = await sign(secret, body);
  return body + '.' + b64u.encode(mac.slice(0, SIG_BYTES));
}

async function readToken(secret, token) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;

  let expected, given;
  try {
    expected = (await sign(secret, body)).slice(0, SIG_BYTES);
    given = b64u.decode(sig);
  } catch {
    return null;
  }
  if (!timingSafeEqual(expected, given)) return null;

  try {
    const payload = JSON.parse(b64u.decodeText(body));
    if (!payload || typeof payload.n !== 'string') return null;
    return payload;
  } catch {
    return null;
  }
}

/* ---------------- datos del carnet ---------------- */

// El secuencial da el número. El resto sale del nombre, así que es
// estable: el mismo nombre siempre tiene la misma condición y el mismo
// nivel de palomería, aunque saque el carnet diez veces.
async function derive(secret, nombre, seq, lugarPedido) {
  const mac = await sign(secret, 'palomo:v2:' + nombre.toLocaleLowerCase('es'));
  const chk = await sign(secret, 'palomo:chk:' + seq);

  return {
    serial: `PAL-${String(seq).padStart(6, '0')}-${chk[0] % 10}`,
    nivel: 82 + (mac[5] % 19),
    categoria: CATEGORIAS[mac[6] % CATEGORIAS.length],
    lugar: normalizarLugar(lugarPedido) || LUGARES[mac[7] % LUGARES.length],
    oficio: OFICIOS[mac[8] % OFICIOS.length]
  };
}

// Solo dejamos pasar lugares de la lista: así nadie escribe lo que quiera
// en el carnet, ni aunque llame a la API directamente.
function normalizarLugar(raw) {
  if (typeof raw !== 'string') return null;
  // NFC porque iOS manda los acentos descompuestos: «SAMANÁ» llegaría
  // como A + tilde suelta y no cuadraría con la lista.
  const s = raw.normalize('NFC').trim().toLocaleUpperCase('es');
  return LUGARES.includes(s) ? s : null;
}

function contador(env) {
  return env.SECUENCIA.get(env.SECUENCIA.idFromName('global'));
}

async function siguienteSecuencial(env) {
  // Si el contador falla, el sitio no se cae: damos un número basado en
  // el reloj. No es correlativo, pero sigue siendo único.
  try {
    const res = await contador(env).fetch('https://secuencia/next');
    const { n } = await res.json();
    if (Number.isInteger(n) && n > 0) return n;
  } catch {
    /* seguimos al respaldo */
  }
  return 900000000 + (Date.now() % 99999999);
}

// Cuántos carnets se han emitido. Es un número, no una lista: el
// contador no sabe de quién es cada carnet.
async function emitidosHasta(env) {
  try {
    const res = await contador(env).fetch('https://secuencia/peek');
    const { n } = await res.json();
    return Number.isInteger(n) && n >= 0 ? n : null;
  } catch {
    return null;
  }
}

/* ---------------- verificación por número ---------------- */

// Acepta «PAL-000123-4», «000123-4», «123-4» o «123».
function parsearSerial(raw) {
  if (typeof raw !== 'string') return null;
  const s = raw.toUpperCase().replace(/[\s.]/g, '');
  const m = s.match(/^(?:PAL-?)?(\d{1,9})(?:-(\d))?$/);
  if (!m) return null;

  const seq = parseInt(m[1], 10);
  if (!Number.isInteger(seq) || seq < 1) return null;
  return { seq, chk: m[2] === undefined ? null : parseInt(m[2], 10) };
}

async function verificarSerial(env, raw) {
  const parsed = parsearSerial(raw);
  if (!parsed) {
    return { valido: false, motivo: 'formato', mensaje: 'Ese número no tiene forma de carnet de palomo.' };
  }

  const { seq, chk } = parsed;

  if (chk !== null) {
    const esperado = (await sign(secretoDe(env), 'palomo:chk:' + seq))[0] % 10;
    if (chk !== esperado) {
      return {
        valido: false, secuencial: seq, motivo: 'digito',
        mensaje: 'El dígito verificador no cuadra. Ese número está inventado.'
      };
    }
  }

  const emitidos = await emitidosHasta(env);
  if (emitidos === null) {
    return {
      valido: false, secuencial: seq, motivo: 'contador',
      mensaje: 'El registro del Ministerio no responde ahora mismo. Prueba de nuevo en un momento.'
    };
  }
  if (seq > emitidos) {
    return {
      valido: false, secuencial: seq, motivo: 'rango',
      mensaje: `Todavía no se ha emitido el palomo número ${seq}. Van ${emitidos}.`
    };
  }

  return {
    valido: true, secuencial: seq, emitidos,
    mensaje: chk === null
      ? `El palomo número ${seq} sí fue emitido por el Ministerio. Para estar seguro del todo, escribe también el dígito que va al final del número.`
      : `El palomo número ${seq} fue emitido por el Ministerio y su dígito verificador cuadra.`
  };
}

/* ---------------- entrada ---------------- */

function limpiarNombre(raw) {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, '') // caracteres de control
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 32);
}

function hoyRD() {
  // El Ministerio opera en horario dominicano (UTC-4, sin horario de verano).
  const d = new Date(Date.now() - 4 * 3600 * 1000);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getUTCFullYear()}`;
}

const esFecha = (s) => typeof s === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(s);

/* ---------------- helpers HTTP ---------------- */

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

const walletDisponible = (env) => ({
  google: !!(env.GOOGLE_WALLET_ISSUER_ID && env.GOOGLE_WALLET_SA_EMAIL && env.GOOGLE_WALLET_SA_KEY),
  apple: !!(env.APPLE_PASS_CERT && env.APPLE_PASS_KEY && env.APPLE_WWDR_CERT)
});

// En producción SIGNING_SECRET va como secreto de Wrangler. El respaldo
// solo existe para que `wrangler dev` arranque sin configurar nada.
const secretoDe = (env) => env.SIGNING_SECRET || 'palomo-dev-secret-no-usar-en-produccion';

/* ---------------- POST /api/emitir ---------------- */

async function emitir(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Cuerpo inválido' }, 400);
  }

  const nombre = limpiarNombre(body && body.nombre);
  if (nombre.length < 2) {
    return json({ ok: false, error: 'Nombre demasiado corto' }, 400);
  }

  const secret = secretoDe(env);
  const emitido = hoyRD();
  const seq = await siguienteSecuencial(env);
  const datos = await derive(secret, nombre, seq, body && body.lugar);
  const token = await makeToken(secret, {
    n: nombre, e: emitido, q: seq, l: datos.lugar
  });

  return json({
    ok: true,
    nombre,
    secuencial: seq,
    ...datos,
    emitido,
    vence: 'UN PALOMO NUNCA MUERE',
    token,
    verifyUrl: `${new URL(request.url).origin}/v/${token}`,
    wallet: walletDisponible(env)
  });
}

/* ---------------- GET /v/<token> ---------------- */

async function verificar(request, env, token) {
  const secret = secretoDe(env);
  const payload = await readToken(secret, token);

  const seqOk = payload && Number.isInteger(payload.q) && payload.q > 0;
  if (!payload || !esFecha(payload.e) || !seqOk) {
    return new Response(paginaFalso(), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
    });
  }

  const nombre = limpiarNombre(payload.n);
  const datos = await derive(secret, nombre, payload.q, payload.l);

  return new Response(
    paginaVerificado({ nombre, emitido: payload.e, secuencial: payload.q, ...datos }),
    {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300'
      }
    }
  );
}

/* ---------------- páginas de verificación ---------------- */

const ESTILO = `
*{box-sizing:border-box}
body{margin:0;min-height:100dvh;display:flex;flex-direction:column;
  font-family:'Archivo',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
  background:radial-gradient(900px 520px at 50% -10%,#1b3468,transparent 62%),#0b1b3a;color:#eef3fb}
.flagbar{height:5px;flex:none;background:linear-gradient(90deg,#002d62 0 25%,#fff 25% 33%,#ce1126 33% 66%,#fff 66% 74%,#002d62 74% 100%)}
main{flex:1;width:100%;max-width:520px;margin:0 auto;padding:34px 20px 40px;display:flex;flex-direction:column;justify-content:center}
.stamp{width:104px;height:104px;margin:0 auto 20px;border-radius:50%;display:grid;place-items:center;font-size:44px;border:3px solid currentColor}
h1{margin:0 0 10px;text-align:center;font-size:clamp(26px,7vw,34px);font-weight:800;letter-spacing:-.02em}
.lead{margin:0 0 28px;text-align:center;color:#c3d2ec;font-size:16px;line-height:1.55}
.panel{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.13);border-radius:16px;overflow:hidden}
.row{display:flex;justify-content:space-between;align-items:baseline;gap:16px;padding:15px 18px;border-bottom:1px solid rgba(255,255,255,.08)}
.row:last-child{border-bottom:0}
.k{font-size:11px;letter-spacing:.13em;text-transform:uppercase;font-weight:700;color:#8ea2c4;flex:none}
.v{font-weight:700;font-size:16.5px;text-align:right;word-break:break-word}
.v.mono{font-family:'IBM Plex Mono',ui-monospace,Menlo,monospace;font-weight:600;font-size:15px}
.cta{display:block;margin:26px auto 0;max-width:330px;text-align:center;text-decoration:none;padding:16px 24px;border-radius:12px;font-weight:700;font-size:16px;color:#fff;background:linear-gradient(180deg,#ce1126,#a80e1f);box-shadow:0 8px 22px -8px rgba(206,17,38,.7)}
footer{flex:none;padding:22px 20px 30px;text-align:center;border-top:1px solid rgba(255,255,255,.12)}
footer p{margin:0 auto 10px;max-width:520px;font-size:12px;line-height:1.55;color:#8ea2c4}
footer strong{color:#c3d2ec}
footer a{color:#c3d2ec}

.form{display:flex;flex-direction:column;gap:9px;margin-bottom:24px}
.form label{font-size:11px;letter-spacing:.13em;text-transform:uppercase;font-weight:700;color:#8ea2c4}
.form input{width:100%;padding:14px 15px;border-radius:11px;border:1px solid rgba(255,255,255,.13);
  background:rgba(0,0,0,.26);color:#fff;outline:none;
  font:600 18px/1.2 'IBM Plex Mono',ui-monospace,Menlo,monospace}
.form input::placeholder{color:#5f7396;font-weight:400}
.form input:focus{border-color:#c9a227;box-shadow:0 0 0 3px rgba(201,162,39,.18)}
.form button{margin-top:4px;padding:14px 20px;border:0;border-radius:11px;cursor:pointer;
  font:700 15px/1 'Archivo',system-ui,sans-serif;color:#fff;
  background:linear-gradient(180deg,#ce1126,#a80e1f)}

.veredicto{display:flex;gap:14px;align-items:flex-start;padding:16px 18px;border-radius:14px;
  border:1px solid rgba(255,255,255,.13);background:rgba(255,255,255,.05);margin-bottom:18px}
.veredicto .marca{font-size:26px;line-height:1;flex:none}
.veredicto.si .marca{color:#5fd39a}
.veredicto.no .marca{color:#ff8b9a}
.vtit{margin:0 0 4px;font-size:16px;font-weight:800}
.vtxt{margin:0;font-size:13.5px;line-height:1.5;color:#c3d2ec}

.total{margin:0 0 18px;text-align:center;font-size:13.5px;color:#8ea2c4}
.total strong{color:#c9a227;font-size:15px}
.nota{margin:0;font-size:12.5px;line-height:1.6;color:#8ea2c4}
.doc{text-align:left}
.doc h2{margin:26px 0 8px;font-size:15px;font-weight:800;color:#c9a227;letter-spacing:-.01em}
.doc h2:first-child{margin-top:0}
.doc p{margin:0 0 12px;font-size:14px;line-height:1.68;color:#c3d2ec}
.doc strong{color:#fff}
.doc em{color:#fff;font-style:italic}
.aviso{margin-top:26px !important;padding:15px 16px;border-radius:12px;
  background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.1);
  font-size:12.5px !important;line-height:1.6 !important;color:#8ea2c4 !important}
`;

function envoltura(titulo, cuerpo) {
  return `<!DOCTYPE html><html lang="es-DO"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(titulo)}</title><meta name="theme-color" content="#0b1b3a">
<meta name="robots" content="noindex">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;700;800&family=IBM+Plex+Mono:wght@600&display=swap" rel="stylesheet">
<style>${ESTILO}</style></head>
<body><div class="flagbar"></div><main>${cuerpo}</main>
<footer>
<p><strong>Esto es un meme.</strong> El «Ministerio de Palomos» no existe y este carnet
no es un documento oficial ni sirve para identificarte ante nadie.</p>
<p>Meme de <a href="https://www.instagram.com/javimolinax/" target="_blank" rel="noopener">@javimolinax</a>
en Instagram y <a href="https://www.tiktok.com/@javimolinaxx" target="_blank" rel="noopener">@javimolinaxx</a> en TikTok</p>
<p><a href="/simbolos-patrios">Sobre el uso de los símbolos patrios</a></p>
</footer></body></html>`;
}

function paginaVerificado(d) {
  return envoltura(
    `Carnet verificado — ${d.nombre}`,
    `
<div class="stamp" style="color:#5fd39a">✓</div>
<h1>Carnet auténtico</h1>
<p class="lead">El Ministerio de Palomos confirma que este carnet fue emitido por nosotros
y que sus datos no han sido alterados.</p>

<div class="panel">
  <div class="row"><span class="k">Nombre</span><span class="v">${esc(d.nombre)}</span></div>
  <div class="row"><span class="k">No. de palomo</span><span class="v mono">${esc(d.serial)}</span></div>
  <div class="row"><span class="k">Palomo número</span><span class="v mono">${d.secuencial}</span></div>
  <div class="row"><span class="k">Condición</span><span class="v">${esc(d.categoria)}</span></div>
  <div class="row"><span class="k">Nivel de palomería</span><span class="v mono">${d.nivel}%</span></div>
  <div class="row"><span class="k">Lugar de tranquilidad</span><span class="v">${esc(d.lugar)}</span></div>
  <div class="row"><span class="k">Ocupación u oficio</span><span class="v">${esc(d.oficio)}</span></div>
  <div class="row"><span class="k">Emitido</span><span class="v mono">${esc(d.emitido)}</span></div>
  <div class="row"><span class="k">Vence</span><span class="v">UN PALOMO NUNCA MUERE</span></div>
</div>

<a class="cta" href="/">Sacar mi propio carnet</a>`
  );
}

function paginaFalso() {
  return envoltura(
    'Carnet no válido',
    `
<div class="stamp" style="color:#ff8b9a">✕</div>
<h1>Este carnet es falso</h1>
<p class="lead">La firma no cuadra. O el enlace se copió mal, o alguien trató de hacerse
el palomo sin serlo. El Ministerio no reconoce este documento.</p>
<a class="cta" href="/">Sacar un carnet de verdad</a>`
  );
}

/* ---------------- /verificar: por número, sin QR ---------------- */

function paginaVerificar(consulta, resultado, emitidos) {
  let bloque = '';
  if (resultado) {
    const bien = resultado.valido;
    bloque = `
<div class="veredicto ${bien ? 'si' : 'no'}">
  <span class="marca">${bien ? '✓' : '✕'}</span>
  <div>
    <p class="vtit">${bien ? 'Carnet auténtico' : 'No lo reconocemos'}</p>
    <p class="vtxt">${esc(resultado.mensaje)}</p>
  </div>
</div>`;
  }

  const total = Number.isInteger(emitidos) && emitidos > 0
    ? `<p class="total">Van <strong>${emitidos.toLocaleString('es-DO')}</strong> palomos certificados.</p>`
    : '';

  return envoltura(
    'Verificar un carnet de palomo',
    `
<h1>Verificar un carnet</h1>
<p class="lead">Escribe el número que aparece en el carnet y el Ministerio te dice
si lo emitimos nosotros.</p>

<form class="form" method="GET" action="/verificar">
  <label for="s">Número de palomo</label>
  <input id="s" name="s" type="text" autocomplete="off" spellcheck="false"
         placeholder="PAL-000123-4" maxlength="20" value="${esc(consulta || '')}">
  <button type="submit">Verificar</button>
</form>

${bloque}
${total}

<p class="nota">Por el número solo podemos confirmar que el carnet fue emitido: no
guardamos nombres ni fotos de nadie. Para ver los datos completos de un carnet,
escanea su código QR, que los lleva firmados dentro.</p>

<a class="cta" href="/">Sacar mi propio carnet</a>`
  );
}

/* ---------------- /simbolos-patrios ---------------- */

function paginaSimbolos() {
  return envoltura(
    'Símbolos patrios: uso y respeto',
    `
<h1>Sobre los símbolos patrios</h1>
<p class="lead">Este sitio es una parodia. La bandera y el escudo de la República
Dominicana no lo son. Por eso no están aquí.</p>

<div class="doc">
  <h2>El carnet no lleva la bandera ni el escudo</h2>
  <p>No es un descuido ni un problema de diseño: es una decisión. El Carnet de
  Palomo no reproduce el Escudo Nacional ni la Bandera Nacional en ninguna parte.
  Lo que ves en el carnet es un palomo dibujado para este proyecto.</p>

  <h2>Por qué</h2>
  <p>La <strong>Ley núm. 210-19</strong>, sobre los símbolos patrios, es clara en
  tres puntos que nos tocan de lleno:</p>
  <p>El <strong>artículo 26</strong> reserva el uso del Escudo Nacional en
  identificaciones e impresos a una lista cerrada de funcionarios públicos. Un
  carnet emitido por un ministerio inventado no está en esa lista, y el
  <strong>artículo 28, numeral 1</strong>, considera irreverencia usar el escudo
  violando cualquier precepto de la ley.</p>
  <p>El <strong>artículo 24, numeral 5</strong>, prohíbe usar la Bandera Nacional
  «total o parcialmente» como distintivo característico de cualquier organización
  privada. El «Ministerio de Palomos» es precisamente una organización privada
  ficticia.</p>
  <p>Y el <strong>artículo 28, numeral 3</strong>, declara irreverencia usar el
  Escudo Nacional en promociones comerciales con fines de lucro. Este carnet está
  pensado para que más adelante sirva en promociones e iniciativas con negocios
  locales, así que ese supuesto nos alcanzaría de forma directa.</p>
  <p>Podíamos haber puesto los símbolos y acompañarlos de un descargo. Preferimos
  no ponerlos.</p>

  <h2>El palomo no es el escudo</h2>
  <p>El emblema del Ministerio es una paloma dibujada desde cero. No es una
  versión del Escudo Nacional, no lo imita y no toma ninguno de sus elementos: ni
  la Biblia, ni la cruz, ni los trofeos, ni las ramas de laurel y palma, ni el
  lema <em>Dios, Patria, Libertad</em>. Son cosas separadas a propósito, para que
  nadie confunda el chiste con el símbolo.</p>

  <h2>Sobre los colores</h2>
  <p>Lo que sí usamos son el azul y el rojo, que son colores, no un símbolo. En
  el carnet aparecen como dos barras sueltas junto a las siglas «RD», una regla
  partida bajo la cabecera y una banda al pie; en el sitio, como la franja de
  arriba. Ninguno de esos elementos es cuarteado, ninguno lleva la cruz blanca y
  ninguno reproduce la forma de la Bandera Nacional.</p>
  <p>El <strong>artículo 44</strong> prohíbe combinar los colores patrios para
  identificar agrupaciones, partidos o movimientos políticos de manera que se
  asemejen a la bandera, y el <strong>artículo 24, numeral 6</strong>, prohíbe
  usarlos en propaganda comercial o política que en conjunto la asemeje. Aquí no
  hay ni partido ni parecido: hay dos colores.</p>

  <h2>No hay burla al símbolo</h2>
  <p>La broma es sobre el palomo, no sobre la patria. Los artículos 25 y 29 de la
  ley definen el ultraje como quemar, destruir, arrojar al suelo, profanar o
  colocar letreros e imágenes encima de los símbolos. Nada de eso se hace ni se
  hará en este sitio.</p>

  <h2>El carnet no se hace pasar por un documento</h2>
  <p>Cada carnet lleva impreso «DOCUMENTO DE PARODIA · SIN VALIDEZ LEGAL · ES UN
  MEME», el emisor es un ministerio que no existe y el sitio lo dice desde la
  portada. No sustituye la cédula ni ningún documento, y no sirve para
  identificarse ante ninguna autoridad, empresa o persona.</p>

  <h2>Si hay algo que corregir, se corrige</h2>
  <p>Si alguna autoridad, el Instituto Duartiano, la Comisión Permanente de
  Efemérides Patrias o cualquier persona entiende que algo de este sitio falta al
  respeto a los símbolos patrios, se corrige o se retira. Sin discusión. El
  código es público y el cambio se puede ver.</p>

  <p class="aviso">Esta página explica nuestro criterio y cita la ley, pero no es
  asesoría legal. La Ley 210-19 sanciona la irreverencia contra los símbolos con
  quince a treinta días de prisión y multa de uno a cinco salarios mínimos del
  sector público (artículo 38), y el ultraje con uno a tres meses y multa de cinco
  a veinte salarios mínimos (artículo 39). El juzgado de paz es el tribunal
  competente (artículo 42).</p>
</div>

<a class="cta" href="/">Volver al inicio</a>`
  );
}

async function rutaVerificar(request, env) {
  const consulta = (new URL(request.url).searchParams.get('s') || '').slice(0, 32);
  const resultado = consulta ? await verificarSerial(env, consulta) : null;
  const emitidos = await emitidosHasta(env);

  return new Response(paginaVerificar(consulta, resultado, emitidos), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

/* ---------------- Wallet (pendiente de credenciales) ---------------- */

function walletGoogle(request, env) {
  if (!walletDisponible(env).google) {
    return json({ ok: false, error: 'Google Wallet no está configurado en este despliegue.' }, 501);
  }
  // Se implementa al activar las credenciales: ver README, «Google Wallet».
  return json({ ok: false, error: 'No implementado todavía.' }, 501);
}

function walletApple(request, env) {
  const msg = walletDisponible(env).apple
    ? 'No implementado todavía.'
    : 'Apple Wallet no está configurado en este despliegue.';
  return new Response(msg, {
    status: 501,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}

/* ---------------- router ---------------- */

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;

    if (path === '/api/emitir') {
      if (request.method !== 'POST') return json({ ok: false, error: 'Usa POST' }, 405);
      return emitir(request, env);
    }

    if (path.startsWith('/v/')) {
      return verificar(request, env, decodeURIComponent(path.slice(3)));
    }

    if (path === '/api/lugares') {
      // Lista única: el <select> del formulario se llena desde aquí,
      // así no se desincroniza de la que valida el servidor.
      return new Response(JSON.stringify({ ok: true, lugares: LUGARES }), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }

    if (path === '/verificar') return rutaVerificar(request, env);

    if (path === '/simbolos-patrios') {
      return new Response(paginaSimbolos(), {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }

    if (path === '/api/verificar') {
      const s = new URL(request.url).searchParams.get('s') || '';
      return json({ ok: true, ...(await verificarSerial(env, s)) });
    }

    if (path === '/api/wallet/google') return walletGoogle(request, env);
    if (path === '/api/wallet/apple') return walletApple(request, env);

    const res = await env.ASSETS.fetch(request);
    const headers = new Headers(res.headers);
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    return new Response(res.body, { status: res.status, headers });
  }
};
