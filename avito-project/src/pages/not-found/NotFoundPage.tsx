import { Link } from 'react-router-dom';
import { AppRoute } from '@/shared/config/routes';
import { PageContainer } from '@/shared/ui/page-container/PageContainer';

export function NotFoundPage() {
  return (
    <PageContainer title="Страница не найдена">
      <Link to={AppRoute.List}>Перейти к списку объявлений</Link>
    </PageContainer>
  );
}
