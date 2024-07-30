import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  Radio,
  FormControlLabel,
  Box,
  Snackbar,
  Alert
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { StaticDateTimePicker } from '@mui/x-date-pickers/StaticDateTimePicker';
import dayjs from 'dayjs';

const AddTaskDialog = ({ open, handleClose, enquiryId, assignedBy }) => {
  const [taskName, setTaskName] = useState('');
  const [taskMessage, setTaskMessage] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [users, setUsers] = useState([]);
  const [stage, setStage] = useState('Lead');
  const [dateTimeOption, setDateTimeOption] = useState('days');
  const [daysToComplete, setDaysToComplete] = useState('');
  const [submissionDate, setSubmissionDate] = useState(dayjs());
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, username');

      if (error) {
        console.error('Error fetching users:', error);
      } else {
        setUsers(data);
      }
    };

    fetchUsers();
  }, []);

  const fetchUserTasks = async (userId) => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to', userId)
      .not('completion_status', 'eq', 'completed');

    if (error) {
      console.error('Error fetching user tasks:', error);
      return [];
    }

    return data;
  };

  const handleAssignedToChange = async (e) => {
    const userId = e.target.value;
    const tasks = await fetchUserTasks(userId);

    if (tasks.length > 0) {
      setSnackbar({
        open: true,
        message: 'This user has incomplete tasks. Please complete existing tasks first.',
        severity: 'warning'
      });
      return;
    }

    setAssignedTo(userId);
  };

  const handleSubmit = async () => {
    const calculatedSubmissionDate = dateTimeOption === 'days'
      ? dayjs().add(daysToComplete, 'day')
      : submissionDate;

    try {
      // Insert the new task
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .insert({
          task_name: taskName,
          task_message: taskMessage,
          enquiry_id: enquiryId,
          type: 'product',
          assigned_by: assignedBy,
          assigned_to: assignedTo,
          submission_date: calculatedSubmissionDate.toISOString()
        });

      if (taskError) throw taskError;
      console.log('Task added successfully:', taskData);

      // Fetch the current enquiry data
      const { data: enquiryData, error: enquiryFetchError } = await supabase
        .from('enquiries')
        .select('salesflow_code, assignedto')
        .eq('id', enquiryId)
        .single();

      if (enquiryFetchError) throw enquiryFetchError;

      // Determine all users who have participated
      let participants = enquiryData.salesflow_code ? enquiryData.salesflow_code.split('-') : [];

      // Add points to the previous user if there is one
      const previousUser = enquiryData.assignedto;
      if (previousUser) {
        // Check if the previous user already received points for this enquiry
        const { data: pointsData, error: pointsCheckError } = await supabase
          .from('salesman_points')
          .select('*')
          .eq('user_id', previousUser)
          .eq('enquiry_id', enquiryId);

        if (pointsCheckError) throw pointsCheckError;

        if (pointsData.length === 0) {
          // Add points to the previous user if they haven't received points for this enquiry
          const { data: newPointsData, error: pointsAddError } = await supabase
            .from('salesman_points')
            .insert({
              user_id: previousUser,
              points: 1,
              enquiry_id: enquiryId
            });

          if (pointsAddError) throw pointsAddError;
          console.log('Points added to previous user:', newPointsData);
        }
      }

      // Prevent multiple points to the same user for the same enquiry
      if (!participants.includes(assignedTo.toString())) {
        participants.push(assignedTo);
      }

      // Update the salesflow_code with the new assigned user
      const salesflow_code = participants.join('-');

      // Update the stage, salesflow_code, and assignedto of the enquiry
      const { data: updatedEnquiryData, error: enquiryUpdateError } = await supabase
        .from('enquiries')
        .update({ stage, salesflow_code, assignedto: assignedTo })
        .eq('id', enquiryId);

      if (enquiryUpdateError) throw enquiryUpdateError;
      console.log('Enquiry stage and assignedto updated successfully:', updatedEnquiryData);

      handleClose();
    } catch (error) {
      console.error('Error adding task or updating enquiry:', error);
      setSnackbar({
        open: true,
        message: `Failed to add task or update enquiry: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ open: false, message: '', severity: 'success' });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Add New Task</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Task Name"
            type="text"
            fullWidth
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Task Message"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={taskMessage}
            onChange={(e) => setTaskMessage(e.target.value)}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Assigned To</InputLabel>
            <Select
              value={assignedTo}
              onChange={handleAssignedToChange}
            >
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.username}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Stage</InputLabel>
            <Select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
            >
              <MenuItem value="Lead">Lead</MenuItem>
              <MenuItem value="Prospect">Prospect</MenuItem>
              <MenuItem value="Opportunity">Opportunity</MenuItem>
              <MenuItem value="Customer-Won">Customer-Won</MenuItem>
              <MenuItem value="Lost/Rejected">Lost/Rejected</MenuItem>
            </Select>
          </FormControl>
          <FormControl component="fieldset" fullWidth margin="dense">
            <RadioGroup
              value={dateTimeOption}
              onChange={(e) => setDateTimeOption(e.target.value)}
            >
              <FormControlLabel
                value="days"
                control={<Radio />}
                label="Days to Complete"
              />
              <FormControlLabel
                value="datetime"
                control={<Radio />}
                label="Pick Date & Time"
              />
            </RadioGroup>
          </FormControl>
          {dateTimeOption === 'days' ? (
            <TextField
              margin="dense"
              label="Days to Complete"
              type="number"
              fullWidth
              value={daysToComplete}
              onChange={(e) => setDaysToComplete(e.target.value)}
            />
          ) : (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <StaticDateTimePicker
                displayStaticWrapperAs="desktop"
                openTo="day"
                value={submissionDate}
                onChange={(newValue) => setSubmissionDate(newValue)}
                renderInput={(params) => <TextField {...params} />}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Add Task</Button>
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
    </LocalizationProvider>
  );
};

export default AddTaskDialog;
