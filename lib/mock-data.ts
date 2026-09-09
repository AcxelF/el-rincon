import { Category, Chat, Post, RankingUser } from "./types";

export const CATEGORIES: Category[] = [
  { id: "all", name: "Todo el rincón", emoji: "🌀" },
  { id: "Vida de campus", name: "Vida de campus", emoji: "☕", group: "tema" },
  { id: "Fiestas", name: "Fiestas y eventos", emoji: "🎉", group: "tema" },
  { id: "Deportes", name: "Deportes", emoji: "⚽", group: "tema" },
  { id: "Gaming y anime", name: "Gaming y anime", emoji: "🎮", group: "tema" },
  { id: "Música y arte", name: "Música y arte", emoji: "🎧", group: "tema" },
  { id: "Comida", name: "Comida y cafeterías", emoji: "🍟", group: "tema" },
  { id: "Tablón", name: "Compra-venta y roomies", emoji: "📌", group: "tema" },
  { id: "Confesiones", name: "Confesiones", emoji: "🤫", group: "tema" },
  { id: "Clubes", name: "Clubes y sociedades", emoji: "🎭", group: "tema" },
  { id: "PFADM", name: "Administración de Empresas", emoji: "💼", group: "carrera" },
  { id: "PFANI", name: "Administración de Negocios Internacionales", emoji: "🌐", group: "carrera" },
  { id: "PFAHT", name: "Administración Hotelera y Turismo", emoji: "🏨", group: "carrera" },
  { id: "PFAND", name: "Administración y Negocios Digitales", emoji: "📱", group: "carrera" },
  { id: "PFAGN", name: "Agronomía y Negocios", emoji: "🌾", group: "carrera" },
  { id: "PFAQI", name: "Arquitectura de Interiores", emoji: "🛋️", group: "carrera" },
  { id: "PFAQU", name: "Arquitectura y Urbanismo Ambiental", emoji: "🏙️", group: "carrera" },
  { id: "PFARE", name: "Artes Escénicas", emoji: "🎭", group: "carrera" },
  { id: "PFBMA", name: "Biología Marina", emoji: "🐬", group: "carrera" },
  { id: "PFCIP", name: "Ciencias Políticas y Relaciones Internacionales", emoji: "🏛️", group: "carrera" },
  { id: "PFCMI", name: "Comunicación Audiovisual", emoji: "🎬", group: "carrera" },
  { id: "PFCEP", name: "Comunicación Estratégica y Publicidad Digital", emoji: "📣", group: "carrera" },
  { id: "PFCMK", name: "Comunicación y Marketing", emoji: "📈", group: "carrera" },
  { id: "PFCOE", name: "Contabilidad Empresarial", emoji: "🧮", group: "carrera" },
  { id: "PFDER", name: "Derecho", emoji: "⚖️", group: "carrera" },
  { id: "PFDIS", name: "Diseño Profesional Gráfico", emoji: "🎨", group: "carrera" },
  { id: "PFEYF", name: "Economía y Finanzas", emoji: "💹", group: "carrera" },
  { id: "PFENI", name: "Economía y Negocios Internacionales", emoji: "🌎", group: "carrera" },
  { id: "PFEDU", name: "Educación", emoji: "📚", group: "carrera" },
  { id: "PFENF", name: "Enfermería", emoji: "💉", group: "carrera" },
  { id: "PFEST", name: "Estomatología / Odontología", emoji: "🦷", group: "carrera" },
  { id: "PFFAR", name: "Farmacia y Bioquímica", emoji: "💊", group: "carrera" },
  { id: "PFIAM", name: "Ingeniería Ambiental", emoji: "🌱", group: "carrera" },
  { id: "PFBIM", name: "Ingeniería Biomédica", emoji: "🩻", group: "carrera" },
  { id: "PFCIB", name: "Ingeniería en Ciberseguridad", emoji: "🔐", group: "carrera" },
  { id: "PFCIV", name: "Ingeniería Civil", emoji: "🏗️", group: "carrera" },
  { id: "PFMIN", name: "Ingeniería de Minas", emoji: "⛏️", group: "carrera" },
  { id: "PFISI", name: "Ingeniería de Sistemas de Información", emoji: "💻", group: "carrera" },
  { id: "PFSOF", name: "Ingeniería de Software", emoji: "🖥️", group: "carrera" },
  { id: "PFDIT", name: "Ingeniería en Diseño e Innovación Tecnológica", emoji: "🛠️", group: "carrera" },
  { id: "PFIEN", name: "Ingeniería Económica y de Negocios", emoji: "📊", group: "carrera" },
  { id: "PFIEC", name: "Ingeniería Electrónica", emoji: "🔌", group: "carrera" },
  { id: "PEMSI", name: "Ingeniería Empresarial y de Sistemas", emoji: "🖥️", group: "carrera" },
  { id: "PFIND", name: "Ingeniería Industrial", emoji: "⚙️", group: "carrera" },
  { id: "PFIAD", name: "Ingeniería en Inteligencia Artificial y Ciencia de Datos", emoji: "🤖", group: "carrera" },
  { id: "PFMKA", name: "Marketing y Administración", emoji: "🛍️", group: "carrera" },
  { id: "PFMEH", name: "Medicina Humana", emoji: "🩺", group: "carrera" },
  { id: "PFMVZ", name: "Medicina Veterinaria y Zootecnia", emoji: "🐾", group: "carrera" },
  { id: "PFNUT", name: "Nutrición y Dietética", emoji: "🥕", group: "carrera" },
  { id: "PFOBS", name: "Obstetricia", emoji: "🤰", group: "carrera" },
  { id: "PFPSI", name: "Psicología", emoji: "🧠", group: "carrera" },
  { id: "PFTRA", name: "Traducción e Interpretación", emoji: "🗣️", group: "carrera" },
];

