import "../scripts/load-turso-env";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { serializeImages } from "../src/lib/items";
import { hashPassword } from "../src/lib/password";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const PLACEHOLDER_IMAGE = "/placeholder-item.svg";

const categories = [
  {
    name: "Fern & Moss",
    gender: "unisex",
    description: "Earthy botanical tones inspired by forest floors.",
  },
  {
    name: "Desert Bloom",
    gender: "women",
    description: "Warm terracotta and cactus-flower inspired pieces.",
  },
  {
    name: "River Stone",
    gender: "men",
    description: "Smooth, grounded designs inspired by riverbeds.",
  },
  {
    name: "Wildflower Meadow",
    gender: "women",
    description: "Delicate floral silhouettes for everyday wear.",
  },
  {
    name: "Timber & Bark",
    gender: "men",
    description: "Rugged textures inspired by tree bark and timber.",
  },
] as const;

const itemsByCategory: Record<
  (typeof categories)[number]["name"],
  Array<{
    name: string;
    type: "ring" | "bracelet";
    price: number;
    material: string;
    natureTheme: string;
    description: string;
    stock: number;
  }>
> = {
  "Fern & Moss": [
    {
      name: "Fern Leaf Band Ring",
      type: "ring",
      price: 68,
      material: "Recycled sterling silver",
      natureTheme: "Fern Leaf",
      description: "A slim band etched with the veins of an unfurling fern frond.",
      stock: 12,
    },
    {
      name: "Moss Agate Cuff",
      type: "bracelet",
      price: 95,
      material: "Moss agate and brass",
      natureTheme: "Forest Moss",
      description: "An open cuff set with a moss agate cabochon.",
      stock: 8,
    },
    {
      name: "Woodland Vine Ring",
      type: "ring",
      price: 74,
      material: "Oxidized silver",
      natureTheme: "Climbing Vine",
      description: "A textured band that wraps the finger like a climbing vine.",
      stock: 10,
    },
  ],
  "Desert Bloom": [
    {
      name: "Cactus Flower Ring",
      type: "ring",
      price: 82,
      material: "Rose gold vermeil",
      natureTheme: "Cactus Bloom",
      description: "A small cluster of petals inspired by desert cactus flowers.",
      stock: 15,
    },
    {
      name: "Terracotta Clay Bracelet",
      type: "bracelet",
      price: 58,
      material: "Ceramic and brass chain",
      natureTheme: "Desert Clay",
      description: "Hand-fired ceramic beads in warm terracotta tones.",
      stock: 20,
    },
    {
      name: "Sunset Citrine Ring",
      type: "ring",
      price: 110,
      material: "Raw citrine and gold vermeil",
      natureTheme: "Desert Sunset",
      description: "A raw citrine stone set to catch the light like a desert sunset.",
      stock: 6,
    },
  ],
  "River Stone": [
    {
      name: "River Pebble Band",
      type: "ring",
      price: 65,
      material: "Brushed sterling silver",
      natureTheme: "River Pebble",
      description: "A smooth, pebble-shaped band with a brushed finish.",
      stock: 14,
    },
    {
      name: "Slate Stone Bracelet",
      type: "bracelet",
      price: 48,
      material: "Grey slate beads and leather cord",
      natureTheme: "Riverbed Slate",
      description: "Flat slate beads strung on a waxed leather cord.",
      stock: 18,
    },
    {
      name: "Driftwood Signet Ring",
      type: "ring",
      price: 89,
      material: "Oxidized silver",
      natureTheme: "Driftwood",
      description: "A signet ring with a grain pattern reminiscent of driftwood.",
      stock: 9,
    },
  ],
  "Wildflower Meadow": [
    {
      name: "Wild Rose Ring",
      type: "ring",
      price: 92,
      material: "14k gold vermeil",
      natureTheme: "Wild Rose",
      description: "A single wild rose in bloom, cast in fine detail.",
      stock: 11,
    },
    {
      name: "Daisy Chain Bracelet",
      type: "bracelet",
      price: 76,
      material: "Freshwater pearl and silver",
      natureTheme: "Daisy Chain",
      description: "Freshwater pearls linked like daisies picked from a meadow.",
      stock: 13,
    },
    {
      name: "Lavender Sprig Ring",
      type: "ring",
      price: 98,
      material: "Amethyst and silver",
      natureTheme: "Lavender Sprig",
      description: "A small amethyst cluster styled after a lavender sprig.",
      stock: 7,
    },
  ],
  "Timber & Bark": [
    {
      name: "Oak Bark Cuff",
      type: "bracelet",
      price: 70,
      material: "Brushed brass",
      natureTheme: "Oak Bark",
      description: "A wide cuff textured to resemble oak bark.",
      stock: 16,
    },
    {
      name: "Timber Grain Band",
      type: "ring",
      price: 55,
      material: "Matte black steel",
      natureTheme: "Timber Grain",
      description: "A matte band etched with a fine wood-grain pattern.",
      stock: 20,
    },
    {
      name: "Cedar Root Bracelet",
      type: "bracelet",
      price: 62,
      material: "Braided leather and copper",
      natureTheme: "Cedar Root",
      description: "Braided leather strands anchored with a copper root clasp.",
      stock: 14,
    },
  ],
};

