import {
  CARNETS, CERTIFICADO, carnetDe, carnetPorSlug, g, generoDe,
  ORDEN_CARNETS, POR_DEFECTO
} from './carnets.js';

/* =========================================================================
   Carnet de Palomo — Cloudflare Worker.

     POST /api/emitir        toma un secuencial, firma el carnet y lo devuelve
     GET  /v/<token>         página de verificación
     resto                   archivos estáticos

   No guardamos carnets ni fotos. Lo único con estado es el contador de
   secuenciales, que vive en un Durable Object y solo sabe cuántos carnets
   se han emitido: ni un nombre, ni una foto, ni una IP.

   El resto del carnet viaja firmado con HMAC dentro del propio QR, así que
   verificar no requiere consultar nada.
   ========================================================================= */

/* ---------------- las dos categorías ----------------

   Palomo: el tranquilo de su casa, sin una maña.
   Pariguayo: el que va a la fiesta y se queda mirando.

   Cada una cambia quién emite el carnet y qué dice; el dibujo es el mismo.
   En el token viaja solo la inicial, para que el QR no crezca.
   ---------------------------------------------------------------- */

// Los cinco estilos. El servidor solo necesita saber cuáles existen para
// entregar el emisor y la frase que le tocan a cada uno.
const ESTILOS = ["oficial","institucional","crema","hielo","carbon","candela","solapin","asodopa","nocturno","tricolor","esmeralda"];
const estiloDe = (v) => (ESTILOS.includes(v) ? v : 'oficial');

// Lo que sale en el carnet cuando no escriben de dónde son. El lugar viaja
// dentro del token firmado, así que verificarlo no consulta nada.
const SIN_LUGAR = 'NO DECLARADO';

/* ---------------- Durable Object: el contador ---------------- */

export class Secuencia {
  constructor(state) {
    this.state = state;
  }

  // Cada Durable Object atiende una petición a la vez, así que el
  // incremento es atómico sin necesidad de bloqueos.
  async fetch(request) {
    const url = new URL(request.url);
    const actual = (await this.state.storage.get('n')) || 0;
    const cab = { 'Content-Type': 'application/json' };

    // /peek solo mira el contador; sirve para verificar sin emitir.
    if (url.pathname === '/peek') {
      return new Response(JSON.stringify({ n: actual }), { headers: cab });
    }

    // /stats devuelve además qué diseños se eligen más. Es un recuento
    // por diseño, no por persona: no sabe quién eligió qué.
    if (url.pathname === '/stats') {
      const disenos = (await this.state.storage.get('disenos')) || {};
      const experimento = (await this.state.storage.get('experimento')) || {};
      return new Response(JSON.stringify({ n: actual, disenos, experimento }), { headers: cab });
    }

    // Llegadas al paso de elegir. No gasta numero del contador: solo
    // anota que alguien de esta rama llego hasta ahi.
    if (url.pathname === '/exp') {
      const clave = url.searchParams.get('k');
      if (clave) {
        const exp = (await this.state.storage.get('experimento')) || {};
        exp[clave] = (exp[clave] || 0) + 1;
        await this.state.storage.put('experimento', exp);
      }
      return new Response(JSON.stringify({ ok: true }), { headers: cab });
    }

    const siguiente = actual + 1;
    await this.state.storage.put('n', siguiente);

    const clave = url.searchParams.get('d');
    if (clave) {
      const disenos = (await this.state.storage.get('disenos')) || {};
      disenos[clave] = (disenos[clave] || 0) + 1;
      await this.state.storage.put('disenos', disenos);
    }

    const rama = url.searchParams.get('x');
    if (rama === 'A' || rama === 'B') {
      const exp = (await this.state.storage.get('experimento')) || {};
      exp[rama + ':emitido'] = (exp[rama + ':emitido'] || 0) + 1;
      if (url.searchParams.get('u') === '1') {
        const u = rama + ':emitido-unico';
        exp[u] = (exp[u] || 0) + 1;
      }
      await this.state.storage.put('experimento', exp);
    }

    return new Response(JSON.stringify({ n: siguiente }), { headers: cab });
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

// El secuencial da el número y la ciudad la escribe la persona. El resto
// sale del nombre, así que es estable: el mismo nombre siempre tiene la
// misma condición y el mismo nivel de palomería, aunque saque el carnet
// diez veces.
async function derive(secret, nombre, seq, tipo, estilo, genero) {
  const mac = await sign(secret, 'palomo:v2:' + nombre.toLocaleLowerCase('es'));
  const chk = await sign(secret, 'palomo:chk:' + seq);
  const prefijo = tipo.prefijo;
  const emisor = tipo.emisores[estilo] || tipo.emisores.oficial;

  // Cada texto se resuelve segun el genero. Los que no cambian estan
  // escritos una sola vez en el registro y g() los devuelve tal cual.
  const t = (v) => g(v, genero);

  return {
    tipo: tipo.id,
    genero,
    estilo,

    // Lo que antes estaba cableado dentro de carnet.js y ahora sale del
    // registro: asi un carnet nuevo no obliga a tocar el dibujo.
    sujeto: t(tipo.sujeto),
    plural: t(tipo.plural),
    emblema: tipo.emblema || 'palomo',
    certificado: t(CERTIFICADO),
    lema: t(tipo.lema),
    cintilla: t(tipo.cintilla),
    citas: tipo.citas.map(t),
    sello: tipo.sello.map(t),
    serial: `${prefijo}-${String(seq).padStart(6, '0')}-${chk[0] % 10}`,

    // El chiste está invertido: un palomo tiene CERO tigueraje. Una barra
    // casi vacía dice más que un 97 por ciento.
    nivel: (mac[5] % 30) / 10,
    nivelEtiqueta: t(tipo.nivelEtiqueta),

    categoria: t(tipo.condiciones[mac[6] % tipo.condiciones.length]),
    oficio: t(tipo.oficios[mac[8] % tipo.oficios.length]),
    antecedentes: t(tipo.antecedentes[mac[9] % tipo.antecedentes.length]),
    vence: t(tipo.vence),

    emisor: emisor.nombre,
    siglas: emisor.siglas,
    titulo: t((tipo.titulos && tipo.titulos[estilo]) || tipo.titulo),
    frase: t(tipo.frases[estilo] || tipo.frases.oficial),
    hashtag: tipo.hashtag,
    invitacion: t(tipo.invitacion)
  };
}

// El lugar lo escribe la persona: texto libre. Lo limpiamos y lo pasamos a
// mayúsculas, que es como van los demás campos del carnet. NFC porque iOS
// manda los acentos descompuestos.
function limpiarLugar(raw) {
  if (typeof raw !== 'string') return '';
  return raw
    .normalize('NFC')
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, '') // caracteres de control
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 24)
    .toLocaleUpperCase('es');
}

