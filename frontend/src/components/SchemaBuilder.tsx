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
  IconButton,
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
import { getSchemas, createSchema, updateSchema, deleteSchema, getPydanticCode } from '../api/api';
import { Schema, SchemaField } from '../types';

interface SchemaBuilderFormSchema {
  name: string;
  description?: string;
  fields: SchemaField[];
}

interface FieldDialogProps {
  open: boolean;
  field: SchemaField | null;
  onClose: () => void;
  onSave: (field: SchemaField) => void;
}

const fieldTypes = [
  { value: 'string', label: 'String' },
  { value: 'integer', label: 'Integer' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'array', label: 'Array' },
  { value: 'object', label: 'Object' },
];

const FieldDialog: React.FC<FieldDialogProps> = ({ open, field, onClose, onSave }) => {
  const [fieldData, setFieldData] = useState<SchemaField>({
    name: '',
    type: 'string',
    description: '',
    required: false,
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

const SchemaBuilder: React.FC = () => {
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [selectedSchema, setSelectedSchema] = useState<Schema | null>(null);
  const [isCreating, setIsCreating] = useState(true);
  const [schemaName, setSchemaName] = useState('');
  const [schemaDescription, setSchemaDescription] = useState('');
  const [fields, setFields] = useState<SchemaField[]>([]);
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [currentField, setCurrentField] = useState<SchemaField | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [pydanticCode, setPydanticCode] = useState('');
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);

  useEffect(() => {
    loadSchemas();
  }, []);

  const loadSchemas = async () => {
    try {
      const loadedSchemas = await getSchemas();
      setSchemas(loadedSchemas);
    } catch (error) {
      console.error('Failed to load schemas:', error);
      setSnackbarMessage('Failed to load schemas');
      setSnackbarOpen(true);
    }
  };

  const handleSchemaSelect = async (schemaId: number) => {
    const schema = schemas.find((s) => s.id === schemaId);
    if (schema) {
      setSelectedSchema(schema);
      setSchemaName(schema.name);
      setSchemaDescription(schema.description || '');
      setFields(schema.schema_json.fields || []);
      setIsCreating(false);
    }
  };

  const handleNewSchema = () => {
    setSelectedSchema(null);
    setSchemaName('');
    setSchemaDescription('');
    setFields([]);
    setIsCreating(true);
  };

  const handleSaveSchema = async () => {
    try {
      const schemaData: SchemaBuilderFormSchema = {
        name: schemaName,
        description: schemaDescription,
        fields: fields,
      };

      let savedSchema;
      if (isCreating) {
        savedSchema = await createSchema(schemaData);
        setSnackbarMessage('Schema created successfully');
      } else if (selectedSchema) {
        savedSchema = await updateSchema(selectedSchema.id, schemaData);
        setSnackbarMessage('Schema updated successfully');
      }

      setSnackbarOpen(true);
      loadSchemas();

      if (savedSchema) {
        setSelectedSchema(savedSchema);
        setIsCreating(false);
      }
    } catch (error) {
      console.error('Failed to save schema:', error);
      setSnackbarMessage('Failed to save schema');
      setSnackbarOpen(true);
    }
  };

  const handleDeleteSchema = async () => {
    if (selectedSchema && window.confirm('Are you sure you want to delete this schema?')) {
      try {
        await deleteSchema(selectedSchema.id);
        setSnackbarMessage('Schema deleted successfully');
        setSnackbarOpen(true);
        loadSchemas();
        handleNewSchema();
      } catch (error) {
        console.error('Failed to delete schema:', error);
        setSnackbarMessage('Failed to delete schema');
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

  const handleFieldSave = (field: SchemaField) => {
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
    if (selectedSchema) {
      try {
        const code = await getPydanticCode(selectedSchema.id);
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
        Schema Builder
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="schema-select-label">Select Schema</InputLabel>
              <Select
                labelId="schema-select-label"
                value={selectedSchema ? selectedSchema.id : ''}
                label="Select Schema"
                onChange={(e) => handleSchemaSelect(Number(e.target.value))}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {schemas.map((schema) => (
                  <MenuItem key={schema.id} value={schema.id}>
                    {schema.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" color="primary" onClick={handleNewSchema}>
                New Schema
              </Button>
              {selectedSchema && (
                <>
                  <Button variant="outlined" color="error" onClick={handleDeleteSchema}>
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
          Schema Definition
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Schema Name"
              value={schemaName}
              onChange={(e) => setSchemaName(e.target.value)}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Description"
              value={schemaDescription}
              onChange={(e) => setSchemaDescription(e.target.value)}
              margin="normal"
              multiline
              rows={1}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Fields</Typography>
            <Button variant="contained" color="primary" onClick={handleAddField}>
              Add Field
            </Button>
          </Box>
          {fields.length === 0 ? (
            <Typography color="text.secondary">No fields defined yet. Click "Add Field" to start.</Typography>
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
                    Description
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
                      {field.description || '-'}
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
          <Button variant="contained" color="primary" onClick={handleSaveSchema} disabled={!schemaName || fields.length === 0}>
            {isCreating ? 'Create Schema' : 'Update Schema'}
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

      <FieldDialog open={fieldDialogOpen} field={currentField} onClose={() => setFieldDialogOpen(false)} onSave={handleFieldSave} />

      <Dialog open={codeDialogOpen} onClose={() => setCodeDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Pydantic Model Code</DialogTitle>
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

export default SchemaBuilder;