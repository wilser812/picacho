import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

const PRODUCT_INCLUDE = {
  vendor: { select: { storeName: true } },
  category: { select: { name: true, slug: true } },
} satisfies Prisma.ProductInclude;

export interface ListProductsParams {
  categorySlug?: string;
  essential?: boolean;
  sort?: "price_asc" | "price_desc";
}

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async list({ categorySlug, essential, sort = "price_asc" }: ListProductsParams) {
    const where: Prisma.ProductWhereInput = { vendor: { isApproved: true } };

    if (essential) where.isEssential = true;

    if (categorySlug) {
      const category = await this.prisma.category.findUnique({
        where: { slug: categorySlug },
        include: { children: true },
      });
      if (!category) return [];
      const categoryIds = category.children.length
        ? [category.id, ...category.children.map((c) => c.id)]
        : [category.id];
      where.categoryId = { in: categoryIds };
    }

    return this.prisma.product.findMany({
      where,
      include: PRODUCT_INCLUDE,
      orderBy: { price: sort === "price_desc" ? "desc" : "asc" },
    });
  }

  async search(q: string, sort: "price_asc" | "price_desc" = "price_asc") {
    if (!q?.trim()) return this.list({ sort });

    const matches = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Product"
      WHERE name ILIKE '%' || ${q} || '%' OR similarity(name, ${q}) > 0.2
      ORDER BY similarity(name, ${q}) DESC
      LIMIT 20
    `;
    const ids = matches.map((m) => m.id);
    if (ids.length === 0) return [];

    return this.prisma.product.findMany({
      where: { id: { in: ids }, vendor: { isApproved: true } },
      include: PRODUCT_INCLUDE,
      orderBy: { price: sort === "price_desc" ? "desc" : "asc" },
    });
  }
}
