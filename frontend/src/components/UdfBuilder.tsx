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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Divider,
  CircularProgress,
} from '@mui/material';
import Form from '@rjsf/mui';
import validator from '@rjsf/validator-ajv8';
import { useUdfs } from '../context/UdfContext';
import { useModels } from '../hooks/useModels';
import { 
  createUdf, 
  updateUdf, 
  deleteUdf, 
  getPydanticCode,
  getModelFields,
  getCalculationsForLevel
} from '../services/api';
import { 
  UDF, 
  UDFField, 
  ModelField,
  CalculationType,
  AggregationLevel,
  CalculationDefinition,
  CalculationParam
} from '../types';
import Snackbar from './common/Snackbar';
import Loading from './common/Loading';

interface UdfBuilderFormSchema {
  name: string;
  description?: string;
  base_model: string;
  aggregation_level: AggregationLevel;
  fields: UDFField[];
}

interface FieldDialogProps {
  open: boolean;
  field: UDFField | null;
  modelFields: ModelField[];
  aggregationLevel: AggregationLevel | ''; // Added aggregation level to props
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

const FieldDialog: React.FC<FieldDialogProps> = ({ open, field, modelFields, aggregationLevel, onClose, onSave }) => {
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

  // Add states for dynamic calculations
  const [availableCalculations, setAvailableCalculations] = useState<CalculationDefinition[]>([]);
  const [selectedCalculation, setSelectedCalculation] = useState<CalculationDefinition | null>(null);
  const [loadingCalculations, setLoadingCalculations] = useState(false);

  // Reset field data when dialog opens or field changes
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

  // Fetch available calculations when dialog opens and aggregation level is set
  useEffect(() => {
    const fetchCalculations = async () => {
      if (open && aggregationLevel) {
        try {
          setLoadingCalculations(true);
          const calculations = await getCalculationsForLevel(aggregationLevel);
          setAvailableCalculations(calculations);
        } catch (error) {
          console.error('Failed to load calculations:', error);
        } finally {
          setLoadingCalculations(false);
        }
      }
    };

    fetchCalculations();
  }, [open, aggregationLevel]);

  // Update selected calculation when calculation type changes
  useEffect(() => {
    if (fieldData.calculation_type) {
      const calculation = availableCalculations.find(calc => calc.type === fieldData.calculation_type);
      setSelectedCalculation(calculation || null);
    } else {
      setSelectedCalculation(null);
    }
  }, [fieldData.calculation_type, availableCalculations]);

  // Handle calculation type change
  const handleCalculationTypeChange = (calcType: string) => {
    const calculation = availableCalculations.find(calc => calc.type === calcType);
    
    // Initialize params with defaults from the calculation definition
    const initialParams: Record<string, any> = {};
    if (calculation?.params) {
      calculation.params.forEach(param => {
        if (param.default !== undefined) {
          initialParams[param.name] = param.default;
        }
      });
    }

    setFieldData({ 
      ...fieldData, 
      calculation_type: calcType || undefined,
      calculation_params: calcType ? initialParams : {}
    });
  };

  // Handle parameter value change
  const handleParamChange = (paramName: string, value: any) => {
    setFieldData({
      ...fieldData,
      calculation_params: {
        ...fieldData.calculation_params,
        [paramName]: value
      }
    });
  };

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
                  onChange={(e) => handleCalculationTypeChange(e.target.value)}
                  disabled={loadingCalculations}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {loadingCalculations ? (
                    <MenuItem disabled>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CircularProgress size={20} sx={{ mr: 1 }} /> Loading calculations...
                      </Box>
                    </MenuItem>
                  ) : (
                    availableCalculations.map((calc) => (
                      <MenuItem key={calc.type} value={calc.type}>
                        {calc.display_name}
                      </MenuItem>
                    ))
                  )}
                </Select>
                {selectedCalculation?.description && (
                  <FormHelperText>{selectedCalculation.description}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            {/* Dynamic parameter fields based on selected calculation */}
            {selectedCalculation?.params && selectedCalculation.params.length > 0 && (
              <Grid item xs={12}>
                <Box sx={{ mt: 2, mb: 1 }}>
                  <Typography variant="subtitle2">Calculation Parameters</Typography>
                </Box>
                {selectedCalculation.params.map(param => (
                  <Box key={param.name} sx={{ mb: 2 }}>
                    {param.type === 'select' ? (
                      <FormControl fullWidth required={param.required}>
                        <InputLabel>{param.display_name}</InputLabel>
                        <Select
                          value={fieldData.calculation_params?.[param.name] || ''}
                          label={param.display_name}
                          onChange={(e) => handleParamChange(param.name, e.target.value)}
                        >
                          {param.options?.map(option => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </Select>
                        {param.description && (
                          <FormHelperText>{param.description}</FormHelperText>
                        )}
                      </FormControl>
                    ) : param.type === 'text' ? (
                      <TextField
                        fullWidth
                        label={param.display_name}
                        value={fieldData.calculation_params?.[param.name] || ''}
                        onChange={(e) => handleParamChange(param.name, e.target.value)}
                        multiline
                        rows={3}
                        required={param.required}
                        helperText={param.description}
                      />
                    ) : (
                      <TextField
                        fullWidth
                        label={param.display_name}
                        value={fieldData.calculation_params?.[param.name] || ''}
                        onChange={(e) => handleParamChange(param.name, e.target.value)}
                        required={param.required}
                        helperText={param.description}
                      />
                    )}
                  </Box>
                ))}
              </Grid>
            )}
            
            {/* Legacy custom formula field for backward compatibility */}
            {fieldData.calculation_type === 'custom' && !selectedCalculation?.params && (
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

            {/* Enhanced UI for the "mapping" calculation type */}
            {selectedCalculation?.type === 'mapping' && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Mapping Type</InputLabel>
                  <Select
                    value={fieldData.calculation_params?.mapping_type || 'static'}
                    label="Mapping Type"
                    onChange={(e) => handleParamChange('mapping_type', e.target.value)}
                  >
                    <MenuItem value="static">Static Value</MenuItem>
                    <MenuItem value="model_field">From Model Field</MenuItem>
                  </Select>
                  <FormHelperText>
                    Choose static for a fixed value or model_field to map from another database table
                  </FormHelperText>
                </FormControl>
                
                {/* Static value input field */}
                {fieldData.calculation_params?.mapping_type === 'static' && (
                  <TextField
                    fullWidth
                    label="Static Value"
                    value={fieldData.calculation_params?.mapping_value || ''}
                    onChange={(e) => handleParamChange('mapping_value', e.target.value)}
                    helperText="Enter the static value to store in this field"
                    sx={{ mt: 2 }}
                  />
                )}
                
                {/* Fields for model mapping - only shown when "From Model Field" is selected */}
                {fieldData.calculation_params?.mapping_type === 'model_field' && (
                  <>
                    <TextField
                      fullWidth
                      label="Relation Field"
                      value={fieldData.calculation_params?.relation_field || ''}
                      onChange={(e) => handleParamChange('relation_field', e.target.value)}
                      helperText="Enter the field in the source model that contains the current record's ID (e.g., 'tranche_id')"
                      required
                      sx={{ mt: 2 }}
                    />
                  </>
                )}
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
  // Use context and hooks for data management
  const { udfs, refreshUdfs, loading: loadingUdfs } = useUdfs();
  const { models, loading: loadingModels } = useModels();
  
  // Local state
  const [modelFields, setModelFields] = useState<ModelField[]>([]);
  const [selectedUdf, setSelectedUdf] = useState<UDF | null>(null);
  const [isCreating, setIsCreating] = useState(true);
  const [udfName, setUdfName] = useState('');
  const [udfDescription, setUdfDescription] = useState('');
  const [selectedBaseModel, setSelectedBaseModel] = useState('');
  const [selectedAggregationLevel, setSelectedAggregationLevel] = useState<AggregationLevel | ''>('');
  const [fields, setFields] = useState<UDFField[]>([]);
  
  // UI state
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [currentField, setCurrentField] = useState<UDFField | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [pydanticCode, setPydanticCode] = useState('');
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [loadingModelFields, setLoadingModelFields] = useState(false);

  // Load model fields when base model changes
  const loadModelFields = async (modelId: string) => {
    try {
      setLoadingModelFields(true);
      const fields = await getModelFields(modelId);
      setModelFields(fields);
    } catch (error) {
      console.error('Failed to load model fields:', error);
      setSnackbarMessage('Failed to load model fields');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoadingModelFields(false);
    }
  };

  // Handle UDF selection
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

  // Handle base model change
  const handleBaseModelChange = async (modelId: string) => {
    setSelectedBaseModel(modelId);
    await loadModelFields(modelId);
  };

  // Reset form for new UDF
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

  // Save UDF
  const handleSaveUdf = async () => {
    try {
      if (!udfName || !selectedBaseModel || !selectedAggregationLevel || fields.length === 0) {
        setSnackbarMessage('Please fill all required fields and add at least one field');
        setSnackbarSeverity('error');
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

      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      await refreshUdfs();

      if (savedUdf) {
        setSelectedUdf(savedUdf);
        setIsCreating(false);
      }
    } catch (error) {
      console.error('Failed to save UDF:', error);
      setSnackbarMessage('Failed to save UDF');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Delete UDF
  const handleDeleteUdf = async () => {
    if (selectedUdf && window.confirm('Are you sure you want to delete this UDF?')) {
      try {
        await deleteUdf(selectedUdf.id);
        setSnackbarMessage('UDF deleted successfully');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        await refreshUdfs();
        handleNewUdf();
      } catch (error) {
        console.error('Failed to delete UDF:', error);
        setSnackbarMessage('Failed to delete UDF');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    }
  };

  // Field management
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

  // View Pydantic code
  const handleShowPydanticCode = async () => {
    if (selectedUdf) {
      try {
        const code = await getPydanticCode(selectedUdf.id);
        setPydanticCode(code);
        setCodeDialogOpen(true);
      } catch (error) {
        console.error('Failed to get Pydantic code:', error);
        setSnackbarMessage('Failed to get Pydantic code');
        setSnackbarSeverity('error');
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

  // Show loading state if data is still loading
  if (loadingUdfs || loadingModels) {
    return <Loading message="Loading UDF builder..." />;
  }

  return (
    <Box sx={{ maxWidth: '100%' }}>
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
              required
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
            <FormControl fullWidth margin="normal" required>
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
                disabled={!isCreating && selectedUdf !== null}
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
          
          {selectedBaseModel && (
            <Grid item xs={12}>
              <Box sx={{ mt: 1, bgcolor: '#f8f9fa', p: 2, borderRadius: 1, border: '1px solid #e0e0e0' }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Note:</strong> The primary key field from the base model will be automatically included in your UDF.
                  You only need to define additional fields you want to include.
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Fields</Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleAddField}
              disabled={!selectedBaseModel || loadingModelFields}
            >
              {loadingModelFields ? <Loading /> : 'Add Field'}
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

      {/* Field Dialog */}
      <FieldDialog 
        open={fieldDialogOpen} 
        field={currentField} 
        modelFields={modelFields}
        aggregationLevel={selectedAggregationLevel} // Pass aggregation level to FieldDialog
        onClose={() => setFieldDialogOpen(false)} 
        onSave={handleFieldSave} 
      />

      {/* Pydantic Code Dialog */}
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
              setSnackbarSeverity('success');
              setSnackbarOpen(true);
            }}
          >
            Copy to Clipboard
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        message={snackbarMessage}
        severity={snackbarSeverity}
        onClose={() => setSnackbarOpen(false)}
      />
    </Box>
  );
};

export default UdfBuilder;