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

// «Certificado» describe a la persona, no al documento, asi que
// concuerda. Es igual para todos los carnets: vive aqui una sola vez.
// El plural va escrito, no derivado: «BEBEDOR» + «S» da «BEBEDORS».
// En espanol las palabras acabadas en consonante llevan -es.
// El dibujo que lleva cada carnet: 'palomo', 'bulto' o 'copa'. Un
// bebedor no lleva palomos; lleva botella y vaso.
export const EMBLEMAS = ['palomo', 'bulto', 'copa'];

export const CERTIFICADO = { m: 'CERTIFICADO', f: 'CERTIFICADA' };

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
    plural: { m: 'PALOMOS', f: 'PALOMAS' },
    hashtag: 'palomos',
    emblema: 'palomo',
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
      descripcion: 'La calle está caliente, pero yo ya tengo mi carnet. Emite tu Carnet de Palomo con tu foto, gratis y sin dar datos personales. #teampalomos',
      og: '/og.jpg'
    },

    // Lo que se ve al entrar. Va aquí y no en el HTML porque el Worker
    // lo pinta por carnet: un buscador tiene que leer el H1 que toca.
    portada: {
      kicker: 'Ministerio de Palomos · RD',
      h1: 'Carnet de Palomo',
      sub: 'Tranquilo en su casa, todo frío. No tamo en líos.'
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
      esmeralda: { m: 'Tranquilo en su casa, todo frío.', f: 'Tranquila en su casa, todo frío.' }
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
    plural: { m: 'PARIGUAYOS', f: 'PARIGUAYAS' },
    hashtag: 'pariguayos',
    emblema: 'bulto',
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
      descripcion: 'Yo no bailo, yo cuido los bultos. Emite tu Carnet de Pariguayo con tu foto, gratis y sin dar datos personales. #teampariguayos',
      // Sin imagen propia todavía: cae en la de palomo. Cada carnet
      // nuevo debería traer la suya.
      og: '/og.jpg'
    },

    portada: {
      kicker: 'Ministerio de Pariguayos · RD',
      h1: 'Carnet de Pariguayo',
      sub: 'Yo no bailo, yo cuido los bultos. Vine fue a mirar.'
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
      esmeralda: { m: 'Parado ahí, como siempre.', f: 'Parada ahí, como siempre.' }
    },

    condiciones: [
      { m: 'PARIGUAYO CERTIFICADO', f: 'PARIGUAYA CERTIFICADA' },
      { m: 'OFICIALMENTE PARIGUAYO', f: 'OFICIALMENTE PARIGUAYA' },
      { m: 'PARIGUAYO VERIFICADO', f: 'PARIGUAYA VERIFICADA' },
      { m: 'MIRÓN OFICIAL', f: 'MIRONA OFICIAL' },
      { m: 'PARIGUAYO VITALICIO', f: 'PARIGUAYA VITALICIA' },
      { m: 'EL QUE NO BAILA', f: 'LA QUE NO BAILA' },
      { m: 'PARIGUAYO DE PRIMERA', f: 'PARIGUAYA DE PRIMERA' }
    ],
    oficios: [
      'SOSTENIENDO LA PARED',
      'CUIDANDO LOS BULTOS',
      'MIRANDO LA FIESTA',
      { m: 'PARADO EN LA ESQUINA', f: 'PARADA EN LA ESQUINA' },
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
  },

  bebedor: {
    id: 'bebedor',

    codigo: 'b',
    prefijo: 'BEB',

    slug: 'carnet-de-bebedor',
    orden: 3,
    buscar: [
      'bebedor', 'bebedora', 'beber', 'tomar', 'trago', 'tragos',
      'ron', 'cerveza', 'fria', 'jumo', 'botella', 'hielo', 'bebida'
    ],

    nombre: { m: 'Bebedor', f: 'Bebedora' },
    sujeto: { m: 'BEBEDOR', f: 'BEBEDORA' },
    plural: { m: 'BEBEDORES', f: 'BEBEDORAS' },
    hashtag: 'bebedores',
    emblema: 'copa',
    nivelEtiqueta: 'Nivel de resistencia',
    vence: 'DE VIERNES A DOMINGO',
    invitacion: 'Invita a tus panas bebedores al club.',
    titulo: { m: 'CARNET DE BEBEDOR', f: 'CARNET DE BEBEDORA' },

    lema: 'BEBER · COMPARTIR · NO PELEAR',
    cintilla: { m: 'Un Bebedor Certificado', f: 'Una Bebedora Certificada' },
    citas: [
      'El que bebe tranquilo, llega a su casa.',
      'Una fría con los míos y de vuelta pa\' casa.'
    ],
    sello: [
      'SIN PELEAR',
      'PAGA LO SUYO',
      'CON SU GRUPO',
      'LLEGA A CASA'
    ],

    seo: {
      titulo: 'Emite tu Carnet de Bebedor RD | Gratis y en 10 segundos',
      descripcion: 'Bebo con los míos, no peleo y llego a mi casa. Emite tu Carnet de Bebedor con tu foto, gratis y sin dar datos personales. #teambebedores',
      og: '/og.jpg'
    },

    portada: {
      kicker: 'Ministerio de Bebedores · RD',
      h1: 'Carnet de Bebedor',
      sub: 'Una fría con los míos, sin líos y de vuelta a casa.'
    },

    titulos: {
      oficial: { m: 'CARNET DE BEBEDOR', f: 'CARNET DE BEBEDORA' },
      institucional: { m: 'CARNET DE BEBEDOR', f: 'CARNET DE BEBEDORA' },
      crema: { m: 'CERTIFICADO DE BEBEDOR', f: 'CERTIFICADO DE BEBEDORA' },
      hielo: { m: 'CARNET DE BEBEDOR', f: 'CARNET DE BEBEDORA' },
      carbon: { m: 'CARNET DE BEBEDOR', f: 'CARNET DE BEBEDORA' },
      candela: { m: 'CREDENCIAL DE BEBEDOR', f: 'CREDENCIAL DE BEBEDORA' },
      solapin: { m: 'CARNET DE BEBEDOR', f: 'CARNET DE BEBEDORA' },
      asodopa: { m: 'CERTIFICADO DE BEBEDOR', f: 'CERTIFICADO DE BEBEDORA' },
      nocturno: { m: 'CARNET DE BEBEDOR', f: 'CARNET DE BEBEDORA' },
      tricolor: { m: 'CERTIFICADO DE BEBEDOR', f: 'CERTIFICADO DE BEBEDORA' },
      esmeralda: { m: 'CREDENCIAL DE BEBEDOR', f: 'CREDENCIAL DE BEBEDORA' }
    },

    // Una institución por estilo. No cambian con el género: son el
    // nombre del organismo.
    emisores: {
      oficial: { nombre: 'Ministerio de Bebedores', siglas: 'MINBE' },
      institucional: { nombre: 'Dirección Nacional de Bebedores', siglas: 'DNB' },
      crema: { nombre: 'Instituto Nacional de la Fría', siglas: 'INAFRIA' },
      hielo: { nombre: 'Comisión Nacional de Bebedores', siglas: 'CONABE' },
      carbon: { nombre: 'Consejo Superior de Bebedores', siglas: 'CONSUBE' },
      candela: { nombre: 'Registro Nacional de Bebedores', siglas: 'RENABE' },
      solapin: { nombre: 'Federación Dominicana de Bebedores', siglas: 'FEDOBE' },
      asodopa: { nombre: 'Asociación Dominicana de Bebedores', siglas: 'ASODOBE' },
      nocturno: { nombre: 'Cámara Dominicana de Bebedores', siglas: 'CADOBE' },
      tricolor: { nombre: 'Asociación Nacional de Bebedores', siglas: 'ANBE' },
      esmeralda: { nombre: 'Junta Central de Bebedores', siglas: 'JCB' }
    },

    frases: {
      oficial: 'Beber sin pelear también es un arte.',
      institucional: { m: 'El que bebe tranquilo, llega a su casa.', f: 'La que bebe tranquila, llega a su casa.' },
      crema: 'Aquí se bebe, no se pelea.',
      hielo: 'Fría, buena compañía y punto.',
      carbon: 'Bebo lo mío y pago lo mío.',
      candela: 'Mi grupo, mi hielo, mi música.',
      solapin: { m: 'No es un sueño, es un bebedor certificado.', f: 'No es un sueño, es una bebedora certificada.' },
      asodopa: 'Mejor una fría con los míos que un lío en la calle.',
      nocturno: 'Sin peleas, sin escándalo, sin llorar.',
      tricolor: { m: "Pa' los bebedores de verdad.", f: "Pa' las bebedoras de verdad." },
      esmeralda: { m: 'Tranquilo con mi fría, todo frío.', f: 'Tranquila con mi fría, todo frío.' }
    },

    condiciones: [
      { m: 'BEBEDOR CERTIFICADO', f: 'BEBEDORA CERTIFICADA' },
      { m: 'OFICIALMENTE BEBEDOR', f: 'OFICIALMENTE BEBEDORA' },
      { m: 'BEBEDOR VERIFICADO', f: 'BEBEDORA VERIFICADA' },
      { m: 'BEBEDOR DE PRIMERA', f: 'BEBEDORA DE PRIMERA' },
      { m: 'BEBEDOR VITALICIO', f: 'BEBEDORA VITALICIA' },
      { m: 'SOCIAL, NO PROBLEMÁTICO', f: 'SOCIAL, NO PROBLEMÁTICA' },
      'AGUANTA LA NOCHE'
    ],
    oficios: [
      'MANTENER LA FRÍA FRÍA',
      'PONER LA MÚSICA',
      'CUIDAR AL GRUPO',
      'PAGAR LA PRIMERA RONDA',
      'BUSCAR EL HIELO',
      'LLEVAR A TODOS A SU CASA',
      'CONTAR EL MISMO CUENTO'
    ],
    antecedentes: [
      'NINGUNO, NI UNA PELEA',
      { m: 'NUNCA HE MANEJADO BEBIDO', f: 'NUNCA HE MANEJADO BEBIDA' },
      'CERO ESCÁNDALOS',
      'SIEMPRE LLEGO A MI CASA',
      'NINGUNO, PREGUNTE'
    ]
  }};

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
