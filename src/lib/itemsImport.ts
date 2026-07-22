import { ALLOWED_GENDERS, isValidGender } from "./categories";
import { ALLOWED_ITEM_TYPES, isValidItemType, serializeImages, type ItemInput } from "./items";

export const CSV_COLUMNS = [
  "name",
  "category",
  "gender",
  "type",
  "price",
  "material",
  "natureTheme",
  "description",
  "stock",
  "isActive",
] as const;

const REQUIRED_COLUMNS = ["name", "category", "gender", "type", "price"] as const;

export type ImportRow =
  | { row: number; name: string; status: "valid"; data: ItemInput }
  | { row: number; name: string; status: "error"; errors: string[] };

export function buildHeaderMap(headerRow: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  headerRow.forEach((header, index) => {
    map[header.trim().toLowerCase()] = index;
  });
  return map;
}

export function validateHeader(headerRow: string[]): string | null {
  const map = buildHeaderMap(headerRow);
  const missing = REQUIRED_COLUMNS.filter((col) => map[col.toLowerCase()] === undefined);
  if (missing.length > 0) {
    return `Missing required column(s): ${missing.join(", ")}`;
  }
  return null;
}

function cell(row: string[], headerMap: Record<string, number>, key: string): string {
  const index = headerMap[key.toLowerCase()];
  if (index === undefined) return "";
  return (row[index] ?? "").trim();
}

function parseBoolean(value: string, fallback: boolean): boolean {
  if (value === "") return fallback;
  const lower = value.toLowerCase();
  if (["true", "1", "yes"].includes(lower)) return true;
  if (["false", "0", "no"].includes(lower)) return false;
  return fallback;
}

export function validateImportRow(
  rowNumber: number,
  row: string[],
  headerMap: Record<string, number>,
  categoryIdsByName: Map<string, number>
): ImportRow {
  const errors: string[] = [];

  const name = cell(row, headerMap, "name");
  if (!name) errors.push("name is required");

  const categoryName = cell(row, headerMap, "category");
  let categoryId: number | undefined;
  if (!categoryName) {
    errors.push("category is required");
  } else {
    categoryId = categoryIdsByName.get(categoryName.toLowerCase());
    if (categoryId === undefined) {
      errors.push(`category "${categoryName}" does not exist`);
    }
  }

  const gender = cell(row, headerMap, "gender");
  if (!isValidGender(gender)) {
    errors.push(`gender must be one of: ${ALLOWED_GENDERS.join(", ")}`);
  }

  const type = cell(row, headerMap, "type");
  if (!isValidItemType(type)) {
    errors.push(`type must be one of: ${ALLOWED_ITEM_TYPES.join(", ")}`);
  }

  const priceRaw = cell(row, headerMap, "price");
  const price = Number(priceRaw);
  if (priceRaw === "" || !Number.isFinite(price) || price <= 0) {
    errors.push("price must be a positive number");
  }

  const stockRaw = cell(row, headerMap, "stock");
  let stock = 0;
  if (stockRaw !== "") {
    stock = Number(stockRaw);
    if (!Number.isInteger(stock) || stock < 0) {
      errors.push("stock must be a non-negative whole number");
    }
  }

  if (errors.length > 0) {
    return { row: rowNumber, name: name || `(row ${rowNumber})`, status: "error", errors };
  }

  return {
    row: rowNumber,
    name,
    status: "valid",
    data: {
      name,
      categoryId: categoryId as number,
      gender,
      type,
      price,
      material: cell(row, headerMap, "material"),
      natureTheme: cell(row, headerMap, "natureTheme"),
      description: cell(row, headerMap, "description"),
      images: serializeImages([]),
      stock,
      isActive: parseBoolean(cell(row, headerMap, "isActive"), true),
    },
  };
}
