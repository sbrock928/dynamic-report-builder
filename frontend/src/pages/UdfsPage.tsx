import React from 'react';
import { Typography, Box } from '@mui/material';
import UdfBuilder from '../components/UdfBuilder';

const UdfsPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        UDF Builder
      </Typography>
      <UdfBuilder />
    </Box>
  );
};

export default UdfsPage;