export const INITIAL_POSTS: Post[] = [
  {
    id: 1,
    cat: "Vida de campus",
    author: "@sofi.exe",
    time: "hace 12 min",
    votes: 148,
    likes: 34,
    title: "¿Quién más vive en la máquina de café del pabellón B?",
    excerpt:
      "Llevo tres semanas desayunando ahí y ya reconozco a la misma gente de las 7:40. Propongo que nos presentemos formalmente.",
    body: "Llevo tres semanas desayunando ahí y ya reconozco a la misma gente de las 7:40 am. El de la casaca verde, la chica que siempre pide doble, el señor que le pega a la máquina cuando se atora. Propongo que nos presentemos formalmente y armemos el club oficial del café del B. Yo llevo galletas el jueves.",
    comments: [
      { id: 11, author: "@dani.mp3", time: "hace 8 min", text: "Yo soy el de la casaca verde y me acabas de exponer ante toda la uni.", likes: 42 },
      { id: 12, author: "anónimo_1417", time: "hace 5 min", text: "La máquina del C es mejor pero nadie quiere escucharme.", likes: 9 },
      { id: 13, author: "@mari.404", time: "hace 2 min", text: "Jueves confirmado, llevo el termo grande.", likes: 17 },
    ],
  },
  {
    id: 2,
    cat: "Deportes",
    author: "@beto.lag",
    time: "hace 40 min",
    votes: 96,
    likes: 21,
    title: "Cascarita mixta viernes 7pm, faltan 4 valientes",
    excerpt:
      "Cancha 2, nivel “no me lastimen por favor”. Traigan polo claro y oscuro porque nunca nos ponemos de acuerdo.",
    body: "Cancha 2, viernes 7pm, nivel “no me lastimen por favor”. Traigan polo claro y oscuro porque nunca nos ponemos de acuerdo con los equipos. Después caemos por unos sánguches a la esquina, eso no se negocia.",
    comments: [
      { id: 21, author: "@kari.pnp", time: "hace 20 min", text: "Me anoto pero de arquera, corriendo me muero.", likes: 12 },
      { id: 22, author: "@luis.owo", time: "hace 11 min", text: "Van dos conmigo, llevo pelota nueva.", likes: 6 },
    ],
  },
  {
    id: 3,
    cat: "Confesiones",
    author: "anónimo_0902",
    time: "hace 2 h",
    votes: 311,
    likes: 58,
    title: "Confieso que le puse nombre al gato del estacionamiento",
    excerpt:
      "Se llama Doctor Pelusa y ya me reconoce. Si alguien más le puso otro nombre tenemos un problema diplomático.",
    body: "Se llama Doctor Pelusa, tiene una oreja chueca y ya reconoce el ruido de mi mochila. Si alguien más le puso otro nombre tenemos un problema diplomático serio y vamos a necesitar votación con urna.",
    comments: [
      { id: 31, author: "@xime.wav", time: "hace 1 h", text: "Nosotras le decimos Michi Rector desde 2024. Esto es guerra.", likes: 88 },
      { id: 32, author: "anónimo_5510", time: "hace 44 min", text: "Propongo elecciones el lunes, con ánfora y todo.", likes: 51 },
    ],
  },
  {
    id: 4,
    cat: "Fiestas",
    author: "@vale.uwu",
    time: "hace 3 h",
    votes: 262,
    likes: 47,
    title: "Post-mortem de la fiesta del sábado (fotos borrosas incluidas)",
    excerpt:
      "A quien perdió una casaca beige: está conmigo, la lavé y no pregunten por qué necesitaba lavarse.",
    body: "A quien perdió una casaca beige: está conmigo, la lavé y no pregunten por qué necesitaba lavarse. También encontramos un carné, una zapatilla sola y a un chico dormido en la escalera que ya está bien, gracias por preguntar.",
    comments: [
      { id: 41, author: "@dani.mp3", time: "hace 2 h", text: "La zapatilla es mía y no quiero hablar del tema.", likes: 74 },
    ],
  },
  {
    id: 5,
    cat: "Gaming y anime",
    author: "@nico.frx",
    time: "hace 5 h",
    votes: 138,
    likes: 26,
    title: "Armamos torneo de Smash en la sala de estudio (perdón bibliotecarios)",
    excerpt: "16 personas, llaves impresas, premio simbólico: una gaseosa y respeto eterno.",
    body: "16 personas, llaves impresas, premio simbólico: una gaseosa grande y respeto eterno. Reglas: sin items, sin Bayonetta y sin llorar en público. Nos vemos el miércoles después de las 6.",
    comments: [
      { id: 51, author: "@alba.cmyk", time: "hace 3 h", text: "Sin Bayonetta es puro cobarde, pero acepto.", likes: 29 },
    ],
  },
  {
    id: 6,
    cat: "Comida",
    author: "@tere.gg",
    time: "hace 8 h",
    votes: 205,
    likes: 39,
    title: "Ranking honesto de los menús del campus",
    excerpt: "Probé las cinco cafeterías en una semana. Mi colesterol y yo tenemos resultados.",
    body: "Probé las cinco cafeterías en una semana. 1) La de doña Chelo, sin discusión. 2) La del pabellón D. 3) Empate técnico entre las otras dos. 5) La de la biblioteca, que es un sánguche con complejo de menú.",
    comments: [
      { id: 61, author: "@ivan.rar", time: "hace 6 h", text: "Defenderé la de la biblioteca con mi vida y no sé por qué.", likes: 33 },
      { id: 62, author: "@paola.svg", time: "hace 5 h", text: "Doña Chelo merece doctorado honorario.", likes: 61 },
    ],
  },
  {
    id: 7,
    cat: "Música y arte",
    author: "@alba.cmyk",
    time: "hace 11 h",
    votes: 84,
    likes: 19,
    title: "Playlist colaborativa para la sala de estudio",
    excerpt: "Reglas: nada con gritos y nada de reggaetón antes de las 8am. Todo lo demás pasa.",
    body: "Reglas simples: nada con gritos, nada de reggaetón antes de las 8am y máximo dos temas seguidos del mismo artista. Ya somos 60 y sorprendentemente no hubo peleas.",
    comments: [
      { id: 71, author: "@mari.404", time: "hace 9 h", text: "Metí tres de jazz para las madrugadas, no las quiten.", likes: 14 },
    ],
  },
  {
    id: 8,
    cat: "Tablón",
    author: "@luis.owo",
    time: "hace 1 d",
    votes: 57,
    likes: 12,
    title: "Busco roomie por Chorrillos, cuarto con ventana de verdad",
    excerpt: "Requisitos: no odiar gatos, lavar tu taza el mismo día, aguantar mis maratones de anime.",
    body: "Requisitos: no odiar gatos, lavar tu taza el mismo día y aguantar maratones de anime los domingos. A 15 minutos del campus caminando rápido, 25 caminando como persona normal.",
    comments: [
      { id: 81, author: "anónimo_7781", time: "hace 20 h", text: "¿La ventana da a pared o a cielo? Es importante.", likes: 21 },
    ],
  },
  {
    id: 9,
    cat: "Clubes",
    author: "@xime.wav",
    time: "hace 1 d",
    votes: 71,
    likes: 15,
    title: "El club de debate necesita gente que le guste discutir sin morir",
    excerpt: "Nos juntamos martes y jueves. No hace falta saber nada, solo tener opiniones fuertes y ganas.",
    body: "Nos juntamos martes y jueves a las 5. No hace falta saber nada, solo tener opiniones fuertes y ganas de que te las desarmen amablemente. Traemos snacks por turnos.",
    comments: [
      { id: 91, author: "@beto.lag", time: "hace 22 h", text: "Voy solo por los snacks y me quedo por el drama.", likes: 18 },
    ],
  },
];

