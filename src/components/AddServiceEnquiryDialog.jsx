import React, { useState, useEffect } from 'react';
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
  Chip,
  Box,
  Grid,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { supabase } from '../supabaseClient';

const AddServiceEnquiryDialog = ({
  dialogOpen,
  handleDialogClose,
  handleFormSubmit,
  users,
  currentUserId,
  showSnackbar,
}) => {
  const [formData, setFormData] = useState({
    date: new Date(),
    jobCardNo: '',
    customerName: '',
    customerMobile: '',
    customerRemarks: '',
    machineType: [],
    complaints: [],
    charges: { oil: 0, petrol: 0, labour: 0 },
    totalAmount: 0,
    repairDate: null,
    status: 'started',
    expectedCompletionDate: new Date(),
    technicians: [],
  });

  const [technicians, setTechnicians] = useState([]);

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const fetchTechnicians = async () => {
    try {
      const { data, error } = await supabase.from('technicians').select('id, name');
      if (error) throw error;
      setTechnicians(data);
    } catch (error) {
      console.error('Error fetching technicians:', error.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTechnicianChange = (event) => {
    const { value } = event.target;
    setFormData((prev) => ({
      ...prev,
      technicians: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      console.log('Form data before submission:', formData);
  
      const formattedDate = formData.date ? formData.date.toISOString() : null;
      const formattedExpectedCompletionDate = formData.expectedCompletionDate ? formData.expectedCompletionDate.toISOString() : null;
  
      const enquiryToSave = {
        ...formData,
        date: formattedDate,
        expected_completion_date: formattedExpectedCompletionDate,
      };
  
      console.log('Enquiry to be saved:', enquiryToSave);
  
      const { data, error } = await supabase
        .from('service_enquiries')
        .insert([enquiryToSave]);
  
      if (error) throw error;
      console.log('Enquiry saved successfully:', data);
      showSnackbar('Enquiry saved successfully!', 'success');
      handleDialogClose();
    } catch (error) {
      console.error('Error saving enquiry:', error.message);
      showSnackbar(`Failed to save the enquiry: ${error.message}`, 'error');
    }
  };

  return (
    <Dialog open={dialogOpen} onClose={handleDialogClose}>
      <DialogTitle>Add Service Enquiry</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <DatePicker
              label="Date"
              value={formData.date}
              onChange={(date) => handleInputChange({ target: { name: 'date', value: date } })}
              renderInput={(params) => <TextField fullWidth {...params} />}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Job Card No"
              name="jobCardNo"
              value={formData.jobCardNo}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Customer Name"
              name="customerName"
              value={formData.customerName}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Customer Mobile"
              name="customerMobile"
              value={formData.customerMobile}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Customer Remarks"
              name="customerRemarks"
              value={formData.customerRemarks}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Technicians</InputLabel>
              <Select
                multiple
                value={formData.technicians}
                onChange={handleTechnicianChange}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={technicians.find((tech) => tech.id === value)?.name} />
                    ))}
                  </Box>
                )}
              >
                {technicians.map((technician) => (
                  <MenuItem key={technician.id} value={technician.id}>
                    {technician.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6">Charges</Typography>
            <TextField
              fullWidth
              label="Oil"
              name="oil"
              type="number"
              value={formData.charges.oil}
              onChange={(e) => handleInputChange({ target: { name: 'charges', value: { ...formData.charges, oil: e.target.value } } })}
            />
            <TextField
              fullWidth
              label="Petrol"
              name="petrol"
              type="number"
              value={formData.charges.petrol}
              onChange={(e) => handleInputChange({ target: { name: 'charges', value: { ...formData.charges, petrol: e.target.value } } })}
            />
            <TextField
              fullWidth
              label="Labour"
              name="labour"
              type="number"
              value={formData.charges.labour}
              onChange={(e) => handleInputChange({ target: { name: 'charges', value: { ...formData.charges, labour: e.target.value } } })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Total Amount"
              name="totalAmount"
              type="number"
              value={formData.totalAmount}
              onChange={handleInputChange}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDialogClose}>Cancel</Button>
        <Button onClick={handleSubmit} color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddServiceEnquiryDialog;
