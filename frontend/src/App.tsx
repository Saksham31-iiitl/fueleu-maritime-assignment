import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppLayout from './adapters/ui/layouts/AppLayout';
import DashboardPage from './adapters/ui/pages/DashboardPage';
import RoutesPage from './adapters/ui/pages/RoutesPage';
import ComparePage from './adapters/ui/pages/ComparePage';
import BankingPage from './adapters/ui/pages/BankingPage';
import PoolingPage from './adapters/ui/pages/PoolingPage';
import AnalyticsPage from './adapters/ui/pages/AnalyticsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/routes" element={<RoutesPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/banking" element={<BankingPage />} />
            <Route path="/pooling" element={<PoolingPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
