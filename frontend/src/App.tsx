import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import UdfsPage from './pages/UdfsPage';
import ReportsPage from './pages/ReportsPage';
import { UdfProvider } from './context/UdfContext';
import { ReportProvider } from './context/ReportContext';

const App: React.FC = () => {
  return (
    <Router>
      <UdfProvider>
        <ReportProvider>
          <MainLayout>
            <Routes>
              <Route path="/" element={<UdfsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
            </Routes>
          </MainLayout>
        </ReportProvider>
      </UdfProvider>
    </Router>
  );
};

export default App;