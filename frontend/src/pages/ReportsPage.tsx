import React from 'react';
import { Typography, Box } from '@mui/material';
import ReportBuilder from '../components/ReportBuilder';

const ReportsPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Report Builder
      </Typography>
      <ReportBuilder />
    </Box>
  );
};

export default ReportsPage;