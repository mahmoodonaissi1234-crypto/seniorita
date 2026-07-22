export const ALLOWED_ITEM_TYPES = ["ring", "bracelet"] as const;
export type ItemType = (typeof ALLOWED_ITEM_TYPES)[number];

export function isValidItemType(value: unknown): value is ItemType {
  return typeof value === "string" && (ALLOWED_ITEM_TYPES as readonly string[]).includes(value);
}

export function parseImages(images: string): string[] {
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function serializeImages(images: string[]): string {
  return JSON.stringify(images);
}

export type ItemInput = {
  name: string;
  categoryId: number;
  gender: string;
  type: string;
  price: number;
  material: string;
  natureTheme: string;
  description: string;
  images: string;
  stock: number;
  isActive: boolean;
};

export function validateItemInput(body: unknown): { data: ItemInput } | { error: string } {
  if (typeof body !== "object" || body === null) {
    return { error: "Invalid request body" };
  }

  const b = body as Record<string, unknown>;

  if (typeof b.name !== "string" || b.name.trim().length === 0) {
    return { error: "name is required" };
  }

  const categoryId = Number(b.categoryId);
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return { error: "category is required" };
  }

  if (b.price === undefined || b.price === null || b.price === "") {
    return { error: "price is required" };
  }
  const price = typeof b.price === "number" ? b.price : Number(b.price);
  if (!Number.isFinite(price)) {
    return { error: "price must be a positive number" };
  }
  if (price <= 0) {
    return { error: "price must be a positive number" };
  }

  const images = Array.isArray(b.images)
    ? serializeImages(b.images.filter((i): i is string => typeof i === "string"))
    : typeof b.images === "string"
      ? b.images
      : serializeImages([]);

  return {
    data: {
      name: b.name.trim(),
      categoryId,
      gender: typeof b.gender === "string" ? b.gender : "",
      type: typeof b.type === "string" ? b.type : "",
      price,
      material: typeof b.material === "string" ? b.material : "",
      natureTheme: typeof b.natureTheme === "string" ? b.natureTheme : "",
      description: typeof b.description === "string" ? b.description : "",
      images,
      stock: Number.isInteger(b.stock) ? (b.stock as number) : 0,
      isActive: typeof b.isActive === "boolean" ? b.isActive : true,
    },
  };
}
