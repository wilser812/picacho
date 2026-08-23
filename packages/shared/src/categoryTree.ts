// Árbol de categorías fijo del catálogo de Picacho. Usado por el seed de Prisma y por los frontends para renderizar navegación.
export interface CategoryNode {
  slug: string;
  name: string;
  icon: string;
  subcategories: { slug: string; name: string }[];
}

export const picachoCategoryTree: CategoryNode[] = [
  {
    slug: "carnes-pescados",
    name: "Carnes y Pescados Frescos",
    icon: "🥩",
    subcategories: [
      { slug: "carnes-rojas", name: "Carnes Rojas" },
      { slug: "carnes-blancas", name: "Carnes Blancas" },
      { slug: "pescados", name: "Pescados" },
      { slug: "mariscos", name: "Mariscos" },
    ],
  },
  {
    slug: "comida-rapida",
    name: "Comida Rápida & Preparada",
    icon: "🍗",
    subcategories: [
      { slug: "pollo-frito", name: "Pollo Frito" },
      { slug: "combos", name: "Combos" },
      { slug: "guarniciones", name: "Guarniciones" },
      { slug: "salsas", name: "Salsas" },
    ],
  },
  {
    slug: "abarrotes-despensa",
    name: "Abarrotes y Despensa",
    icon: "🌾",
    subcategories: [
      { slug: "tuberculos-raices", name: "Tubérculos y Raíces" },
      { slug: "verduras-hortalizas", name: "Verduras y Hortalizas Básicas" },
      { slug: "arroz-menestras", name: "Arroz y Menestras" },
      { slug: "aceites-enlatados", name: "Aceites y Enlatados" },
      { slug: "bebidas", name: "Bebidas" },
    ],
  },
  {
    slug: "limpieza-hogar",
    name: "Limpieza y Cuidado del Hogar",
    icon: "🧹",
    subcategories: [
      { slug: "detergentes", name: "Detergentes" },
      { slug: "lavavajillas", name: "Lavavajillas" },
      { slug: "papel", name: "Papel" },
    ],
  },
  {
    slug: "ferreteria-bricolaje",
    name: "Ferretería y Bricolaje",
    icon: "🔧",
    subcategories: [
      { slug: "herramientas", name: "Herramientas" },
      { slug: "fijaciones", name: "Fijaciones" },
      { slug: "electricidad-basica", name: "Electricidad Básica" },
    ],
  },
  {
    slug: "tecnologia-electrohogar",
    name: "Tecnología y Electrohogar",
    icon: "🔌",
    subcategories: [],
  },
  {
    slug: "cuidado-personal-salud",
    name: "Cuidado Personal y Salud",
    icon: "🧼",
    subcategories: [
      { slug: "higiene", name: "Higiene" },
      { slug: "botiquin", name: "Botiquín" },
    ],
  },
  {
    slug: "repuestos-autopartes",
    name: "Repuestos y Autopartes",
    icon: "🔩",
    subcategories: [
      { slug: "motores-transmision", name: "Motores y Transmisión" },
      { slug: "frenos-suspension", name: "Frenos y Suspensión" },
      { slug: "iluminacion-electricidad", name: "Iluminación y Electricidad" },
      { slug: "accesorios-carroceria", name: "Accesorios y Carrocería" },
      { slug: "turbos", name: "Turbos" },
    ],
  },
];

// Productos de referencia para el seed inicial de "Tubérculos y Raíces" y "Verduras y Hortalizas Básicas",
// las dos subcategorías detalladas explícitamente por el negocio.
export const picachoSeedProducts = {
  "tuberculos-raices": [
    "Papa Amarilla",
    "Papa Canchan / Rosada",
    "Papa Yungay",
    "Papa Huamantanga",
    "Papa Nativa",
    "Olluco picado",
    "Olluco entero",
    "Camote amarillo",
    "Camote morado",
    "Yuca fresca",
    "Oca",
    "Mashua",
    "Unkucha / Pituca",
  ],
  "verduras-hortalizas": [
    "Cebolla roja",
    "Ajo",
    "Tomate",
    "Zanahoria",
    "Zapallo",
    "Choclo",
    "Alverja verde",
    "Habas",
    "Vainita",
    "Lechuga",
    "Espinaca",
    "Acelga",
    "Culantro",
    "Perejil",
  ],
} as const;
