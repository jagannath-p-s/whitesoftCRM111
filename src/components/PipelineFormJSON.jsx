import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
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
  const [activeStep, setActiveStep] = useState(0);

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
        await fetchStages(data.pipeline_id, data.current_stage_id);
        await fetchPipelineData(data.pipeline_id);
      }
    } catch (error) {
      showSnackbar('Failed to fetch existing data', 'error');
      console.error('Error fetching existing data:', error);
    } finally {
      setLoading(false);
    }
  }, [enquiryId]);

  const fetchStages = useCallback(async (pipelineId, currentStageId) => {
    try {
      const { data, error } = await supabase
        .from('pipeline_stages')
        .select('*')
        .eq('pipeline_id', pipelineId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setStages(data);

      if (data.length > 0) {
        const stageIndex = data.findIndex(stage => stage.stage_id === currentStageId);
        if (stageIndex !== -1) {
          setCurrentStage(currentStageId);
          setActiveStep(stageIndex);
          await fetchFields(currentStageId);
        } else {
          setCurrentStage(data[0].stage_id);
          setActiveStep(0);
          await fetchFields(data[0].stage_id);
        }
      }
    } catch (error) {
      showSnackbar('Failed to fetch stages', 'error');
      console.error('Error fetching stages:', error);
    }
  }, []);

  const fetchFields = useCallback(async (stageId) => {
    if (!stageId) return;
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

  const handlePipelineChange = async (event) => {
    const pipelineId = event.target.value;
    setSelectedPipeline(pipelineId);
    setFormData({});
    setCurrentStage(null);
    setActiveStep(0);
    await fetchStages(pipelineId);
  };

  const handleStageChange = async (stageId, index) => {
    setCurrentStage(stageId);
    setActiveStep(index);
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
    if (!selectedPipeline) {
      showSnackbar('Please select a pipeline before saving', 'error');
      return;
    }

    if (!currentStage) {
      showSnackbar('Please select a stage before saving', 'error');
      return;
    }

    try {
      const { error: saveDataError } = await supabase.from('pipeline_data_json').upsert(
        Object.entries(formData).map(([stageId, data]) => ({
          enquiry_id: enquiryId,
          pipeline_id: selectedPipeline,
          stage_id: parseInt(stageId),
          data: data,
        })),
        { onConflict: ['enquiry_id', 'pipeline_id', 'stage_id'] }
      );

      if (saveDataError) throw saveDataError;

      const { error: updateEnquiryError } = await supabase
        .from('enquiries')
        .update({ 
          pipeline_id: selectedPipeline, 
          current_stage_id: currentStage 
        })
        .eq('id', enquiryId);

      if (updateEnquiryError) throw updateEnquiryError;

      setIsEditing(false);
      showSnackbar('Data and stage saved successfully', 'success');
    } catch (error) {
      showSnackbar(`Failed to save data: ${error.message}`, 'error');
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
        <Checkbox checked={Boolean(value)} disabled />
      );
    }

    return value || 'N/A';
  };

  useEffect(() => {
    const fieldContainer = document.getElementById('field-container');
    if (fieldContainer) {
      fieldContainer.scrollIntoView({ behavior: 'smooth' });
    }
  }, [fields]);

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <FormControl fullWidth margin="normal">
        <InputLabel>Pipeline</InputLabel>
        <Select
          value={selectedPipeline || ''}
          onChange={handlePipelineChange}
          disabled={isEditing}
        >
          {pipelines.map((pipeline) => (
            <MenuItem key={pipeline.pipeline_id} value={pipeline.pipeline_id}>
              {pipeline.pipeline_name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedPipeline ? (
        <>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mt: 4, mb: 4 }}>
            {stages.map((stage, index) => (
              <Step key={stage.stage_id} onClick={() => handleStageChange(stage.stage_id, index)}>
                <StepLabel>{stage.stage_name}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Card>
            <CardContent id="field-container">
              <Grid container spacing={4}>
                {fields.map((field) => (
                  <Grid item xs={12} sm={6} key={field.field_id}>
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
          <Box display="flex" justifyContent="flex-end" sx={{ mt: 2 }}>
            <Button variant="contained" color="primary" onClick={handleSubmit}>
              Save Stage Changes
            </Button>
          </Box>
        </>
      ) : (
        <Typography variant="body1" sx={{ mt: 2 }}>
          Please select a pipeline from the dropdown to view and edit stages.
        </Typography>
      )}

      <Snackbar
        open={snackbar.open}
        anchorOrigin={{ vertical: 'center', horizontal: 'center' }}
        autoHideDuration={2000}
        onClose={closeSnackbar}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Dialog
        open={filePreviewDialog.open}
        onClose={() => setFilePreviewDialog({ open: false, url: '', type: '' })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>File Preview</DialogTitle>
        <DialogContent>
          {filePreviewDialog.type.startsWith('image/') ? (
            <img src={filePreviewDialog.url} alt="File preview" style={{ width: '100%', height: 'auto' }} />
          ) : (
            <Typography>
              This file type cannot be previewed. Please download the file to view its contents.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFilePreviewDialog({ open: false, url: '', type: '' })} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PipelineFormJSON;
