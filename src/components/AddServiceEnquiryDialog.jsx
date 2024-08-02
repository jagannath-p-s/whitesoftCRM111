import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
  IconButton,
  Typography,
  Box,
  Grid,
  Paper,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip
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

const AddServiceEnquiryDialog = ({ dialogOpen, handleDialogClose, handleFormSubmit, showSnackbar }) => {
  const [formData, setFormData] = useState({
    date: dayjs(),
    jobCardNo: '',
    customerName: '',
    customerMobile: '',
    customerRemarks: '',
    machineType: [],
    complaints: [''],
    parts: [{ partId: '', partName: '', partNumber: '', qty: 1, rate: 0, amount: 0 }],
    technicians: [],
    charges: { oil: '', petrol: '', labour: '' },
    totalAmount: 0,
    totalCharges: 0,
    repairDate: null,
    expectedCompletionDate: dayjs(),
    status: 'started',
  });
  const [partsOptions, setPartsOptions] = useState([]);
  const [techniciansOptions, setTechniciansOptions] = useState([]);

  useEffect(() => {
    const fetchParts = async () => {
      const { data, error } = await supabase.from('products').select('*').eq('subcategory_id', 9); // Adjust this as needed
      if (error) console.error(error);
      else setPartsOptions(data);
    };

    const fetchTechnicians = async () => {
      const { data, error } = await supabase.from('technicians').select('id, name, employee_code');
      if (error) console.error(error);
      else setTechniciansOptions(data);
    };

    fetchParts();
    fetchTechnicians();
  }, []);

  useEffect(() => {
    calculateTotalAmount();
    calculateTotalCharges();
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
        newData.charges = { ...prevData.charges, [chargeField]: value === '' ? '' : parseFloat(value) || 0 };
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
    const partsTotal = formData.parts.reduce((sum, part) => sum + (parseFloat(part.amount) || 0), 0);
    const total = partsTotal + parseFloat(formData.totalCharges || 0);

    setFormData((prevData) => ({
      ...prevData,
      totalAmount: total.toFixed(2)
    }));
  };

  const calculateTotalCharges = () => {
    const chargesTotal = Object.values(formData.charges).reduce((sum, charge) => sum + (parseFloat(charge) || 0), 0);

    setFormData((prevData) => ({
      ...prevData,
      totalCharges: chargesTotal.toFixed(2)
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

  const handleTechnicianChange = (event) => {
    const {
      target: { value },
    } = event;
    setFormData({
      ...formData,
      technicians: typeof value === 'string' ? value.split(',') : value,
    });
  };

  const handleSubmit = async () => {
    try {
      console.log('Submitting form data:', formData);

      const complaintsJson = JSON.stringify(formData.complaints);
      const machineTypeJson = JSON.stringify(formData.machineType);
      const chargesJson = JSON.stringify(formData.charges);

      const serviceEnquiryData = {
        date: formData.date.toISOString(),
        job_card_no: formData.jobCardNo,
        customer_name: formData.customerName || null,
        customer_mobile: formData.customerMobile || null,
        customer_remarks: formData.customerRemarks || null,
        machine_type: machineTypeJson,
        complaints: complaintsJson,
        technician_name: formData.technicians.map((id) => techniciansOptions.find((tech) => tech.id === id).name).join(', '),
        charges: chargesJson,
        total_amount: parseFloat(formData.totalAmount) || 0,
        total_charges: parseFloat(formData.totalCharges) || 0,
        repair_date: formData.repairDate ? formData.repairDate.toISOString() : null,
        expected_completion_date: formData.expectedCompletionDate ? formData.expectedCompletionDate.toISOString() : null,
        status: formData.status
      };

      const { data: serviceEnquiry, error: serviceEnquiryError } = await supabase
        .from('service_enquiries')
        .insert(serviceEnquiryData)
        .select()
        .single();

      if (serviceEnquiryError) throw serviceEnquiryError;

      console.log('Service enquiry inserted:', serviceEnquiry);

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
      showSnackbar('Enquiry saved successfully!', 'success');
    } catch (error) {
      console.error('Error submitting form:', error);
      showSnackbar(`Failed to save the enquiry: ${error.message}`, 'error');
    }
  };

  return (
    <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', mb: 2 }}>
        Add Service Enquiry
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
                        {option.product_name} ({option.code})
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
            <FormControl fullWidth margin="dense">
              <InputLabel>Technicians</InputLabel>
              <Select
                multiple
                value={formData.technicians}
                onChange={handleTechnicianChange}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={techniciansOptions.find((tech) => tech.id === value)?.name} />
                    ))}
                  </Box>
                )}
              >
                {techniciansOptions.map((technician) => (
                  <MenuItem key={technician.id} value={technician.id}>
                    {technician.name} ({technician.employee_code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
                    onFocus={(e) => e.target.select()}
                    InputProps={{
                      inputProps: { min: 0 },
                    }}
                  />
                </Grid>
              ))}
            </Grid>
            <TextField
              name="totalCharges"
              label="Total Charges"
              type="number"
              variant="outlined"
              fullWidth
              margin="dense"
              value={formData.totalCharges}
              InputProps={{ readOnly: true }}
            />
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
                label="Expected Completion Date"
                value={formData.expectedCompletionDate}
                onChange={(date) => handleChange({ target: { name: 'expectedCompletionDate', value: date } })}
                slotProps={{ textField: { fullWidth: true, margin: 'dense' } }}
              />
              <DatePicker
                label="Date of Repair"
                value={formData.repairDate}
                onChange={(date) => handleChange({ target: { name: 'repairDate', value: date } })}
                slotProps={{ textField: { fullWidth: true, margin: 'dense' } }}
              />
            </LocalizationProvider>
          </StyledPaper>
        </Box>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleDialogClose} color="primary" variant="outlined">
          Cancel
        </Button>
        <Button onClick={handleSubmit} color="primary" variant="contained">
          Add Service Enquiry
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddServiceEnquiryDialog;
