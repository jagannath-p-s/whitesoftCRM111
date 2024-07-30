import React, { useState, useEffect } from 'react';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CommentIcon from '@mui/icons-material/Comment';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import { supabase } from '../supabaseClient';
import AddTaskDialog from './AddTaskDialog';
import PipelineFormJSON from './PipelineFormJSON';

const ContactCard = ({ contact, user, color, visibleFields }) => {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipeline, setSelectedPipeline] = useState(contact?.pipeline_id || '');
  const [error, setError] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const userInitial = user?.username ? user.username.charAt(0).toUpperCase() : 'J';
  const username = user?.username ? user.username : 'Unknown User';

  useEffect(() => {
    fetchPipelines();
    fetchUserTasks(user.id);
    const taskSubscription = supabase
      .channel('public:tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `assigned_to=eq.${user.id}` }, (payload) => {
        fetchUserTasks(user.id);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(taskSubscription);
    };
  }, []);

  const fetchPipelines = async () => {
    try {
      const { data, error } = await supabase.from('pipelines').select('*');
      if (error) throw error;
      setPipelines(data || []);
    } catch (error) {
      console.error('Error fetching pipelines:', error);
      setError('Failed to fetch pipelines. Please try again later.');
    }
  };

  const fetchUserTasks = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', userId)
        .not('completion_status', 'eq', 'completed');

      if (error) throw error;
      setTasks(data);
    } catch (error) {
      console.error('Error fetching user tasks:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch tasks. Please try again later.',
        severity: 'error'
      });
      setTasks([]);
    }
  };

  const handleInitialClick = async () => {
    await fetchUserTasks(user.id);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleEditClick = () => setEditOpen(true);
  const handleEditClose = () => setEditOpen(false);
  const handleAddClick = () => setAddTaskOpen(true);
  const handleAddTaskClose = () => setAddTaskOpen(false);

  const handlePipelineChange = (event) => {
    setSelectedPipeline(event.target.value);
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('enquiries')
        .update({ pipeline_id: selectedPipeline })
        .eq('id', contact.id);
      if (error) throw error;
      setEditOpen(false);
    } catch (error) {
      console.error('Error updating pipeline:', error);
      setError('Failed to update pipeline. Please try again later.');
    }
  };

  const getTextColorClass = (color) => {
    const colorMap = {
      blue: 'text-blue-600',
      red: 'text-red-600',
      green: 'text-green-600',
      yellow: 'text-yellow-600',
      purple: 'text-purple-600'
    };
    return colorMap[color] || 'text-gray-600';
  };

  const parseProducts = (products) => {
    if (!products) return {};
    if (typeof products === 'string') {
      try {
        return JSON.parse(products.replace(/""/g, '"'));
      } catch (error) {
        console.error('Error parsing products:', error);
        return {};
      }
    }
    return products; // If it's already an object, return as is
  };

  const products = parseProducts(contact?.products);

  if (!contact || !user) {
    return <div>Error: contact or user data is missing.</div>;
  }

  return (
    <div className="mb-4 p-4 bg-white rounded-lg shadow-md border border-gray-200 flex flex-col justify-between">
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <div>
        {visibleFields.name && <div className={`text-sm font-bold ${getTextColorClass(color)} mb-2`}>{contact.name}</div>}
        {visibleFields.mobilenumber1 && <p className="text-sm mb-1">Contact No: {contact.mobilenumber1}</p>}
        {visibleFields.mobilenumber2 && <p className="text-sm mb-1">Contact No 2: {contact.mobilenumber2}</p>}
        {visibleFields.address && <p className="text-sm mb-1">Address: {contact.address}</p>}
        {visibleFields.location && <p className="text-sm mb-1">Location: {contact.location}</p>}
        {visibleFields.stage && <p className="text-sm mb-1">Stage: {contact.stage}</p>}
        {visibleFields.mailid && <p className="text-sm mb-1">Email: {contact.mailid}</p>}
        {visibleFields.leadsource && <p className="text-sm mb-1">Lead Source: {contact.leadsource}</p>}
        {visibleFields.assignedto && <p className="text-sm mb-1">Assigned To: {username}</p>}
        {visibleFields.remarks && <p className="text-sm mb-1">Remarks: {contact.remarks}</p>}
        {visibleFields.priority && <p className="text-sm mb-1">Priority: {contact.priority}</p>}
        {visibleFields.invoiced && <p className="text-sm mb-1">Invoiced: {contact.invoiced ? 'Yes' : 'No'}</p>}
        {visibleFields.collected && <p className="text-sm mb-1">Collected: {contact.collected ? 'Yes' : 'No'}</p>}
        {visibleFields.created_at && <p className="text-sm mb-1">Date Created: {new Date(contact.created_at).toLocaleDateString()}</p>}
        {visibleFields.salesflow_code && <p className="text-sm mb-1">Salesflow Code: {contact.salesflow_code}</p>}
        {visibleFields.products && Object.values(products).length > 0 && (
          <Box mt={2}>
            <Typography variant="body2">Products:</Typography>
            {Object.values(products).map((product, index) => (
              <Chip 
                key={index}
                label={`${product.product_name} (${product.quantity})`}
                size="small"
                sx={{ mr: 1, mt: 1 }}
              />
            ))}
          </Box>
        )}
      </div>
      <div className="flex justify-end items-center space-x-2 mt-2">
        <Tooltip title="Add">
          <button className="p-1 rounded-full hover:bg-gray-200" onClick={handleAddClick}>
            <AddIcon fontSize="small" />
          </button>
        </Tooltip>
        <Tooltip title="Edit">
          <button className="p-1 rounded-full hover:bg-gray-200" onClick={handleEditClick}>
            <EditIcon fontSize="small" />
          </button>
        </Tooltip>
        <Tooltip title="Comment">
          <button className="p-1 rounded-full hover:bg-gray-200">
            <CommentIcon fontSize="small" />
          </button>
        </Tooltip>
        <Tooltip title="Assigned To">
          <div 
            className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center cursor-pointer"
            onClick={handleInitialClick}
          >
            {userInitial}
          </div>
        </Tooltip>
      </div>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Assigned Tasks</DialogTitle>
        <DialogContent>
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <Box key={task.id} mb={2}>
                <Typography variant="body1"><strong>Task Name:</strong> {task.task_name}</Typography>
                <Typography variant="body2"><strong>Task Message:</strong> {task.task_message}</Typography>
                <Typography variant="body2"><strong>Completion Status:</strong> {task.completion_status}</Typography>
              </Box>
            ))
          ) : (
            <DialogContentText>
              No tasks assigned currently. Assigned to: {username}
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editOpen} onClose={handleEditClose} fullWidth maxWidth="md">
        <DialogTitle>Edit Contact</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Pipeline</InputLabel>
            <Select value={selectedPipeline} onChange={handlePipelineChange}>
              {pipelines.map((pipeline) => (
                <MenuItem key={pipeline.pipeline_id} value={pipeline.pipeline_id}>
                  {pipeline.pipeline_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <PipelineFormJSON enquiryId={contact.id} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSave} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <AddTaskDialog
        open={addTaskOpen}
        handleClose={handleAddTaskClose}
        enquiryId={contact.id}
        assignedBy={user.id}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default ContactCard;
