import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Snackbar,
  Alert,
  Breadcrumbs,
  Link,
  Tooltip,
  Divider,
} from '@mui/material';
import { Delete, Add, ArrowBack, ArrowForward, TextFields, CheckBox, AttachFile, Edit } from '@mui/icons-material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { styled } from '@mui/material/styles';
import { supabase } from '../supabaseClient';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginTop: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[3],
}));

const StyledButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(1),
  borderRadius: theme.shape.borderRadius * 2,
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

const StyledListItem = styled(ListItem)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  transition: 'background-color 0.3s',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  '&::before': {
    content: 'none',
  },
}));

const Pipelines = () => {
  const [pipelines, setPipelines] = useState([]);
  const [stages, setStages] = useState([]);
  const [fields, setFields] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentPipeline, setCurrentPipeline] = useState(null);
  const [currentStage, setCurrentStage] = useState(null);
  const [currentField, setCurrentField] = useState(null);
  const [dialogType, setDialogType] = useState('pipeline');
  const [formData, setFormData] = useState({ name: '', type: 'textfield' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: '', item: null });

  const fetchData = useCallback(async (table, filters = []) => {
    let query = supabase.from(table).select('*');
    filters.forEach(({ column, value }) => {
      query = query.eq(column, value);
    });

    const { data, error } = await query;
    if (error) {
      showSnackbar(`Error fetching ${table}: ${error.message}`, 'error');
      return [];
    }
    return data;
  }, []);

  useEffect(() => {
    fetchData('pipelines').then(setPipelines);
  }, [fetchData]);

  useEffect(() => {
    if (currentPipeline) {
      fetchData('pipeline_stages', [{ column: 'pipeline_id', value: currentPipeline.pipeline_id }]).then(setStages);
    }
  }, [currentPipeline, fetchData]);

  useEffect(() => {
    if (currentStage) {
      fetchData('pipeline_fields', [{ column: 'stage_id', value: currentStage.stage_id }]).then(setFields);
    }
  }, [currentStage, fetchData]);

  const handleOpenDialog = (type, item = null) => {
    setDialogType(type);
    setFormData({
      name: item?.name || item?.pipeline_name || item?.stage_name || item?.field_name || '',
      type: item?.type || item?.field_type || 'textfield',
    });
    setOpenDialog(true);

    if (type === 'pipeline') {
      setCurrentPipeline(item);
    } else if (type === 'stage') {
      setCurrentStage(item);
    } else if (type === 'field') {
      setCurrentField(item);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({ name: '', type: 'textfield' });
  };

  const handleFormSubmit = async () => {
    const submitFunctions = {
      pipeline: handlePipelineSubmit,
      stage: handleStageSubmit,
      field: handleFieldSubmit,
    };

    const result = await submitFunctions[dialogType]();

    if (result.error) {
      showSnackbar(`Error: ${result.error.message}`, 'error');
    } else {
      showSnackbar(`${dialogType} ${currentPipeline || currentStage || currentField ? 'updated' : 'added'} successfully`, 'success');
      handleCloseDialog();
      if (dialogType === 'pipeline') fetchData('pipelines').then(setPipelines);
      if (dialogType === 'stage' && currentPipeline) fetchData('pipeline_stages', [{ column: 'pipeline_id', value: currentPipeline.pipeline_id }]).then(setStages);
      if (dialogType === 'field' && currentStage) fetchData('pipeline_fields', [{ column: 'stage_id', value: currentStage.stage_id }]).then(setFields);
    }
  };

  const handlePipelineSubmit = async () => {
    const { pipeline_id } = currentPipeline || {};
    return pipeline_id
      ? await supabase.from('pipelines').update({ pipeline_name: formData.name }).eq('pipeline_id', pipeline_id)
      : await supabase.from('pipelines').insert({ pipeline_name: formData.name });
  };

  const handleStageSubmit = async () => {
    const { stage_id } = currentStage || {};
    return stage_id
      ? await supabase.from('pipeline_stages').update({ stage_name: formData.name }).eq('stage_id', stage_id)
      : await supabase.from('pipeline_stages').insert({ stage_name: formData.name, pipeline_id: currentPipeline.pipeline_id });
  };

  const handleFieldSubmit = async () => {
    const { field_id } = currentField || {};
    return field_id
      ? await supabase.from('pipeline_fields').update({ field_name: formData.name, field_type: formData.type }).eq('field_id', field_id)
      : await supabase.from('pipeline_fields').insert({ field_name: formData.name, field_type: formData.type, stage_id: currentStage.stage_id });
  };

  const handleDelete = (type, item) => {
    setConfirmDialog({ open: true, type, item });
  };

  const confirmDelete = async () => {
    const { type, item } = confirmDialog;
    const deleteOperations = {
      pipeline: { table: 'pipelines', key: 'pipeline_id', refresh: () => fetchData('pipelines').then(setPipelines) },
      stage: { table: 'pipeline_stages', key: 'stage_id', refresh: () => fetchData('pipeline_stages', [{ column: 'pipeline_id', value: currentPipeline.pipeline_id }]).then(setStages) },
      field: { table: 'pipeline_fields', key: 'field_id', refresh: () => fetchData('pipeline_fields', [{ column: 'stage_id', value: currentStage.stage_id }]).then(setFields) },
    };

    const { table, key, refresh } = deleteOperations[type];
    const result = await supabase.from(table).delete().eq(key, item[key]);

    if (result.error) {
      showSnackbar(`Error deleting ${type}: ${result.error.message}`, 'error');
    } else {
      showSnackbar(`${type} deleted successfully`, 'success');
      refresh();
      setConfirmDialog({ open: false, type: '', item: null });
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const getIconForFieldType = (type) => {
    switch (type) {
      case 'textfield':
        return <TextFields />;
      case 'checkbox':
        return <CheckBox />;
      case 'file':
        return <AttachFile />;
      default:
        return null;
    }
  };

  const renderPipelineCard = (pipeline) => (
    <StyledPaper key={pipeline.pipeline_id}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight="bold" onClick={() => setCurrentPipeline(pipeline)}>
          {pipeline.pipeline_name}
        </Typography>
        <Box>
          <Tooltip title="Delete Pipeline">
            <IconButton onClick={(e) => { e.stopPropagation(); handleDelete('pipeline', pipeline); }} size="small">
              <Delete />
            </IconButton>
          </Tooltip>
          <Tooltip title="View Stages">
            <IconButton onClick={(e) => { e.stopPropagation(); setCurrentPipeline(pipeline); }} size="small">
              <ArrowForward />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </StyledPaper>
  );

  const renderStageListItem = (stage) => (
    <StyledListItem key={stage.stage_id}>
      <ListItemText
        primary={
          <Typography variant="subtitle1" fontWeight="bold" onClick={() => setCurrentStage(currentStage?.stage_id === stage.stage_id ? null : stage)}>
            {stage.stage_name}
          </Typography>
        }
      />
      <ListItemSecondaryAction>
        <Tooltip title="Delete Stage">
          <StyledIconButton onClick={(e) => { e.stopPropagation(); handleDelete('stage', stage); }} size="small">
            <Delete />
          </StyledIconButton>
        </Tooltip>
        <Tooltip title="View Fields">
          <StyledIconButton onClick={(e) => { e.stopPropagation(); setCurrentStage(stage); }} size="small">
            <ArrowForward />
          </StyledIconButton>
        </Tooltip>
      </ListItemSecondaryAction>
    </StyledListItem>
  );

  const renderFieldListItem = (field) => (
    <StyledListItem key={field.field_id}>
      <ListItemText
        primary={
          <Box display="flex" alignItems="center">
            {getIconForFieldType(field.field_type)}
            <Typography variant="body1" fontWeight="bold" ml={1}>{field.field_name}</Typography>
          </Box>
        }
      />
      <ListItemSecondaryAction>
        <Tooltip title="Edit Field">
          <StyledIconButton onClick={(e) => { e.stopPropagation(); handleOpenDialog('field', field); }} size="small">
            <Edit />
          </StyledIconButton>
        </Tooltip>
        <Tooltip title="Delete Field">
          <StyledIconButton onClick={(e) => { e.stopPropagation(); handleDelete('field', field); }} size="small">
            <Delete />
          </StyledIconButton>
        </Tooltip>
      </ListItemSecondaryAction>
    </StyledListItem>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-4">
              <AccountTreeIcon className="text-blue-500" style={{ fontSize: '1.75rem' }} />
              <h1 className="text-xl font-semibold ml-2">Pipelines</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Tooltip title="Add new pipeline">
                <IconButton
                  className="p-2"
                  onClick={() => handleOpenDialog('pipeline')}
                  style={{ backgroundColor: '#e3f2fd', color: '#1e88e5', borderRadius: '12px' }}
                >
                  <Add style={{ fontSize: '1.75rem' }} />
                </IconButton>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      <Container maxWidth="md" className="flex-grow p-4 space-x-4 overflow-x-auto">
        <StyledPaper>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
              <Link underline="hover" color="inherit" onClick={() => { setCurrentStage(null); setCurrentPipeline(null); }}>
                Pipelines
              </Link>
              {currentPipeline && (
                <Link underline="hover" color="inherit" onClick={() => setCurrentStage(null)}>
                  {currentPipeline.pipeline_name}
                </Link>
              )}
              {currentStage && <Link underline="hover" color="inherit">{currentStage.stage_name}</Link>}
            </Breadcrumbs>
            <Divider sx={{ mb: 3 }} />
          </Box>
          {!currentPipeline && (
            <List>
              {pipelines.map((pipeline) => renderPipelineCard(pipeline))}
            </List>
          )}
          {currentPipeline && !currentStage && (
            <>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Stages of {currentPipeline.pipeline_name}
                </Typography>
                <Tooltip title="Back to Pipelines">
                  <StyledIconButton onClick={() => setCurrentPipeline(null)} size="small">
                    <ArrowBack />
                  </StyledIconButton>
                </Tooltip>
              </Box>
              <List>
                {stages.map((stage) => renderStageListItem(stage))}
              </List>
              <Box mt={2}>
                <StyledButton
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => handleOpenDialog('stage')}
                  color="primary"
                >
                  Add Stage
                </StyledButton>
              </Box>
            </>
          )}
          {currentStage && (
            <>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Fields of {currentStage.stage_name}
                </Typography>
                <Tooltip title="Back to Stages">
                  <StyledIconButton onClick={() => setCurrentStage(null)} size="small">
                    <ArrowBack />
                  </StyledIconButton>
                </Tooltip>
              </Box>
              <List>
                {fields.map((field) => renderFieldListItem(field))}
              </List>
              <Box mt={2}>
                <StyledButton
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => handleOpenDialog('field')}
                  color="primary"
                >
                  Add Field
                </StyledButton>
              </Box>
            </>
          )}
        </StyledPaper>

        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle>{(currentPipeline && dialogType === 'pipeline') || (currentStage && dialogType === 'stage') || (currentField && dialogType === 'field') ? 'Edit' : 'Add'} {dialogType}</DialogTitle>
          <DialogContent>
            <TextField
              label="Name"
              fullWidth
              margin="normal"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            />
            {dialogType === 'field' && (
              <FormControl fullWidth margin="normal">
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
                >
                  <MenuItem value="textfield">Textfield</MenuItem>
                  <MenuItem value="checkbox">Checkbox</MenuItem>
                  <MenuItem value="file">File</MenuItem>
                </Select>
              </FormControl>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleFormSubmit} variant="contained" color="primary">
              {(currentPipeline && dialogType === 'pipeline') || (currentStage && dialogType === 'stage') || (currentField && dialogType === 'field') ? 'Update' : 'Submit'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, type: '', item: null })}>
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to delete this {confirmDialog.type}?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDialog({ open: false, type: '', item: null })}>Cancel</Button>
            <Button onClick={confirmDelete} variant="contained" color="primary">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </div>
  );
};

export default Pipelines;