export const INITIAL_CHATS: Chat[] = [
  {
    id: 1,
    alias: "@dani.mp3",
    status: "en línea",
    unread: true,
    msgs: [
      { me: false, text: "oye, ¿al final vas al karaoke del jueves?" },
      { me: true, text: "obvio, ya tengo canción y todo" },
      { me: false, text: "no me digas que otra vez la misma" },
      { me: true, text: "es un clásico, respétala" },
      { me: false, text: "jajaja ok, te guardo sitio adelante" },
    ],
  },
  {
    id: 2,
    alias: "@kari.pnp",
    status: "hace 5 min",
    unread: true,
    msgs: [
      { me: false, text: "para la cascarita, ¿llevo pelota o ya hay?" },
      { me: true, text: "luis lleva una nueva, tú trae la reja de gaseosas" },
      { me: false, text: "eso sí sé hacerlo bien" },
    ],
  },
  {
    id: 3,
    alias: "@mari.404",
    status: "hace 2 h",
    unread: false,
    msgs: [
      { me: false, text: "te robé la idea del club del café, perdón no perdón" },
      { me: true, text: "me parece justo, pero quiero crédito en el póster" },
    ],
  },
  {
    id: 4,
    alias: "anónimo_1417",
    status: "alias oculto",
    unread: false,
    msgs: [
      { me: false, text: "la máquina del C sigue siendo mejor y lo sabes" },
      { me: true, text: "esto es acoso, pero seguí" },
    ],
  },
];

