"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ALLOWED_GENDERS, type Gender } from "@/lib/categories";
import { parseImages } from "@/lib/items";
import { ItemModal, type ItemFormValues, type Category } from "./ItemModal";
import { DeleteItemModal } from "./DeleteItemModal";
import styles from "./items.module.css";

type Item = {
  id: number;
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
  category: { id: number; name: string };
};

type ModalState = { mode: "create" } | { mode: "edit"; item: Item } | null;

const PAGE_SIZE = 8;
const EMPTY_FORM: ItemFormValues = {
  name: "",
  categoryId: "",
  gender: "unisex",
  type: "ring",
  price: "",
  material: "",
  natureTheme: "",
  description: "",
  stock: "0",
};

function itemToFormValues(item: Item): ItemFormValues {
  return {
    name: item.name,
    categoryId: item.categoryId,
    gender: item.gender as Gender,
    type: item.type as "ring" | "bracelet",
    price: String(item.price),
    material: item.material,
    natureTheme: item.natureTheme,
    description: item.description,
    stock: String(item.stock),
  };
}

export function ItemsTable() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [categories, setCategories] = useState<Category[]>([]);

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<number | "">("");
  const [genderFilter, setGenderFilter] = useState<Gender | "">("");
  const [currentPage, setCurrentPage] = useState(1);

  const [modal, setModal] = useState<ModalState>(null);
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);

  const searchParams = useSearchParams();
  const handledEditParam = useRef(false);

  // Load categories once, for the filter dropdown and the item form.
  useEffect(() => {
    let ignore = false;
    fetch("/api/categories")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Category[]) => {
        if (!ignore) setCategories(data);
      })
      .catch(() => {
        /* filter dropdown just stays empty; not critical to the page working */
      });
    return () => {
      ignore = true;
    };
  }, []);

  // Debounce free-text search into searchQuery.
  useEffect(() => {
    const id = setTimeout(() => {
      setSearchQuery(searchInput);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  // Fetch items whenever filters (or refreshKey) change.
  useEffect(() => {
    let ignore = false;
    const params = new URLSearchParams();
    if (categoryFilter !== "") params.set("category", String(categoryFilter));
    if (genderFilter !== "") params.set("gender", genderFilter);
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    const qs = params.toString();

    fetch(`/api/items${qs ? `?${qs}` : ""}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load items");
        return res.json();
      })
      .then((data: Item[]) => {
        if (!ignore) setItems(data);
      })
      .catch(() => {
        if (!ignore) setError("Couldn't load items. Check your connection and try again.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [categoryFilter, genderFilter, searchQuery, refreshKey]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  // Deep link support: /items?edit=<id> opens that item's edit modal directly.
  useEffect(() => {
    if (handledEditParam.current || !items) return;
    const editId = searchParams.get("edit");
    if (!editId) return;
    const target = items.find((i) => i.id === Number(editId));
    if (!target) return;

    handledEditParam.current = true;
    const id = setTimeout(() => setModal({ mode: "edit", item: target }), 0);
    return () => clearTimeout(id);
  }, [items, searchParams]);

  async function handleToggleActive(item: Item) {
    setActionError(null);
    const res = await fetch(`/api/items/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: item.name,
        categoryId: item.categoryId,
        gender: item.gender,
        type: item.type,
        price: item.price,
        material: item.material,
        natureTheme: item.natureTheme,
        description: item.description,
        stock: item.stock,
        isActive: !item.isActive,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setActionError(data.error ?? "Failed to update item");
      return;
    }
    setItems((prev) => prev?.map((i) => (i.id === item.id ? data : i)) ?? null);
  }

  async function handleModalSubmit(values: ItemFormValues) {
    const isEdit = modal?.mode === "edit";
    const url = isEdit ? `/api/items/${modal.item.id}` : "/api/items";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.name,
        categoryId: values.categoryId,
        gender: values.gender,
        type: values.type,
        price: Number(values.price),
        material: values.material,
        natureTheme: values.natureTheme,
        description: values.description,
        stock: Number(values.stock) || 0,
        isActive: isEdit ? modal.item.isActive : true,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      return { error: data.error ?? "Failed to save item" };
    }

    setModal(null);
    setToast(isEdit ? "Item updated" : "Item created");
    setRefreshKey((k) => k + 1);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/items/${deleteTarget.id}`, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok) {
      return { error: data.error ?? "Failed to delete item" };
    }

    setItems((prev) => prev?.filter((i) => i.id !== deleteTarget.id) ?? null);
    setDeleteTarget(null);
    setToast("Item deleted");
  }

  const totalPages = items ? Math.max(1, Math.ceil(items.length / PAGE_SIZE)) : 1;
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = items ? items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE) : [];

  return (
    <div>
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <input
            className={styles.searchInput}
            type="search"
            placeholder="Search by name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <select
            className={styles.filterSelect}
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value ? Number(e.target.value) : "");
              setCurrentPage(1);
            }}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            className={styles.filterSelect}
            value={genderFilter}
            onChange={(e) => {
              setGenderFilter(e.target.value as Gender | "");
              setCurrentPage(1);
            }}
          >
            <option value="">All genders</option>
            {ALLOWED_GENDERS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <button className={styles.newBtn} onClick={() => setModal({ mode: "create" })}>
          New Item
        </button>
      </div>

      {toast && <p className={styles.toast}>{toast}</p>}
      {actionError && <p className={styles.actionError}>{actionError}</p>}

      {loading ? (
        <p className={styles.state}>Loading items...</p>
      ) : error ? (
        <div className={styles.state}>
          <p>{error}</p>
          <button
            className={styles.retry}
            onClick={() => {
              setError(null);
              setLoading(true);
              setRefreshKey((k) => k + 1);
            }}
          >
            Retry
          </button>
        </div>
      ) : !items || items.length === 0 ? (
        <p className={styles.state}>No items match your filters.</p>
      ) : (
        <>
          <table className={styles.table}>
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Category</th>
                <th>Gender</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((item) => {
                const [image] = parseImages(item.images);
                return (
                  <tr key={item.id}>
                    <td>
                      <div className={styles.thumbWrap}>
                        {image && (
                          <Image
                            src={image}
                            alt={item.name}
                            fill
                            unoptimized
                            className={styles.thumb}
                          />
                        )}
                      </div>
                    </td>
                    <td>{item.name}</td>
                    <td>{item.category.name}</td>
                    <td className={styles.genderCell}>{item.gender}</td>
                    <td>${item.price.toFixed(2)}</td>
                    <td>{item.stock}</td>
                    <td>
                      <button
                        className={`${styles.toggle} ${item.isActive ? styles.toggleOn : ""}`}
                        onClick={() => handleToggleActive(item)}
                        aria-pressed={item.isActive}
                        aria-label={item.isActive ? "Active" : "Inactive"}
                      >
                        <span className={styles.toggleKnob} />
                      </button>
                    </td>
                    <td className={styles.actionsCell}>
                      <button
                        className={styles.editBtn}
                        onClick={() => setModal({ mode: "edit", item })}
                      >
                        Edit
                      </button>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => setDeleteTarget(item)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
              >
                Previous
              </button>
              <span className={styles.pageInfo}>
                Page {safePage} of {totalPages}
              </span>
              <button
                className={styles.pageBtn}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {modal && (
        <ItemModal
          mode={modal.mode}
          categories={categories}
          initialValues={modal.mode === "edit" ? itemToFormValues(modal.item) : EMPTY_FORM}
          onClose={() => setModal(null)}
          onSubmit={handleModalSubmit}
        />
      )}

      {deleteTarget && (
        <DeleteItemModal
          itemName={deleteTarget.name}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
