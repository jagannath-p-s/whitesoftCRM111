import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Box,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Alert,
  Tooltip,
  Typography
} from '@mui/material';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import PrintIcon from '@mui/icons-material/Print';
import ContactCard from './ContactCard';

const Dash = () => {
  const [bills, setBills] = useState([]);
  const [filters, setFilters] = useState({
    mobileNumber: '',
    jobCardNumber: '',
    customerName: '',
  });
  const [sortOption, setSortOption] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [showEnquiryDialog, setShowEnquiryDialog] = useState(false);

  useEffect(() => {
    fetchBills();
  }, [filters, sortOption]);

  const fetchBills = async () => {
    let query = supabase.from('printed_bills').select('*');

    if (filters.mobileNumber) {
      query = query.ilike('mobile_number', `%${filters.mobileNumber}%`);
    }
    if (filters.jobCardNumber) {
      query = query.ilike('job_card_number', `%${filters.jobCardNumber}%`);
    }
    if (filters.customerName) {
      query = query.ilike('customer_name', `%${filters.customerName}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching bills:', error);
    } else {
      const sortedData = data.sort((a, b) => {
        if (sortOption === 'asc') {
          return (a.waiting_number || '').localeCompare(b.waiting_number || '') || (a.waiting_number ? 1 : -1);
        } else if (sortOption === 'desc') {
          return (b.waiting_number || '').localeCompare(a.waiting_number || '') || (b.waiting_number ? -1 : 1);
        } else {
          return 0;
        }
      });
      setBills(sortedData);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["Customer Name", "Mobile Number", "Job Card Number", "Waiting Number", "Pipeline Name", "Invoiced", "Collected"];
    const tableRows = [];

    bills.forEach(bill => {
      const billData = [
        bill.customer_name,
        bill.mobile_number,
        bill.job_card_number,
        bill.waiting_number,
        bill.pipeline_name,
        bill.invoiced ? 'Yes' : 'No',
        bill.collected ? 'Yes' : 'No'
      ];
      tableRows.push(billData);
    });

    doc.autoTable(tableColumn, tableRows, { startY: 20 });
    doc.text("Printed Bills Report", 14, 15);
    doc.save('printed_bills_report.pdf');
  };

  const handlePrint = (bill) => {
    const doc = new jsPDF();
    doc.text("Haritha Agritech", 20, 20);
    doc.text("AKKIKAVU, NEAR PERUMPILAVU", 20, 30);
    doc.text("KUNNAMKULAM-KOZHIKODE ROAD", 20, 40);
    doc.text("KERALA, INDIA", 20, 50);
    doc.text("PH: 9747403390 | GSTIN: 29GGGGG1314R9Z6", 20, 60);
    doc.text(`Bill: ${new Date().toLocaleDateString()}`, 20, 70);

    doc.text(`Customer Name: ${bill.customer_name}`, 20, 90);
    doc.text(`Mobile Number: ${bill.mobile_number}`, 20, 100);
    doc.text(`Waiting Number: ${bill.waiting_number || ''}`, 20, 110);
    doc.text(`Pipeline: ${bill.pipeline_name}`, 20, 120);

    doc.autoTable({
      startY: 140,
      head: [['Item', 'Qty', 'Price', 'Amt']],
      body: Object.entries(bill.products || {}).map(([product, details]) => [
        product,
        details.quantity,
        details.price,
        (details.quantity * details.price).toFixed(2)
      ]),
    });

    const total = Object.values(bill.products || {}).reduce((acc, product) => acc + product.quantity * product.price, 0);
    doc.text(`Total: Rs. ${total.toFixed(2)}`, 20, doc.autoTable.previous.finalY + 10);

    doc.text("Thank You", 20, doc.autoTable.previous.finalY + 30);
    doc.text(new Date().toLocaleString(), 20, doc.autoTable.previous.finalY + 40);

    doc.save(`bill_${bill.customer_name}.pdf`);
  };

  return (
    <Box p={4} mx={2} my={4} bgcolor="white" borderRadius={4} boxShadow={2}>
      <Box display="flex" justifyContent="space-between" mb={2} p={2} bgcolor="white" borderRadius={4} boxShadow={2}>
        <TextField
          name="mobileNumber"
          label="Mobile Number"
          variant="outlined"
          value={filters.mobileNumber}
          onChange={handleFilterChange}
          style={{ marginRight: 10 }}
        />
        <TextField
          name="jobCardNumber"
          label="Job Card Number"
          variant="outlined"
          value={filters.jobCardNumber}
          onChange={handleFilterChange}
          style={{ marginRight: 10 }}
        />
        <TextField
          name="customerName"
          label="Customer Name"
          variant="outlined"
          value={filters.customerName}
          onChange={handleFilterChange}
          style={{ marginRight: 10 }}
        />
        <FormControl variant="outlined" style={{ minWidth: 120 }}>
          <InputLabel>Sort By</InputLabel>
          <Select value={sortOption} onChange={handleSortChange} label="Sort By">
            <MenuItem value="asc">Waiting Number (ASC)</MenuItem>
            <MenuItem value="desc">Waiting Number (DESC)</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Button variant="contained" color="primary" onClick={downloadPDF}>
        Download as PDF
      </Button>
      <TableContainer component={Paper} style={{ marginTop: 20 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Customer Name</TableCell>
              <TableCell>Mobile Number</TableCell>
              <TableCell>Job Card Number</TableCell>
              <TableCell>Waiting Number</TableCell>
              <TableCell>Pipeline Name</TableCell>
              <TableCell>Invoiced</TableCell>
              <TableCell>Collected</TableCell>
              {/* <TableCell>Last Updated</TableCell> */}
              {/* <TableCell>Actions</TableCell> */}
            </TableRow>
          </TableHead>
          <TableBody>
            {bills.map((bill) => (
              <TableRow key={bill.id}>
                <TableCell>{bill.customer_name}</TableCell>
                <TableCell>{bill.mobile_number}</TableCell>
                <TableCell>{bill.job_card_number}</TableCell>
                <TableCell>{bill.waiting_number}</TableCell>
                <TableCell>{bill.pipeline_name}</TableCell>
                <TableCell>
                  <FormControl variant="outlined" size="small">
                    <Select
                      value={bill.invoiced ? 'Yes' : 'No'}
                      onChange={async (e) => {
                        const invoiced = e.target.value === 'Yes';
                        const { error } = await supabase
                          .from('printed_bills')
                          .update({ invoiced })
                          .eq('id', bill.id);
                        if (error) {
                          setSnackbar({ open: true, message: 'Error updating invoiced status', severity: 'error' });
                        } else {
                          fetchBills();
                        }
                      }}
                    >
                      <MenuItem value="Yes">Yes</MenuItem>
                      <MenuItem value="No">No</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  <FormControl variant="outlined" size="small">
                    <Select
                      value={bill.collected ? 'Yes' : 'No'}
                      onChange={async (e) => {
                        const collected = e.target.value === 'Yes';
                        const { error } = await supabase
                          .from('printed_bills')
                          .update({ collected })
                          .eq('id', bill.id);
                        if (error) {
                          setSnackbar({ open: true, message: 'Error updating collected status', severity: 'error' });
                        } else {
                          fetchBills();
                        }
                      }}
                    >
                      <MenuItem value="Yes">Yes</MenuItem>
                      <MenuItem value="No">No</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                {/* <TableCell>{new Date(bill.last_updated).toLocaleDateString()}</TableCell> */}
                {/* <TableCell>
                  <Tooltip title="Print">
                    <IconButton onClick={() => handlePrint(bill)}>
                      <PrintIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell> */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={showEnquiryDialog} onClose={() => setShowEnquiryDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Enquiry Details</DialogTitle>
        <DialogContent>
          {selectedEnquiry ? (
            <Box m={2}>
              <ContactCard contact={selectedEnquiry} user={{ id: selectedEnquiry.assignedto }} color="blue" visibleFields={{ name: true, mobilenumber1: true, address: true, remarks: true }} />
            </Box>
          ) : (
            <Typography>No enquiry data available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEnquiryDialog(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dash;
