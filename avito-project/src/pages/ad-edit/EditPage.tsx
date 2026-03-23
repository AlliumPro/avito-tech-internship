import { Link, useParams } from 'react-router-dom';
import { AppRoute, getViewPath } from '@/shared/config/routes';
import { PageContainer } from '@/shared/ui/page-container/PageContainer';

export function EditPage() {
  const { id = '' } = useParams();

  return (
    <PageContainer title={`Редактирование объявления #${id}`}>
      <p>Каркас страницы редактирования. Здесь будет форма и AI-инструменты.</p>
      <p >
        <Link to={getViewPath(id)}>Отменить и вернуться к карточке</Link>
      </p>
      <p >
        <Link to={AppRoute.List}>Назад к списку</Link>
      </p>
    </PageContainer>
  );
}
