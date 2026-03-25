import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createAiAssistant } from '@/pages/ad-edit/aiAssistant';
import lightbulbIcon from '@/assets/lightbulb.svg';
import { AppRoute, getViewPath } from '@/shared/config/routes';
import { Button } from '@/shared/ui/button/Button';
import styles from './EditPage.module.css';

type Category = 'auto' | 'electronics' | 'real_estate';
type FieldKind = 'text' | 'number' | 'select';

type SelectOption = {
  value: string;
  label: string;
};

type ParamField = {
  key: string;
  label: string;
  kind: FieldKind;
  options?: SelectOption[];
};

type DetailItem = {
  id: number;
  category: Category;
  title: string;
  description?: string;
  price: number | null;
  params: Record<string, unknown>;
};

type EditFormState = {
  category: Category;
  title: string;
  description: string;
  price: string;
  params: Record<string, string>;
};

type ValidationErrors = {
  title?: string;
  price?: string;
};

type UpdatePayload = {
  category: Category;
  title: string;
  description?: string;
  price: number;
  params: Record<string, string | number>;
};

const API_BASE_URL = 'http://127.0.0.1:8080';
const MAX_DESCRIPTION_LENGTH = 3000;

const CATEGORY_OPTIONS: SelectOption[] = [
  { value: 'auto', label: 'Авто' },
  { value: 'electronics', label: 'Электроника' },
  { value: 'real_estate', label: 'Недвижимость' },
];

const PARAM_FIELDS: Record<Category, ParamField[]> = {
  auto: [
    { key: 'brand', label: 'Бренд', kind: 'text' },
    { key: 'model', label: 'Модель', kind: 'text' },
    { key: 'yearOfManufacture', label: 'Год выпуска', kind: 'number' },
    {
      key: 'transmission',
      label: 'КПП',
      kind: 'select',
      options: [
        { value: 'automatic', label: 'Автоматическая' },
        { value: 'manual', label: 'Механическая' },
      ],
    },
    { key: 'mileage', label: 'Пробег', kind: 'number' },
    { key: 'enginePower', label: 'Мощность двигателя', kind: 'number' },
  ],
  electronics: [
    {
      key: 'type',
      label: 'Тип',
      kind: 'select',
      options: [
        { value: 'phone', label: 'Телефон' },
        { value: 'laptop', label: 'Ноутбук' },
        { value: 'misc', label: 'Другое' },
      ],
    },
    { key: 'brand', label: 'Бренд', kind: 'text' },
    { key: 'model', label: 'Модель', kind: 'text' },
    {
      key: 'condition',
      label: 'Состояние',
      kind: 'select',
      options: [
        { value: 'new', label: 'Новый' },
        { value: 'used', label: 'Б/у' },
      ],
    },
    { key: 'color', label: 'Цвет', kind: 'text' },
  ],
  real_estate: [
    {
      key: 'type',
      label: 'Тип',
      kind: 'select',
      options: [
        { value: 'flat', label: 'Квартира' },
        { value: 'house', label: 'Дом' },
        { value: 'room', label: 'Комната' },
      ],
    },
    { key: 'address', label: 'Адрес', kind: 'text' },
    { key: 'area', label: 'Площадь', kind: 'number' },
    { key: 'floor', label: 'Этаж', kind: 'number' },
  ],
};

const isCategory = (value: string): value is Category =>
  value === 'auto' || value === 'electronics' || value === 'real_estate';

const getDraftKey = (id: string): string => `ad-edit-draft-${id}`;

const toFormState = (item: DetailItem): EditFormState => {
  const params: Record<string, string> = {};

  for (const [key, rawValue] of Object.entries(item.params)) {
    if (typeof rawValue === 'string' || typeof rawValue === 'number') {
      params[key] = String(rawValue);
    }
  }

  return {
    category: item.category,
    title: item.title,
    description: item.description ?? '',
    price: item.price === null ? '' : String(item.price),
    params,
  };
};

const parseDraft = (value: string): EditFormState | null => {
  try {
    const raw = JSON.parse(value) as Partial<EditFormState>;

    if (!raw || typeof raw !== 'object' || !raw.category || !isCategory(raw.category)) {
      return null;
    }

    return {
      category: raw.category,
      title: typeof raw.title === 'string' ? raw.title : '',
      description: typeof raw.description === 'string' ? raw.description : '',
      price: typeof raw.price === 'string' ? raw.price : '',
      params:
        raw.params && typeof raw.params === 'object'
          ? Object.fromEntries(
              Object.entries(raw.params).map(([key, fieldValue]) => [
                key,
                typeof fieldValue === 'string' ? fieldValue : '',
              ]),
            )
          : {},
    };
  } catch {
    return null;
  }
};

