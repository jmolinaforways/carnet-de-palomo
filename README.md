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
5. El carnet se descarga como PNG. No hay pases de Apple Wallet ni Google Wallet:
   el PNG funciona igual en iPhone y en Android, y mantiene el proyecto simple.

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

## Sin símbolos patrios

**El carnet no lleva la bandera ni el escudo de la República Dominicana. No los
añadas.** El emblema es un palomo dibujado con código (`paintPalomo` en
`public/carnet.js`); lo demás son solo azul y rojo, que son colores, no símbolos.

El motivo está en la [Ley núm. 210-19](https://mirex.gob.do/pdf/dcep/ley_no.210-19_de_los_simbolos_patrios_dominicanos.pdf):
el artículo 26 reserva el Escudo en **identificaciones** a una lista cerrada de
funcionarios públicos; el 24.5 prohíbe la bandera como distintivo de una
organización privada; y el 28.3 declara irreverencia usar el escudo en promociones
comerciales con fines de lucro, que es justo hacia donde va este proyecto. La pena
por irreverencia es de 15 a 30 días de prisión y multa de 1 a 5 salarios mínimos
del sector público (art. 38).

## Términos, privacidad y datos

El sitio publica [términos](https://palomos.com.do/terminos) y
[política de privacidad](https://palomos.com.do/privacidad), y hay que aceptarlos
con una casilla antes de poder emitir un carnet.

Lo que declaran es lo que el código hace, y conviene que siga siendo así:

- La foto **nunca** sale del navegador. No hay endpoint que la reciba.
- El nombre y la ciudad viajan al servidor solo para firmar el token. No se guardan.
- Lo único con estado es el contador de secuenciales: un número, no una lista.
- El nombre y la ciudad **sí** van dentro del QR, firmados y legibles por quien lo
  escanee. Eso está dicho en los términos, en la privacidad y en la propia casilla.

Si algún día se empieza a almacenar nombres o fotos, hay que reescribir las dos
páginas y asumir las obligaciones de responsable de tratamiento de la Ley 172-13:
base legal, conservación, seguridad y atención de los derechos de acceso,
rectificación, cancelación y oposición.

Nada de esto es asesoría legal. Para certeza, consulta a un abogado dominicano.

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
| `GET /terminos` | Términos y condiciones |
| `GET /privacidad` | Política de privacidad |

---

## Licencia

Código bajo [MIT](LICENSE).
