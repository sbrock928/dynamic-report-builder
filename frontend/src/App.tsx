import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import Sidebar from './components/Sidebar';
import SchemaBuilder from './components/SchemaBuilder';
import ReportBuilder from './components/ReportBuilder';

const App: React.FC = () => {
  return (
    <Router>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <Sidebar />
        <Box component="main" sx={{ flexGrow: 1, height: '100vh', overflow: 'auto' }}>
          <Routes>
            <Route path="/" element={<SchemaBuilder />} />
            <Route path="/reports" element={<ReportBuilder />} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
};

export default App;