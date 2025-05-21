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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Divider,
  Chip,
  ListItemText,
  OutlinedInput,
} from '@mui/material';
import {
  getUdfs,  // Updated from getSchemas
  getReportLayouts,
  createReportLayout,
  updateReportLayout,
  deleteReportLayout,
  runReport,
  getCycleCodes,
  getAvailableModels,
} from '../api/api';
import { UDF, UDFField, ReportLayout, ModelInfo, AggregationLevel } from '../types';  // Updated from Schema to UDF

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const ReportBuilder: React.FC = () => {
  const [udfs, setUdfs] = useState<UDF[]>([]);  // Updated from schemas to udfs
  const [reports, setReports] = useState<ReportLayout[]>([]);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportLayout | null>(null);
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [isCreating, setIsCreating] = useState(true);
  const [selectedUdfIds, setSelectedUdfIds] = useState<number[]>([]);  
  const [selectedPrimaryModel, setSelectedPrimaryModel] = useState('');
  const [selectedAggregationLevel, setSelectedAggregationLevel] = useState<AggregationLevel | ''>('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [cycleCodes, setCycleCodes] = useState<string[]>([]);
  const [selectedCycleCode, setSelectedCycleCode] = useState('');
  const [reportData, setReportData] = useState<Record<string, any>[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [fieldSelectOpen, setFieldSelectOpen] = useState(false);
  const [isReportRunning, setIsReportRunning] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Debug effect to help identify issues
  useEffect(() => {
    console.log('Available UDFs:', udfs);  // Updated from schemas to udfs
    console.log('Selected aggregation level:', selectedAggregationLevel);
    console.log('Compatible UDFs:', getCompatibleUdfs());  // Updated from getCompatibleSchemas
  }, [udfs, selectedAggregationLevel]);  // Updated from schemas to udfs

  const loadData = async () => {
    try {
      const [udfData, reportData, cycleData, modelData] = await Promise.all([  // Updated from schemaData to udfData
        getUdfs(),  // Updated from getSchemas
        getReportLayouts(),
        getCycleCodes(),
        getAvailableModels(),
      ]);
      setUdfs(udfData);  // Updated from setSchemas to setUdfs
      setReports(reportData);
      setCycleCodes(cycleData);
      setModels(modelData);
      if (cycleData.length > 0) {
        setSelectedCycleCode(cycleData[0]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      setSnackbarMessage('Failed to load data');
      setSnackbarOpen(true);
    }
  };

  const getCompatibleUdfs = () => {  // Updated from getCompatibleSchemas
    if (!selectedAggregationLevel) return [];
    
    // Return UDFs that match the selected aggregation level
    return udfs.filter(udf => udf.aggregation_level === selectedAggregationLevel);  // Updated from schemas to udfs
  };

  const handlePrimaryModelSelect = (modelId: string) => {
    setSelectedPrimaryModel(modelId);
    // Reset selected UDFs when primary model changes
    setSelectedUdfIds([]);  // Updated from setSelectedSchemaIds
  };

  const handleUdfSelect = (event: React.ChangeEvent<{ value: unknown }>) => {  // Updated from handleSchemaSelect
    const udfIds = event.target.value as number[];  // Updated from schemaIds
    setSelectedUdfIds(udfIds);  // Updated from setSelectedSchemaIds
    
    // Reset field selection when UDFs change
    setSelectedFields([]);
  };

  const handleReportSelect = (reportId: number) => {
    const report = reports.find((r) => r.id === reportId);
    if (report) {
      setSelectedReport(report);
      setReportName(report.name);
      setReportDescription(report.description || '');
      setSelectedPrimaryModel(report.primary_model);
      setSelectedAggregationLevel(report.aggregation_level);
      setSelectedUdfIds(report.udf_ids);  // Updated from schema_ids to udf_ids
      
      // Set the selected fields from the report layout
      const reportFields = report.layout_json.fields || [];
      setSelectedFields(reportFields);
      
      setIsCreating(false);
    }
  };

  const handleNewReport = () => {
    setSelectedReport(null);
    setReportName('');
    setReportDescription('');
    setSelectedPrimaryModel('');
    setSelectedAggregationLevel('');
    setSelectedUdfIds([]);  // Updated from setSelectedSchemaIds
    setSelectedFields([]);
    setIsCreating(true);
    setReportData([]);
  };

  const handleSaveReport = async () => {
    try {
      if (!selectedPrimaryModel) {
        setSnackbarMessage('Please select a primary model');
        setSnackbarOpen(true);
        return;
      }

      if (!selectedAggregationLevel) {
        setSnackbarMessage('Please select an aggregation level');
        setSnackbarOpen(true);
        return;
      }

      if (selectedUdfIds.length === 0) {  // Updated from selectedSchemaIds
        setSnackbarMessage('Please select at least one UDF');  // Updated from schema to UDF
        setSnackbarOpen(true);
        return;
      }

      const layoutData = {
        name: reportName,
        description: reportDescription,
        primary_model: selectedPrimaryModel,
        aggregation_level: selectedAggregationLevel as AggregationLevel,
        udf_ids: selectedUdfIds,  // Updated from schema_ids to udf_ids
        layout_json: {
          fields: selectedFields,
        },
      };

      let savedReport;
      if (isCreating) {
        savedReport = await createReportLayout(layoutData);
        setSnackbarMessage('Report layout created successfully');
      } else if (selectedReport) {
        savedReport = await updateReportLayout(selectedReport.id, layoutData);
        setSnackbarMessage('Report layout updated successfully');
      }

      setSnackbarOpen(true);
      await loadData();

      if (savedReport) {
        setSelectedReport(savedReport);
        setIsCreating(false);
      }
    } catch (error) {
      console.error('Failed to save report layout:', error);
      setSnackbarMessage('Failed to save report layout');
      setSnackbarOpen(true);
    }
  };

  const handleDeleteReport = async () => {
    if (selectedReport && window.confirm('Are you sure you want to delete this report layout?')) {
      try {
        await deleteReportLayout(selectedReport.id);
        setSnackbarMessage('Report layout deleted successfully');
        setSnackbarOpen(true);
        await loadData();
        handleNewReport();
      } catch (error) {
        console.error('Failed to delete report layout:', error);
        setSnackbarMessage('Failed to delete report layout');
        setSnackbarOpen(true);
      }
    }
  };

  const handleRunReport = async () => {
    if (selectedReport && selectedCycleCode) {
      try {
        setIsReportRunning(true);
        const result = await runReport({
          report_id: selectedReport.id,
          cycle_code: selectedCycleCode,
        });
        setReportData(result.data);
        setSnackbarMessage('Report generated successfully');
        setSnackbarOpen(true);
      } catch (error) {
        console.error('Failed to run report:', error);
        setSnackbarMessage('Failed to run report');
        setSnackbarOpen(true);
      } finally {
        setIsReportRunning(false);
      }
    }
  };

  const handleFieldToggle = (fieldName: string) => {
    setSelectedFields((prev) => {
      if (prev.includes(fieldName)) {
        return prev.filter((f) => f !== fieldName);
      } else {
        return [...prev, fieldName];
      }
    });
  };

  const handleSelectAllFields = () => {
    const allFields: string[] = [];
    
    // Get fields from all selected UDFs
    selectedUdfIds.forEach(udfId => {  // Updated from schemaId to udfId
      const udf = udfs.find(s => s.id === udfId);  // Updated from schema to udf
      if (udf) {
        udf.fields.forEach(field => {
          allFields.push(`${udf.name}.${field.name}`);
        });
      }
    });
    
    setSelectedFields(allFields);
  };

  const handleDeselectAllFields = () => {
    setSelectedFields([]);
  };

  const exportToCsv = () => {
    if (reportData.length === 0) {
      setSnackbarMessage('No data to export');
      setSnackbarOpen(true);
      return;
    }

    // Create CSV content
    const header = selectedFields.join(',');
    const rows = reportData.map((row) => {
      return selectedFields
        .map((field) => {
          const value = row[field];
          return typeof value === 'string' ? `"${value}"` : value;
        })
        .join(',');
    });
    const csvContent = `${header}\n${rows.join('\n')}`;

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const reportNameSafe = reportName.replace(/[^\w\s]/gi, '');
    link.setAttribute('href', url);
    link.setAttribute('download', `${reportNameSafe}_${selectedCycleCode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setExportDialogOpen(false);
  };

  // Get selected UDFs
  const getSelectedUdfs = () => {  // Updated from getSelectedSchemas
    return udfs.filter(udf => selectedUdfIds.includes(udf.id));  // Updated from schemas to udfs
  };

  // Group fields by UDF
  const getFieldsByUdf = () => {  // Updated from getFieldsBySchema
    const fieldGroups: Record<string, UDFField[]> = {};  // Updated from SchemaField to UDFField
    
    getSelectedUdfs().forEach(udf => {  // Updated from getSelectedSchemas
      fieldGroups[udf.name] = udf.fields;
    });
    
    return fieldGroups;
  };

  return (
    <Box sx={{ p: 3, maxWidth: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Report Builder
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="report-select-label">Select Report</InputLabel>
              <Select
                labelId="report-select-label"
                value={selectedReport ? selectedReport.id : ''}
                label="Select Report"
                onChange={(e) => handleReportSelect(Number(e.target.value))}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {reports.map((report) => (
                  <MenuItem key={report.id} value={report.id}>
                    {report.name} ({report.aggregation_level} level)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" color="primary" onClick={handleNewReport}>
                New Report
              </Button>
              {selectedReport && (
                <Button variant="outlined" color="error" onClick={handleDeleteReport}>
                  Delete
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Report Definition
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Report Name"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Description"
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              margin="normal"
              multiline
              rows={1}
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="primary-model-label">Primary Model</InputLabel>
              <Select
                labelId="primary-model-label"
                value={selectedPrimaryModel}
                label="Primary Model"
                onChange={(e) => handlePrimaryModelSelect(e.target.value)}
                disabled={!isCreating && selectedReport !== null}
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
                disabled={!isCreating && selectedReport !== null} // Only disable when editing an existing report
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                <MenuItem value="deal">Deal Level</MenuItem>
                <MenuItem value="group">Group Level</MenuItem>
                <MenuItem value="tranche">Tranche Level</MenuItem>
              </Select>
              <FormHelperText>
                Defines the granularity of this report. Only UDFs with matching level can be included.
              </FormHelperText>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="udfs-label">UDFs</InputLabel>
              <Select
                labelId="udfs-label"
                multiple
                value={selectedUdfIds}
                onChange={(e: any) => handleUdfSelect(e)}
                input={<OutlinedInput label="UDFs" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as number[]).map((udfId) => {
                      const udf = udfs.find(s => s.id === udfId);
                      return udf ? (
                        <Chip key={udfId} label={udf.name} />
                      ) : null;
                    })}
                  </Box>
                )}
                MenuProps={MenuProps}
                disabled={!selectedPrimaryModel || !selectedAggregationLevel || (!isCreating && selectedReport !== null)}
              >
                {udfs
                  .filter(udf => udf.aggregation_level === selectedAggregationLevel)
                  .map((udf) => (
                    <MenuItem key={udf.id} value={udf.id}>
                      <Checkbox checked={selectedUdfIds.includes(udf.id)} />
                      <ListItemText 
                        primary={udf.name} 
                        secondary={`${udf.fields.length} fields`} 
                      />
                    </MenuItem>
                  ))}
              </Select>
              <FormHelperText>
                {!selectedAggregationLevel 
                  ? "Select an aggregation level first" 
                  : getCompatibleUdfs().length === 0
                    ? `No UDFs available with '${selectedAggregationLevel}' aggregation level`
                    : "Select UDFs to include in the report"}
              </FormHelperText>
            </FormControl>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Fields to Include</Typography>
            <Button
              variant="outlined"
              onClick={() => setFieldSelectOpen(true)}
              disabled={selectedUdfIds.length === 0}
            >
              Configure Fields
            </Button>
          </Box>
          {selectedFields.length === 0 ? (
            <Typography color="text.secondary">
              {selectedUdfIds.length === 0
                ? "Select UDFs first, then configure fields."
                : "No fields selected yet. Click \"Configure Fields\" to start."}
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {selectedFields.map((field) => (
                <Chip
                  key={field}
                  label={field}
                  sx={{ backgroundColor: '#f5f5f5' }}
                  onDelete={() => handleFieldToggle(field)}
                />
              ))}
            </Box>
          )}
        </Box>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveReport}
            disabled={!reportName || !selectedPrimaryModel || !selectedAggregationLevel || selectedUdfIds.length === 0 || selectedFields.length === 0}
          >
            {isCreating ? 'Create Report' : 'Update Report'}
          </Button>
        </Box>
      </Paper>

      {selectedReport && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Run Report
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="cycle-select-label">Cycle Code</InputLabel>
                <Select
                  labelId="cycle-select-label"
                  value={selectedCycleCode}
                  label="Cycle Code"
                  onChange={(e) => setSelectedCycleCode(e.target.value)}
                >
                  {cycleCodes.map((code) => (
                    <MenuItem key={code} value={code}>
                      {code}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={8}>
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleRunReport}
                  disabled={isReportRunning || !selectedCycleCode}
                >
                  {isReportRunning ? <CircularProgress size={24} /> : 'Run Report'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setExportDialogOpen(true)}
                  disabled={reportData.length === 0}
                >
                  Export to CSV
                </Button>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            {reportData.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      {selectedFields.map((field) => (
                        <TableCell key={field}>{field}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {selectedFields.map((field) => (
                          <TableCell key={field}>{row[field]}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography color="text.secondary">
                {isReportRunning
                  ? 'Generating report...'
                  : 'Run the report to see data here.'}
              </Typography>
            )}
          </Box>
        </Paper>
      )}

      <Dialog open={fieldSelectOpen} onClose={() => setFieldSelectOpen(false)} maxWidth="md" fullWidth>
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
                            checked={selectedFields.includes(fieldFullName)}
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
          <Button onClick={() => setFieldSelectOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
        <DialogTitle>Export Report</DialogTitle>
        <DialogContent>
          <Typography>
            Export the current report data to a CSV file?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
          <Button onClick={exportToCsv} variant="contained" color="primary">
            Export
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

export default ReportBuilder;