export const RANKING: RankingUser[] = [
  { alias: "@michi.rector", meta: "gato · sin carrera", karma: 9900, badge: "Leyenda" },
  { alias: "@mari.404", meta: "Arquitectura · 8vo", karma: 4200, badge: "Chismosa mayor" },
  { alias: "@beto.lag", meta: "Ing. Industrial · 6to", karma: 3100, badge: "Armador de planes" },
  { alias: "@tere.gg", meta: "Nutrición · 4to", karma: 2700, badge: "Crítica gastronómica" },
  { alias: "@sofi.exe", meta: "Comunicación · 5to", karma: 2400, badge: "Cafeinómana" },
  { alias: "@dani.mp3", meta: "Psicología · 7mo", karma: 2100, badge: "Karaoke MVP" },
  { alias: "anónimo_0902", meta: "alias oculto", karma: 1800, badge: "Confesor serial" },
  { alias: "@alba.cmyk", meta: "Diseño · 3ro", karma: 1500, badge: "DJ de la sala" },
];

export function formatKarma(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(Math.max(0, Math.round(n)));
}

export const BADGES = [
  "☕ Cafeinómana nivel 4",
  "🎤 Sobrevivió al karaoke",
  "🔥 Hilo con 300+ votos",
  "🤝 Organizó 6 quedadas",
];

export const MY_ANON_ALIAS = "anónimo_2231";
