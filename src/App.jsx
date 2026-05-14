import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import ConfiguratorPage from './ConfiguratorPage';
import {
  CalendarPage,
  CatalogPage,
  CommissionsPage,
  CustomersPage,
  DashboardPage,
  HelpPage,
  OrdersPage,
  QuoteDetailPage,
  QuotesPage,
  SalesShell,
  SettingsPage,
} from './SalesPages';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route element={<SalesShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/quotes" element={<QuotesPage />} />
          <Route path="/quotes/:quoteId" element={<QuoteDetailPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/commissions" element={<CommissionsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/help" element={<HelpPage />} />
        </Route>
        <Route path="/quotes/:quoteId/configurator" element={<ConfiguratorPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
