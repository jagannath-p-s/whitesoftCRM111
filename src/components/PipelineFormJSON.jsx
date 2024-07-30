import React, { useState, useEffect, useCallback } from 'react';
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Grid,
} from '@mui/material';
import { supabase } from '../supabaseClient';

const PipelineFormJSON = ({ enquiryId }) => {
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [stages, setStages] = useState([]);
  const [currentStage, setCurrentStage] = useState(null);
  const [fields, setFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [filePreviewDialog, setFilePreviewDialog] = useState({ open: false, url: '', type: '' });
  const [pipelineDialogOpen, setPipelineDialogOpen] = useState(false);

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const fetchPipelines = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('pipelines').select('*');
      if (error) throw error;
      setPipelines(data);
    } catch (error) {
      showSnackbar('Failed to fetch pipelines', 'error');
      console.error('Error fetching pipelines:', error);
    }
  }, []);

  const fetchExistingData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('enquiries')
        .select('pipeline_id, current_stage_id')
        .eq('id', enquiryId)
        .single();

      if (error) throw error;

      if (data?.pipeline_id) {
        setSelectedPipeline(data.pipeline_id);
        setCurrentStage(data.current_stage_id);
        await fetchStages(data.pipeline_id);
        await fetchPipelineData(data.pipeline_id);
      } else {
        setPipelineDialogOpen(true);
      }
    } catch (error) {
      showSnackbar('Failed to fetch existing data', 'error');
      console.error('Error fetching existing data:', error);
    } finally {
      setLoading(false);
    }
  }, [enquiryId]);

  const fetchStages = useCallback(async (pipelineId) => {
    try {
      const { data, error } = await supabase
        .from('pipeline_stages')
        .select('*')
        .eq('pipeline_id', pipelineId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setStages(data);
      if (data.length > 0 && !currentStage) {
        setCurrentStage(data[0].stage_id);
        await fetchFields(data[0].stage_id);
      }
    } catch (error) {
      showSnackbar('Failed to fetch stages', 'error');
      console.error('Error fetching stages:', error);
    }
  }, [currentStage]);

  const fetchFields = useCallback(async (stageId) => {
    try {
      const { data, error } = await supabase
        .from('pipeline_fields')
        .select('*')
        .eq('stage_id', stageId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setFields(data);
    } catch (error) {
      showSnackbar('Failed to fetch fields', 'error');
      console.error('Error fetching fields:', error);
    }
  }, []);

  const fetchPipelineData = useCallback(async (pipelineId) => {
    try {
      const { data, error } = await supabase
        .from('pipeline_data_json')
        .select('*')
        .eq('enquiry_id', enquiryId)
        .eq('pipeline_id', pipelineId);

      if (error) throw error;

      const formattedData = data.reduce((acc, item) => {
        acc[item.stage_id] = item.data;
        return acc;
      }, {});

      setFormData(formattedData);
    } catch (error) {
      showSnackbar('Failed to fetch pipeline data', 'error');
      console.error('Error fetching pipeline data:', error);
    }
  }, [enquiryId]);

  useEffect(() => {
    fetchPipelines();
    fetchExistingData();
  }, [fetchPipelines, fetchExistingData]);

  const handleStageChange = async (stageId) => {
    setCurrentStage(stageId);
    await fetchFields(stageId);
  };

  const handleInputChange = (fieldId, value) => {
    setFormData((prevData) => ({
      ...prevData,
      [currentStage]: {
        ...prevData[currentStage],
        [fieldId]: value,
      },
    }));
  };

  const handleFileUpload = async (fieldId, file) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) throw new Error('User not authenticated');

      const uniqueFileName = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(uniqueFileName, file);

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from('uploaded_files').insert([
        {
          file_name: file.name,
          file_path: uniqueFileName,
          uploaded_by: user.id,
          file_size: file.size,
          file_type: file.type,
        },
      ]);

      if (insertError) throw insertError;

      handleInputChange(fieldId, uniqueFileName);
      showSnackbar('File uploaded successfully', 'success');
    } catch (error) {
      showSnackbar(`Failed to upload file: ${error.message}`, 'error');
      console.error('Error uploading file:', error);
    }
  };

  const handleFileView = async (filePath) => {
    try {
      const { data, error } = await supabase.storage.from('files').download(filePath);
      if (error) throw error;

      const url = URL.createObjectURL(data);
      const fileType = data.type;

      setFilePreviewDialog({
        open: true,
        url,
        type: fileType,
      });
    } catch (error) {
      showSnackbar(`Error viewing file: ${error.message}`, 'error');
    }
  };

  const handleFileDownload = async (filePath) => {
    try {
      const { data, error } = await supabase.storage.from('files').download(filePath);
      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = filePath.split('/').pop();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      showSnackbar(`Error downloading file: ${error.message}`, 'error');
    }
  };

  const handleSubmit = async () => {
    try {
      const { error } = await supabase.from('pipeline_data_json').upsert(
        Object.entries(formData).map(([stageId, data]) => ({
          enquiry_id: enquiryId,
          pipeline_id: selectedPipeline,
          stage_id: parseInt(stageId),
          data: data,
        })),
        { onConflict: ['enquiry_id', 'pipeline_id', 'stage_id'] }
      );

      if (error) throw error;

      const { error: updateError } = await supabase
        .from('enquiries')
        .update({ pipeline_id: selectedPipeline, current_stage_id: currentStage })
        .eq('id', enquiryId);

      if (updateError) throw updateError;

      setIsEditing(false);
      showSnackbar('Data saved successfully', 'success');
    } catch (error) {
      showSnackbar('Failed to save data', 'error');
      console.error('Error saving data:', error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    fetchPipelineData(selectedPipeline);
  };

  const handlePipelineSelection = async (pipelineId) => {
    setSelectedPipeline(pipelineId);
    setPipelineDialogOpen(false);
    await fetchStages(pipelineId);
    await fetchPipelineData(pipelineId);
  };

  const renderFieldValue = (field) => {
    const value = formData[currentStage]?.[field.field_id];

    if (field.field_type === 'file' && value) {
      return (
        <Box>
          <Button variant="outlined" onClick={() => handleFileView(value)} sx={{ mr: 1 }}>
            View File
          </Button>
          <Button variant="outlined" onClick={() => handleFileDownload(value)}>
            Download File
          </Button>
        </Box>
      );
    }

    if (field.field_type === 'checkbox') {
      return (
        <Checkbox
          checked={value || false}
          disabled={!isEditing}
          onChange={(e) => handleInputChange(field.field_id, e.target.checked)}
        />
      );
    }

    return value || 'N/A';
  };

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Current Pipeline</InputLabel>
            <Select
              value={selectedPipeline || ''}
              disabled
            >
              {pipelines.map((pipeline) => (
                <MenuItem key={pipeline.pipeline_id} value={pipeline.pipeline_id}>
                  {pipeline.pipeline_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Current Stage</InputLabel>
            <Select
              value={currentStage || ''}
              onChange={(e) => handleStageChange(e.target.value)}
              disabled={!isEditing}
            >
              {stages.map((stage) => (
                <MenuItem key={stage.stage_id} value={stage.stage_id}>
                  {stage.stage_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {selectedPipeline && (
        <>
          <Stepper activeStep={stages.findIndex(stage => stage.stage_id === currentStage)} alternativeLabel sx={{ mt: 4, mb: 4 }}>
            {stages.map((stage) => (
              <Step key={stage.stage_id}>
                <StepLabel>{stage.stage_name}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Card>
            <CardContent>
              <Grid container spacing={2}>
                {fields.map((field) => (
                  <Grid item xs={12} md={6} key={field.field_id}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {field.field_name}
                    </Typography>
                    {isEditing ? (
                      <FormControl fullWidth margin="normal">
                        {field.field_type === 'textfield' && (
                          <TextField
                            value={formData[currentStage]?.[field.field_id] || ''}
                            onChange={(e) => handleInputChange(field.field_id, e.target.value)}
                          />
                        )}
                        {field.field_type === 'checkbox' && (
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={formData[currentStage]?.[field.field_id] || false}
                                onChange={(e) => handleInputChange(field.field_id, e.target.checked)}
                              />
                            }
                            label="Yes"
                          />
                        )}
                        {field.field_type === 'file' && (
                          <input
                            type="file"
                            onChange={(e) => handleFileUpload(field.field_id, e.target.files[0])}
                          />
                        )}
                      </FormControl>
                    ) : (
                      <Typography>{renderFieldValue(field)}</Typography>
                    )}
                  </Grid>
                ))}
              </Grid>
            </CardContent>
            <CardActions>
              {isEditing ? (
                <>
                  <Button variant="contained" color="primary" onClick={handleSubmit}>
                    Save
                  </Button>
                  <Button variant="outlined" onClick={handleCancel}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button variant="contained" color="primary" onClick={handleEdit}>
                  Edit
                </Button>
              )}
            </CardActions>
          </Card>
        </>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={closeSnackbar}>
        <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Dialog open={filePreviewDialog.open} onClose={() => setFilePreviewDialog({ open: false, url: '', type: '' })} maxWidth="md" fullWidth>
        <DialogTitle>File Preview</DialogTitle>
        <DialogContent>
          {filePreviewDialog.type.startsWith('image/') ? (
            <img src={filePreviewDialog.url} alt="File preview" style={{ width: '100%', height: 'auto' }} />
          ) : (
            <Typography>This file type cannot be previewed. Please download the file to view its contents.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFilePreviewDialog({ open: false, url: '', type: '' })} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={pipelineDialogOpen} onClose={() => setPipelineDialogOpen(false)}>
        <DialogTitle>Select a Pipeline</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Pipeline</InputLabel>
            <Select
              value={selectedPipeline || ''}
              onChange={(e) => handlePipelineSelection(e.target.value)}
            >
              {pipelines.map((pipeline) => (
                <MenuItem key={pipeline.pipeline_id} value={pipeline.pipeline_id}>
                  {pipeline.pipeline_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPipelineDialogOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PipelineFormJSON;
