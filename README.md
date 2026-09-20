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

La bandera y el escudo de la República Dominicana se usan **sin alteración**: no
se recolorean, no se recortan y no se deforman. Los archivos están en
`public/assets/` y vienen de Wikimedia Commons, en dominio público
(`PD-Dominican Republic` + `PD ineligible`).

El emblema del palomo (`drawPalomo` en `public/carnet.js`) es un dibujo propio y
no guarda ninguna relación con el escudo nacional.

### Lo que dice la Ley 210-19

Que los archivos estén libres de derechos de autor **no** significa que su uso esté
libre de restricciones. La [Ley núm. 210-19](https://mirex.gob.do/pdf/dcep/ley_no.210-19_de_los_simbolos_patrios_dominicanos.pdf)
regula el uso de la bandera, el escudo y el himno. Lo que aplica aquí:

| Artículo | Qué dice | Cómo nos afecta |
|---|---|---|
| 24.1 y 24.2 | Es irreverencia usar colores distintos a los constitucionales, o incorporar a la bandera una versión del escudo que no sea la oficial | **Cumplido.** Usamos los archivos oficiales sin tocar |
| 24.5 | Prohíbe usar la bandera en propaganda comercial o **como distintivo característico de cualquier organización privada** | **Riesgo.** El «Ministerio de Palomos» es una organización ficticia privada que usa la bandera como distintivo |
| 26 | Reserva el uso del Escudo Nacional en **identificaciones** e impresos a una lista cerrada de funcionarios públicos | **Riesgo.** El carnet es una identificación con el escudo, emitida por un particular |
| 28.1 | Es irreverencia usar el escudo violando cualquier precepto de la ley | Se activa si el artículo 26 se considera incumplido |
| 28.3 | Es irreverencia usar el escudo en promociones comerciales con fines de lucro | **No aplica hoy.** Aplicaría si el sitio se monetiza |
| 25 y 29 | Ultraje: quemar, destruir, arrojar al suelo, profanar, poner letreros encima | **No aplica.** Nada de eso se hace |
| 38 | Pena por irreverencia: 15 a 30 días de prisión y multa de 1 a 5 salarios mínimos del sector público | |
| 39 | Pena por ultraje: 1 a 3 meses y multa de 5 a 20 salarios mínimos | |
| 42 | El juzgado de paz es el tribunal competente | |

El riesgo real está en los artículos 26 y 24.5, no en el ultraje: poner el escudo
oficial en una identificación emitida por un particular. El descargo y la página
[/simbolos-patrios](https://palomos.com.do/simbolos-patrios) documentan la buena fe
y la ausencia de lucro, pero no eliminan ese punto.

**Si se quiere exposición cero**, la vía es quitar el escudo y la bandera del carnet
y dejar solo el emblema del palomo: el documento sigue leyéndose como cédula
dominicana por la tipografía, la retícula, el guilloche y la banda MRZ.

Esto no es asesoría legal. Para certeza, consulta a un abogado dominicano.

---

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
public/assets/      Bandera y escudo oficiales (dominio público)
public/vendor/      qrcode-generator (MIT, de Kazuhiko Arase)
```

## Rutas

| Ruta | Qué hace |
|---|---|
| `POST /api/emitir` | Toma un secuencial y devuelve el carnet firmado |
| `GET /v/<token>` | Página de verificación del QR |
| `GET /verificar?s=<número>` | Verificación por número escrito |
| `GET /api/verificar?s=<número>` | Lo mismo, en JSON |
| `GET /api/wallet/google` · `/apple` | Pases de Wallet (501 sin credenciales) |

---

## Licencia

Código bajo [MIT](LICENSE). El escudo y la bandera son de dominio público y su
uso está sujeto a la Ley de Símbolos Patrios dominicana, no a esta licencia.
