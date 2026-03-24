/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuth } from '@/src/hooks/useAuth';
import { Sidebar } from '@/src/components/Sidebar';
import { OrderDashboard } from '@/src/components/OrderDashboard';
import { ExpeditionForm } from '@/src/components/ExpeditionForm';
import { Athletes } from '@/src/components/Athletes';
import { Teams } from '@/src/components/Teams';
import { Matches } from '@/src/components/Matches';
import { Login } from '@/src/components/Login';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Carregando Arena Manager...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-4 lg:ml-64 lg:p-8">
        <div className="mx-auto max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <OrderDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/alimentar"
          element={
            <PrivateRoute>
              <ExpeditionForm />
            </PrivateRoute>
          }
        />
        <Route
          path="/atletas"
          element={
            <PrivateRoute>
              <Athletes />
            </PrivateRoute>
          }
        />
        <Route
          path="/times"
          element={
            <PrivateRoute>
              <Teams />
            </PrivateRoute>
          }
        />
        <Route
          path="/partidas"
          element={
            <PrivateRoute>
              <Matches />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

