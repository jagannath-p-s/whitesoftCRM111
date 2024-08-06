import React, { useState, useEffect, useRef } from 'react';
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
  Alert,
  Typography,
  Grid,
  Paper
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
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [incompleteTasks, setIncompleteTasks] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const calendarRef = useRef(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, employee_code');

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
    setIncompleteTasks(tasks.length);
    setSelectedUser(userId);

    if (tasks.length > 0) {
      setConfirmDialogOpen(true);
    } else {
      setAssignedTo(userId);
    }
  };

  const handleConfirmDialogClose = (confirm) => {
    setConfirmDialogOpen(false);
    if (confirm) {
      setAssignedTo(selectedUser);
    }
    setSelectedUser(null);
  };

  const handleDateTimeOptionChange = (e) => {
    setDateTimeOption(e.target.value);
    if (e.target.value === 'datetime' && calendarRef.current) {
      calendarRef.current.scrollIntoView({ behavior: 'smooth' });
    }
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
    setSnackbar({ open: false, message: '', severity: 'info' });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h5" component="div" gutterBottom>
            Add New Task
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                label="Task Name"
                type="text"
                fullWidth
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Task Message"
                type="text"
                fullWidth
                multiline
                rows={4}
                value={taskMessage}
                onChange={(e) => setTaskMessage(e.target.value)}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Assign To</InputLabel>
                <Select
                  value={assignedTo}
                  onChange={handleAssignedToChange}
                  label="Assign To"
                >
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.username} ({user.employee_code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Stage</InputLabel>
                <Select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  label="Stage"
                >
                  <MenuItem value="Lead">Lead</MenuItem>
                  <MenuItem value="Prospect">Prospect</MenuItem>
                  <MenuItem value="Opportunity">Opportunity</MenuItem>
                  <MenuItem value="Customer-Won">Customer-Won</MenuItem>
                  <MenuItem value="Lost/Rejected">Lost/Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Task Completion Time
                </Typography>
                <RadioGroup
                  value={dateTimeOption}
                  onChange={handleDateTimeOptionChange}
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
                {dateTimeOption === 'days' ? (
                  <TextField
                    margin="dense"
                    label="Days to Complete"
                    type="number"
                    fullWidth
                    value={daysToComplete}
                    onChange={(e) => setDaysToComplete(e.target.value)}
                    variant="outlined"
                  />
                ) : (
                  <Box ref={calendarRef} sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                    <StaticDateTimePicker
                      displayStaticWrapperAs="desktop"
                      openTo="day"
                      value={submissionDate}
                      onChange={(newValue) => setSubmissionDate(newValue)}
                      renderInput={(params) => <TextField {...params} />}
                    />
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose} variant="outlined">Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">Add Task</Button>
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
      <Dialog
        open={confirmDialogOpen}
        onClose={() => handleConfirmDialogClose(false)}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title">Confirm Task Assignment</DialogTitle>
        <DialogContent>
          <Typography id="confirm-dialog-description">
            This user already has {incompleteTasks} incomplete tasks. Do you still want to assign a new task to this user?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleConfirmDialogClose(false)} color="primary">
            No
          </Button>
          <Button onClick={() => handleConfirmDialogClose(true)} color="primary" autoFocus>
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default AddTaskDialog;