const buildUpdatePayload = (form: EditFormState): UpdatePayload => {
  const params: Record<string, string | number> = {};

  for (const field of PARAM_FIELDS[form.category]) {
    const value = form.params[field.key]?.trim();

    if (!value) {
      continue;
    }

    if (field.kind === 'number') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        params[field.key] = parsed;
      }
      continue;
    }

    if (field.kind === 'select' && field.options && !field.options.some((option) => option.value === value)) {
      continue;
    }

    params[field.key] = value;
  }

  return {
    category: form.category,
    title: form.title.trim(),
    description: form.description.trim() ? form.description.trim() : undefined,
    price: Number(form.price),
    params,
  };
};

const validateForm = (form: EditFormState): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!form.title.trim()) {
    errors.title = 'Укажите название объявления.';
  }

  const price = Number(form.price);
  if (!form.price.trim()) {
    errors.price = 'Укажите цену.';
  } else if (!Number.isFinite(price) || price < 0) {
    errors.price = 'Цена должна быть числом больше или равным 0.';
  }

  return errors;
};

export function EditPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'ready' | 'saving' | 'error'>('loading');
  const [form, setForm] = useState<EditFormState | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [pageError, setPageError] = useState<string | null>(null);
  const [aiLoadingTarget, setAiLoadingTarget] = useState<'description' | 'price' | null>(null);
  const [suggestedDescription, setSuggestedDescription] = useState<string | null>(null);
  const [suggestedPrice, setSuggestedPrice] = useState<number | null>(null);
  const [descriptionAiError, setDescriptionAiError] = useState<string | null>(null);
  const [priceAiError, setPriceAiError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<
    | {
        type: 'success' | 'error';
        title: string;
        message: string;
      }
    | null
  >(null);

  const aiAssistant = useMemo(() => createAiAssistant(), []);
  const paramFields = form ? PARAM_FIELDS[form.category] : [];

  useEffect(() => {
    const controller = new AbortController();
    let isCurrentRequest = true;

    const loadItem = async () => {
      if (!id) {
        setPageError('Некорректный идентификатор объявления.');
        setStatus('error');
        return;
      }

      setStatus('loading');
      setPageError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/items/${id}`, {
          signal: controller.signal,
        });

        if (response.status === 404) {
          if (!isCurrentRequest) {
            return;
          }

          setPageError('Объявление не найдено.');
          setStatus('error');
          return;
        }

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const item = (await response.json()) as DetailItem;
        if (!isCurrentRequest) {
          return;
        }

        const initialForm = toFormState(item);
        const draftRaw = localStorage.getItem(getDraftKey(id));
        const draft = draftRaw ? parseDraft(draftRaw) : null;

        if (draft) {
          setForm(draft);
        } else {
          setForm(initialForm);
        }

        setErrors({});
        setDescriptionAiError(null);
        setPriceAiError(null);
        setSuggestedDescription(null);
        setSuggestedPrice(null);
        setSaveNotice(null);
        setStatus('ready');
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }

        if (!isCurrentRequest) {
          return;
        }

        setPageError('Не удалось загрузить объявление для редактирования.');
        setStatus('error');
      }
    };

    void loadItem();

    return () => {
      isCurrentRequest = false;
      controller.abort();
    };
  }, [id]);

  useEffect(() => {
    if (!id || !form || status === 'loading' || status === 'error') {
      return;
    }

    localStorage.setItem(getDraftKey(id), JSON.stringify(form));
  }, [form, id, status]);

  const updateForm = (patch: Partial<EditFormState>) => {
    setForm((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        ...patch,
      };
    });
  };

  const handleCategoryChange = (nextCategory: Category) => {
    updateForm({
      category: nextCategory,
      params: {},
    });
  };

  const handleParamChange = (key: string, value: string) => {
    setForm((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        params: {
          ...prev.params,
          [key]: value,
        },
      };
    });
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id || !form) {
      return;
    }

    const nextErrors = validateForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const payload = buildUpdatePayload(form);

    setStatus('saving');
    setPageError(null);
    setSaveNotice(null);

    try {
      const response = await fetch(`${API_BASE_URL}/items/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      localStorage.removeItem(getDraftKey(id));
      setStatus('ready');
      setSaveNotice({
        type: 'success',
        title: 'Изменения сохранены',
        message: 'Данные успешно обновлены. Выполняется переход к объявлению.',
      });

      window.setTimeout(() => {
        navigate(getViewPath(id));
      }, 1100);
    } catch {
      setStatus('ready');
      setSaveNotice({
        type: 'error',
        title: 'Ошибка сохранения',
        message: 'При попытке сохранить изменения произошла ошибка. Попробуйте еще раз.',
      });
    }
  };

  const handleDescriptionSuggestion = async () => {
    if (!form) {
      return;
    }

    try {
      setDescriptionAiError(null);
      setSuggestedDescription(null);
      setAiLoadingTarget('description');
      const suggestion = await aiAssistant.generateDescription(buildUpdatePayload(form));
      setSuggestedDescription(suggestion);
    } catch (error) {
      setDescriptionAiError(
        error instanceof Error ? error.message : 'Не удалось получить предложение для описания.',
      );
    } finally {
      setAiLoadingTarget(null);
    }
  };

  const handlePriceSuggestion = async () => {
    if (!form) {
      return;
    }

    try {
      setPriceAiError(null);
      setSuggestedPrice(null);
      setAiLoadingTarget('price');
      const suggestion = await aiAssistant.estimatePrice(buildUpdatePayload(form));
      setSuggestedPrice(suggestion);
    } catch (error) {
      setPriceAiError(error instanceof Error ? error.message : 'Не удалось получить оценку цены.');
    } finally {
      setAiLoadingTarget(null);
    }
  };

  if (status === 'loading') {
    return <main className={styles.state}>Загрузка формы редактирования...</main>;
  }

  if (status === 'error' || !form) {
    return (
      <main className={styles.state}>
        <p className={styles.errorText}>{pageError ?? 'Страница недоступна.'}</p>
        <Link to={AppRoute.List} className={styles.backLink}>
          Вернуться к списку
        </Link>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      {saveNotice && (
        <section
          className={saveNotice.type === 'success' ? styles.toastSuccess : styles.toastError}
          role="status"
          aria-live="polite"
        >
          <p className={styles.toastTitle}>{saveNotice.title}</p>
          <p className={styles.toastMessage}>{saveNotice.message}</p>
          <button
            type="button"
            className={styles.toastClose}
            onClick={() => {
              setSaveNotice(null);
            }}
          >
            Закрыть
          </button>
        </section>
      )}

      <div className={styles.canvas}>
        <Button to={getViewPath(id)} variant="secondary" className={styles.backToListButton}>
          К объявлению
        </Button>

        <header className={styles.header}>
          <h1 className={styles.title}>Редактирование объявления</h1>
        </header>

        {pageError && <p className={styles.errorBanner}>{pageError}</p>}

        <form className={styles.form} onSubmit={handleSave}>
          <div className={styles.divider} aria-hidden />

          <label className={styles.fieldFixed}>
            <span className={styles.labelSection}>Категория</span>
            <select
              className={styles.input}
              value={form.category}
              onChange={(event) => {
                handleCategoryChange(event.target.value as Category);
              }}
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className={styles.divider} aria-hidden />

          <label className={styles.fieldFixed}>
            <span className={styles.labelSection}>
              <span className={styles.requiredMark} aria-hidden>
                *
              </span>{' '}
              Название
            </span>
            <input
              className={errors.title ? styles.inputError : styles.input}
              value={form.title}
              onChange={(event) => {
                updateForm({ title: event.target.value });
              }}
            />
            {errors.title && <span className={styles.fieldError}>{errors.title}</span>}
          </label>

          <div className={styles.divider} aria-hidden />

          <div className={styles.rowWithAction}>
            <label className={styles.fieldFixed}>
              <span className={styles.labelSection}>
                <span className={styles.requiredMark} aria-hidden>
                  *
                </span>{' '}
                Цена
              </span>
              <input
                className={errors.price ? styles.inputError : styles.input}
                type="number"
                min="0"
                step="1"
                value={form.price}
                onChange={(event) => {
                  updateForm({ price: event.target.value });
                }}
              />
              {errors.price && <span className={styles.fieldError}>{errors.price}</span>}
            </label>

            <Button
              type="button"
              variant="secondary"
              className={`${styles.aiInlineButton} ${styles.aiPriceButton}`}
              onClick={handlePriceSuggestion}
              disabled={aiLoadingTarget !== null}
              startIcon={<img src={lightbulbIcon} alt="" aria-hidden />}
            >
              {aiLoadingTarget === 'price'
                ? 'Выполняется запрос'
                : suggestedPrice !== null || Boolean(priceAiError)
                  ? 'Повторить запрос'
                  : 'Узнать рыночную цену'}
            </Button>
          </div>

          {suggestedPrice !== null && (
            <section className={styles.aiResultCard}>
              <p className={styles.aiCardTitle}>Ответ AI:</p>
              <p className={styles.aiCardText}>{suggestedPrice.toLocaleString('ru-RU')} ₽</p>
              <div className={styles.aiCardActions}>
                <Button
                  type="button"
                  variant="secondary"
                  className={styles.applyButton}
                  onClick={() => {
                    updateForm({ price: String(suggestedPrice) });
                  }}
                >
                  Применить
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className={styles.closeAiCardButton}
                  onClick={() => {
                    setSuggestedPrice(null);
                  }}
                >
                  Закрыть
                </Button>
              </div>
            </section>
          )}

          {priceAiError && (
            <section className={styles.aiErrorCard}>
              <p className={styles.aiErrorTitle}>Произошла ошибка при запросе к AI</p>
              <p className={styles.aiErrorText}>{priceAiError}</p>
              <Button
                type="button"
                variant="secondary"
                className={styles.closeAiCardButton}
                onClick={() => {
                  setPriceAiError(null);
                }}
              >
                Закрыть
              </Button>
            </section>
          )}

          <div className={styles.divider} aria-hidden />

          <section className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Характеристики</h2>
            <div className={styles.paramsList}>
              {paramFields.map((field) => (
                <label key={field.key} className={styles.fieldFixedParam}>
                  <span className={styles.labelParam}>{field.label}</span>
                  {field.kind === 'select' ? (
                    <select
                      className={styles.input}
                      value={form.params[field.key] ?? ''}
                      onChange={(event) => {
                        handleParamChange(field.key, event.target.value);
                      }}
                    >
                      <option value="">Не выбрано</option>
                      {(field.options ?? []).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className={styles.input}
                      type={field.kind === 'number' ? 'number' : 'text'}
                      value={form.params[field.key] ?? ''}
                      onChange={(event) => {
                        handleParamChange(field.key, event.target.value);
                      }}
                    />
                  )}
                </label>
              ))}
            </div>
          </section>

          <div className={styles.divider} aria-hidden />

          <section className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Описание</h2>
            <label className={styles.fieldWide}>
              <textarea
                className={styles.textarea}
                rows={4}
                maxLength={MAX_DESCRIPTION_LENGTH}
                value={form.description}
                onChange={(event) => {
                  updateForm({ description: event.target.value });
                }}
              />
              <span className={styles.counter}>
                {form.description.length}/{MAX_DESCRIPTION_LENGTH}
              </span>
            </label>

            <Button
              type="button"
              variant="secondary"
              className={styles.aiInlineButton}
              onClick={handleDescriptionSuggestion}
              disabled={aiLoadingTarget !== null}
              startIcon={<img src={lightbulbIcon} alt="" aria-hidden />}
            >
              {aiLoadingTarget === 'description'
                ? 'Выполняется запрос'
                : suggestedDescription || descriptionAiError
                  ? 'Повторить запрос'
                  : form.description.trim()
                    ? 'Улучшить описание'
                    : 'Придумать описание'}
            </Button>

            {suggestedDescription && (
              <section className={styles.aiResultCard}>
                <p className={styles.aiCardTitle}>Ответ AI:</p>
                <p className={styles.suggestionText}>{suggestedDescription}</p>
                <div className={styles.aiCardActions}>
                  <Button
                    type="button"
                    variant="secondary"
                    className={styles.applyButton}
                    onClick={() => {
                      updateForm({ description: suggestedDescription });
                    }}
                  >
                    Применить
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className={styles.closeAiCardButton}
                    onClick={() => {
                      setSuggestedDescription(null);
                    }}
                  >
                    Закрыть
                  </Button>
                </div>
              </section>
            )}

            {descriptionAiError && (
              <section className={styles.aiErrorCard}>
                <p className={styles.aiErrorTitle}>Произошла ошибка при запросе к AI</p>
                <p className={styles.aiErrorText}>{descriptionAiError}</p>
                <Button
                  type="button"
                  variant="secondary"
                  className={styles.closeAiCardButton}
                  onClick={() => {
                    setDescriptionAiError(null);
                  }}
                >
                  Закрыть
                </Button>
              </section>
            )}
          </section>

          <footer className={styles.actions}>
            <Button type="submit" disabled={status === 'saving'}>
              {status === 'saving' ? 'Сохранение...' : 'Сохранить'}
            </Button>
            <Button to={getViewPath(id)} variant="secondary">
              Отменить
            </Button>
          </footer>
        </form>
      </div>
    </main>
  );
}