async function main() {
  await prisma.transaction.deleteMany();
  await prisma.item.deleteMany();
  await prisma.category.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@seniorita.com",
      passwordHash: hashPassword("password"),
      role: "owner",
    },
  });

  await prisma.user.create({
    data: {
      name: "Staff Member",
      email: "staff@seniorita.com",
      passwordHash: hashPassword("password"),
      role: "staff",
    },
  });

  await prisma.settings.create({
    data: {
      id: 1,
      businessName: "Seniorita",
      logoUrl: null,
    },
  });

  const itemIdsByName: Record<string, number> = {};

  for (const category of categories) {
    const created = await prisma.category.create({ data: category });

    const items = itemsByCategory[category.name];
    for (const item of items) {
      const createdItem = await prisma.item.create({
        data: {
          ...item,
          categoryId: created.id,
          gender: category.gender,
          images: serializeImages([PLACEHOLDER_IMAGE]),
          isActive: true,
        },
      });
      itemIdsByName[item.name] = createdItem.id;
    }
  }

  // Sample sales/expenses spanning the last several months so the Finance
  // page's date-range filter and monthly chart have something to show.
  const transactions: Array<{
    type: "sale" | "expense";
    amount: number;
    description: string;
    date: Date;
    itemName?: string;
  }> = [
    { type: "sale", amount: 68, description: "Sold Fern Leaf Band Ring", date: new Date(2026, 1, 5), itemName: "Fern Leaf Band Ring" },
    { type: "sale", amount: 82, description: "Sold Cactus Flower Ring", date: new Date(2026, 1, 12), itemName: "Cactus Flower Ring" },
    { type: "expense", amount: 210, description: "Raw materials restock", date: new Date(2026, 1, 15) },
    { type: "sale", amount: 65, description: "Sold River Pebble Band", date: new Date(2026, 1, 22), itemName: "River Pebble Band" },

    { type: "sale", amount: 95, description: "Sold Moss Agate Cuff", date: new Date(2026, 2, 3), itemName: "Moss Agate Cuff" },
    { type: "sale", amount: 92, description: "Sold Wild Rose Ring", date: new Date(2026, 2, 9), itemName: "Wild Rose Ring" },
    { type: "sale", amount: 58, description: "Sold Terracotta Clay Bracelet", date: new Date(2026, 2, 18), itemName: "Terracotta Clay Bracelet" },
    { type: "expense", amount: 45, description: "Packaging supplies", date: new Date(2026, 2, 20) },

    { type: "sale", amount: 110, description: "Sold Sunset Citrine Ring", date: new Date(2026, 3, 4), itemName: "Sunset Citrine Ring" },
    { type: "sale", amount: 70, description: "Sold Oak Bark Cuff", date: new Date(2026, 3, 11), itemName: "Oak Bark Cuff" },
    { type: "expense", amount: 150, description: "Craft fair booth fee", date: new Date(2026, 3, 14) },
    { type: "sale", amount: 76, description: "Sold Daisy Chain Bracelet", date: new Date(2026, 3, 25), itemName: "Daisy Chain Bracelet" },

    { type: "sale", amount: 89, description: "Sold Driftwood Signet Ring", date: new Date(2026, 4, 6), itemName: "Driftwood Signet Ring" },
    { type: "expense", amount: 32, description: "Shipping costs", date: new Date(2026, 4, 10) },
    { type: "sale", amount: 48, description: "Sold Slate Stone Bracelet", date: new Date(2026, 4, 17), itemName: "Slate Stone Bracelet" },
    { type: "sale", amount: 98, description: "Sold Lavender Sprig Ring", date: new Date(2026, 4, 28), itemName: "Lavender Sprig Ring" },

    { type: "sale", amount: 74, description: "Sold Woodland Vine Ring", date: new Date(2026, 5, 2), itemName: "Woodland Vine Ring" },
    { type: "expense", amount: 180, description: "Raw materials restock", date: new Date(2026, 5, 8) },
    { type: "sale", amount: 55, description: "Sold Timber Grain Band", date: new Date(2026, 5, 19), itemName: "Timber Grain Band" },
    { type: "sale", amount: 62, description: "Sold Cedar Root Bracelet", date: new Date(2026, 5, 26), itemName: "Cedar Root Bracelet" },

    { type: "sale", amount: 68, description: "Sold Fern Leaf Band Ring", date: new Date(2026, 6, 3), itemName: "Fern Leaf Band Ring" },
    { type: "sale", amount: 82, description: "Sold Cactus Flower Ring", date: new Date(2026, 6, 9), itemName: "Cactus Flower Ring" },
    { type: "expense", amount: 40, description: "Packaging supplies", date: new Date(2026, 6, 12) },
    { type: "sale", amount: 92, description: "Sold Wild Rose Ring", date: new Date(2026, 6, 16) },
  ];

  for (const transaction of transactions) {
    await prisma.transaction.create({
      data: {
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        date: transaction.date,
        itemId: transaction.itemName ? itemIdsByName[transaction.itemName] : undefined,
      },
    });
  }

  const categoryCount = await prisma.category.count();
  const itemCount = await prisma.item.count();
  const transactionCount = await prisma.transaction.count();
  const userCount = await prisma.user.count();
  console.log(
    `Seeded ${categoryCount} categories, ${itemCount} items, ${transactionCount} transactions, and ${userCount} users.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
