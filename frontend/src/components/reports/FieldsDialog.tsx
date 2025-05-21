import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Checkbox,
  FormControlLabel,
  Divider,
  Grid
} from '@mui/material';
import { UDF, UDFField } from '../../types';

interface FieldsDialogProps {
  open: boolean;
  onClose: () => void;
  udfs: UDF[];
  selectedFields: string[];
  onFieldsChange: (fields: string[]) => void;
}

const FieldsDialog: React.FC<FieldsDialogProps> = ({
  open,
  onClose,
  udfs,
  selectedFields,
  onFieldsChange
}) => {
  const [localSelectedFields, setLocalSelectedFields] = useState<string[]>(selectedFields);

  const handleFieldToggle = (fieldName: string) => {
    setLocalSelectedFields(prev => {
      if (prev.includes(fieldName)) {
        return prev.filter(f => f !== fieldName);
      } else {
        return [...prev, fieldName];
      }
    });
  };

  const handleSelectAllFields = () => {
    const allFields: string[] = [];
    
    // Get fields from all UDFs
    udfs.forEach(udf => {
      udf.fields.forEach(field => {
        allFields.push(`${udf.name}.${field.name}`);
      });
    });
    
    setLocalSelectedFields(allFields);
  };

  const handleDeselectAllFields = () => {
    setLocalSelectedFields([]);
  };

  const handleSave = () => {
    onFieldsChange(localSelectedFields);
    onClose();
  };

  // Group fields by UDF
  const getFieldsByUdf = () => {
    const fieldGroups: Record<string, UDFField[]> = {};
    
    udfs.forEach(udf => {
      fieldGroups[udf.name] = udf.fields;
    });
    
    return fieldGroups;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Select Fields to Include</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2, mt: 1 }}>
          <Button variant="outlined" size="small" onClick={handleSelectAllFields}>
            Select All
          </Button>
          <Button variant="outlined" size="small" onClick={handleDeselectAllFields} sx={{ ml: 1 }}>
            Deselect All
          </Button>
        </Box>
        <Divider sx={{ mb: 2 }} />
        
        {Object.entries(getFieldsByUdf()).map(([udfName, fields]) => (
          <Box key={udfName} sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
              {udfName}
            </Typography>
            <Grid container spacing={1}>
              {fields.map((field) => {
                const fieldFullName = `${udfName}.${field.name}`;
                
                return (
                  <Grid item xs={12} sm={6} key={fieldFullName}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={localSelectedFields.includes(fieldFullName)}
                          onChange={() => handleFieldToggle(fieldFullName)}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body1">{field.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {field.type}
                            {field.description ? ` - ${field.description}` : ''}
                            {field.calculation_type ? ` (${field.calculation_type})` : ''}
                          </Typography>
                        </Box>
                      }
                      sx={{ display: 'block', mb: 1 }}
                    />
                  </Grid>
                );
              })}
            </Grid>
            <Divider sx={{ my: 2 }} />
          </Box>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FieldsDialog;