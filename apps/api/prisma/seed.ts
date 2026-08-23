import { PrismaClient } from "@prisma/client";
import { picachoCategoryTree, picachoSeedProducts } from "@picacho/shared";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  for (const main of picachoCategoryTree) {
    const parent = await prisma.category.upsert({
      where: { slug: main.slug },
      update: { name: main.name, icon: main.icon },
      create: { slug: main.slug, name: main.name, icon: main.icon },
    });

    for (const sub of main.subcategories) {
      await prisma.category.upsert({
        where: { slug: sub.slug },
        update: { name: sub.name, parentId: parent.id },
        create: { slug: sub.slug, name: sub.name, parentId: parent.id },
      });
    }
  }

  await prisma.user.upsert({
    where: { email: "admin@picacho.pe" },
    update: {},
    create: {
      email: "admin@picacho.pe",
      name: "Admin Picacho",
      passwordHash: await bcrypt.hash("changeme123", 10),
      role: "ADMIN",
    },
  });

  const vendorUser = await prisma.user.upsert({
    where: { email: "vendedor.demo@picacho.pe" },
    update: {},
    create: {
      email: "vendedor.demo@picacho.pe",
      name: "Bodega Picacho Demo",
      passwordHash: await bcrypt.hash("changeme123", 10),
      role: "VENDOR",
      vendor: { create: { storeName: "Bodega Picacho Demo", isApproved: true } },
    },
    include: { vendor: true },
  });

  const vendor = await prisma.vendor.findUniqueOrThrow({ where: { userId: vendorUser.id } });

  const essentialSeeds: { subSlug: keyof typeof picachoSeedProducts; price: number }[] = [
    { subSlug: "tuberculos-raices", price: 3.5 },
    { subSlug: "verduras-hortalizas", price: 2.0 },
  ];

  for (const { subSlug, price } of essentialSeeds) {
    const category = await prisma.category.findUniqueOrThrow({ where: { slug: subSlug } });
    const names = picachoSeedProducts[subSlug].slice(0, 5);

    for (const [i, name] of names.entries()) {
      await prisma.product.upsert({
        where: { id: `seed-${subSlug}-${i}` },
        update: {},
        create: {
          id: `seed-${subSlug}-${i}`,
          name,
          price: price + i * 0.3,
          unit: "KG",
          isEssential: true,
          categoryId: category.id,
          vendorId: vendor.id,
        },
      });
    }
  }

  // Productos de referencia en el resto de categorías, para poder probar catálogo y búsqueda
  // más allá de abarrotes. Precios y unidades ilustrativos.
  const otherSeeds: {
    categorySlug: string;
    unit: "UNIT" | "KG" | "LITER";
    items: { name: string; price: number; essential?: boolean }[];
  }[] = [
    {
      categorySlug: "carnes-rojas",
      unit: "KG",
      items: [
        { name: "Lomo de Res Premium", price: 42.5, essential: true },
        { name: "Carne Molida", price: 22.0 },
        { name: "Costillas de Res", price: 28.5 },
        { name: "Chuleta de Cerdo", price: 18.9 },
      ],
    },
    {
      categorySlug: "carnes-blancas",
      unit: "KG",
      items: [
        { name: "Pechuga de Pollo", price: 15.5, essential: true },
        { name: "Muslos de Pollo", price: 12.0 },
        { name: "Pavo Fileteado", price: 32.0 },
        { name: "Conejo Fresco", price: 35.5 },
      ],
    },
    {
      categorySlug: "pescados",
      unit: "KG",
      items: [
        { name: "Trucha Fresca", price: 28.5, essential: true },
        { name: "Jurel Entero", price: 18.0 },
        { name: "Lenguado Fileteado", price: 35.0 },
        { name: "Bacalao Congelado", price: 24.5 },
      ],
    },
    {
      categorySlug: "mariscos",
      unit: "KG",
      items: [
        { name: "Camarones Gigantes", price: 45.0, essential: true },
        { name: "Calamares Frescos", price: 28.5 },
        { name: "Pulpo Cocido", price: 55.0 },
        { name: "Almejas Frescas", price: 32.0 },
      ],
    },
    {
      categorySlug: "pollo-frito",
      unit: "UNIT",
      items: [
        { name: "Combo 1 Presa + Papas", price: 12.9, essential: true },
        { name: "Presa de Pollo Frito", price: 6.5 },
        { name: "Alitas Broaster (6 uds)", price: 15.9 },
      ],
    },
    {
      categorySlug: "detergentes",
      unit: "UNIT",
      items: [
        { name: "Detergente Ariel 1kg", price: 14.5, essential: true },
        { name: "Detergente Bolivar 900g", price: 9.9 },
      ],
    },
    {
      categorySlug: "herramientas",
      unit: "UNIT",
      items: [
        { name: "Martillo de Uña 16oz", price: 22.0 },
        { name: "Destornillador Set 6 piezas", price: 18.5 },
      ],
    },
    {
      categorySlug: "tecnologia-electrohogar",
      unit: "UNIT",
      items: [
        { name: "Foco LED 9W", price: 7.9 },
        { name: "Cargador USB-C 20W", price: 24.9 },
      ],
    },
    {
      categorySlug: "motores-transmision",
      unit: "UNIT",
      items: [
        { name: "Filtro de Aceite Standard", price: 35.0 },
        { name: "Aceite Motor 5W30 1L", price: 28.5 },
        { name: "Bujías Iridium Set 4", price: 120.0 },
        { name: "Correa de Distribución", price: 85.0 },
      ],
    },
    {
      categorySlug: "frenos-suspension",
      unit: "UNIT",
      items: [
        { name: "Pastillas de Freno Delantera", price: 65.0 },
        { name: "Discos de Freno Set 2", price: 110.0 },
        { name: "Amortiguadores Delanteros Par", price: 250.0 },
        { name: "Líquido de Frenos 500ml", price: 15.5 },
      ],
    },
    {
      categorySlug: "iluminacion-electricidad",
      unit: "UNIT",
      items: [
        { name: "Faro Delantero LED", price: 95.0 },
        { name: "Faro Trasero LED", price: 75.0 },
        { name: "Batería Auto 12V 60Ah", price: 380.0 },
        { name: "Alternador Refabricado", price: 250.0 },
      ],
    },
    {
      categorySlug: "accesorios-carroceria",
      unit: "UNIT",
      items: [
        { name: "Limpiabrisas Set 2", price: 22.0 },
        { name: "Espejos Retrovisores Par", price: 85.0 },
        { name: "Manijas de Puerta Set 4", price: 45.0 },
        { name: "Sellador Automotive 290ml", price: 12.5 },
      ],
    },
    {
      categorySlug: "turbos",
      unit: "UNIT",
      items: [
        { name: "Turbo Completo Diesel", price: 850.0 },
        { name: "Cartucho Turbo Estándar", price: 520.0 },
        { name: "Turbo Refabricado", price: 420.0 },
        { name: "Kit Sellos Turbo", price: 95.0 },
      ],
    },
    {
      categorySlug: "higiene",
      unit: "UNIT",
      items: [
        { name: "Jabón de Tocador x3", price: 8.9, essential: true },
        { name: "Papel Higiénico x8", price: 16.9 },
      ],
    },
  ];

  for (const { categorySlug, unit, items } of otherSeeds) {
    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) continue;

    for (const [i, item] of items.entries()) {
      await prisma.product.upsert({
        where: { id: `seed-${categorySlug}-${i}` },
        update: {},
        create: {
          id: `seed-${categorySlug}-${i}`,
          name: item.name,
          price: item.price,
          unit,
          isEssential: Boolean(item.essential),
          categoryId: category.id,
          vendorId: vendor.id,
        },
      });
    }
  }

  console.log("Seed completo.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
