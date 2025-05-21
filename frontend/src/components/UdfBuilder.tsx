import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  TextField,
  Paper,
  Grid,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  FormHelperText,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Divider,
} from '@mui/material';
import Form from '@rjsf/mui';
import validator from '@rjsf/validator-ajv8';
import { 
  getUdfs, 
  createUdf, 
  updateUdf, 
  deleteUdf, 
  getPydanticCode,
  getAvailableModels,
  getModelFields
} from '../api/api';
import { 
  UDF, 
  UDFField, 
  ModelInfo, 
  ModelField,
  CalculationType,
  AggregationLevel
} from '../types';

interface UdfBuilderFormSchema {  // Changed from SchemaBuilderFormSchema
  name: string;
  description?: string;
  base_model: string;
  aggregation_level: AggregationLevel;
  fields: UDFField[];  // Changed from SchemaField
}
interface FieldDialogProps {
  open: boolean;
  field: UDFField | null;
  modelFields: ModelField[];
  onClose: () => void;
  onSave: (field: UDFField) => void;
}

const fieldTypes = [
  { value: 'string', label: 'String' },
  { value: 'integer', label: 'Integer' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'array', label: 'Array' },
  { value: 'object', label: 'Object' },
];

const calculationTypes = [
  { value: 'sum', label: 'Sum' },
  { value: 'average', label: 'Average' },
  { value: 'count', label: 'Count' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
  { value: 'custom', label: 'Custom Formula' },
];

const FieldDialog: React.FC<FieldDialogProps> = ({ open, field, modelFields, onClose, onSave }) => {
  const [fieldData, setFieldData] = useState<UDFField>({
    name: '',
    type: 'string',
    description: '',
    required: false,
    source_field: undefined,
    calculation_type: undefined,
    calculation_params: {},
    default: undefined,
    enum_values: undefined,
  });

  useEffect(() => {
    if (field) {
      setFieldData({ ...field });
    } else {
      setFieldData({
        name: '',
        type: 'string',
        description: '',
        required: false,
        source_field: undefined,
        calculation_type: undefined,
        calculation_params: {},
        default: undefined,
        enum_values: undefined,
      });
    }
  }, [field]);

  const handleSave = () => {
    onSave(fieldData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{field ? 'Edit Field' : 'Add Field'}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Field Name"
                value={fieldData.name}
                onChange={(e) => setFieldData({ ...fieldData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Field Type</InputLabel>
                <Select
                  value={fieldData.type}
                  label="Field Type"
                  onChange={(e) => setFieldData({ ...fieldData, type: e.target.value })}
                >
                  {fieldTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={fieldData.required}
                      onChange={(e) => setFieldData({ ...fieldData, required: e.target.checked })}
                    />
                  }
                  label="Required"
                />
              </FormGroup>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={fieldData.description || ''}
                onChange={(e) => setFieldData({ ...fieldData, description: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Typography variant="subtitle2">Calculation Settings</Typography>
              </Divider>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Source Field</InputLabel>
                <Select
                  value={fieldData.source_field || ''}
                  label="Source Field"
                  onChange={(e) => setFieldData({ ...fieldData, source_field: e.target.value })}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {modelFields.map((modelField) => (
                    <MenuItem key={modelField.name} value={modelField.name}>
                      {modelField.name} ({modelField.type})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Calculation Type</InputLabel>
                <Select
                  value={fieldData.calculation_type || ''}
                  label="Calculation Type"
                  onChange={(e) => setFieldData({ 
                    ...fieldData, 
                    calculation_type: e.target.value as CalculationType,
                    calculation_params: e.target.value === 'custom' ? { formula: '' } : {}
                  })}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {calculationTypes.map((calcType) => (
                    <MenuItem key={calcType.value} value={calcType.value}>
                      {calcType.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {fieldData.calculation_type === 'custom' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Custom Formula"
                  value={fieldData.calculation_params?.formula || ''}
                  onChange={(e) => setFieldData({ 
                    ...fieldData, 
                    calculation_params: { ...fieldData.calculation_params, formula: e.target.value } 
                  })}
                  multiline
                  rows={2}
                  helperText="Enter SQL-like formula, e.g., 'amount * 0.75' or 'MAX(amount, 1000)'"
                />
              </Grid>
            )}
            
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Typography variant="subtitle2">Additional Settings</Typography>
              </Divider>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Default Value"
                value={fieldData.default || ''}
                onChange={(e) => setFieldData({ ...fieldData, default: e.target.value })}
              />
            </Grid>
            
            {fieldData.type === 'string' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Enum Values (comma separated)"
                  value={fieldData.enum_values ? fieldData.enum_values.join(', ') : ''}
                  onChange={(e) =>
                    setFieldData({
                      ...fieldData,
                      enum_values: e.target.value ? e.target.value.split(',').map((v) => v.trim()) : undefined,
                    })
                  }
                  helperText="Enter comma-separated values for enum type"
                />
              </Grid>
            )}
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          {field ? 'Update' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const UdfBuilder: React.FC = () => {
  const [udfs, setUdfs] = useState<UDF[]>([]);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [modelFields, setModelFields] = useState<ModelField[]>([]);
  const [selectedUdf, setSelectedUdf] = useState<UDF | null>(null);
  const [isCreating, setIsCreating] = useState(true);
  const [udfName, setUdfName] = useState('');
  const [udfDescription, setUdfDescription] = useState('');
  const [selectedBaseModel, setSelectedBaseModel] = useState('');
  const [selectedAggregationLevel, setSelectedAggregationLevel] = useState<AggregationLevel | ''>('');
  const [fields, setFields] = useState<UDFField[]>([]);
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [currentField, setCurrentField] = useState<UDFField | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [pydanticCode, setPydanticCode] = useState('');
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [loadedUdfs, loadedModels] = await Promise.all([
        getUdfs(),
        getAvailableModels()
      ]);
      setUdfs(loadedUdfs);
      setModels(loadedModels);
    } catch (error) {
      console.error('Failed to load data:', error);
      setSnackbarMessage('Failed to load data');
      setSnackbarOpen(true);
    }
  };

  const loadModelFields = async (modelId: string) => {
    try {
      const fields = await getModelFields(modelId);
      setModelFields(fields);
    } catch (error) {
      console.error('Failed to load model fields:', error);
      setSnackbarMessage('Failed to load model fields');
      setSnackbarOpen(true);
    }
  };

  const handleUdfSelect = async (udfId: number) => {
    const udf = udfs.find((s) => s.id === udfId);
    if (udf) {
      setSelectedUdf(udf);
      setUdfName(udf.name);
      setUdfDescription(udf.description || '');
      setSelectedBaseModel(udf.base_model);
      setSelectedAggregationLevel(udf.aggregation_level);
      setFields(udf.fields || []);
      setIsCreating(false);
      
      // Load model fields for the selected base model
      if (udf.base_model) {
        await loadModelFields(udf.base_model);
      }
    }
  };

  const handleBaseModelChange = async (modelId: string) => {
    setSelectedBaseModel(modelId);
    await loadModelFields(modelId);
  };

  const handleNewUdf = () => {
    setSelectedUdf(null);
    setUdfName('');
    setUdfDescription('');
    setSelectedBaseModel('');
    setSelectedAggregationLevel('');
    setFields([]);
    setModelFields([]);
    setIsCreating(true);
  };

  const handleSaveUdf = async () => {
    try {
      if (!selectedBaseModel) {
        setSnackbarMessage('Please select a base model');
        setSnackbarOpen(true);
        return;
      }
      
      if (!selectedAggregationLevel) {
        setSnackbarMessage('Please select an aggregation level');
        setSnackbarOpen(true);
        return;
      }
      
      const udfData: UdfBuilderFormSchema = {
        name: udfName,
        description: udfDescription,
        base_model: selectedBaseModel,
        aggregation_level: selectedAggregationLevel as AggregationLevel,
        fields: fields,
      };

      let savedUdf;
      if (isCreating) {
        savedUdf = await createUdf(udfData);
        setSnackbarMessage('UDF created successfully');
      } else if (selectedUdf) {
        savedUdf = await updateUdf(selectedUdf.id, udfData);
        setSnackbarMessage('UDF updated successfully');
      }

      setSnackbarOpen(true);
      loadData();

      if (savedUdf) {
        setSelectedUdf(savedUdf);
        setIsCreating(false);
      }
    } catch (error) {
      console.error('Failed to save UDF:', error);
      setSnackbarMessage('Failed to save UDF');
      setSnackbarOpen(true);
    }
  };

  const handleDeleteUdf = async () => {
    if (selectedUdf && window.confirm('Are you sure you want to delete this UDF?')) {
      try {
        await deleteUdf(selectedUdf.id);
        setSnackbarMessage('UDF deleted successfully');
        setSnackbarOpen(true);
        loadData();
        handleNewUdf();
      } catch (error) {
        console.error('Failed to delete UDF:', error);
        setSnackbarMessage('Failed to delete UDF');
        setSnackbarOpen(true);
      }
    }
  };

  const handleAddField = () => {
    setCurrentField(null);
    setFieldDialogOpen(true);
  };

  const handleEditField = (index: number) => {
    setCurrentField(fields[index]);
    setFieldDialogOpen(true);
  };

  const handleDeleteField = (index: number) => {
    const newFields = [...fields];
    newFields.splice(index, 1);
    setFields(newFields);
  };

  const handleFieldSave = (field: UDFField) => {
    if (currentField) {
      // Edit existing field
      const index = fields.findIndex((f) => f.name === currentField.name);
      if (index !== -1) {
        const newFields = [...fields];
        newFields[index] = field;
        setFields(newFields);
      }
    } else {
      // Add new field
      setFields([...fields, field]);
    }
    setFieldDialogOpen(false);
  };

  const handleShowPydanticCode = async () => {
    if (selectedUdf) {
      try {
        const code = await getPydanticCode(selectedUdf.id);
        setPydanticCode(code);
        setCodeDialogOpen(true);
      } catch (error) {
        console.error('Failed to get Pydantic code:', error);
        setSnackbarMessage('Failed to get Pydantic code');
        setSnackbarOpen(true);
      }
    }
  };

  // Create a JSON Schema for the form preview
  const createJsonSchema = () => {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    fields.forEach((field) => {
      let fieldSchema: Record<string, any> = {};

      switch (field.type) {
        case 'string':
          fieldSchema.type = 'string';
          break;
        case 'integer':
          fieldSchema.type = 'integer';
          break;
        case 'number':
          fieldSchema.type = 'number';
          break;
        case 'boolean':
          fieldSchema.type = 'boolean';
          break;
        case 'array':
          fieldSchema.type = 'array';
          fieldSchema.items = { type: 'string' };
          break;
        case 'object':
          fieldSchema.type = 'object';
          fieldSchema.properties = {};
          break;
        default:
          fieldSchema.type = 'string';
      }

      if (field.description) {
        fieldSchema.description = field.description;
      }

      if (field.default !== undefined) {
        fieldSchema.default = field.default;
      }

      if (field.enum_values && field.enum_values.length > 0) {
        fieldSchema.enum = field.enum_values;
      }

      // Add calculation info to description if available
      if (field.calculation_type) {
        const calcDesc = field.source_field 
          ? `Calculation: ${field.calculation_type} of ${field.source_field}` 
          : `Calculation: ${field.calculation_type}`;
        
        if (fieldSchema.description) {
          fieldSchema.description += ` (${calcDesc})`;
        } else {
          fieldSchema.description = calcDesc;
        }
      }

      properties[field.name] = fieldSchema;

      if (field.required) {
        required.push(field.name);
      }
    });

    return {
      type: 'object',
      properties,
      required,
    };
  };

  return (
    <Box sx={{ p: 3, maxWidth: '100%' }}>
      <Typography variant="h4" gutterBottom>
        UDF Builder
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="udf-select-label">Select UDF</InputLabel>
              <Select
                labelId="udf-select-label"
                value={selectedUdf ? selectedUdf.id : ''}
                label="Select UDF"
                onChange={(e) => handleUdfSelect(Number(e.target.value))}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {udfs.map((udf) => (
                  <MenuItem key={udf.id} value={udf.id}>
                    {udf.name} ({udf.aggregation_level} level)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" color="primary" onClick={handleNewUdf}>
                New UDF
              </Button>
              {selectedUdf && (
                <>
                  <Button variant="outlined" color="error" onClick={handleDeleteUdf}>
                    Delete
                  </Button>
                  <Button variant="outlined" onClick={handleShowPydanticCode}>
                    View Pydantic Code
                  </Button>
                </>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          UDF Definition
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="UDF Name"
              value={udfName}
              onChange={(e) => setUdfName(e.target.value)}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Description"
              value={udfDescription}
              onChange={(e) => setUdfDescription(e.target.value)}
              margin="normal"
              multiline
              rows={1}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="base-model-label">Base Model</InputLabel>
              <Select
                labelId="base-model-label"
                value={selectedBaseModel}
                label="Base Model"
                onChange={(e) => handleBaseModelChange(e.target.value)}
                disabled={!isCreating && selectedUdf !== null}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {models.map((model) => (
                  <MenuItem key={model.id} value={model.id}>
                    {model.name} {model.description ? `- ${model.description}` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth margin="normal" required>
              <InputLabel id="aggregation-level-label">Aggregation Level</InputLabel>
              <Select
                labelId="aggregation-level-label"
                value={selectedAggregationLevel}
                label="Aggregation Level"
                onChange={(e) => setSelectedAggregationLevel(e.target.value as AggregationLevel)}
                disabled={!isCreating && selectedUdf !== null} // Only disable when editing an existing UDF
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                <MenuItem value="deal">Deal Level</MenuItem>
                <MenuItem value="group">Group Level</MenuItem>
                <MenuItem value="tranche">Tranche Level</MenuItem>
              </Select>
              <FormHelperText>
                Defines the granularity of this UDF. Different aggregation levels can be based on the same model.
              </FormHelperText>
            </FormControl>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Fields</Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleAddField}
              disabled={!selectedBaseModel}
            >
              Add Field
            </Button>
          </Box>
          {fields.length === 0 ? (
            <Typography color="text.secondary">
              {!selectedBaseModel 
                ? "Select a base model first, then add fields." 
                : "No fields defined yet. Click \"Add Field\" to start."}
            </Typography>
          ) : (
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
              <Box component="thead">
                <Box component="tr" sx={{ borderBottom: '1px solid #ddd' }}>
                  <Box component="th" sx={{ textAlign: 'left', p: 1 }}>
                    Name
                  </Box>
                  <Box component="th" sx={{ textAlign: 'left', p: 1 }}>
                    Type
                  </Box>
                  <Box component="th" sx={{ textAlign: 'left', p: 1 }}>
                    Required
                  </Box>
                  <Box component="th" sx={{ textAlign: 'left', p: 1 }}>
                    Calculation
                  </Box>
                  <Box component="th" sx={{ textAlign: 'left', p: 1 }}>
                    Source Field
                  </Box>
                  <Box component="th" sx={{ textAlign: 'right', p: 1 }}>
                    Actions
                  </Box>
                </Box>
              </Box>
              <Box component="tbody">
                {fields.map((field, index) => (
                  <Box key={index} component="tr" sx={{ borderBottom: '1px solid #ddd' }}>
                    <Box component="td" sx={{ p: 1 }}>
                      {field.name}
                    </Box>
                    <Box component="td" sx={{ p: 1 }}>
                      {field.type}
                    </Box>
                    <Box component="td" sx={{ p: 1 }}>
                      {field.required ? 'Yes' : 'No'}
                    </Box>
                    <Box component="td" sx={{ p: 1 }}>
                      {field.calculation_type || '-'}
                    </Box>
                    <Box component="td" sx={{ p: 1 }}>
                      {field.source_field || '-'}
                    </Box>
                    <Box component="td" sx={{ p: 1, textAlign: 'right' }}>
                      <Button size="small" onClick={() => handleEditField(index)}>
                        Edit
                      </Button>
                      <Button size="small" color="error" onClick={() => handleDeleteField(index)}>
                        Delete
                      </Button>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSaveUdf} 
            disabled={!udfName || !selectedBaseModel || !selectedAggregationLevel || fields.length === 0}
          >
            {isCreating ? 'Create UDF' : 'Update UDF'}
          </Button>
        </Box>
      </Paper>

      {fields.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Form Preview
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Form schema={createJsonSchema()} validator={validator} />
        </Paper>
      )}

      <FieldDialog 
        open={fieldDialogOpen} 
        field={currentField} 
        modelFields={modelFields}
        onClose={() => setFieldDialogOpen(false)} 
        onSave={handleFieldSave} 
      />

      <Dialog open={codeDialogOpen} onClose={() => setCodeDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Pydantic Model Code for UDF</DialogTitle>
        <DialogContent>
          <Box component="pre" sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1, overflowX: 'auto' }}>
            <Box component="code">{pydanticCode}</Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCodeDialogOpen(false)}>Close</Button>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(pydanticCode);
              setSnackbarMessage('Code copied to clipboard');
              setSnackbarOpen(true);
            }}
          >
            Copy to Clipboard
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UdfBuilder;