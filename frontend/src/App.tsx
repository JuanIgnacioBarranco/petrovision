// ============================================================
// PetroVision — Application Root (Routes + Auth Guard)
// ============================================================

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import MainLayout from '@/components/layouts/MainLayout';
import Login from '@/components/modules/Login';
import Overview from '@/components/modules/Overview';
import ProcessView from '@/components/modules/ProcessView';
import InstrumentList from '@/components/modules/InstrumentList';
import AlarmConsole from '@/components/modules/AlarmConsole';
import TrendViewer from '@/components/modules/TrendViewer';
import BatchTracker from '@/components/modules/BatchTracker';
import MLDashboard from '@/components/modules/MLDashboard';
import PIDTuning from '@/components/modules/PIDTuning';
import AuditLog from '@/components/modules/AuditLog';
import ProcessFlowDiagram from '@/components/modules/ProcessFlowDiagram';
import WhatIfSimulator from '@/components/modules/WhatIfSimulator';
import Documentation from '@/components/modules/Documentation';
import DigitalTwin from '@/components/modules/DigitalTwin';
import SPCDashboard from '@/components/modules/SPCDashboard';
import ReportCenter from '@/components/modules/ReportCenter';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuth((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Overview />} />
        <Route path="process" element={<ProcessView />} />
        <Route path="pfd" element={<ProcessFlowDiagram />} />
        <Route path="simulator" element={<WhatIfSimulator />} />
        <Route path="docs" element={<Documentation />} />
        <Route path="digital-twin" element={<DigitalTwin />} />
        <Route path="instruments" element={<InstrumentList />} />
        <Route path="alarms" element={<AlarmConsole />} />
        <Route path="trends" element={<TrendViewer />} />
        <Route path="batches" element={<BatchTracker />} />
        <Route path="ml" element={<MLDashboard />} />
        <Route path="pid" element={<PIDTuning />} />
        <Route path="audit" element={<AuditLog />} />
        <Route path="spc" element={<SPCDashboard />} />
        <Route path="reports" element={<ReportCenter />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
