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

## La bandera: cómo se usa y qué riesgo tiene

Durante un tiempo el carnet no llevó ningún símbolo patrio. Ya no es así: **cinco
de los once diseños llevan la Bandera Nacional**, pequeña y en un costado (Hielo,
Vintage, Sobrio, Solapín y ASODOPA).

**Si la tocas, respeta estas dos reglas.** Son las que mantienen el uso dentro de
lo defendible:

1. **No se dibuja: se usa el archivo.** `public/bandera.svg` es el archivo oficial
   ([Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Flag_of_the_Dominican_Republic.svg),
   dominio público), 900×600 con la cruz de 120 sobre cuarteles de 240 —la mitad de
   la altura de un cuartel, la proporción que manda la ley— y con su Escudo dentro.
   Se pinta tal cual, solo escalado, a su propia proporción. Redibujar un símbolo
   patrio a mano es alterarlo, que es justo lo prohibido. Si el archivo no ha
   cargado todavía, su hueco queda **en blanco**: nunca se pinta media bandera.
2. **No es el centro de nada.** Va al lado del nombre de la institución, en chico.

El emblema propio del proyecto es otra cosa: un palomo con corona dentro de un aro
(`marcaPalomos` en `public/carnet.js`). Ese sí es dibujado, y es el mismo en los
once diseños.

### El riesgo, dicho claro

La [Ley núm. 210-19](https://mirex.gob.do/pdf/dcep/ley_no.210-19_de_los_simbolos_patrios_dominicanos.pdf)
no contempla ninguna versión de la bandera sin escudo como alternativa oficial: el
artículo 7 confirma que el Escudo va en el centro, y el 24.1 fija los colores
—rojo bermellón, azul ultramar y blanco en la cruz—.

Pero además:

- **Art. 24.5** — prohíbe usar la Bandera «total o parcialmente en promoción o
  propaganda electoral, política o **comercial**».
- **Art. 28.3** — declara irreverencia usar el Escudo «en promociones comerciales
  con fines de lucro».
- **Arts. 38 y 39** — irreverencia: 15 a 30 días de prisión y multa de 1 a 5
  salarios mínimos. Ultraje: 1 a 3 meses y de 5 a 20 salarios mínimos.

Este proyecto contempla promociones con negocios locales. Eso activa los dos
artículos. Quien mantiene el sitio lo sabe y decidió seguir adelante; queda escrito
aquí para que nadie que llegue al código se lo encuentre de sorpresa.

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
