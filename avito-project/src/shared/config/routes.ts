export const AppRoute = {
  List: '/ads',
  View: '/ads/:id',
  Edit: '/ads/:id/edit',
} as const;

export const getViewPath = (id: string | number): string => `/ads/${id}`;

export const getEditPath = (id: string | number): string => `/ads/${id}/edit`;
