import { Link } from 'react-router-dom';
import { getViewPath } from '@/shared/config/routes';
import placeholderImage from '@/assets/placeholder-image.png';
import type { AdListItem, Category, Layout } from './types';
import styles from './ListCard.module.css';

const CATEGORY_LABEL: Record<Category, string> = {
  auto: 'Авто',
  electronics: 'Электроника',
  real_estate: 'Недвижимость',
};

const formatPrice = (price: number | null): string => {
  if (price === null) {
    return 'Цена не указана';
  }

  return `${price.toLocaleString('ru-RU')} ₽`;
};

type ListCardProps = {
  ad: AdListItem;
  layout: Layout;
};

export function ListCard({ ad, layout }: ListCardProps) {
  const isGrid = layout === 'grid';
  const bodyClassName = isGrid ? styles.cardBodyGrid : styles.cardBodyList;
  const tagClassName = isGrid ? styles.categoryTagGrid : styles.categoryTagList;

  return (
    <Link to={getViewPath(ad.id)} className={isGrid ? styles.cardGrid : styles.cardList}>
      <div className={isGrid ? styles.photoGrid : styles.photoList} aria-hidden>
        <img className={styles.photoImage} src={placeholderImage} alt="" />
      </div>

      <div className={bodyClassName}>
        <span className={tagClassName}>{CATEGORY_LABEL[ad.category]}</span>
        <div className={styles.cardMain}>
          <h3 className={styles.cardTitle}>{ad.title}</h3>
          <p className={styles.price}>{formatPrice(ad.price)}</p>
        </div>

        {ad.needsRevision && (
          <span className={styles.revisionBadge}>
            <span className={styles.revisionDot} />
            Требует доработок
          </span>
        )}
      </div>
    </Link>
  );
}
