import React, { useState, useEffect } from 'react';
import {
  Box, Button, TextField, Typography, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, FormControl, InputLabel, Select, MenuItem, Tooltip, Snackbar, Alert, Menu, Chip
} from '@mui/material';
import {
  Add as AddIcon, Search as SearchIcon, Edit as EditIcon, Delete as DeleteIcon, Build as BuildIcon, MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { supabase } from '../supabaseClient';
import ServiceEnquiryDialog from './ServiceEnquiryDialog';
import TechnicianDialog from './TechnicianDialog';

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
  const [technicianDialogOpen, setTechnicianDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [technicianFilter, setTechnicianFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingEnquiry, setEditingEnquiry] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [anchorEl, setAnchorEl] = useState(null);
  const [techniciansOptions, setTechniciansOptions] = useState([]);

  useEffect(() => {
    fetchEnquiries();
    fetchTechnicians();
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

  const fetchTechnicians = async () => {
    try {
      const { data, error } = await supabase
        .from('technicians')
        .select('*');
      if (error) throw error;
      setTechniciansOptions(data);
    } catch (error) {
      setError(error.message);
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
      filtered = filtered.filter(enquiry =>
        enquiry.technician_name && enquiry.technician_name.split(', ').includes(technicianFilter)
      );
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

  const handleStatusChange = async (enquiry, status) => {
    if (status === 'completed') {
      return;
    }

    try {
      const { error } = await supabase
        .from('service_enquiries')
        .update({ status })
        .eq('id', enquiry.id);
      if (error) throw error;
      fetchEnquiries();
      showSnackbar('Status updated successfully', 'success');
    } catch (error) {
      console.error('Error updating status:', error);
      showSnackbar('Error updating status', 'error');
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleManageTechnicians = () => {
    setTechnicianDialogOpen(true);
    handleMenuClose();
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">Error: {error}</Typography>;

  return (
    <Box className="flex flex-col min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md">
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
              <Tooltip title="More options">
                <IconButton
                  onClick={handleMenuOpen}
                  style={{ backgroundColor: '#e3f2fd', color: '#1e88e5', borderRadius: '12px' }}
                >
                  <MoreVertIcon />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={handleManageTechnicians}>Manage Technicians</MenuItem>
              </Menu>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow p-4 space-x-4 overflow-x-auto">
        <TableContainer component={Paper} className="shadow-md sm:rounded-lg overflow-auto">
          <Table stickyHeader className="min-w-full">
            <TableHead>
              <TableRow>
                <StyledTableCell>Date</StyledTableCell>
                <StyledTableCell>Job Card No</StyledTableCell>
                <StyledTableCell>Customer Name</StyledTableCell>
                <StyledTableCell>Customer Mobile</StyledTableCell>
                <StyledTableCell>
                  <FormControl fullWidth>
                    <InputLabel>Technician</InputLabel>
                    <Select
                      value={technicianFilter}
                      onChange={handleTechnicianFilterChange}
                      displayEmpty
                    >
                      <MenuItem value="">
                        <em>All</em>
                      </MenuItem>
                      {Array.from(new Set(enquiries.flatMap(e => e.technician_name ? e.technician_name.split(', ') : []))).map(tech => (
                        <MenuItem key={tech} value={tech}>{tech}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </StyledTableCell>
                <StyledTableCell>Total Amount</StyledTableCell>
                <StyledTableCell>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      onChange={handleStatusFilterChange}
                      displayEmpty
                    >
                      <MenuItem value="">
                        <em>All</em>
                      </MenuItem>
                      <MenuItem value="started">Started</MenuItem>
                      <MenuItem value="ongoing">Ongoing</MenuItem>
                      <MenuItem value="paused">Paused</MenuItem>
                      <MenuItem value="paused due to parts unavailability">Paused due to Parts Unavailability</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                    </Select>
                  </FormControl>
                </StyledTableCell>
                <StyledTableCell>Expected Completion Date</StyledTableCell>
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
                      <Select
                        value={enquiry.status}
                        onChange={(e) => handleStatusChange(enquiry, e.target.value)}
                        disabled={enquiry.status === 'completed'}
                      >
                        <MenuItem value="started">Started</MenuItem>
                        <MenuItem value="ongoing">Ongoing</MenuItem>
                        <MenuItem value="paused">Paused</MenuItem>
                        <MenuItem value="paused due to parts unavailability">Paused due to Parts Unavailability</MenuItem>
                        <MenuItem value="completed">Completed</MenuItem>
                      </Select>
                    </TableCell>
                    <TableCell style={{ color: enquiry.status !== 'completed' && new Date(enquiry.expected_completion_date) < new Date() ? 'red' : 'inherit' }}>
                      {new Date(enquiry.expected_completion_date).toLocaleDateString()}
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
                  <TableCell colSpan={9} align="center">
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
        techniciansOptions={techniciansOptions}
      />

      <TechnicianDialog
        open={technicianDialogOpen}
        onClose={() => setTechnicianDialogOpen(false)}
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
