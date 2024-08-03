import React, { useState, useEffect } from 'react';
import {
  Box, IconButton, TextField, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Menu, MenuItem, Tooltip, Snackbar, Alert
} from '@mui/material';
import {
  Add as AddIcon, Search as SearchIcon, Edit as EditIcon, Delete as DeleteIcon, Build as BuildIcon, ArrowDropDown as ArrowDropDownIcon
} from '@mui/icons-material';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import { styled } from '@mui/material/styles';
import { supabase } from '../supabaseClient';
import ServiceEnquiryDialog from './ServiceEnquiryDialog';
import TechnicianDialog from './TechnicianDialog';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  color: theme.palette.common.black,
  padding: theme.spacing(2),
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:first-of-type td, &:first-of-type th': {
    paddingLeft: theme.spacing(3),
  },
  '&:last-child td, &:last-child th': {
    paddingRight: theme.spacing(3),
  },
}));

const FilterSelect = ({ label, value, handleChange, options }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (selectedValue) => {
    handleChange({ target: { value: selectedValue } });
    handleClose();
  };

  return (
    <Box display="flex" alignItems="center">
      <Typography variant="subtitle1" fontWeight="bold">{label}</Typography>
      <IconButton onClick={handleOpen} size="small">
        <ArrowDropDownIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={() => handleSelect('')}>
          <em>All</em>
        </MenuItem>
        {options.map((option) => (
          <MenuItem key={option} onClick={() => handleSelect(option)}>
            {option}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

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
      setTechniciansOptions(data.map(tech => tech.name));
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

  const handleManageTechnicians = () => {
    setTechnicianDialogOpen(true);
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">Error: {error}</Typography>;

  return (
    <Box className="flex flex-col min-h-screen bg-gray-100">
      <Box className="bg-white shadow-md p-4">
        <Box className="max-w-7xl mx-auto flex justify-between items-center">
          <Box className="flex items-center space-x-4">
            <BuildIcon className="text-blue-500" style={{ fontSize: '1.75rem' }} />
            <h1 className="text-xl font-semibold ml-2">Service Enquiries</h1>
          </Box>
          <Box className="flex items-center space-x-4">
            <TextField
              placeholder="Search for enquiries"
              value={searchTerm}
              onChange={handleSearchChange}
              variant="outlined"
              size="small"
            />
            <Tooltip title="Add new enquiry">
              <IconButton
                onClick={handleAddEnquiryClick}
                style={{ backgroundColor: '#e3f2fd', color: '#1e88e5', borderRadius: '12px' }}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Manage technicians">
              <IconButton
                onClick={handleManageTechnicians}
                style={{ backgroundColor: '#e3f2fd', color: '#1e88e5', borderRadius: '12px' }}
              >
                <DesignServicesIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      <Box className="flex-grow p-4">
        <TableContainer component={Paper} className="shadow-md rounded-lg overflow-hidden">
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <StyledTableCell>Date</StyledTableCell>
                <StyledTableCell>Job Card No</StyledTableCell>
                <StyledTableCell>Customer Name</StyledTableCell>
                <StyledTableCell>Customer Mobile</StyledTableCell>
                <StyledTableCell>
                  <FilterSelect 
                    label="Technician"
                    value={technicianFilter}
                    handleChange={handleTechnicianFilterChange}
                    options={techniciansOptions}
                  />
                </StyledTableCell>
                <StyledTableCell>Total Amount</StyledTableCell>
                <StyledTableCell>
                  <FilterSelect 
                    label="Status"
                    value={statusFilter}
                    handleChange={handleStatusFilterChange}
                    options={['started', 'ongoing', 'paused', 'completed']}
                  />
                </StyledTableCell>
                <StyledTableCell>Expected Completion</StyledTableCell>
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
                    <TableCell>
                      {enquiry.total_amount != null ? `₹${enquiry.total_amount.toFixed(2)}` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Typography>{enquiry.status}</Typography>
                        <IconButton size="small" onClick={(event) => handleStatusChange(enquiry, event.target.value)}>
                          <ArrowDropDownIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>{new Date(enquiry.expected_completion_date).toLocaleDateString()}</TableCell>
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
      </Box>

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
        autoHideDuration={2000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Services;
