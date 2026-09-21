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
todo el proyecto es un Durable Object que guarda **tres recuentos**: cuántos
carnets se han emitido, cuántos de cada diseño, y los de una prueba A/B. Son
números sueltos; ninguno sabe de quién es cada carnet.

Por eso la verificación por número escrito (`/verificar`) confirma que el carnet
fue emitido y que su dígito verificador cuadra, pero no muestra el nombre: no lo
tenemos. Para ver los datos completos hay que escanear el QR, que los lleva
firmados dentro.

---

## Sin símbolos patrios

**El carnet no lleva la Bandera ni el Escudo de la República Dominicana. No los
añadas.** El emblema es un palomo con corona dentro de un aro, dibujado con código
(`marcaPalomos` en `public/carnet.js`); lo demás son azul y rojo, que son colores,
no símbolos.

Hubo un rato en que cinco diseños sí llevaron la Bandera, pequeña y con el archivo
oficial sin alterar. Se quitó, y conviene saber por qué antes de querer devolverla.

El motivo está en la [Ley núm. 210-19](https://mirex.gob.do/pdf/dcep/ley_no.210-19_de_los_simbolos_patrios_dominicanos.pdf):

- **Art. 24.5** — prohíbe usar la Bandera «total o parcialmente en promoción o
  propaganda electoral, política o **comercial**». No distingue tamaños: una
  banderita en un costado también es «parcialmente».
- **Art. 28.3** — declara irreverencia usar el Escudo «en promociones comerciales
  con fines de lucro».
- **Arts. 38 y 39** — irreverencia: 15 a 30 días de prisión y multa de 1 a 5
  salarios mínimos. Ultraje: 1 a 3 meses y de 5 a 20 salarios mínimos.

Este proyecto contempla promociones con negocios locales, y eso activa los dos
artículos. Por eso no hay símbolos patrios.

Un apunte por si alguien busca el atajo: **no existe una versión oficial de la
Bandera sin Escudo**. El artículo 7 confirma que el Escudo va en el centro, y el
24.1 fija los colores —rojo bermellón, azul ultramar y blanco en la cruz—. Dibujar
una bandera propia tampoco vale: redibujar un símbolo patrio es alterarlo, que es
justo lo que la ley prohíbe.

## Lo que no dibujamos nosotros

Casi todo el carnet se dibuja con código. Una sola pieza viene de fuera:

- **La silueta de la Estatua de la Libertad** (emblema del Carnet de Dominican
  York) es [`Liberty_symbol.svg`](https://commons.wikimedia.org/wiki/File:Liberty_symbol.svg)
  de Mikael Häggström, que la puso en dominio público en 2008. Va incrustada en
  `public/carnet.js` como un `Path2D` de 127 puntos, normalizada y recentrada;
  no se descarga nada.

  Está ahí porque dibujarla a mano no salía: tres intentos y seguía pareciendo
  una pieza de ajedrez. A ese tamaño una figura humana necesita la silueta de
  verdad. La atribución no es legalmente obligatoria —es dominio público— pero
  se pone igual.

## Términos, privacidad y datos

El sitio publica [términos](https://palomos.com.do/terminos) y
[política de privacidad](https://palomos.com.do/privacidad), y hay que aceptarlos
con una casilla antes de poder emitir un carnet.

Lo que declaran es lo que el código hace, y conviene que siga siendo así:

- La foto **nunca** sale del navegador. No hay endpoint que la reciba.
- El nombre y la ciudad viajan al servidor solo para firmar el token. No se guardan.
- Lo único con estado son tres recuentos agregados: números, no listas.
- El navegador sí guarda tres cosas en `localStorage` (la rama de la prueba A/B y
  dos marcas para no contar dos veces). No salen del dispositivo y están dichas en
  la política de privacidad.
- El nombre, la ciudad y el concepto **sí** van dentro del QR, firmados y legibles
  por quien lo escanee. Eso está dicho en los términos, en la privacidad y en la propia casilla.

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
