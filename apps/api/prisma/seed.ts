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

  // Usuarios demo adicionales (comprador, repartidor, segundo vendedor) para
  // poder probar cada panel de la plataforma con datos reales sin registrarse a mano.
  const buyerUser = await prisma.user.upsert({
    where: { email: "comprador.demo@picacho.pe" },
    update: {},
    create: {
      email: "comprador.demo@picacho.pe",
      name: "Comprador Demo",
      passwordHash: await bcrypt.hash("changeme123", 10),
      role: "BUYER",
    },
  });

  const driverUser = await prisma.user.upsert({
    where: { email: "repartidor.demo@picacho.pe" },
    update: {},
    create: {
      email: "repartidor.demo@picacho.pe",
      name: "Repartidor Demo",
      passwordHash: await bcrypt.hash("changeme123", 10),
      role: "DRIVER",
      driver: { create: { phone: "987654321", vehiclePlate: "ABC-123", vehicleType: "Moto" } },
    },
    include: { driver: true },
  });
  const driver = driverUser.driver ?? (await prisma.driver.findUniqueOrThrow({ where: { userId: driverUser.id } }));

  const vendor2User = await prisma.user.upsert({
    where: { email: "vendedor2.demo@picacho.pe" },
    update: {},
    create: {
      email: "vendedor2.demo@picacho.pe",
      name: "Verduras El Sol",
      passwordHash: await bcrypt.hash("changeme123", 10),
      role: "VENDOR",
      vendor: { create: { storeName: "Verduras El Sol", isApproved: false } },
    },
    include: { vendor: true },
  });
  const vendor2 = vendor2User.vendor ?? (await prisma.vendor.findUniqueOrThrow({ where: { userId: vendor2User.id } }));

  const verdurasCategory = await prisma.category.findUniqueOrThrow({ where: { slug: "verduras-hortalizas" } });
  await prisma.product.upsert({
    where: { id: "seed-vendor2-product-0" },
    update: {},
    create: {
      id: "seed-vendor2-product-0",
      name: "Zanahoria",
      price: 2.5,
      unit: "KG",
      categoryId: verdurasCategory.id,
      vendorId: vendor2.id,
    },
  });

  // Pedidos de ejemplo, uno por cada estado del flujo, para que admin/vendedor/
  // repartidor/comprador tengan algo que ver apenas inician sesión.
  async function upsertOrder(params: {
    id: string;
    driverId?: string;
    status: "RECEIVED" | "PREPARING" | "ON_THE_WAY" | "DELIVERED";
    items: { productId: string; quantity: number; unitPrice: number }[];
  }) {
    const total = params.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    return prisma.order.upsert({
      where: { id: params.id },
      update: { status: params.status, driverId: params.driverId },
      create: {
        id: params.id,
        buyerId: buyerUser.id,
        vendorId: vendor.id,
        driverId: params.driverId,
        status: params.status,
        total,
        items: {
          create: params.items.map((i, idx) => ({
            id: `${params.id}-item-${idx}`,
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        },
      },
    });
  }

  const orderReceived = await upsertOrder({
    id: "seed-order-received",
    status: "RECEIVED",
    items: [
      { productId: "seed-verduras-hortalizas-0", quantity: 3, unitPrice: 2.0 },
      { productId: "seed-carnes-blancas-0", quantity: 1, unitPrice: 15.5 },
    ],
  });
  await prisma.payment.upsert({
    where: { orderId: orderReceived.id },
    update: {},
    create: { orderId: orderReceived.id, provider: "mock", status: "pending", providerPaymentId: `mock-${orderReceived.id}` },
  });

  const orderPreparing = await upsertOrder({
    id: "seed-order-preparing",
    status: "PREPARING",
    items: [{ productId: "seed-pollo-frito-0", quantity: 2, unitPrice: 12.9 }],
  });
  await prisma.payment.upsert({
    where: { orderId: orderPreparing.id },
    update: {},
    create: { orderId: orderPreparing.id, provider: "mock", status: "approved", providerPaymentId: `mock-${orderPreparing.id}` },
  });

  const orderOnTheWay = await upsertOrder({
    id: "seed-order-ontheway",
    driverId: driver.id,
    status: "ON_THE_WAY",
    items: [
      { productId: "seed-detergentes-0", quantity: 1, unitPrice: 14.5 },
      { productId: "seed-higiene-0", quantity: 2, unitPrice: 8.9 },
    ],
  });
  await prisma.payment.upsert({
    where: { orderId: orderOnTheWay.id },
    update: {},
    create: { orderId: orderOnTheWay.id, provider: "mock", status: "approved", providerPaymentId: `mock-${orderOnTheWay.id}` },
  });

  const orderDelivered = await upsertOrder({
    id: "seed-order-delivered",
    driverId: driver.id,
    status: "DELIVERED",
    items: [
      { productId: "seed-verduras-hortalizas-1", quantity: 2, unitPrice: 2.3 },
      { productId: "seed-carnes-blancas-0", quantity: 1, unitPrice: 15.5 },
    ],
  });
  await prisma.payment.upsert({
    where: { orderId: orderDelivered.id },
    update: {},
    create: { orderId: orderDelivered.id, provider: "mock", status: "approved", providerPaymentId: `mock-${orderDelivered.id}` },
  });

  const existingInvoice = await prisma.invoice.findUnique({ where: { orderId: orderDelivered.id } });
  if (!existingInvoice) {
    const counter = await prisma.invoiceCounter.upsert({
      where: { docType: "BOLETA" },
      update: { correlative: { increment: 1 } },
      create: { docType: "BOLETA", series: "B001", correlative: 1 },
    });
    await prisma.invoice.create({
      data: {
        orderId: orderDelivered.id,
        docType: "BOLETA",
        series: counter.series,
        correlative: counter.correlative,
        buyerDocType: "DNI",
        buyerDocNumber: "00000000",
        buyerName: buyerUser.name,
        provider: "mock",
        status: "ISSUED",
        pdfUrl: `http://localhost:3001/invoicing/mock/${orderDelivered.id}`,
        externalId: `mock-${counter.series}-${counter.correlative}`,
      },
    });
  }

  console.log("Seed completo.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
