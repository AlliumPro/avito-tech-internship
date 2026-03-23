import { Navigate, Route, Routes } from 'react-router-dom';
import { AppRoute } from '@/shared/config/routes';
import { EditPage } from '@/pages/ad-edit/EditPage';
import { ListPage } from '@/pages/ads-list/ListPage';
import { ViewPage } from '@/pages/ad-view/ViewPage';
import { NotFoundPage } from '@/pages/not-found/NotFoundPage';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={AppRoute.List} replace />} />
      <Route path={AppRoute.List} element={<ListPage />} />
      <Route path={AppRoute.View} element={<ViewPage />} />
      <Route path={AppRoute.Edit} element={<EditPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
