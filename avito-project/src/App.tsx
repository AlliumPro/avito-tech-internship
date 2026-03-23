import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from '@/app/providers/router/AppRouter';

export default function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}