// Frase propia: la escribe la persona y ocupa el sitio de la frase del
// diseño. Ochenta caracteres es lo que entra en el formato más estrecho
// sin que el cuerpo de letra baje de donde se lee.
const CONCEPTO_MAX = 80;

function limpiarConcepto(raw) {
  if (typeof raw !== 'string') return '';
  return raw
    .normalize('NFC')
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, CONCEPTO_MAX);
}

// El contador vive en un único Durable Object, identificado por este
// nombre. Cambiarlo crea uno nuevo que empieza en cero: es la forma de
// reiniciar la numeración, y la única.
//
// Hacerlo después de lanzar significaría repartir números que ya tiene
// otra gente. Si alguna vez hace falta, que sea antes de anunciar.
const CONTADOR = 'lanzamiento-limpio';

function contador(env) {
  return env.SECUENCIA.get(env.SECUENCIA.idFromName(CONTADOR));
}

async function siguienteSecuencial(env, diseno, rama, primera) {
  // Si el contador falla, el sitio no se cae: damos un número basado en
  // el reloj. No es correlativo, pero sigue siendo único.
  try {
    const partes = [];
    if (diseno) { partes.push('d=' + encodeURIComponent(diseno)); }
    if (rama === 'A' || rama === 'B') { partes.push('x=' + rama); }
    if (primera === true) { partes.push('u=1'); }
    const q = partes.length ? '?' + partes.join('&') : '';
    const res = await contador(env).fetch('https://secuencia/next' + q);
    const { n } = await res.json();
    if (Number.isInteger(n) && n > 0) return n;
  } catch {
    /* seguimos al respaldo */
  }
  return 900000000 + (Date.now() % 99999999);
}

// Cuántos carnets se han emitido, cuántos de cada diseño y los dos
// recuentos de la prueba A/B. Son números sueltos, no listas: el
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

