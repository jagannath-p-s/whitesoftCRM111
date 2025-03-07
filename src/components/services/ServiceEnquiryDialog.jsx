import React, { useState, useEffect, useRef } from 'react';
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
  Chip,
  Autocomplete,
  Tooltip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import PrintIcon from '@mui/icons-material/Print';
import dayjs from 'dayjs';
import { supabase } from '../../supabaseClient';
import { useReactToPrint } from 'react-to-print';

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

// Styling for print media
const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
    .printable-content, .printable-content * {
      visibility: visible;
    }
    .printable-content {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
    }
    .no-print {
      display: none;
    }
  }
`;

const ServiceEnquiryDialog = ({
  dialogOpen,
  handleDialogClose,
  handleFormSubmit,
  editingEnquiry,
  techniciansOptions,
}) => {
  const [formData, setFormData] = useState({
    date: dayjs(),
    jobCardNo: '',
    customerName: '',
    customerMobile: '',
    customerRemarks: '',
    companyRemarks: '',
    machineType: '', // New separate field for machine
    complaintType: [],
    complaints: [''],
    parts: [
      {
        partId: '',
        partName: '',
        partNumber: '',
        qty: 1,
        rate: 0,
        amount: 0,
      },
    ],
    technicians: [],
    charges: { mistCharges: 0, oilPetrol: 0, labour: 0 },
    advance: 0, // New field for advance payment
    totalAmount: 0,
    balanceAmount: 0, // New field to calculate balance after advance
    repairDate: null,
    expectedCompletionDate: null,
    expectedDeliveryDate: null,
    status: 'started',
  });
  const [partsOptions, setPartsOptions] = useState([]);
  const printComponentRef = useRef();

  const fetchProductsPaginated = async () => {
    try {
      // First get total count
      const { count, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('Error counting products:', countError);
        return;
      }
      console.log(`Total products in database: ${count}`);
      
      // Determine how many pages we need if we fetch 1000 items per page
      const pageSize = 1000;
      const pages = Math.ceil(count / pageSize);
      let allProducts = [];
      
      // Fetch each page
      for (let page = 0; page < pages; page++) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        
        const { data, error } = await supabase
          .from('products')
          .select('*, categories(category_id, category_name)')
          .range(from, to);
        
        if (error) {
          console.error(`Error fetching page ${page + 1}:`, error);
          continue; // Try to continue with other pages
        }
        
        console.log(`Fetched page ${page + 1}/${pages} with ${data.length} products`);
        allProducts = [...allProducts, ...data];
      }
      
      // Validate the products data before setting state
      const validProducts = allProducts.filter(product => 
        product && 
        product.product_id && 
        (product.item_name || product.barcode_number)
      );
      
      console.log(`Valid products for display: ${validProducts.length} out of ${allProducts.length} total fetched`);
      setPartsOptions(validProducts);
    } catch (error) {
      console.error('Error fetching parts with pagination:', error);
    }
  };

  // Update your useEffect to use the paginated fetch
  useEffect(() => {
    // Fetch all products with pagination
    fetchProductsPaginated();
    
    // The rest of your effect code for editing an enquiry
    if (editingEnquiry) {
      // Your existing code for editing an enquiry
      const parsedComplaintType = JSON.parse(editingEnquiry.machine_type);
      // Extract machine type if it exists in the enhanced format
      const machineTypeName = 
        typeof parsedComplaintType === 'object' && parsedComplaintType.machineType 
          ? parsedComplaintType.machineType 
          : '';
      // Get the complaint types array, supporting both formats
      const complaintTypes = 
        typeof parsedComplaintType === 'object' && Array.isArray(parsedComplaintType.types)
          ? parsedComplaintType.types
          : parsedComplaintType;
          
      const parsedComplaints = JSON.parse(editingEnquiry.complaints);
      const parsedCharges = JSON.parse(editingEnquiry.charges);
      const mappedCharges = {
        mistCharges: parsedCharges.oil || 0,
        oilPetrol: parsedCharges.petrol || 0,
        labour: parsedCharges.labour || 0,
      };
      // Get advance from charges if it exists
      const advanceAmount = parsedCharges.advance || 0;
      const repairDate = editingEnquiry.repair_date
        ? dayjs(editingEnquiry.repair_date)
        : null;
      const expectedCompletionDate = editingEnquiry.expected_completion_date
        ? dayjs(editingEnquiry.expected_completion_date)
        : null;
      const expectedDeliveryDate = editingEnquiry.expected_delivery_date
        ? dayjs(editingEnquiry.expected_delivery_date)
        : null;

      setFormData({
        date: dayjs(editingEnquiry.date),
        jobCardNo: editingEnquiry.job_card_no,
        customerName: editingEnquiry.customer_name,
        customerMobile: editingEnquiry.customer_mobile,
        customerRemarks: editingEnquiry.customer_remarks,
        companyRemarks: editingEnquiry.company_remarks || '',
        machineType: machineTypeName, // Load machine type from the JSON
        complaintType: complaintTypes,
        complaints: parsedComplaints,
        parts: editingEnquiry.service_enquiry_parts.map((part) => ({
          partId: part.part_id,
          partName: part.part_name,
          partNumber: part.part_number,
          qty: part.qty,
          rate: part.rate,
          amount: part.amount,
        })),
        technicians: editingEnquiry.technician_name
          ? editingEnquiry.technician_name
              .split(', ')
              .map((name) => {
                const tech = techniciansOptions.find((t) => t.name === name);
                return tech ? tech.id : null;
              })
              .filter((id) => id !== null)
          : [],
        charges: mappedCharges,
        advance: advanceAmount, // Load advance from charges
        totalAmount: editingEnquiry.total_amount,
        balanceAmount: editingEnquiry.total_amount - advanceAmount,
        repairDate: repairDate,
        expectedCompletionDate: expectedCompletionDate,
        expectedDeliveryDate: expectedDeliveryDate,
        status: editingEnquiry.status,
      });
    } else {
      // Fetch max job card number when adding a new enquiry
      const fetchMaxJobCardNo = async () => {
        const { data, error } = await supabase
          .from('service_enquiries')
          .select('job_card_no');

        if (error) {
          console.error('Error fetching job card numbers:', error);
          setFormData((prevData) => ({ ...prevData, jobCardNo: '1' }));
        } else if (data && data.length > 0) {
          const jobCardNos = data
            .map((item) => parseInt(item.job_card_no, 10))
            .filter((num) => !isNaN(num));
          const maxJobCardNo =
            jobCardNos.length > 0 ? Math.max(...jobCardNos) : 0;
          const newJobCardNo = maxJobCardNo + 1;
          setFormData((prevData) => ({
            ...prevData,
            jobCardNo: newJobCardNo.toString(),
          }));
        } else {
          setFormData((prevData) => ({ ...prevData, jobCardNo: '1' }));
        }
      };

      fetchMaxJobCardNo();
    }
  }, [editingEnquiry, techniciansOptions]);

  useEffect(() => {
    calculateTotalAmount();
  }, [formData.parts, formData.charges, formData.advance]);

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
          const qty =
            field === 'qty'
              ? parseFloat(value) || 0
              : parseFloat(newData.parts[index].qty) || 0;
          const rate =
            field === 'rate'
              ? parseFloat(value) || 0
              : parseFloat(newData.parts[index].rate) || 0;
          newData.parts[index].amount = qty * rate;
        }
      } else if (type === 'checkbox') {
        newData.complaintType = checked
          ? [...prevData.complaintType, value]
          : prevData.complaintType.filter((item) => item !== value);
      } else if (name.startsWith('charges.')) {
        const chargeField = name.split('.')[1];
        newData.charges = {
          ...prevData.charges,
          [chargeField]: parseFloat(value) || 0,
        };
      } else if (name === 'advance') {
        // Handle advance payment specially
        newData.advance = parseFloat(value) || 0;
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

  const handleTechnicianChange = (event) => {
    const {
      target: { value },
    } = event;
    setFormData({
      ...formData,
      technicians: typeof value === 'string' ? value.split(',') : value,
    });
  };

  const fetchPartPrice = async (partId, index) => {
    const { data, error } = await supabase
      .from('products')
      .select('price, item_name, barcode_number')
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
        amount: data.price * (parseFloat(newParts[index].qty) || 1),
        partName: data.item_name,
        partNumber: data.barcode_number,
      };
      return { ...prevData, parts: newParts };
    });
  };

  const calculateTotalAmount = () => {
    const partsTotal = formData.parts.reduce(
      (sum, part) => sum + (part.amount || 0),
      0
    );
    const chargesTotal = Object.values(formData.charges).reduce(
      (sum, charge) => sum + parseFloat(charge || 0),
      0
    );
    const total = partsTotal + chargesTotal;
    const advance = parseFloat(formData.advance) || 0;
    const balance = total - advance;

    setFormData((prevData) => ({
      ...prevData,
      totalAmount: total.toFixed(2),
      balanceAmount: balance.toFixed(2)
    }));
  };

  const addItem = (type) => {
    setFormData((prevData) => ({
      ...prevData,
      [type]:
        type === 'parts'
          ? [
              ...prevData[type],
              {
                partId: '',
                partName: '',
                partNumber: '',
                qty: 1,
                rate: 0,
                amount: 0,
              },
            ]
          : [...prevData[type], ''],
    }));
  };

  const removeItem = (type, index) => {
    setFormData((prevData) => ({
      ...prevData,
      [type]: prevData[type].filter((_, i) => i !== index),
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

  const renderCheckbox = (value, options) => {
    if (!options || !Array.isArray(options)) {
      return false;
    }
    return options.includes(value);
  };

  // Setup print handler
  const handlePrint = useReactToPrint({
    content: () => printComponentRef.current,
    documentTitle: `Service_Bill_${formData.jobCardNo}`,
    onBeforeGetContent: () => {
      return new Promise((resolve) => {
        console.log("Preparing print content...");
        console.log("Print ref exists:", !!printComponentRef.current);
        resolve();
      });
    },
    onAfterPrint: () => {
      console.log("Print completed");
    },
    onPrintError: (error) => {
      console.error("Print error:", error);
    }
  });

  const handleSubmit = async () => {
    try {
      console.log('Submitting form data:', formData);

      // Create an enhanced complaintType that includes the machine name
      const enhancedComplaintType = {
        machineType: formData.machineType, // Store machine type in this JSON
        types: formData.complaintType
      };
      const complaintTypeJson = JSON.stringify(enhancedComplaintType);
      const complaintsJson = JSON.stringify(formData.complaints);

      // Map 'mistCharges' and 'oilPetrol' back to 'oil' and 'petrol' for saving
      // Also include advance payment within the charges JSON
      const chargesForSave = {
        oil: formData.charges.mistCharges || 0,
        petrol: formData.charges.oilPetrol || 0,
        labour: formData.charges.labour || 0,
        advance: parseFloat(formData.advance) || 0 // Store advance in charges JSON
      };
      const chargesJson = JSON.stringify(chargesForSave);

      // Prepare service enquiry data object with fields that match your database schema
      const serviceEnquiryData = {
        date: formData.date.toISOString(),
        job_card_no: formData.jobCardNo,
        customer_name: formData.customerName,
        customer_mobile: formData.customerMobile,
        customer_remarks: formData.customerRemarks,
        company_remarks: formData.companyRemarks,
        machine_type: complaintTypeJson,
        complaints: complaintsJson,
        technician_name: formData.technicians
          .map((id) => techniciansOptions.find((tech) => tech.id === id)?.name)
          .join(', '),
        charges: chargesJson,
        total_amount: parseFloat(formData.totalAmount),
        repair_date: formData.repairDate
          ? formData.repairDate.toISOString()
          : null,
        expected_completion_date: formData.expectedCompletionDate
          ? formData.expectedCompletionDate.toISOString()
          : null,
        expected_delivery_date: formData.expectedDeliveryDate
          ? formData.expectedDeliveryDate.toISOString()
          : null,
        status: formData.status,
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

        // Track and save technician changes
        const oldTechnicians = editingEnquiry.technician_name
          ? editingEnquiry.technician_name.split(', ')
          : [];
        const newTechnicians = formData.technicians.map(
          (id) => techniciansOptions.find((tech) => tech.id === id)?.name
        );

        if (JSON.stringify(oldTechnicians) !== JSON.stringify(newTechnicians)) {
          const changes = {
            oldTechnicians,
            newTechnicians,
            changedAt: new Date().toISOString(),
          };
          await supabase.from('technician_changes').insert({
            service_id: serviceEnquiry.id,
            changes: JSON.stringify(changes),
          });
        }

        // Delete old parts and insert new parts
        await supabase
          .from('service_enquiry_parts')
          .delete()
          .eq('service_enquiry_id', editingEnquiry.id);
      } else {
        const { data, error: serviceEnquiryError } = await supabase
          .from('service_enquiries')
          .insert(serviceEnquiryData)
          .select()
          .single();

        if (serviceEnquiryError) throw serviceEnquiryError;
        serviceEnquiry = data;
      }

      const partsData = formData.parts.map((part) => ({
        service_enquiry_id: serviceEnquiry.id,
        part_id: parseInt(part.partId),
        part_name: part.partName,
        part_number: part.partNumber,
        qty: parseInt(part.qty),
        rate: parseFloat(part.rate),
        amount: parseFloat(part.amount),
      }));

      const { data: parts, error: partsError } = await supabase
        .from('service_enquiry_parts')
        .insert(partsData);

      if (partsError) throw partsError;

      console.log('Parts inserted:', parts);

      // Call the parent's handleFormSubmit with the complete service enquiry data
      handleFormSubmit(serviceEnquiry);
      handleDialogClose();
    } catch (error) {
      console.log('Error submitting form:', error);
      // Handle the error with more detailed logging
      console.error('Error details:', error.details);
      alert(`Error submitting form: ${error.message || 'Unknown error'}`);
    }
  };

  // Mapping for charge labels
  const chargeLabels = {
    mistCharges: 'Mist Charges',
    oilPetrol: 'Oil/Petrol',
    labour: 'Labour',
  };

  // Format a number as currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // Simple print fallback method
  const handlePrintFallback = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print the bill');
      return;
    }
    
    const content = printComponentRef.current.innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Service Bill #${formData.jobCardNo}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; }
          th { background-color: #f2f2f2; }
          .text-right { text-align: right; }
          .signature-line { border-top: 1px solid #000; margin-top: 50px; padding-top: 5px; width: 70%; text-align: center; }
          @media print {
            button { display: none; }
          }
        </style>
      </head>
      <body>
        ${content}
        <div style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()">Print</button>
          <button onclick="window.close()">Close</button>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  return (
    <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ mb: 2 }}>
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
                    onChange={(date) =>
                      handleChange({
                        target: { name: 'date', value: date },
                      })
                    }
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
            {renderInputField('Company Remarks', 'companyRemarks')}
          </StyledPaper>

          <StyledPaper elevation={3}>
            {/* New Machine Type field */}
            <StyledTypography variant="h6">Machine Details</StyledTypography>
            <TextField
              name="machineType"
              label="Machine Type/Model"
              type="text"
              variant="outlined"
              fullWidth
              margin="dense"
              value={formData.machineType}
              onChange={handleChange}
            />

            <StyledTypography variant="h6">Complaint Type</StyledTypography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {[
                'Blade',
                'Tap n go',
                'Cup/Cup Nut',
                'Side Cover, Nut',
                'Bar, Bar Cover',
                'Chain',
                'Air filter/Cover',
                'Engine only',
                'Paid Service',
                'With Transmission',
                'Hose & Gun',
              ].map((type) => (
                <FormControlLabel
                  key={type}
                  control={
                    <Checkbox
                      checked={renderCheckbox(type, formData.complaintType)}
                      onChange={(e) => handleChange(e)}
                      value={type}
                    />
                  }
                  label={type}
                />
              ))}
            </Box>

            <StyledTypography variant="h6">Complaints</StyledTypography>
            {formData.complaints.map((complaint, index) => (
              <Box
                key={index}
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <TextField
                  name={`complaints.${index}`}
                  label={`Complaint ${index + 1}`}
                  type="text"
                  variant="outlined"
                  fullWidth
                  margin="dense"
                  value={complaint}
                  onChange={(e) => handleComplaintsChange(e, index)}
                />
                <StyledIconButton
                  onClick={() => removeItem('complaints', index)}
                >
                  <RemoveCircleIcon />
                </StyledIconButton>
              </Box>
            ))}
            <StyledButton
              onClick={() => addItem('complaints')}
              variant="contained"
              startIcon={<AddCircleIcon />}
            >
              Add Complaint
            </StyledButton>

            <StyledTypography variant="h6">Parts</StyledTypography>
            {formData.parts.map((part, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 2,
                }}
              >
                {/* Autocomplete for Part Selection */}
                <Autocomplete
                  options={partsOptions}
                  getOptionLabel={(option) =>
                    `${option?.item_name || ''} (${option?.barcode_number || ''})`
                  }
                  filterOptions={(options, { inputValue }) =>
                    options.filter(
                      (option) =>
                        (option.item_name?.toLowerCase() || '').includes(
                          inputValue?.toLowerCase() || ''
                        ) ||
                        (option.barcode_number?.toLowerCase() || '').includes(
                          inputValue?.toLowerCase() || ''
                        )
                    )
                  }
                  value={
                    partsOptions.find(
                      (option) => option.product_id === part.partId
                    ) || null
                  }
                  onChange={(event, newValue) => {
                    if (newValue) {
                      setFormData((prevData) => {
                        const newParts = [...prevData.parts];
                        newParts[index] = {
                          ...newParts[index],
                          partId: newValue.product_id,
                          partName: newValue.item_name || '',
                          partNumber: newValue.barcode_number || '',
                          rate: newValue.price || 0,
                          amount:
                            (newValue.price || 0) *
                            (parseFloat(newParts[index].qty) || 1),
                        };
                        return { ...prevData, parts: newParts };
                      });
                    } else {
                      setFormData((prevData) => {
                        const newParts = [...prevData.parts];
                        newParts[index] = {
                          ...newParts[index],
                          partId: '',
                          partName: '',
                          partNumber: '',
                          rate: 0,
                          amount: 0,
                        };
                        return { ...prevData, parts: newParts };
                      });
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Part"
                      variant="outlined"
                      margin="dense"
                      fullWidth
                    />
                  )}
                  sx={{ flex: 2 }}
                />

                <TextField
                  name="qty"
                  label="Qty"
                  type="number"
                  value={part.qty}
                  onChange={(e) => handleChange(e, index, 'qty')}
                  sx={{ width: '100px' }}
                  InputProps={{ inputProps: { min: 1 } }}
                />
                <TextField
                  name="rate"
                  label="Rate"
                  type="number"
                  value={part.rate}
                  onChange={(e) => handleChange(e, index, 'rate')}
                  sx={{ width: '100px' }}
                  InputProps={{ inputProps: { min: 0 } }}
                />
                <TextField
                  name="amount"
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
            <StyledButton
              onClick={() => addItem('parts')}
              variant="contained"
              startIcon={<AddCircleIcon />}
            >
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
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 0.5,
                    }}
                  >
                    {selected.map((value) => (
                      <Chip
                        key={value}
                        label={
                          techniciansOptions.find((tech) => tech.id === value)
                            ?.name
                        }
                      />
                    ))}
                  </Box>
                )}
              >
                {techniciansOptions.map((technician) => (
                  <MenuItem key={technician.id} value={technician.id}>
                    {technician.name}
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
                    label={chargeLabels[charge]}
                    type="number"
                    variant="outlined"
                    fullWidth
                    margin="dense"
                    value={formData.charges[charge]}
                    onChange={handleChange}
                    InputProps={{ inputProps: { min: 0 } }}
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
            
            {/* New Advance Payment Field */}
            <TextField
              name="advance"
              label="Advance Payment"
              type="number"
              variant="outlined"
              fullWidth
              margin="dense"
              value={formData.advance}
              onChange={handleChange}
              InputProps={{ inputProps: { min: 0 } }}
            />
            
            {/* Balance Amount Field */}
            <TextField
              name="balanceAmount"
              label="Balance Amount"
              type="number"
              variant="outlined"
              fullWidth
              margin="dense"
              value={formData.balanceAmount}
              InputProps={{ readOnly: true }}
              sx={{ mb: 2 }}
            />
            
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Expected Completion Date"
                value={formData.expectedCompletionDate}
                onChange={(date) =>
                  handleChange({
                    target: { name: 'expectedCompletionDate', value: date },
                  })
                }
                slotProps={{ textField: { fullWidth: true, margin: 'dense' } }}
              />
              <DatePicker
                label="Expected Delivery/Followup Date"
                value={formData.expectedDeliveryDate}
                onChange={(date) =>
                  handleChange({
                    target: { name: 'expectedDeliveryDate', value: date },
                  })
                }
                slotProps={{ textField: { fullWidth: true, margin: 'dense' } }}
              />
              <DatePicker
                label="Repair Date"
                value={formData.repairDate}
                onChange={(date) => {
                  handleChange({
                    target: { name: 'repairDate', value: date },
                  });
                  if (date) {
                    setFormData((prevData) => ({
                      ...prevData,
                      status: 'completed',
                    }));
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
                <MenuItem value="paused due to parts unavailability">
                  Paused due to Parts Unavailability
                </MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="delivered">Delivered</MenuItem>
              </Select>
            </FormControl>
          </StyledPaper>
        </Box>
        
        {/* Printable Content */}
        <Box 
          sx={{ 
            position: 'absolute', 
            left: '-9999px', 
            top: 0,
            width: '100%',
            maxWidth: '800px',
            background: '#fff',
            padding: '20px',
            boxSizing: 'border-box',
          }}
        >
          <div ref={printComponentRef} className="printable-content">
            <style>
              {`
                @media print {
                  @page { size: auto; margin: 10mm; }
                  body { margin: 0; padding: 0; }
                }
              `}
            </style>
            <Box sx={{ textAlign: 'center', mb: 3, p: 5 }}>
             
              <Divider sx={{ my: 2 }} />
            </Box>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Typography variant="body1"><strong>Bill No:</strong> {formData.jobCardNo}</Typography>
                <Typography variant="body1"><strong>Date:</strong> {formData.date.format('DD/MM/YYYY')}</Typography>
                <Typography variant="body1"><strong>Status:</strong> {formData.status.toUpperCase()}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1"><strong>Customer:</strong> {formData.customerName}</Typography>
                <Typography variant="body1"><strong>Mobile:</strong> {formData.customerMobile}</Typography>
                <Typography variant="body1"><strong>Machine:</strong> {formData.machineType}</Typography>
              </Grid>
            </Grid>
            
            <Typography variant="h6" gutterBottom>Complaints</Typography>
            <Box sx={{ mb: 3 }}>
              {formData.complaints.map((complaint, index) => (
                <Typography key={index} variant="body2">• {complaint}</Typography>
              ))}
            </Box>
            
            <Typography variant="h6" gutterBottom>Parts & Services</Typography>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Sl. No</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Item</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Part No.</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>Qty</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>Rate</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {formData.parts.map((part, index) => (
                  <tr key={index}>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{index + 1}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{part.partName}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{part.partNumber}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>{part.qty}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>{parseFloat(part.rate).toFixed(2)}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>{parseFloat(part.amount).toFixed(2)}</td>
                  </tr>
                ))}
                {/* Additional charges */}
                {Object.entries(formData.charges).map(([key, value]) => 
                  parseFloat(value) > 0 ? (
                    <tr key={key}>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }} colSpan="4"></td>
                      <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>{chargeLabels[key]}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>{parseFloat(value).toFixed(2)}</td>
                    </tr>
                  ) : null
                )}
                {/* Total row */}
                <tr>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }} colSpan="4"></td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>Total</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{parseFloat(formData.totalAmount).toFixed(2)}</td>
                </tr>
                {/* Advance payment row */}
                <tr>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }} colSpan="4"></td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>Advance Paid</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{parseFloat(formData.advance).toFixed(2)}</td>
                </tr>
                {/* Balance row */}
                <tr>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }} colSpan="4"></td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>Balance Due</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{parseFloat(formData.balanceAmount).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            
            <Grid container spacing={2} sx={{ mt: 4 }}>
              <Grid item xs={6}>
                <Box sx={{ borderTop: '1px solid #000', pt: 1, mt: 5, width: '70%' }}>
                  <Typography variant="body2" align="center">Customer Signature</Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ borderTop: '1px solid #000', pt: 1, mt: 5, width: '70%', ml: 'auto' }}>
                  <Typography variant="body2" align="center">Authorized Signature</Typography>
                </Box>
              </Grid>
            </Grid>
            
            <Typography variant="body2" sx={{ mt: 5, fontStyle: 'italic' }}>
              Note: This is a computer-generated bill, no signature required.
            </Typography>
          </div>
        </Box>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleDialogClose} color="primary" variant="outlined">
          Cancel
        </Button>
        <Button 
          onClick={handlePrintFallback} // Using the more reliable fallback as default
          color="secondary" 
          variant="outlined" 
          startIcon={<PrintIcon />}
        >
          Print Bill
        </Button>
        <Button onClick={handleSubmit} color="primary" variant="contained">
          {editingEnquiry ? 'Update Service Enquiry' : 'Add Service Enquiry'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ServiceEnquiryDialog;