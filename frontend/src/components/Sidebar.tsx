import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Box, List, ListItem, ListItemButton, ListItemText, Typography, Divider } from '@mui/material';

const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <Box sx={{ width: 240, borderRight: '1px solid #ddd', height: '100vh' }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" component="div">
          UDF & Report Builder
        </Typography>
      </Box>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton 
            component={Link} 
            to="/" 
            selected={location.pathname === '/'}
          >
            <ListItemText primary="UDF Builder" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton 
            component={Link} 
            to="/reports" 
            selected={location.pathname === '/reports'}
          >
            <ListItemText primary="Report Builder" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );
};

export default Sidebar;