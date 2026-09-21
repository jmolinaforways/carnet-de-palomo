/* =======================================================================
   El registro de carnets.

   Esto es LA fuente. El Worker lo importa y lo inyecta en la página, así
   que el navegador ve exactamente lo mismo: no hay dos catálogos que
   mantener sincronizados, que es como estaba antes.

   Para añadir un carnet nuevo, añade una entrada aquí. Nada más.

   ---- El género ----

   Un texto puede ser una cadena suelta -igual para todos- o { m, f }.
   Así solo se escribe dos veces lo que de verdad cambia: las
   instituciones, los oficios y casi todos los antecedentes son iguales.

   Hay tres opciones: 'm', 'f' y 'x' (prefiero no decir). La 'x' usa la
   forma masculina, que en español es la no marcada; si algún día hay
   una forma neutra mejor, se cambia solo aquí.

   ---- Lo que no se puede tocar ----

   'codigo' viaja dentro del token firmado y 'prefijo' va en el número
   del carnet. Los dos son permanentes: cambiarlos invalida los carnets
   que ya tiene la gente. Añadir, sí; renombrar, no.
   ======================================================================= */

export const GENEROS = ['m', 'f', 'x'];

export function generoDe(v) {
  return GENEROS.includes(v) ? v : 'x';
}

// Resuelve un texto según el género. Acepta cadena o { m, f }.
export function g(valor, genero) {
  if (typeof valor === 'string') return valor;
  if (!valor) return '';
  return genero === 'f' && valor.f ? valor.f : valor.m;
}

