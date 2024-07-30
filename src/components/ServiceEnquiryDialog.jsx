import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField, Checkbox, FormControlLabel, IconButton, Typography, Box, Grid, Paper, Divider, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import dayjs from 'dayjs';
import { supabase } from '../supabaseClient'; // Adjust the path as needed

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[3],
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  fontWeight: 600,
  color: theme.palette.primary.main,
}));

const StyledButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.error.main,
}));

const ServiceEnquiryDialog = ({ dialogOpen, handleDialogClose, handleFormSubmit, editingEnquiry }) => {
  const [formData, setFormData] = useState({
    date: dayjs(),
    jobCardNo: '',
    customerName: '',
    customerMobile: '',
    customerRemarks: '',
    machineType: [],
    complaints: [''],
    parts: [{ partId: '', partName: '', partNumber: '', qty: 1, rate: 0, amount: 0 }],
    technicianName: '',
    charges: { oil: 0, petrol: 0, labour: 0 },
    totalAmount: 0,
    repairDate: null,
    status: 'started',
  });
  const [partsOptions, setPartsOptions] = useState([]);

  useEffect(() => {
    const fetchParts = async () => {
      const { data, error } = await supabase.from('products').select('*').eq('subcategory_id', 9); // Adjust this as needed
      if (error) console.error(error);
      else setPartsOptions(data);
    };
    fetchParts();

    if (editingEnquiry) {
      setFormData({
        date: dayjs(editingEnquiry.date),
        jobCardNo: editingEnquiry.job_card_no,
        customerName: editingEnquiry.customer_name,
        customerMobile: editingEnquiry.customer_mobile,
        customerRemarks: editingEnquiry.customer_remarks,
        machineType: JSON.parse(editingEnquiry.machine_type),
        complaints: JSON.parse(editingEnquiry.complaints),
        parts: editingEnquiry.service_enquiry_parts.map(part => ({
          partId: part.part_id,
          partName: part.part_name,
          partNumber: part.part_number,
          qty: part.qty,
          rate: part.rate,
          amount: part.amount
        })),
        technicianName: editingEnquiry.technician_name,
        charges: JSON.parse(editingEnquiry.charges),
        totalAmount: editingEnquiry.total_amount,
        repairDate: editingEnquiry.repair_date ? dayjs(editingEnquiry.repair_date) : null,
        status: editingEnquiry.status
      });
    }
  }, [editingEnquiry]);

  useEffect(() => {
    calculateTotalAmount();
  }, [formData.parts, formData.charges]);

  const handleChange = (e, index, field) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => {
      let newData = { ...prevData };

      if (field) {
        newData.parts = [...prevData.parts];
        newData.parts[index] = { ...newData.parts[index], [field]: value };

        if (field === 'partId') {
          fetchPartPrice(value, index);
        } else if (field === 'qty' || field === 'rate') {
          const qty = field === 'qty' ? parseFloat(value) || 0 : parseFloat(newData.parts[index].qty) || 0;
          const rate = field === 'rate' ? parseFloat(value) || 0 : parseFloat(newData.parts[index].rate) || 0;
          newData.parts[index].amount = qty * rate;
        }
      } else if (type === 'checkbox') {
        newData.machineType = checked
          ? [...prevData.machineType, value]
          : prevData.machineType.filter((item) => item !== value);
      } else if (name.startsWith('charges.')) {
        const chargeField = name.split('.')[1];
        newData.charges = { ...prevData.charges, [chargeField]: parseFloat(value) || 0 };
      } else {
        newData[name] = value;
      }

      return newData;
    });
  };

  const handleComplaintsChange = (e, index) => {
    const newComplaints = [...formData.complaints];
    newComplaints[index] = e.target.value;
    setFormData({ ...formData, complaints: newComplaints });
  };

  const fetchPartPrice = async (partId, index) => {
    const { data, error } = await supabase
      .from('products')
      .select('price')
      .eq('product_id', partId)
      .single();

    if (error) {
      console.error('Error fetching part price:', error);
      return;
    }

    setFormData((prevData) => {
      const newParts = [...prevData.parts];
      newParts[index] = {
        ...newParts[index],
        rate: data.price,
        amount: data.price * (parseFloat(newParts[index].qty) || 1)
      };
      return { ...prevData, parts: newParts };
    });
  };

  const calculateTotalAmount = () => {
    const partsTotal = formData.parts.reduce((sum, part) => sum + (part.amount || 0), 0);
    const chargesTotal = Object.values(formData.charges).reduce((sum, charge) => sum + parseFloat(charge || 0), 0);
    const total = partsTotal + chargesTotal;

    setFormData((prevData) => ({
      ...prevData,
      totalAmount: total.toFixed(2)
    }));
  };

  const addItem = (type) => {
    setFormData((prevData) => ({
      ...prevData,
      [type]: type === 'parts'
        ? [...prevData[type], { partId: '', partName: '', partNumber: '', qty: 1, rate: 0, amount: 0 }]
        : [...prevData[type], '']
    }));
  };

  const removeItem = (type, index) => {
    setFormData((prevData) => ({
      ...prevData,
      [type]: prevData[type].filter((_, i) => i !== index)
    }));
  };

  const renderInputField = (label, name, type = 'text') => (
    <TextField
      name={name}
      label={label}
      type={type}
      variant="outlined"
      fullWidth
      margin="dense"
      value={formData[name]}
      onChange={handleChange}
    />
  );

  const renderCheckbox = (label, value) => (
    <FormControlLabel
      key={value}
      control={
        <Checkbox
          name="machineType"
          value={value}
          checked={formData.machineType.includes(value)}
          onChange={handleChange}
        />
      }
      label={label}
    />
  );

  const handleSubmit = async () => {
    try {
      console.log('Submitting form data:', formData);

      const complaintsJson = JSON.stringify(formData.complaints);
      const machineTypeJson = JSON.stringify(formData.machineType);
      const chargesJson = JSON.stringify(formData.charges);

      const serviceEnquiryData = {
        date: formData.date.toISOString(),
        job_card_no: formData.jobCardNo,
        customer_name: formData.customerName,
        customer_mobile: formData.customerMobile,
        customer_remarks: formData.customerRemarks,
        machine_type: machineTypeJson,
        complaints: complaintsJson,
        technician_name: formData.technicianName,
        charges: chargesJson,
        total_amount: parseFloat(formData.totalAmount),
        repair_date: formData.repairDate ? formData.repairDate.toISOString() : null,
        status: formData.status
      };

      let serviceEnquiry;
      if (editingEnquiry) {
        const { data, error: serviceEnquiryError } = await supabase
          .from('service_enquiries')
          .update(serviceEnquiryData)
          .eq('id', editingEnquiry.id)
          .select()
          .single();
        
        if (serviceEnquiryError) throw serviceEnquiryError;
        serviceEnquiry = data;

        // Delete old parts and insert new parts
        await supabase.from('service_enquiry_parts').delete().eq('service_enquiry_id', editingEnquiry.id);
      } else {
        const { data, error: serviceEnquiryError } = await supabase
          .from('service_enquiries')
          .insert(serviceEnquiryData)
          .select()
          .single();

        if (serviceEnquiryError) throw serviceEnquiryError;
        serviceEnquiry = data;
      }

      const partsData = formData.parts.map(part => ({
        service_enquiry_id: serviceEnquiry.id,
        part_id: parseInt(part.partId),
        part_name: part.partName,
        part_number: part.partNumber,
        qty: parseInt(part.qty),
        rate: parseFloat(part.rate),
        amount: parseFloat(part.amount)
      }));

      const { data: parts, error: partsError } = await supabase
        .from('service_enquiry_parts')
        .insert(partsData);

      if (partsError) throw partsError;

      console.log('Parts inserted:', parts);

      handleFormSubmit();
      handleDialogClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      // Handle the error, e.g., show a notification to the user
    }
  };

  return (
    <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', mb: 2 }}>
        {editingEnquiry ? 'Edit Service Enquiry' : 'Add Service Enquiry'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <StyledPaper elevation={3}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Date"
                    value={formData.date}
                    onChange={(date) => handleChange({ target: { name: 'date', value: date } })}
                    slotProps={{ textField: { fullWidth: true, margin: 'dense' } }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6}>
                {renderInputField('Job Card No', 'jobCardNo')}
              </Grid>
            </Grid>
            {renderInputField('Customer Name', 'customerName')}
            {renderInputField('Customer Mobile', 'customerMobile')}
            {renderInputField('Customer Remarks', 'customerRemarks')}
          </StyledPaper>

          <StyledPaper elevation={3}>
            <StyledTypography variant="h6">Machine Type</StyledTypography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {['Blade', 'Tap n go', 'Cup/Cup Nut', 'Side Cover, Nut', 'Bar, Bar Cover', 'Chain', 'Air filter/Cover', 'Engine only', 'Paid Service', 'With Transmission', 'Hose & Gun'].map((type) =>
                renderCheckbox(type, type)
              )}
            </Box>

            <StyledTypography variant="h6">Complaints</StyledTypography>
            {formData.complaints.map((complaint, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  name={`complaints.${index}`}
                  type="text"
                  variant="outlined"
                  fullWidth
                  margin="dense"
                  value={complaint}
                  onChange={(e) => handleComplaintsChange(e, index)}
                />
                <StyledIconButton onClick={() => removeItem('complaints', index)}>
                  <RemoveCircleIcon />
                </StyledIconButton>
              </Box>
            ))}
            <StyledButton onClick={() => addItem('complaints')} variant="contained" startIcon={<AddCircleIcon />}>
              Add Complaint
            </StyledButton>

            <StyledTypography variant="h6">Parts</StyledTypography>
            {formData.parts.map((part, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <FormControl fullWidth margin="dense">
                  <InputLabel>Part</InputLabel>
                  <Select
                    name="parts"
                    value={part.partId}
                    onChange={(e) => handleChange(e, index, 'partId')}
                    label="Part"
                  >
                    <MenuItem value="" disabled>Select a part</MenuItem>
                    {partsOptions.map((option) => (
                      <MenuItem key={option.product_id} value={option.product_id}>
                        {option.product_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  name="parts"
                  label="Qty"
                  type="number"
                  value={part.qty}
                  onChange={(e) => handleChange(e, index, 'qty')}
                  sx={{ width: '100px' }}
                />
                <TextField
                  name="parts"
                  label="Rate"
                  type="number"
                  value={part.rate}
                  onChange={(e) => handleChange(e, index, 'rate')}
                  sx={{ width: '100px' }}
                />
                <TextField
                  name="parts"
                  label="Amount"
                  type="number"
                  value={part.amount}
                  InputProps={{ readOnly: true }}
                  sx={{ width: '100px' }}
                />
                <StyledIconButton onClick={() => removeItem('parts', index)}>
                  <RemoveCircleIcon />
                </StyledIconButton>
              </Box>
            ))}
            <StyledButton onClick={() => addItem('parts')} variant="contained" startIcon={<AddCircleIcon />}>
              Add Part
            </StyledButton>
          </StyledPaper>

          <StyledPaper elevation={3}>
            {renderInputField('Name of Technician', 'technicianName')}
            <StyledTypography variant="h6">Charges</StyledTypography>
            <Grid container spacing={2}>
              {Object.keys(formData.charges).map((charge) => (
                <Grid item xs={12} sm={4} key={charge}>
                  <TextField
                    name={`charges.${charge}`}
                    label={charge.charAt(0).toUpperCase() + charge.slice(1)}
                    type="number"
                    variant="outlined"
                    fullWidth
                    margin="dense"
                    value={formData.charges[charge]}
                    onChange={handleChange}
                  />
                </Grid>
              ))}
            </Grid>
            <TextField
              name="totalAmount"
              label="Total Amount"
              type="number"
              variant="outlined"
              fullWidth
              margin="dense"
              value={formData.totalAmount}
              InputProps={{ readOnly: true }}
            />
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Completion Date"
                value={formData.repairDate}
                onChange={(date) => {
                  handleChange({ target: { name: 'repairDate', value: date } });
                  if (date) {
                    setFormData(prevData => ({ ...prevData, status: 'completed' }));
                  }
                }}
                slotProps={{ textField: { fullWidth: true, margin: 'dense' } }}
              />
            </LocalizationProvider>
          </StyledPaper>

          <StyledPaper elevation={3}>
            <FormControl fullWidth margin="dense">
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={handleChange}
                label="Status"
              >
                <MenuItem value="started">Started</MenuItem>
                <MenuItem value="ongoing">Ongoing</MenuItem>
                <MenuItem value="paused">Paused</MenuItem>
                <MenuItem value="paused due to parts unavailability">Paused due to Parts Unavailability</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </StyledPaper>
        </Box>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleDialogClose} color="primary" variant="outlined">
          Cancel
        </Button>
        <Button onClick={handleSubmit} color="primary" variant="contained">
          {editingEnquiry ? 'Update Service Enquiry' : 'Add Service Enquiry'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ServiceEnquiryDialog;
