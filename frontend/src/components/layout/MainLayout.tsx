import React from 'react';
import { Box, CssBaseline } from '@mui/material';
import Sidebar from '../Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, height: '100vh', overflow: 'auto', p: 3 }}>
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;