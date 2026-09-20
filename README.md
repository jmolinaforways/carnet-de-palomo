# Carnet de Palomo

Genera tu Carnet de Palomo del «Ministerio de Palomos». Es un meme dominicano:
*palomo* es el que está tranquilo de su casa, sin una maña, sin líos.

**Esto es una parodia.** El Ministerio de Palomos no existe, el carnet no tiene
validez legal y no sirve para identificarse ante nadie.

Sitio: **[palomos.com.do](https://palomos.com.do)** · Meme de [@javimolinax](https://www.instagram.com/javimolinax/)

---

## Cómo funciona

1. Escribes un nombre (puede ser inventado) y tomas o subes una foto.
2. El navegador recorta la foto y dibuja el carnet completo en un `<canvas>`.
3. El servidor toma un número secuencial, firma el carnet con HMAC-SHA256 y
   devuelve un token.
4. El QR del carnet apunta a `/v/<token>`, que muestra la página de verificación.

### Lo que no hacemos

La foto **nunca sale del navegador**. Al servidor solo viaja el nombre, y solo
para firmar el token; no se guarda.

No hay base de datos de carnets. El carnet entero viaja firmado dentro del
propio QR, así que verificar no requiere consultar nada. Lo único con estado en
todo el proyecto es un Durable Object que guarda **un número**: cuántos carnets
se han emitido. No sabe de quién es cada uno.

Por eso la verificación por número escrito (`/verificar`) confirma que el carnet
fue emitido y que su dígito verificador cuadra, pero no muestra el nombre: no lo
tenemos. Para ver los datos completos hay que escanear el QR, que los lleva
firmados dentro.

---

## Símbolos patrios

**El carnet no lleva la bandera ni el escudo de la República Dominicana.** Es una
decisión, no un descuido. No los pongas.

El emblema del «Ministerio de Palomos» es un palomo dibujado con código
( en ). No es una versión del Escudo Nacional ni
toma ninguno de sus elementos.

### Por qué, según la Ley 210-19

La [Ley núm. 210-19](https://mirex.gob.do/pdf/dcep/ley_no.210-19_de_los_simbolos_patrios_dominicanos.pdf)
regula el uso de la bandera, el escudo y el himno. Tres artículos nos tocaban de lleno:

| Artículo | Qué dice | Por qué aplica |
|---|---|---|
| 26 | Reserva el uso del Escudo Nacional en **identificaciones** e impresos a una lista cerrada de funcionarios públicos | El carnet es una identificación emitida por un ministerio inventado |
| 28.1 | Es irreverencia usar el escudo violando cualquier precepto de la ley | Se activa por el artículo 26 |
| 24.5 | Prohíbe usar la bandera «total o parcialmente» como **distintivo característico de cualquier organización privada**, y en propaganda comercial | El «Ministerio de Palomos» es una organización privada ficticia |
| 28.3 | Es irreverencia usar el escudo en **promociones comerciales con fines de lucro** | El carnet está pensado para promociones con negocios locales |
| 25 y 29 | Ultraje: quemar, destruir, arrojar al suelo, profanar, poner letreros encima | No aplica: nada de eso se hace |
| 38 | Pena por irreverencia: 15 a 30 días de prisión y multa de 1 a 5 salarios mínimos del sector público | |
| 39 | Pena por ultraje: 1 a 3 meses y multa de 5 a 20 salarios mínimos | |
| 42 | El juzgado de paz es el tribunal competente | |

El artículo 28.3 es el decisivo: en cuanto el carnet sirva para promociones con
negocios, usar el escudo pasaría de riesgo interpretable a supuesto expreso. Por eso
se quitó antes de que eso ocurra, y no después.

### Los colores sí se usan

La franja superior del sitio es azul, blanco y rojo en banda horizontal. Es color,
no símbolo: no es cuarteada, no tiene cruz blanca y no reproduce la forma de la
bandera. El artículo 44 prohíbe combinar los colores para identificar **agrupaciones,
partidos o movimientos políticos** de modo que se asemejen a la bandera, y el 24.6
habla de propaganda **comercial o política** que en conjunto la asemeje. Si algún día
el sitio hace campañas comerciales con piezas que evoquen la bandera, hay que volver
a mirar el 24.6.

La página [/simbolos-patrios](https://palomos.com.do/simbolos-patrios) publica este
criterio. Esto no es asesoría legal; para certeza, consulta a un abogado dominicano.

## Correr en local

```bash
npm install
npm run dev
```

Queda en http://localhost:8787. En local el contador arranca en 1 y la firma usa
un secreto de desarrollo.

> **Windows:** `wrangler` falla con `ENAMETOOLONG` si la ruta del proyecto es muy
> larga. Clónalo en una ruta corta, tipo `C:\Users\<tu-usuario>\palomos`.

## Desplegar

```bash
npx wrangler login
npx wrangler secret put SIGNING_SECRET
npm run deploy
```

`SIGNING_SECRET` es la llave que firma los carnets. Genera una así:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Si cambias el secreto, todos los QR emitidos antes dejan de verificar.**
Cámbialo solo si se filtró.

### Dominio

En el panel de Cloudflare, Workers & Pages → `carnet-de-palomo` → Settings →
Domains & Routes → Add custom domain → `palomos.com.do`.

---

## Wallet

El botón «Guardar en Wallet» está en el código pero **apagado**, porque necesita
credenciales que hay que pedir. Mientras tanto el carnet se descarga como PNG,
que funciona igual en iPhone y Android.

| | Costo | Qué hace falta |
|---|---|---|
| **Google Wallet** | Gratis | Cuenta de emisor en el [Google Pay & Wallet Console](https://pay.google.com/business/console). Arranca en *demo mode* (los pases salen con `[TEST ONLY]` y solo los guardan cuentas de prueba). Para abrirlo a todo el mundo hay que pedir *publishing access*: es gratis, lo revisa Google y tarda ~2 días hábiles. |
| **Apple Wallet** | US$99/año | Certificado Pass Type ID, que exige membresía activa del Apple Developer Program. No hay vía gratis: ninguna librería puede emitir ese certificado porque es una autoridad certificadora. |

El Worker enciende cada botón solo si encuentra sus variables:

```bash
# Google Wallet
npx wrangler secret put GOOGLE_WALLET_ISSUER_ID
npx wrangler secret put GOOGLE_WALLET_SA_EMAIL
npx wrangler secret put GOOGLE_WALLET_SA_KEY     # llave privada del service account

# Apple Wallet
npx wrangler secret put APPLE_PASS_CERT
npx wrangler secret put APPLE_PASS_KEY
npx wrangler secret put APPLE_WWDR_CERT
```

Sin ellas, `/api/wallet/*` responde 501 y los botones ni aparecen.

---

## Estructura

```
src/index.js        Worker: emisión, firma, verificación, contador (Durable Object)
public/index.html   La página
public/carnet.js    El dibujo del carnet en canvas
public/app.js       Cámara, foto, pasos, descarga y compartir
public/styles.css   Estilos
public/vendor/      qrcode-generator (MIT, de Kazuhiko Arase)
```

## Rutas

| Ruta | Qué hace |
|---|---|
| `POST /api/emitir` | Toma un secuencial y devuelve el carnet firmado |
| `GET /v/<token>` | Página de verificación del QR |
| `GET /verificar?s=<número>` | Verificación por número escrito |
| `GET /api/verificar?s=<número>` | Lo mismo, en JSON |
| `GET /api/lugares` | Lista de lugares del selector |
| `GET /simbolos-patrios` | Criterio de uso de los símbolos patrios |
| `GET /api/wallet/google` · `/apple` | Pases de Wallet (501 sin credenciales) |

---

## Licencia

Código bajo [MIT](LICENSE).
