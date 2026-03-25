import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import editIcon from '@/assets/Edit.svg';
import exclamationCircle from '@/assets/exclamation-circle.svg';
import placeholderImage from '@/assets/placeholder-image.png';
import { API_BASE_URL } from '@/shared/config/api';
import { AppRoute, getEditPath } from '@/shared/config/routes';
import { Button } from '@/shared/ui/button/Button';
import styles from './ViewPage.module.css';

type Category = 'auto' | 'electronics' | 'real_estate';

type DetailItem = {
  id: number;
  title: string;
  category: Category;
  description?: string;
  price: number | null;
  createdAt: string;
  updatedAt: string;
  params: Record<string, unknown>;
  needsRevision: boolean;
};

const PARAM_LABELS: Record<Category, Record<string, string>> = {
  auto: {
    brand: 'Бренд',
    model: 'Модель',
    yearOfManufacture: 'Год выпуска',
    transmission: 'КПП',
    mileage: 'Пробег',
    enginePower: 'Мощность',
  },
  electronics: {
    type: 'Тип',
    brand: 'Бренд',
    model: 'Модель',
    condition: 'Состояние',
    color: 'Цвет',
  },
  real_estate: {
    type: 'Тип',
    address: 'Адрес',
    area: 'Площадь',
    floor: 'Этаж',
  },
};

const PARAM_VALUE_LABELS: Record<string, Record<string, string>> = {
  transmission: {
    automatic: 'Автоматическая',
    manual: 'Механическая',
  },
  type: {
    phone: 'Телефон',
    laptop: 'Ноутбук',
    misc: 'Другое',
    flat: 'Квартира',
    house: 'Дом',
    room: 'Комната',
  },
  condition: {
    new: 'Новый',
    used: 'Б/у',
  },
};

const formatPrice = (price: number | null): string => {
  if (price === null) {
    return 'Цена не указана';
  }

  return `${price.toLocaleString('ru-RU')} ₽`;
};

const formatDateTime = (value: string): string =>
  new Date(value).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

const formatParamValue = (value: unknown, key?: string): string => {
  if (typeof value === 'string') {
    if (key) {
      return PARAM_VALUE_LABELS[key]?.[value] ?? value;
    }

    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'Да' : 'Нет';
  }

  return '';
};

const getMissingFieldLabels = (item: DetailItem): string[] => {
  const requiredByCategory: Record<Category, string[]> = {
    auto: ['brand', 'model', 'yearOfManufacture', 'transmission', 'mileage', 'enginePower'],
    electronics: ['type', 'brand', 'model', 'condition', 'color'],
    real_estate: ['type', 'address', 'area', 'floor'],
  };

  const missing: string[] = [];

  if (!item.description?.trim()) {
    missing.push('Описание');
  }

  const labelMap = PARAM_LABELS[item.category];

  for (const key of requiredByCategory[item.category]) {
    const rawValue = item.params[key];
    const formatted = formatParamValue(rawValue, key).trim();

    if (!formatted) {
      missing.push(labelMap[key] ?? key);
    }
  }

  return missing;
};

export function ViewPage() {
  const { id = '' } = useParams();
  const [item, setItem] = useState<DetailItem | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let isCurrentRequest = true;

    const loadItem = async () => {
      setStatus('loading');
      setErrorMessage(null);

      try {
        const response = await fetch(`${API_BASE_URL}/items/${id}`, {
          signal: controller.signal,
        });

        if (response.status === 404) {
          if (!isCurrentRequest) {
            return;
          }

          setItem(null);
          setErrorMessage('Объявление не найдено.');
          setStatus('error');
          return;
        }

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = (await response.json()) as DetailItem;
        if (!isCurrentRequest) {
          return;
        }

        setItem(data);
        setStatus('success');
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }

        if (!isCurrentRequest) {
          return;
        }

        setItem(null);
        setErrorMessage('Не удалось загрузить карточку объявления.');
        setStatus('error');
      }
    };

    if (!id) {
      setItem(null);
      setErrorMessage('Некорректный идентификатор объявления.');
      setStatus('error');
      return;
    }

    void loadItem();

    return () => {
      isCurrentRequest = false;
      controller.abort();
    };
  }, [id]);

  const visibleCharacteristics = useMemo(() => {
    if (!item) {
      return [];
    }

    const labels = PARAM_LABELS[item.category];

    return Object.entries(item.params)
      .map(([key, rawValue]) => ({
        key,
        label: labels[key] ?? key,
        value: formatParamValue(rawValue, key),
      }))
      .filter((entry) => Boolean(entry.value.trim()));
  }, [item]);

  const missingFields = useMemo(() => {
    if (!item || !item.needsRevision) {
      return [];
    }

    return getMissingFieldLabels(item);
  }, [item]);

  if (status === 'loading') {
    return <main className={styles.state}>Загрузка карточки объявления...</main>;
  }

  if (status === 'error' || !item) {
    return (
      <main className={styles.state}>
        <p className={styles.errorText}>{errorMessage ?? 'Объявление не найдено.'}</p>
        <Link to={AppRoute.List} className={styles.backLink}>
          Вернуться к списку
        </Link>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.canvas}>
        <Button to={AppRoute.List} variant="secondary" className={styles.backToListButton}>
          К объявлениям
        </Button>

        <section className={styles.topBlock}>
          <div className={styles.titlePriceRow}>
            <h1 className={styles.title}>{item.title}</h1>
            <p className={styles.price}>{formatPrice(item.price)}</p>
          </div>

          <div className={styles.metaRow}>
            <Button to={getEditPath(item.id)} size="edit" endIcon={<img src={editIcon} alt="" aria-hidden />}>
              Редактировать
            </Button>

            <div className={styles.meta}>
              <p className={styles.dateLine}>Опубликовано: {formatDateTime(item.createdAt)}</p>
              {item.updatedAt !== item.createdAt && (
                <p className={styles.dateLine}>Отредактировано: {formatDateTime(item.updatedAt)}</p>
              )}
            </div>
          </div>
        </section>

        <div className={styles.divider} aria-hidden />

        <section className={styles.mainBlock}>
          <div className={styles.mediaBlock}>
            <div className={styles.photoBox}>
              <img className={styles.photoImage} src={placeholderImage} alt="Фотография объявления" />
            </div>

            <div className={styles.descriptionBlock}>
              <h2 className={styles.blockTitle}>Описание</h2>
              <p className={styles.descriptionText}>{item.description?.trim() || 'Отсутствует'}</p>
            </div>
          </div>

          <div className={styles.detailsBlock}>
            {item.needsRevision && missingFields.length > 0 && (
              <section className={styles.warningBox}>
                <div className={styles.warningHeader}>
                  <img className={styles.warningIconImage} src={exclamationCircle} alt="" aria-hidden />
                  <h3 className={styles.warningTitle}>Требуются доработки</h3>
                </div>
                <p className={styles.warningSubtitle}>У объявления не заполнены поля:</p>
                <ul className={styles.warningList}>
                  {missingFields.map((field) => (
                    <li key={field}>{field}</li>
                  ))}
                </ul>
              </section>
            )}

            <section className={styles.charsBlock}>
              <h2 className={styles.blockTitle}>Характеристики</h2>
              {visibleCharacteristics.length > 0 ? (
                <dl className={styles.charList}>
                  {visibleCharacteristics.map((entry) => (
                    <div className={styles.charRow} key={entry.key}>
                      <dt className={styles.charName}>{entry.label}</dt>
                      <dd className={styles.charValue}>{entry.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className={styles.descriptionText}>Нет заполненных характеристик.</p>
              )}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
