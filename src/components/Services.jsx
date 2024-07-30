import React, { useState, useEffect } from 'react';
import {
  Box, Button, TextField, Typography, IconButton, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, FormControl, InputLabel, Select, MenuItem, Chip, Tooltip, Snackbar, Alert, Dialog, DialogActions, DialogContent, DialogTitle
} from '@mui/material';
import {
  Add as AddIcon, Search as SearchIcon, Edit as EditIcon, Delete as DeleteIcon, MoreVert as MoreVertIcon ,  Build as BuildIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { supabase } from '../supabaseClient'; // Adjust the path as needed
import ServiceEnquiryDialog from './ServiceEnquiryDialog'; // Renamed from AddServiceEnquiryDialog

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  color: theme.palette.common.black,
}));


const StyledTableRow = styled(TableRow)(({ theme }) => ({
  backgroundColor: theme.palette.common.white,
}));


const Services = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [technicianFilter, setTechnicianFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingEnquiry, setEditingEnquiry] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchEnquiries();
  }, []);

  useEffect(() => {
    filterEnquiries();
  }, [searchTerm, technicianFilter, statusFilter, enquiries]);

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_enquiries')
        .select('*, service_enquiry_parts(*)');
      if (error) throw error;
      setEnquiries(data);
      setFilteredEnquiries(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const filterEnquiries = () => {
    let filtered = enquiries;
    if (searchTerm) {
      filtered = filtered.filter(enquiry =>
        enquiry.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enquiry.customer_mobile.includes(searchTerm) ||
        enquiry.job_card_no.includes(searchTerm)
      );
    }
    if (technicianFilter) {
      filtered = filtered.filter(enquiry => enquiry.technician_name === technicianFilter);
    }
    if (statusFilter) {
      filtered = filtered.filter(enquiry => enquiry.status === statusFilter);
    }
    setFilteredEnquiries(filtered);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleTechnicianFilterChange = (e) => {
    setTechnicianFilter(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleAddEnquiryClick = () => {
    setEditingEnquiry(null);
    setDialogOpen(true);
  };

  const handleEditEnquiry = (enquiry) => {
    setEditingEnquiry(enquiry);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingEnquiry(null);
  };

  const handleFormSubmit = () => {
    fetchEnquiries();
    handleDialogClose();
  };

  const handleDeleteEnquiry = async (id) => {
    if (window.confirm('Are you sure you want to delete this enquiry?')) {
      try {
        const { error } = await supabase
          .from('service_enquiries')
          .delete()
          .eq('id', id);
        if (error) throw error;
        fetchEnquiries();
        showSnackbar('Enquiry deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting enquiry:', error);
        showSnackbar('Error deleting enquiry', 'error');
      }
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">Error: {error}</Typography>;

  return (
    <Box className="flex flex-col min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <BuildIcon className="text-blue-500" style={{ fontSize: '1.75rem' }} />
                <h1 className="text-xl font-semibold ml-2">Service Enquiries</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <TextField
                type="text"
                placeholder="Search for enquiries"
                value={searchTerm}
                onChange={handleSearchChange}
                variant="outlined"
                size="small"
                sx={{ pl: 1, pr: 1, py: 1, borderRadius: 2 }}
                autoComplete="off"
                InputProps={{
                  endAdornment: <SearchIcon />,
                }}
              />
              <Tooltip title="Add new enquiry">
                <IconButton
                  className="p-2"
                  onClick={handleAddEnquiryClick}
                  style={{ backgroundColor: '#e3f2fd', color: '#1e88e5', borderRadius: '12px' }}
                >
                  <AddIcon style={{ fontSize: '1.75rem' }} />
                </IconButton>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow p-4 space-x-4 overflow-x-auto">
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Technician</InputLabel>
              <Select
                value={technicianFilter}
                onChange={handleTechnicianFilterChange}
                label="Technician"
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {Array.from(new Set(enquiries.map(e => e.technician_name))).map(tech => (
                  <MenuItem key={tech} value={tech}>{tech}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                label="Status"
              >
                <MenuItem value=""><em>None</em></MenuItem>
                <MenuItem value="started">Started</MenuItem>
                <MenuItem value="ongoing">Ongoing</MenuItem>
                <MenuItem value="paused">Paused</MenuItem>
                <MenuItem value="paused due to parts unavailability">Paused due to Parts Unavailability</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <TableContainer component={Paper} className="shadow-md sm:rounded-lg overflow-auto">
  <Table stickyHeader className="min-w-full">
    <TableHead>
      <TableRow>
        <StyledTableCell>Date</StyledTableCell>
        <StyledTableCell>Job Card No</StyledTableCell>
        <StyledTableCell>Customer Name</StyledTableCell>
        <StyledTableCell>Customer Mobile</StyledTableCell>
        <StyledTableCell>Technician</StyledTableCell>
        <StyledTableCell>Total Amount</StyledTableCell>
        <StyledTableCell>Status</StyledTableCell>
        <StyledTableCell>Actions</StyledTableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {filteredEnquiries.length > 0 ? (
        filteredEnquiries.map(enquiry => (
          <StyledTableRow key={enquiry.id}>
            <TableCell>{new Date(enquiry.date).toLocaleDateString()}</TableCell>
            <TableCell>{enquiry.job_card_no}</TableCell>
            <TableCell>{enquiry.customer_name}</TableCell>
            <TableCell>{enquiry.customer_mobile}</TableCell>
            <TableCell>{enquiry.technician_name}</TableCell>
            <TableCell>₹{enquiry.total_amount.toFixed(2)}</TableCell>
            <TableCell>
              <Chip 
                label={enquiry.status} 
                color={enquiry.status === 'completed' ? 'success' : enquiry.status.includes('paused') ? 'warning' : 'primary'}
              />
            </TableCell>
            <TableCell>
              <IconButton onClick={() => handleEditEnquiry(enquiry)} color="primary">
                <EditIcon />
              </IconButton>
              <IconButton onClick={() => handleDeleteEnquiry(enquiry.id)} color="error">
                <DeleteIcon />
              </IconButton>
            </TableCell>
          </StyledTableRow>
        ))
      ) : (
        <TableRow>
          <TableCell colSpan={8} align="center">
            No data to display
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  </Table>
</TableContainer>


      </div>

      <ServiceEnquiryDialog
        dialogOpen={dialogOpen}
        handleDialogClose={handleDialogClose}
        handleFormSubmit={handleFormSubmit}
        editingEnquiry={editingEnquiry}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Services;