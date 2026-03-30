import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';

import './assets/font/pretendardvariable.css';
import './assets/style/index.scss';
import { router } from './router/router.tsx';

import ErrorBoundary from './components/layout/error-boundary.tsx';
import { InnogridUIProvider } from '@innogrid/ui';
import { ReactQueryProvider } from './components/provider/react-query-provider.tsx';
import { ToastProvider } from './components/ui/toast.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <InnogridUIProvider language={'ko'} theme={'cloudit'}>
      <ErrorBoundary>
        <ReactQueryProvider>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </ReactQueryProvider>
      </ErrorBoundary>
    </InnogridUIProvider>
  </StrictMode>
);
