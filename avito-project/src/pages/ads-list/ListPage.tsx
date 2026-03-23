import { useEffect, useMemo, useState } from "react";
import { ListCard } from "./ListCard.tsx";
import type { AdListItem, Category, Layout } from "./types";
import styles from "./ListPage.module.css";

type SortValue = "created_desc" | "created_asc" | "title_asc" | "title_desc";

type ItemsResponse = {
  items: AdListItem[];
  total: number;
};

const API_BASE_URL = "http://127.0.0.1:8080";

const SORT_PARAMS: Record<
  SortValue,
  { sortColumn: string; sortDirection: "asc" | "desc" }
> = {
  created_desc: { sortColumn: "createdAt", sortDirection: "desc" },
  created_asc: { sortColumn: "createdAt", sortDirection: "asc" },
  title_asc: { sortColumn: "title", sortDirection: "asc" },
  title_desc: { sortColumn: "title", sortDirection: "desc" },
};

export function ListPage() {
  const [query, setQuery] = useState("");
  const [layout, setLayout] = useState<Layout>("grid");
  const [isCategoryOpen, setIsCategoryOpen] = useState(true);
  const [sortValue, setSortValue] = useState<SortValue>("created_desc");
  const [onlyNeedsRevision, setOnlyNeedsRevision] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [ads, setAds] = useState<AdListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const pageSize = layout === "grid" ? 15 : 4;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    const controller = new AbortController();
    let isCurrentRequest = true;

    const loadItems = async () => {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("q", query);
      params.set("limit", String(pageSize));
      params.set("skip", String((safePage - 1) * pageSize));

      if (selectedCategories.length > 0) {
        params.set("categories", selectedCategories.join(","));
      }

      if (onlyNeedsRevision) {
        params.set("needsRevision", "true");
      }

      const sortParams = SORT_PARAMS[sortValue];
      params.set("sortColumn", sortParams.sortColumn);
      params.set("sortDirection", sortParams.sortDirection);

      try {
        const response = await fetch(
          `${API_BASE_URL}/items?${params.toString()}`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = (await response.json()) as ItemsResponse;
        if (!isCurrentRequest) {
          return;
        }

        setAds(data.items);
        setTotal(data.total);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        if (!isCurrentRequest) {
          return;
        }

        setAds([]);
        setTotal(0);
        setError(
          "Не удалось загрузить объявления. Проверьте подключение к серверу.",
        );
      } finally {
        if (isCurrentRequest) {
          setIsLoading(false);
        }
      }
    };

    void loadItems();

    return () => {
      isCurrentRequest = false;
      controller.abort();
    };
  }, [
    onlyNeedsRevision,
    pageSize,
    query,
    reloadKey,
    safePage,
    selectedCategories,
    sortValue,
  ]);

  const subtitleText = useMemo(() => `${total} объявления`, [total]);

  const toggleCategory = (category: Category) => {
    setPage(1);
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((current) => current !== category)
        : [...prev, category],
    );
  };

  const resetFilters = () => {
    setQuery("");
    setSortValue("created_desc");
    setOnlyNeedsRevision(false);
    setSelectedCategories([]);
    setPage(1);
  };

  return (
    <main className={styles.page}>
      <div className={styles.canvas}>
        <header className={styles.header}>
          <h1 className={styles.title}>Мои объявления</h1>
          <p className={styles.subtitle}>{subtitleText}</p>
        </header>

        <section className={styles.searchRow}>
          <input
            className={styles.searchInput}
            value={query}
            onChange={(event) => {
              setPage(1);
              setQuery(event.target.value);
            }}
            placeholder="Найти объявление..."
            aria-label="Строка поиска объявлений"
          />
          <button
            type="button"
            className={
              layout === "grid"
                ? styles.layoutButtonActive
                : styles.layoutButton
            }
            onClick={() => {
              setPage(1);
              setLayout("grid");
            }}
            aria-label="Сетка"
          >
            ⊞
          </button>
          <button
            type="button"
            className={
              layout === "list"
                ? styles.layoutButtonActive
                : styles.layoutButton
            }
            onClick={() => {
              setPage(1);
              setLayout("list");
            }}
            aria-label="Список"
          >
            ☰
          </button>
          <select
            className={styles.sortSelect}
            value={sortValue}
            onChange={(event) => {
              setPage(1);
              setSortValue(event.target.value as SortValue);
            }}
            aria-label="Сортировка"
          >
            <option value="created_desc">По новизне (сначала новые)</option>
            <option value="created_asc">По новизне (сначала старые)</option>
            <option value="title_asc">По названию (А → Я)</option>
            <option value="title_desc">По названию (Я → А)</option>
          </select>
        </section>

        <section className={styles.contentArea}>
          <div className={styles.filtersColumn}>
            <aside className={styles.filters}>
              <div className={styles.filtersTop}>
                <h2 className={styles.filtersTitle}>Фильтры</h2>

                <button
                  type="button"
                  className={styles.categoryToggle}
                  onClick={() => setIsCategoryOpen((prev) => !prev)}
                  aria-expanded={isCategoryOpen}
                  aria-label="Свернуть или развернуть фильтр по категории"
                >
                  <span className={styles.filtersLabel}>Категория</span>
                  <span
                    className={
                      isCategoryOpen ? styles.chevronUp : styles.chevronDown
                    }
                    aria-hidden
                  />
                </button>

                {isCategoryOpen && (
                  <div className={styles.categoriesList}>
                    <label className={styles.checkboxRow}>
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes("auto")}
                        onChange={() => toggleCategory("auto")}
                      />
                      <span>Авто</span>
                    </label>
                    <label className={styles.checkboxRow}>
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes("electronics")}
                        onChange={() => toggleCategory("electronics")}
                      />
                      <span>Электроника</span>
                    </label>
                    <label className={styles.checkboxRow}>
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes("real_estate")}
                        onChange={() => toggleCategory("real_estate")}
                      />
                      <span>Недвижимость</span>
                    </label>
                  </div>
                )}

                <div className={styles.filterDivider} aria-hidden />

                <div className={styles.revisionRow}>
                  <span>Только требующие доработок</span>

                  <button
                    type="button"
                    className={
                      onlyNeedsRevision ? styles.switchActive : styles.switch
                    }
                    onClick={() => {
                      setPage(1);
                      setOnlyNeedsRevision((prev) => !prev);
                    }}
                    aria-label="Только требующие доработок"
                  >
                    <span className={styles.switchThumb} />
                  </button>
                </div>
              </div>
            </aside>

            <button
              type="button"
              className={styles.resetButton}
              onClick={resetFilters}
            >
              Сбросить фильтры
            </button>
          </div>

          <div className={styles.cardsPane}>
            {isLoading && (
              <div className={styles.stateMessage}>Загрузка объявлений</div>
            )}

            {!isLoading && error && (
              <div className={styles.stateError}>
                <p className={styles.stateText}>{error}</p>
                <button
                  type="button"
                  className={styles.retryButton}
                  onClick={() => setReloadKey((prev) => prev + 1)}
                >
                  Повторить
                </button>
              </div>
            )}

            {!isLoading && !error && ads.length === 0 && (
              <div className={styles.stateMessage}>
                Ничего не найдено по выбранным фильтрам.
              </div>
            )}

            {!isLoading && !error && ads.length > 0 && (
              <div
                className={
                  layout === "grid" ? styles.cardsGrid : styles.cardsList
                }
              >
                {ads.map((ad) => (
                  <ListCard key={ad.id} ad={ad} layout={layout} />
                ))}
              </div>
            )}

            {!isLoading && !error && ads.length > 0 && (
              <footer className={styles.pagination}>
                <button
                  type="button"
                  className={styles.pageButton}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={safePage === 1}
                  aria-label="Назад"
                >
                  ‹
                </button>

                {Array.from({ length: totalPages }).map((_, index) => {
                  const pageNumber = index + 1;
                  const isActive = pageNumber === safePage;

                  return (
                    <button
                      type="button"
                      key={pageNumber}
                      className={
                        isActive ? styles.pageButtonActive : styles.pageButton
                      }
                      onClick={() => setPage(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  );
                })}

                <button
                  type="button"
                  className={styles.pageButton}
                  onClick={() =>
                    setPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={safePage === totalPages}
                  aria-label="Вперед"
                >
                  ›
                </button>
              </footer>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
