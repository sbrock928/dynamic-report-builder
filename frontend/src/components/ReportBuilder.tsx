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
  Chip,
  OutlinedInput,
} from '@mui/material';
import { useReports } from '../context/ReportContext';
import { useUdfs } from '../context/UdfContext';
import { useModels } from '../hooks/useModels';
import { useCycleCodes } from '../hooks/useCycleCodes';
import { useReportData } from '../hooks/useReportData';
import { filterUdfsByAggregationLevel, exportToCsv, createSafeFileName } from '../utils/helpers';
import { ReportLayout, AggregationLevel } from '../types';
import {
  createReportLayout,
  updateReportLayout,
  deleteReportLayout,
} from '../services/api';
import Snackbar from '../components/common/Snackbar';
import Loading from '../components/common/Loading';
import FieldsDialog from './reports/FieldsDialog';
import ReportDataTable from './reports/ReportDataTable';

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
  // Fetch data using custom hooks
  const { reports, refreshReports, loading: loadingReports } = useReports();
  const { udfs, loading: loadingUdfs } = useUdfs();
  const { models, loading: loadingModels } = useModels();
  const { cycleCodes, loading: loadingCycleCodes } = useCycleCodes();
  const { reportData, isLoading: isReportRunning, executeReport } = useReportData();
  
  // Local state
  const [selectedReport, setSelectedReport] = useState<ReportLayout | null>(null);
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [isCreating, setIsCreating] = useState(true);
  const [selectedUdfIds, setSelectedUdfIds] = useState<number[]>([]);
  const [selectedPrimaryModel, setSelectedPrimaryModel] = useState('');
  const [selectedAggregationLevel, setSelectedAggregationLevel] = useState<AggregationLevel | ''>('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [selectedCycleCode, setSelectedCycleCode] = useState('');
  
  // UI state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [fieldSelectOpen, setFieldSelectOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  
  // Initialize data
  useEffect(() => {
    if (cycleCodes.length > 0 && !selectedCycleCode) {
      setSelectedCycleCode(cycleCodes[0]);
    }
  }, [cycleCodes, selectedCycleCode]);

  // Selected UDFs based on aggregation level
  const getCompatibleUdfs = () => {
    return filterUdfsByAggregationLevel(udfs, selectedAggregationLevel);
  };

  const getSelectedUdfs = () => {
    return udfs.filter(udf => selectedUdfIds.includes(udf.id));
  };

  // Handlers
  const handlePrimaryModelSelect = (modelId: string) => {
    setSelectedPrimaryModel(modelId);
    // Reset selected UDFs when primary model changes
    setSelectedUdfIds([]);
  };

  const handleUdfSelect = (event: React.ChangeEvent<{ value: unknown }>) => {
    const udfIds = event.target.value as number[];
    setSelectedUdfIds(udfIds);
    
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
      setSelectedUdfIds(report.udf_ids);
      
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
    setSelectedUdfIds([]);
    setSelectedFields([]);
    setIsCreating(true);
  };

  const handleSaveReport = async () => {
    try {
      if (!reportName || !selectedPrimaryModel || !selectedAggregationLevel || selectedUdfIds.length === 0 || selectedFields.length === 0) {
        setSnackbarMessage('Please fill in all required fields');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      const layoutData = {
        name: reportName,
        description: reportDescription,
        primary_model: selectedPrimaryModel,
        aggregation_level: selectedAggregationLevel as AggregationLevel,
        udf_ids: selectedUdfIds,
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

      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      await refreshReports();

      if (savedReport) {
        setSelectedReport(savedReport);
        setIsCreating(false);
      }
    } catch (error) {
      console.error('Failed to save report layout:', error);
      setSnackbarMessage('Failed to save report layout');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleDeleteReport = async () => {
    if (selectedReport && window.confirm('Are you sure you want to delete this report layout?')) {
      try {
        await deleteReportLayout(selectedReport.id);
        setSnackbarMessage('Report layout deleted successfully');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        await refreshReports();
        handleNewReport();
      } catch (error) {
        console.error('Failed to delete report layout:', error);
        setSnackbarMessage('Failed to delete report layout');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    }
  };

  const handleRunReport = async () => {
    if (selectedReport && selectedCycleCode) {
      try {
        await executeReport({
          report_id: selectedReport.id,
          cycle_code: selectedCycleCode,
        });
        setSnackbarMessage('Report generated successfully');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } catch (error) {
        setSnackbarMessage('Failed to run report');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    }
  };

  const handleFieldsChange = (fields: string[]) => {
    setSelectedFields(fields);
  };

  const handleExportToCsv = () => {
    if (reportData.length === 0 || selectedFields.length === 0) {
      setSnackbarMessage('No data to export');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    const reportNameSafe = createSafeFileName(reportName);
    exportToCsv(reportData, selectedFields, `${reportNameSafe}_${selectedCycleCode}`);
    setExportDialogOpen(false);
  };

  // Show loading state if initial data is still loading
  if (loadingReports || loadingUdfs || loadingModels || loadingCycleCodes) {
    return <Loading message="Loading report builder..." />;
  }

  return (
    <Box sx={{ maxWidth: '100%' }}>
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
              required
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
            <FormControl fullWidth margin="normal" required>
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
                disabled={!isCreating && selectedReport !== null}
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
            <FormControl fullWidth margin="normal" required>
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
                {getCompatibleUdfs().map((udf) => (
                  <MenuItem key={udf.id} value={udf.id}>
                    {udf.name} ({udf.fields.length} fields)
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
                  {isReportRunning ? <Loading /> : 'Run Report'}
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
            {isReportRunning ? (
              <Loading message="Generating report..." />
            ) : (
              <ReportDataTable 
                data={reportData} 
                fields={selectedFields}
              />
            )}
          </Box>
        </Paper>
      )}

      {/* Field Selection Dialog */}
      <FieldsDialog
        open={fieldSelectOpen}
        onClose={() => setFieldSelectOpen(false)}
        udfs={getSelectedUdfs()}
        selectedFields={selectedFields}
        onFieldsChange={handleFieldsChange}
      />

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
        <DialogTitle>Export Report</DialogTitle>
        <DialogContent>
          <Typography>
            Export the current report data to a CSV file?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleExportToCsv} variant="contained" color="primary">
            Export
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={snackbarOpen}
        message={snackbarMessage}
        severity={snackbarSeverity}
        onClose={() => setSnackbarOpen(false)}
      />
    </Box>
  );
};

export default ReportBuilder;