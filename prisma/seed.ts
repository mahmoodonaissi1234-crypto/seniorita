import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { serializeImages } from "../src/lib/items";

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
  await prisma.item.deleteMany();
  await prisma.category.deleteMany();

  for (const category of categories) {
    const created = await prisma.category.create({ data: category });

    const items = itemsByCategory[category.name];
    for (const item of items) {
      await prisma.item.create({
        data: {
          ...item,
          categoryId: created.id,
          gender: category.gender,
          images: serializeImages([PLACEHOLDER_IMAGE]),
          isActive: true,
        },
      });
    }
  }

  const categoryCount = await prisma.category.count();
  const itemCount = await prisma.item.count();
  console.log(`Seeded ${categoryCount} categories and ${itemCount} items.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
