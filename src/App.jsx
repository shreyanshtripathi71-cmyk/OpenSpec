import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ConfiguratorPage from './ConfiguratorPage';

/* ══════════════════════════════════════════════════════════════
   APP — Minimal router
   ══════════════════════════════════════════════════════════════
   Only the 3D configurator is a React SPA page.
   All other pages are self-contained HTML files served from public/.
   React Router handles the configurator route; everything else
   redirects to the appropriate static HTML. */

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* The only React page — our 3D window configurator */}
        <Route path="/quotes/:quoteId/configurator" element={<ConfiguratorPage />} />

        {/* Redirect everything else to static HTML pages */}
        <Route path="/" element={<Redirect to="/landing/" />} />
        <Route path="/login" element={<Redirect to="/login/" />} />
        <Route path="/master-admin" element={<Redirect to="/master-login/" />} />
        <Route path="/factory" element={<Redirect to="/factory/" />} />

        {/* All sales routes → the OpenSpec sales portal */}
        <Route path="/dashboard" element={<Redirect to="/sales/" />} />
        <Route path="/quotes" element={<Redirect to="/sales/" />} />
        <Route path="/quotes/:quoteId" element={<Redirect to="/sales/" />} />
        <Route path="/orders" element={<Redirect to="/sales/" />} />
        <Route path="/customers" element={<Redirect to="/sales/" />} />
        <Route path="/catalog" element={<Redirect to="/sales/" />} />
        <Route path="/calendar" element={<Redirect to="/sales/" />} />
        <Route path="/commissions" element={<Redirect to="/sales/" />} />
        <Route path="/settings" element={<Redirect to="/sales/" />} />
        <Route path="/help" element={<Redirect to="/sales/" />} />

        {/* Catch-all → landing */}
        <Route path="*" element={<Redirect to="/landing/" />} />
      </Routes>
    </BrowserRouter>
  );
}

/* Simple redirect to a static HTML file */
function Redirect({ to }) {
  window.location.replace(to);
  return null;
}