// Acepta «PAL-000123-4», «BEB-000123-4», «000123-4», «123-4» o «123».
//
// El prefijo dice de qué carnet es, pero la numeración es única para
// todo el sitio: PAL-000500 y BEB-000501 son dos carnets seguidos. Por
// eso aquí el prefijo se acepta y se descarta: sin base de datos, el
// número por sí solo no puede decir de qué tipo es.
//
// Antes solo aceptaba «PAL-», así que quien tenía un carnet de
// pariguayo no podía verificar su número a mano.
function parsearSerial(raw) {
  if (typeof raw !== 'string') return null;
  const s = raw.toUpperCase().replace(/[\s.]/g, '');
  const m = s.match(/^(?:[A-Z]{2,4}-?)?(\d{1,9})(?:-(\d))?$/);
  if (!m) return null;

  const seq = parseInt(m[1], 10);
  if (!Number.isInteger(seq) || seq < 1) return null;
  return { seq, chk: m[2] === undefined ? null : parseInt(m[2], 10) };
}

async function verificarSerial(env, raw, url) {
  const parsed = parsearSerial(raw);
  if (!parsed) {
    return { valido: false, motivo: 'formato', mensaje: 'Ese número no tiene forma de número de carnet.' };
  }

  const { seq, chk } = parsed;

  if (chk !== null) {
    const secret = secretoDe(env, url);
    if (!secret) {
      return { valido: false, motivo: 'sin-llave', mensaje: SIN_LLAVE };
    }
    const esperado = (await sign(secret, 'palomo:chk:' + seq))[0] % 10;
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
      mensaje: `Todavía no se ha emitido el carnet número ${seq}. Van ${emitidos}.`
    };
  }

  return {
    valido: true, secuencial: seq, emitidos,
    mensaje: chk === null
      ? `El carnet número ${seq} sí fue emitido. Para estar seguro del todo, escribe también el dígito que va al final del número.`
      : `El carnet número ${seq} fue emitido y su dígito verificador cuadra.`
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

// La llave que firma los carnets. En producción va como secreto de Wrangler.
//
// El respaldo de desarrollo SOLO se entrega en localhost, y es a propósito:
// este código es público, así que firmar con una llave que está en GitHub
// sería peor que no firmar. Si en producción falta el secreto preferimos
// fallar de cara antes que emitir carnets falsificables.
function secretoDe(env, url) {
  if (env.SIGNING_SECRET) return env.SIGNING_SECRET;

  const host = url && url.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]') {
    return 'palomo-dev-secret-solo-local';
  }
  return null;
}

const SIN_LLAVE = 'El Ministerio está sin llave de firma. Avisa a quien lo administra.';

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

  // La ciudad es opcional y la escribe la persona. Si no pone nada, el
  // carnet lo dice; no le inventamos un pueblo.
  const lugar = limpiarLugar(body && body.lugar) || SIN_LUGAR;

  // Su propia frase, si la escribió. Si no, el carnet usa la del diseño.
  const concepto = limpiarConcepto(body && body.concepto);

  const secret = secretoDe(env, new URL(request.url));
  if (!secret) return json({ ok: false, error: SIN_LLAVE }, 503);

  const tipo = carnetDe(body && body.tipo);
  const genero = generoDe(body && body.genero);
  const estilo = estiloDe(body && body.estilo);
  const emitido = hoyRD();
  // La rama del experimento, si el navegador la manda. Es una letra:
  // cualquier otra cosa se ignora.
  const rama = (body && body.exp) === 'A' || (body && body.exp) === 'B' ? body.exp : null;
  // Si este navegador no habia emitido nunca, cuenta tambien como
  // persona, no solo como emision.
  const primera = rama && (body && body.expPrimera) === true;
  const seq = await siguienteSecuencial(env, tipo.id + ':' + estilo, rama, primera);
  const datos = await derive(secret, nombre, seq, tipo, estilo, genero);
  const token = await makeToken(secret, {
    n: nombre, e: emitido, q: seq, l: lugar, t: tipo.codigo,
    // 'x' es el valor por defecto: no viaja, para no engordar el QR.
    x: genero === 'x' ? undefined : genero,
    c: concepto || undefined
  });

  return json({
    ok: true,
    nombre,
    secuencial: seq,
    ...datos,
    lugar,
    concepto,
    emitido,
    token,
    verifyUrl: `${new URL(request.url).origin}/v/${token}`
  });
}

/* ---------------- GET /v/<token> ---------------- */

