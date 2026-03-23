export type Category = 'auto' | 'electronics' | 'real_estate';

export type Layout = 'grid' | 'list';

export type AdListItem = {
  id: number;
  title: string;
  price: number | null;
  category: Category;
  needsRevision: boolean;
};