export const CARNETS = {
  palomo: {
    id: 'palomo',

    // El código viaja en el token y el prefijo va en el número. Los dos
    // son permanentes: cambiarlos rompe los carnets ya emitidos.
    codigo: 'p',
    prefijo: 'PAL',

    slug: 'carnet-de-palomo',
    orden: 1,
    porDefecto: true,
    buscar: ['palomo', 'paloma', 'tranquilo', 'paz', 'sin lios', 'sin problemas'],

    nombre: { m: 'Palomo', f: 'Paloma' },
    sujeto: { m: 'PALOMO', f: 'PALOMA' },
    hashtag: 'palomos',
    nivelEtiqueta: 'Nivel de tigueraje',
    vence: 'DE POR VIDA',
    invitacion: 'Invita a tus panas palomos al club.',
    titulo: { m: 'CARNET DE PALOMO', f: 'CARNET DE PALOMA' },

    lema: 'PAZ · TRANQUILIDAD · VIDA SIN LÍOS',
    cintilla: { m: 'Un Palomo Certificado', f: 'Una Paloma Certificada' },
    citas: [
      { m: 'El que se queda en su casa, siempre gana.', f: 'La que se queda en su casa, siempre gana.' },
      { m: 'Mejor tranquilo en mi casa que en líos en la calle.', f: 'Mejor tranquila en mi casa que en líos en la calle.' }
    ],
    sello: [
      'SIN ENREDOS',
      'SIN PROBLEMAS',
      'EN MI CASA',
      { m: 'TRANQUILO', f: 'TRANQUILA' }
    ],

    seo: {
      titulo: 'Emite tu Carnet de Palomo RD | Gratis y en 10 segundos',
      descripcion: 'La calle está caliente, pero yo ya tengo mi carnet. Emite tu Carnet de Palomo con tu foto, gratis y sin dar datos personales. #teampalomos'
    },

    titulos: {
      oficial: { m: 'CARNET DE PALOMO', f: 'CARNET DE PALOMA' },
      hielo: { m: 'CARNET DE PALOMO', f: 'CARNET DE PALOMA' },
      institucional: { m: 'CARNET DE PALOMO', f: 'CARNET DE PALOMA' },
      crema: { m: 'CERTIFICADO DE PALOMO', f: 'CERTIFICADO DE PALOMA' },
      carbon: { m: 'CARNET DE PALOMO', f: 'CARNET DE PALOMA' },
      candela: { m: 'CREDENCIAL DE PALOMO', f: 'CREDENCIAL DE PALOMA' },
      solapin: { m: 'CARNET DE PALOMO', f: 'CARNET DE PALOMA' },
      asodopa: { m: 'CERTIFICADO DE PALOMO', f: 'CERTIFICADO DE PALOMA' },
      nocturno: { m: 'CARNET DE PALOMO', f: 'CARNET DE PALOMA' },
      tricolor: { m: 'CERTIFICADO DE PALOMO', f: 'CERTIFICADO DE PALOMA' },
      esmeralda: { m: 'CREDENCIAL DE PALOMO', f: 'CREDENCIAL DE PALOMA' }
    },

    // Una institución por estilo, para que cada diseño tenga su voz.
    // No cambian con el género: son el nombre del organismo.
    emisores: {
      oficial: { nombre: 'Ministerio de Palomos', siglas: 'MINPAL' },
      institucional: { nombre: 'Dirección General del Palomaje', siglas: 'DGP' },
      crema: { nombre: 'Instituto Nacional del Palomaje', siglas: 'INAPAL' },
      hielo: { nombre: 'Comisión Nacional de Palomos', siglas: 'CONAPAL' },
      carbon: { nombre: 'Consejo Superior de Palomos', siglas: 'CONSUPAL' },
      candela: { nombre: 'Registro Nacional de Palomos', siglas: 'RENAPAL' },
      solapin: { nombre: 'Federación Dominicana de Palomos', siglas: 'FEDOPAL' },
      asodopa: { nombre: 'Asociación Dominicana de Palomos', siglas: 'ASODOPA' },
      nocturno: { nombre: 'Cámara Dominicana de Palomos', siglas: 'CADOPAL' },
      tricolor: { nombre: 'Asociación Nacional de Palomos', siglas: 'ANPC' },
      esmeralda: { nombre: 'Junta Central de Palomos', siglas: 'JCP' }
    },

    frases: {
      oficial: 'La paz también es una forma de éxito.',
      hielo: 'Aquí no hay líos, aquí hay carnet.',
      institucional: { m: 'El que se queda en su casa, siempre gana.', f: 'La que se queda en su casa, siempre gana.' },
      crema: 'Aquí no andamos en gente.',
      carbon: { m: 'El que no debe, duerme tranquilo.', f: 'La que no debe, duerme tranquila.' },
      candela: 'Mi casa, mi paz, mi gente.',
      solapin: { m: 'No es un sueño, es un palomo certificado.', f: 'No es un sueño, es una paloma certificada.' },
      asodopa: { m: 'Mejor tranquilo en mi casa que en líos en la calle.', f: 'Mejor tranquila en mi casa que en líos en la calle.' },
      nocturno: 'Sin líos, sin cuentos, sin maña.',
      tricolor: { m: "Pa' los palomos de verdad.", f: "Pa' las palomas de verdad." },
      esmeralda: 'Tranquilo en su casa, todo frío.'
    },

    condiciones: [
      { m: 'PALOMO CERTIFICADO', f: 'PALOMA CERTIFICADA' },
      { m: 'OFICIALMENTE PALOMO', f: 'OFICIALMENTE PALOMA' },
      { m: 'PALOMO VERIFICADO', f: 'PALOMA VERIFICADA' },
      { m: 'PALOMO DE PRIMERA', f: 'PALOMA DE PRIMERA' },
      { m: 'PALOMO VITALICIO', f: 'PALOMA VITALICIA' },
      { m: 'TRANQUILO DE SU CASA', f: 'TRANQUILA DE SU CASA' },
      { m: 'PALOMO SIN UNA MAÑA', f: 'PALOMA SIN UNA MAÑA' }
    ],
    oficios: [
      'TRABAJAR Y EVITAR PROBLEMAS',
      'DE LA CASA AL TRABAJO',
      'CASA, COLMADO Y CASA',
      'DISFRUTAR MI FAMILIA',
      { m: 'SERENO DE SU CASA', f: 'SERENA DE SU CASA' },
      'NI FU NI FA',
      'EN SU CASA TEMPRANO'
    ],
    antecedentes: [
      'NINGUNO, GRACIAS A DIOS',
      'NINGUNO',
      { m: 'LIMPIO COMO EL AGUA', f: 'LIMPIA COMO EL AGUA' },
      'NI UNA MULTA',
      'NINGUNO, PREGUNTE'
    ]
  },

  pariguayo: {
    id: 'pariguayo',

    // El código viaja en el token y el prefijo va en el número. Los dos
    // son permanentes: cambiarlos rompe los carnets ya emitidos.
    codigo: 'g',
    prefijo: 'PAR',

    slug: 'carnet-de-pariguayo',
    orden: 2,
    buscar: ['pariguayo', 'pariguaya', 'pariguallo', 'parriguayo', 'no bailo', 'bultos'],

    nombre: { m: 'Pariguayo', f: 'Pariguaya' },
    sujeto: { m: 'PARIGUAYO', f: 'PARIGUAYA' },
    hashtag: 'pariguayos',
    nivelEtiqueta: 'Nivel de flow',
    vence: 'DE POR VIDA',
    invitacion: 'Invita a tus panas pariguayos al club.',
    titulo: { m: 'CARNET DE PARIGUAYO', f: 'CARNET DE PARIGUAYA' },

    lema: 'MIRAR · CUIDAR · NO BAILAR',
    cintilla: { m: 'Un Pariguayo Certificado', f: 'Una Pariguaya Certificada' },
    citas: [
      { m: 'El que no baila, observa.', f: 'La que no baila, observa.' },
      'Yo vine fue a mirar, no a bailar.'
    ],
    sello: [
      'SIN BAILAR',
      'CON EL VASO',
      'EN LA ESQUINA',
      'MIRANDO'
    ],

    seo: {
      titulo: 'Emite tu Carnet de Pariguayo RD | Gratis y en 10 segundos',
      descripcion: 'Yo no bailo, yo cuido los bultos. Emite tu Carnet de Pariguayo con tu foto, gratis y sin dar datos personales. #teampariguayos'
    },

    titulos: {
      oficial: { m: 'CARNET DE PARIGUAYO', f: 'CARNET DE PARIGUAYA' },
      hielo: { m: 'CARNET DE PARIGUAYO', f: 'CARNET DE PARIGUAYA' },
      institucional: { m: 'CARNET DE PARIGUAYO', f: 'CARNET DE PARIGUAYA' },
      crema: { m: 'CERTIFICADO DE PARIGUAYO', f: 'CERTIFICADO DE PARIGUAYA' },
      carbon: { m: 'CARNET DE PARIGUAYO', f: 'CARNET DE PARIGUAYA' },
      candela: { m: 'CREDENCIAL DE PARIGUAYO', f: 'CREDENCIAL DE PARIGUAYA' },
      solapin: { m: 'CARNET DE PARIGUAYO', f: 'CARNET DE PARIGUAYA' },
      asodopa: { m: 'CERTIFICADO DE PARIGUAYO', f: 'CERTIFICADO DE PARIGUAYA' },
      nocturno: { m: 'CARNET DE PARIGUAYO', f: 'CARNET DE PARIGUAYA' },
      tricolor: { m: 'CERTIFICADO DE PARIGUAYO', f: 'CERTIFICADO DE PARIGUAYA' },
      esmeralda: { m: 'CREDENCIAL DE PARIGUAYO', f: 'CREDENCIAL DE PARIGUAYA' }
    },

    // Una institución por estilo, para que cada diseño tenga su voz.
    // No cambian con el género: son el nombre del organismo.
    emisores: {
      oficial: { nombre: 'Ministerio de Pariguayos', siglas: 'MINPAR' },
      institucional: { nombre: 'Dirección General del Pariguayaje', siglas: 'DGPAR' },
      crema: { nombre: 'Instituto Nacional del Pariguayaje', siglas: 'INAPARI' },
      hielo: { nombre: 'Comisión Nacional de Pariguayos', siglas: 'CONAPARI' },
      carbon: { nombre: 'Consejo Superior de Pariguayos', siglas: 'CONSUPARI' },
      candela: { nombre: 'Registro Nacional de Pariguayos', siglas: 'RENAPARI' },
      solapin: { nombre: 'Federación Dominicana de Pariguayos', siglas: 'FEDOPARI' },
      asodopa: { nombre: 'Asociación Dominicana de Pariguayos', siglas: 'ASODOPARI' },
      nocturno: { nombre: 'Cámara Dominicana de Pariguayos', siglas: 'CADOPARI' },
      tricolor: { nombre: 'Asociación Nacional de Pariguayos', siglas: 'ANPAR' },
      esmeralda: { nombre: 'Junta Central de Pariguayos', siglas: 'JCPAR' }
    },

    frases: {
      oficial: { m: 'El que no baila, observa.', f: 'La que no baila, observa.' },
      hielo: 'Aquí no se baila, aquí se observa.',
      institucional: 'Yo no bailo, yo cuido los bultos.',
      crema: 'Yo vine fue a mirar.',
      carbon: { m: 'El que graba no baila.', f: 'La que graba no baila.' },
      candela: 'Sosteniendo la pared desde siempre.',
      solapin: { m: 'No es un sueño, es un pariguayo certificado.', f: 'No es un sueño, es una pariguaya certificada.' },
      asodopa: 'Llegué temprano y me quedé en la esquina.',
      nocturno: 'Buscando el hielo toda la noche.',
      tricolor: { m: "Pa' los pariguayos de verdad.", f: "Pa' las pariguayas de verdad." },
      esmeralda: 'Parado ahí, como siempre.'
    },

    condiciones: [
      { m: 'PARIGUAYO CERTIFICADO', f: 'PARIGUAYA CERTIFICADA' },
      { m: 'OFICIALMENTE PARIGUAYO', f: 'OFICIALMENTE PARIGUAYA' },
      { m: 'PARIGUAYO VERIFICADO', f: 'PARIGUAYA VERIFICADA' },
      'MIRÓN OFICIAL',
      { m: 'PARIGUAYO VITALICIO', f: 'PARIGUAYA VITALICIA' },
      'EL QUE NO BAILA',
      { m: 'PARIGUAYO DE PRIMERA', f: 'PARIGUAYA DE PRIMERA' }
    ],
    oficios: [
      'SOSTENIENDO LA PARED',
      'CUIDANDO LOS BULTOS',
      'MIRANDO LA FIESTA',
      'PARADO EN LA ESQUINA',
      'BUSCANDO EL HIELO',
      'GUARDANDO EL PUESTO',
      'GRABANDO A LOS DEMÁS'
    ],
    antecedentes: [
      'NINGUNO, NI BAILANDO',
      'NINGUNO, GRACIAS A DIOS',
      'NUNCA ME HE TIRADO',
      'CERO PASOS DADOS',
      'NINGUNO, PREGUNTE'
    ]
  }
};

// En el orden en que se enseñan.
export const ORDEN_CARNETS = Object.values(CARNETS)
  .sort((a, b) => a.orden - b.orden)
  .map((c) => c.id);

export const POR_DEFECTO = (Object.values(CARNETS).find((c) => c.porDefecto) || CARNETS.palomo).id;

// Por código de token y por slug de URL, para no recorrer el objeto.
const PORCODIGO = {};
const PORSLUG = {};
for (const c of Object.values(CARNETS)) {
  PORCODIGO[c.codigo] = c;
  PORSLUG[c.slug] = c;
}

export function carnetDe(v) {
  return CARNETS[v] || PORCODIGO[v] || CARNETS[POR_DEFECTO];
}

export function carnetPorSlug(slug) {
  return PORSLUG[slug] || null;
}