async function verificar(request, env, token) {
  const secret = secretoDe(env, new URL(request.url));
  if (!secret) return new Response(SIN_LLAVE, { status: 503 });
  const payload = await readToken(secret, token);

  const seqOk = payload && Number.isInteger(payload.q) && payload.q > 0;
  if (!payload || !esFecha(payload.e) || !seqOk) {
    return new Response(paginaFalso(), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
    });
  }

  const nombre = limpiarNombre(payload.n);
  const tipo = carnetDe(payload.t);
  const genero = generoDe(payload.x);
  const datos = await derive(secret, nombre, payload.q, tipo, 'oficial', genero);
  const lugar = limpiarLugar(payload.l) || SIN_LUGAR;
  const concepto = limpiarConcepto(payload.c);

  return new Response(
    paginaVerificado({ nombre, emitido: payload.e, secuencial: payload.q, lugar, concepto, ...datos }),
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
.form input:focus{border-color:#ff5f74;box-shadow:0 0 0 3px rgba(255,95,116,.2)}
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
.total strong{color:#ff5f74;font-size:15px}
.nota{margin:0;font-size:12.5px;line-height:1.6;color:#8ea2c4}
.doc{text-align:left}
.doc h2{margin:28px 0 8px;font-size:15px;font-weight:800;color:#7fb2ff;letter-spacing:-.01em}
.doc h2:first-child{margin-top:0}
.doc p{margin:0 0 12px;font-size:14.5px;line-height:1.68;color:#c3d2ec}
.doc strong{color:#fff}
.doc em{color:#fff;font-style:italic}
.doc a{color:#7fb2ff}
`;

function envoltura(titulo, cuerpo, indexar) {
  return `<!DOCTYPE html><html lang="es-DO"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(titulo)}</title><meta name="theme-color" content="#0b1b3a">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Carnet de Palomo">
<meta property="og:image" content="https://palomos.com.do/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://palomos.com.do/og.jpg">
${indexar ? '' : '<meta name="robots" content="noindex">'}
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;700;800&family=IBM+Plex+Mono:wght@600&display=swap" rel="stylesheet">
<style>${ESTILO}</style>
<script defer src="https://static.cloudflareinsights.com/beacon.min.js"
        data-cf-beacon='{"token": "5252e7034c504b9ebe41f551a96ef465"}'></script></head>
<body><div class="flagbar"></div><main>${cuerpo}</main>
<footer>
<p><strong>Esto es un meme.</strong> El «Ministerio de Palomos» no existe y este carnet
no es un documento oficial ni sirve para identificarte ante nadie.</p>
<p>Meme de <a href="https://www.instagram.com/javimolinax/" target="_blank" rel="noopener">@javimolinax</a>
en Instagram y <a href="https://www.tiktok.com/@javimolinaxt" target="_blank" rel="noopener">@javimolinaxt</a> en TikTok</p>
</footer></body></html>`;
}

function paginaVerificado(d) {
  return envoltura(
    `Carnet verificado — ${d.nombre}`,
    `
<div class="stamp" style="color:#5fd39a">✓</div>
<h1>Carnet auténtico</h1>
<p class="lead">El ${esc(d.emisor)} confirma que este carnet fue emitido por nosotros
y que sus datos no han sido alterados.</p>

<div class="panel">
  <div class="row"><span class="k">Nombre</span><span class="v">${esc(d.nombre)}</span></div>
  <div class="row"><span class="k">No. de ${esc(d.tipo)}</span><span class="v mono">${esc(d.serial)}</span></div>
  <div class="row"><span class="k">${esc(d.tipo)} número</span><span class="v mono">${d.secuencial}</span></div>
  <div class="row"><span class="k">Condición</span><span class="v">${esc(d.categoria)}</span></div>
  <div class="row"><span class="k">${esc(d.nivelEtiqueta)}</span><span class="v mono">${d.nivel.toFixed(1)}%</span></div>
  <div class="row"><span class="k">Antecedentes</span><span class="v">${esc(d.antecedentes)}</span></div>
  <div class="row"><span class="k">Lugar de tranquilidad</span><span class="v">${esc(d.lugar)}</span></div>
  ${d.concepto ? `<div class="row"><span class="k">Su concepto</span><span class="v">${esc(d.concepto)}</span></div>` : ''}
  <div class="row"><span class="k">Ocupación u oficio</span><span class="v">${esc(d.oficio)}</span></div>
  <div class="row"><span class="k">Emitido</span><span class="v mono">${esc(d.emitido)}</span></div>
  <div class="row"><span class="k">Vence</span><span class="v">${esc(d.vence)}</span></div>
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

<a class="cta" href="/">Sacar mi propio carnet</a>`,
    true
  );
}

/* ---------------- términos y privacidad ---------------- */

const CONTACTO =
  '<a href="https://www.instagram.com/javimolinax/" target="_blank" rel="noopener">@javimolinax</a>';

function paginaTerminos() {
  return envoltura(
    'Términos y condiciones',
    `
<h1>Términos y condiciones</h1>
<p class="lead">En corto: esto es un chiste, el carnet no vale para nada oficial, y
lo que hagas con él es cosa tuya.</p>

<div class="doc">
  <h2>1. Qué es este sitio</h2>
  <p>Carnet de Palomo es una parodia. El «Ministerio de Palomos» no existe, no está
  afiliado a ninguna institución del Estado dominicano ni actúa en representación de
  ninguna. El carnet que genera es una imagen humorística.</p>

  <h2>2. Al usarlo, aceptas esto</h2>
  <p>Generar un carnet implica que leíste y aceptas estos términos y la
  <a href="/privacidad">política de privacidad</a>. Si no estás de acuerdo con algo,
  no generes el carnet.</p>

  <h2>3. El carnet no vale como documento</h2>
  <p>No es un documento de identidad. No sustituye la cédula ni ningún otro documento
  oficial. No sirve para identificarte, acreditarte ni probar nada ante ninguna
  autoridad, empresa o persona.</p>
  <p>Te comprometes a <strong>no</strong> presentarlo como documento real, no usarlo
  para engañar a nadie, no suplantar a otra persona y no alterarlo para que parezca
  emitido por una institución de verdad. Si lo haces, la responsabilidad es
  únicamente tuya.</p>

  <h2>4. El nombre y la foto los pones tú</h2>
  <p>Al generar un carnet declaras que el nombre que escribes y la foto que usas son
  tuyos, o que tienes permiso para usarlos. No uses fotos de otras personas sin su
  consentimiento, ni imágenes de menores, ni contenido ilegal, sexual, violento o que
  incite al odio.</p>
  <p>Este sitio no revisa ni almacena lo que pones: la foto se procesa en tu propio
  navegador y no llega a ningún servidor. Eso significa que el contenido de tu carnet
  es tuyo y de nadie más, y también que respondes tú por él.</p>

  <h2>5. Lo que el carnet muestra a quien lo escanee</h2>
  <p>El nombre, la ciudad, la fecha y el número de tu carnet van dentro del código QR,
  firmados. Cualquiera que escanee tu carnet verá esos datos. Si lo publicas o lo
  compartes, los estás compartiendo tú. Puedes usar un apodo o un nombre inventado.</p>

  <h2>6. Promociones con terceros</h2>
  <p>Si en algún momento un negocio decide reconocer el Carnet de Palomo para una
  promoción, esa promoción es del negocio: sus condiciones, su cumplimiento y sus
  reclamaciones son con él, no con nosotros. Este sitio no garantiza que ningún
  comercio acepte el carnet ni responde por lo que ofrezca.</p>

  <h2>7. Se entrega tal cual</h2>
  <p>El servicio se ofrece «tal cual», sin garantía de que funcione siempre, de que
  esté disponible, ni de que los carnets ya emitidos se puedan seguir verificando.
  Podemos cambiarlo, pausarlo o cerrarlo en cualquier momento y sin aviso.</p>

  <h2>8. Hasta dónde respondemos</h2>
  <p>En la medida en que la ley lo permita, no respondemos por daños, perjuicios ni
  reclamaciones derivados del uso del sitio o del carnet, ni por el uso que un tercero
  haga de un carnet que tú generaste o compartiste.</p>

  <h2>9. De quién es qué</h2>
  <p>El código fuente es público y está bajo licencia MIT. El nombre «Carnet de
  Palomo», el emblema del palomo y los textos del sitio son de ${CONTACTO}. Tu carnet
  es tuyo: úsalo, compártelo y ríete con él.</p>

  <h2>10. Menores</h2>
  <p>Este sitio no está dirigido a menores de 13 años. Si eres menor de edad, úsalo
  con el permiso de tu madre, padre o tutor.</p>

  <h2>11. Cambios</h2>
  <p>Podemos actualizar estos términos. La versión vigente es siempre la publicada en
  esta página.</p>

  <h2>12. Ley aplicable</h2>
  <p>Estos términos se rigen por las leyes de la República Dominicana, y cualquier
  controversia se somete a sus tribunales.</p>

  <h2>13. Contacto</h2>
  <p>Escribe a ${CONTACTO} en Instagram.</p>
</div>

<a class="cta" href="/">Volver al inicio</a>`,
    true
  );
}

function paginaPrivacidad() {
  return envoltura(
    'Política de privacidad',
    `
<h1>Política de privacidad</h1>
<p class="lead">Lo más importante: tu foto nunca sale de tu teléfono, y no guardamos
tu nombre ni tu carnet en ninguna base de datos.</p>

<div class="doc">
  <h2>Quién responde</h2>
  <p>Este sitio lo mantiene ${CONTACTO}, en la República Dominicana. Para cualquier
  asunto de datos, escribe por ahí.</p>

  <h2>Tu foto no se sube. Nunca.</h2>
  <p>Cuando tomas o eliges una foto, el navegador la recorta y dibuja el carnet dentro
  de tu propio dispositivo. La imagen no viaja a ningún servidor, ni al nuestro ni a
  ninguno. Cuando cierras la página, desaparece.</p>

  <h2>No guardamos carnets, ni nombres</h2>
  <p>El nombre y la ciudad que escribes viajan al servidor solo el instante necesario
  para firmar el código de tu carnet, y no se escriben en ningún sitio. No existe una
  base de datos de carnets ni de personas.</p>
  <p>Lo único que el servidor conserva son tres recuentos: cuántos carnets se han
  emitido en total, cuántos de cada diseño, y los de una prueba que comparamos para
  saber si conviene ofrecer varios diseños o uno solo. Los tres son números sueltos.
  Ninguno guarda quién, ni cuándo, ni desde dónde: no hay forma de ir de un número a
  una persona, porque no existe la lista.</p>

  <h2>Pero el QR sí lleva tus datos</h2>
  <p>Para poder verificar un carnet sin guardar nada, el nombre, la ciudad, tu
  concepto, la fecha y el número van <em>dentro</em> del código QR, protegidos con una
  firma que impide alterarlos. No están cifrados: quien escanee tu carnet los verá. Si compartes tu
  carnet, compartes esos datos. Por eso puedes poner un apodo.</p>

  <h2>Datos técnicos de la conexión</h2>
  <p>Como cualquier web, para servirte la página se procesan datos técnicos de tu
  conexión (dirección IP, tipo de navegador y dispositivo). De eso se encarga
  Cloudflare, nuestro proveedor de infraestructura, con fines de seguridad, prevención
  de abuso y funcionamiento del servicio. No usamos esos datos para identificarte ni
  los cruzamos con tu carnet.</p>

  <h2>Medición, sin cookies</h2>
  <p>Para saber cuánta gente nos visita usamos <strong>Cloudflare Web Analytics</strong>,
  y solo eso. No pone cookies, no guarda identificadores en tu navegador y no te sigue
  de un sitio a otro. Cuenta visitas, páginas vistas, país y desde dónde llega la gente,
  sin armar un perfil de nadie.</p>
  <p>Por eso no te salta ningún cartel pidiéndote permiso: no hay publicidad ni
  rastreo que consentir.
  No usamos el pixel de Meta, ni Google Analytics, ni ninguna herramienta publicitaria.
  Si algún día eso cambiara, te lo pediríamos antes de activarlo y podrías negarte sin
  perder nada.</p>
  <h2>Lo que sí queda en tu navegador</h2>
  <p>Guardamos tres cosas en el almacenamiento local de tu navegador, que es un
  espacio que pertenece a este sitio y que nunca sale de tu dispositivo: una letra
  —<code>A</code> o <code>B</code>— para que siempre veas la misma versión de la
  página mientras probamos si conviene ofrecer varios diseños o uno solo, y dos
  marcas de «por aquí ya pasé», para no contarte dos veces en esa prueba.</p>
  <p>No son cookies, no viajan a ningún servidor, no sirven para identificarte y no
  te siguen a otros sitios. Si borras los datos del sitio en tu navegador,
  desaparecen y empiezas de cero.</p>

  <h2>Tus derechos</h2>
  <p>La <strong>Ley núm. 172-13</strong> sobre protección de datos personales te
  reconoce los derechos de acceso, rectificación, cancelación y oposición sobre tus
  datos. Puedes ejercerlos escribiendo a ${CONTACTO}.</p>
  <p>En la práctica, sobre tu carnet no hay nada que rectificar ni cancelar, porque no
  lo tenemos. Si quieres que un carnet deje de circular, basta con que dejes de
  compartirlo: nosotros no tenemos copia. Sobre los datos de medición, puedes retirar
  tu consentimiento cuando quieras.</p>

  <h2>Menores</h2>
  <p>El sitio no está dirigido a menores de 13 años y no recogemos datos de ellos a
  sabiendas.</p>

  <h2>Cambios</h2>
  <p>Si cambiamos cómo tratamos los datos, actualizaremos esta página. El código es
  público, así que cualquiera puede comprobar que lo que dice aquí es lo que hace el
  sitio.</p>
</div>

<a class="cta" href="/">Volver al inicio</a>`,
    true
  );
}

async function rutaVerificar(request, env) {
  const consulta = (new URL(request.url).searchParams.get('s') || '').slice(0, 32);
  const resultado = consulta ? await verificarSerial(env, consulta, new URL(request.url)) : null;
  const emitidos = await emitidosHasta(env);

  return new Response(paginaVerificar(consulta, resultado, emitidos), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

/* ---------------- router ---------------- */


/* ---------------- una URL por carnet ---------------- */

const SITIO_URL = 'https://palomos.com.do';

function cabezaDe(carnet, canonica) {
  const s = carnet.seo;
  const img = SITIO_URL + (s.og || '/og.jpg');
  // El de la portada, en caja normal: en redes se lee mejor que el
  // del carnet, que va todo en mayusculas.
  const corta = carnet.portada.h1;
  return [
    `<title>${esc(s.titulo)}</title>`,
    `<meta name="description" content="${esc(s.descripcion)}">`,
    '<meta name="author" content="Javier Molina (@javimolinax)">',
    '<meta name="theme-color" content="#0b1b3a">',
    '',
    `<meta property="og:title" content="${esc(corta)}">`,
    `<meta property="og:description" content="${esc(s.descripcion)}">`,
    '<meta property="og:type" content="website">',
    `<meta property="og:url" content="${esc(canonica)}">`,
    '<meta property="og:site_name" content="Carnet de Palomo">',
    '<meta property="og:locale" content="es_DO">',
    `<meta property="og:image" content="${img}">`,
    `<meta property="og:image:secure_url" content="${img}">`,
    '<meta property="og:image:type" content="image/jpeg">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    `<meta property="og:image:alt" content="${esc(corta)}">`,
    '',
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${esc(corta)}">`,
    `<meta name="twitter:description" content="${esc(s.descripcion)}">`,
    `<meta name="twitter:image" content="${img}">`,
    '',
    `<link rel="canonical" href="${esc(canonica)}">`
  ].join('\n');
}

function fichaDe(carnet, canonica) {
  const ficha = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: g(carnet.titulo, 'm'),
    url: canonica,
    applicationCategory: 'EntertainmentApplication',
    operatingSystem: 'Web',
    inLanguage: 'es-DO',
    isFamilyFriendly: true,
    description: carnet.seo.descripcion,
    image: SITIO_URL + (carnet.seo.og || '/og.jpg'),
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'DOP' },
    author: {
      '@type': 'Person',
      name: 'Javier Molina',
      sameAs: [
        'https://www.instagram.com/javimolinax/',
        'https://www.tiktok.com/@javimolinaxt'
      ]
    }
  };
  return '<script type="application/ld+json">\n' +
    JSON.stringify(ficha, null, 2).replace(/</g, '\\u003c') +
    '\n</script>';
}

function portadaDe(carnet) {
  const p = carnet.portada;
  return [
    `<p class="kicker">${esc(p.kicker)}</p>`,
    `<h1>${esc(p.h1)}</h1>`,
    `<p class="sub">${esc(p.sub)}</p>`
  ].join('\n      ');
}

// El registro entero viaja a la página. Antes el cliente tenía su
// propia copia del catálogo y había que mantener las dos a la vez.
function registroDe(carnet) {
  const datos = { carnets: CARNETS, orden: ORDEN_CARNETS, activo: carnet.id };
  return '<script>window.PALOMOS=' +
    JSON.stringify(datos).replace(/</g, '\\u003c') +
    ';</script>';
}

async function paginaDeCarnet(request, env, carnet, canonica) {
  const base = new URL(request.url);
  base.pathname = '/index.html';
  base.search = '';

  const res = await env.ASSETS.fetch(new Request(base.toString(), { method: 'GET' }));
  if (!res.ok) return res;

  let html = await res.text();
  html = html
    .replace('<!--CABEZA-->', cabezaDe(carnet, canonica))
    .replace('<!--FICHA-->', fichaDe(carnet, canonica))
    .replace('<!--PORTADA-->', portadaDe(carnet))
    .replace('<!--REGISTRO-->', registroDe(carnet));

  const headers = {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'public, max-age=0, must-revalidate',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };
  if (env.ENTORNO === 'staging') headers['X-Robots-Tag'] = 'noindex, nofollow';

  return new Response(html, { headers });
}

function sitemapDe(env) {
  const hoy = new Date().toISOString().slice(0, 10);
  const urls = [SITIO_URL + '/'];
  for (const id of ORDEN_CARNETS) {
    if (id === POR_DEFECTO) continue;   // ese vive en la raíz
    urls.push(SITIO_URL + '/' + CARNETS[id].slug);
  }
  urls.push(SITIO_URL + '/verificar', SITIO_URL + '/terminos', SITIO_URL + '/privacidad');

  const cuerpo = urls.map((u) =>
    `  <url><loc>${u}</loc><lastmod>${hoy}</lastmod></url>`).join('\n');

  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    cuerpo + '\n</urlset>\n';
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;

    // La raíz y una dirección por carnet.
    if (path === '/' || path === '/index.html') {
      return paginaDeCarnet(request, env, CARNETS[POR_DEFECTO], SITIO_URL + '/');
    }

    if (path.startsWith('/carnet-de-')) {
      const slug = path.slice(1).replace(/\/$/, '');
      const carnet = carnetPorSlug(slug);
      if (!carnet) return new Response('No existe ese carnet.', { status: 404 });

      // El de por defecto vive en la raíz: su propio slug redirige, para
      // no tener la misma página en dos direcciones peleándose en Google.
      if (carnet.id === POR_DEFECTO) {
        return Response.redirect(SITIO_URL + '/', 301);
      }
      return paginaDeCarnet(request, env, carnet, SITIO_URL + '/' + carnet.slug);
    }

    if (path === '/sitemap.xml') {
      return new Response(sitemapDe(env), {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }

    if (path === '/api/emitir') {
      if (request.method !== 'POST') return json({ ok: false, error: 'Usa POST' }, 405);
      return emitir(request, env);
    }

    if (path.startsWith('/v/')) {
      return verificar(request, env, decodeURIComponent(path.slice(3)));
    }

    // Anota que alguien llego al paso de elegir. Es una escritura
    // abierta, asi que solo acepta dos letras y un nombre de evento de
    // una lista cerrada: lo peor que puede pasar es que alguien infle
    // un contador de un meme.
    if (path === '/api/paso') {
      if (request.method !== 'POST') return json({ ok: false, error: 'Usa POST' }, 405);
      let cuerpo = null;
      try { cuerpo = await request.json(); } catch { cuerpo = null; }
      const rama = cuerpo && cuerpo.exp;
      const evento = cuerpo && cuerpo.paso;
      if ((rama !== 'A' && rama !== 'B') ||
          (evento !== 'elegir' && evento !== 'elegir-unico')) {
        return json({ ok: false }, 400);
      }
      try {
        await contador(env).fetch('https://secuencia/exp?k=' + rama + '%3A' + evento);
      } catch { /* si el registro no responde, no pasa nada */ }
      return json({ ok: true });
    }

    // Solo el numero, para ensenarlo en la portada. Va aparte y
    // cacheado un minuto: si cada visita despertara al Durable Object,
    // lo estariamos pagando por nada. Que el numero llegue con un
    // minuto de retraso no le importa a nadie.
    if (path === '/api/cuantos') {
      try {
        const res = await contador(env).fetch('https://secuencia/peek');
        const { n } = await res.json();
        return new Response(JSON.stringify({ ok: true, total: n }), {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'public, max-age=60'
          }
        });
      } catch {
        return json({ ok: false }, 503);
      }
    }

    if (path === '/api/populares') {
      try {
        const res = await contador(env).fetch('https://secuencia/stats');
        const { n, disenos, experimento } = await res.json();
        return json({ ok: true, total: n, disenos: disenos || {}, experimento: experimento || {} });
      } catch {
        return json({ ok: false, error: 'El registro no responde.' }, 503);
      }
    }

    if (path === '/verificar') return rutaVerificar(request, env);

    if (path === '/terminos' || path === '/privacidad') {
      const html = path === '/terminos' ? paginaTerminos() : paginaPrivacidad();
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }

    if (path === '/api/verificar') {
      const s = new URL(request.url).searchParams.get('s') || '';
      return json({ ok: true, ...(await verificarSerial(env, s, new URL(request.url))) });
    }


    // La copia de staging se cierra entera a los buscadores.
    if (env.ENTORNO === 'staging' && path === '/robots.txt') {
      return new Response(['User-agent: *', 'Disallow: /', ''].join(String.fromCharCode(10)), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Robots-Tag': 'noindex, nofollow'
        }
      });
    }

    const res = await env.ASSETS.fetch(request);
    const headers = new Headers(res.headers);
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // La copia de staging no se indexa. Si Google la encontrara, le
    // competiría al sitio de verdad por sus propias palabras.
    if (env.ENTORNO === 'staging') {
      headers.set('X-Robots-Tag', 'noindex, nofollow');
    }

    return new Response(res.body, { status: res.status, headers });
  }
};
