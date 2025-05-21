import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  Button
} from '@mui/material';

interface ReportDataTableProps {
  data: Record<string, any>[];
  fields: string[];
  onExport?: () => void;
}

const ReportDataTable: React.FC<ReportDataTableProps> = ({ data, fields, onExport }) => {
  if (!data.length) {
    return (
      <Typography color="text.secondary">
        No data available. Run the report to see results.
      </Typography>
    );
  }

  return (
    <Box>
      {onExport && (
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="outlined" 
            onClick={onExport}
            disabled={data.length === 0}
          >
            Export to CSV
          </Button>
        </Box>
      )}
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {fields.map((field) => (
                <TableCell key={field}>{field}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {fields.map((field) => (
                  <TableCell key={field}>{row[field]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ReportDataTable;