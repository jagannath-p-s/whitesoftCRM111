import React, { useState, useEffect } from 'react';
import {
  Box, IconButton, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Snackbar, Alert, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Checkbox, FormControlLabel, Button, TablePagination
} from '@mui/material';
import {
  Edit as EditIcon, Delete as DeleteIcon, Download as DownloadIcon
} from '@mui/icons-material';
import { supabase } from '../../supabaseClient';
import { styled } from '@mui/material/styles';
import EditEnquiryDialog from './EditEnquiryDialog';
import Papa from 'papaparse';

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

const TableView = ({ visibleFields }) => {
  const [enquiries, setEnquiries] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEnquiry, setEditingEnquiry] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [totalProducts, setTotalProducts] = useState(0);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchEnquiries();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, productSearchTerm]);

  const fetchEnquiries = async () => {
    const { data, error } = await supabase.from('enquiries').select('*');
    if (error) {
      console.error('Error fetching enquiries:', error);
    } else {
      setEnquiries(data);
    }
  };

  const fetchProducts = async () => {
    try {
      let query = supabase.from('products').select('*', { count: 'exact' });
      if (productSearchTerm) {
        query = query.or(`name.ilike.%${productSearchTerm}%,alias.ilike.%${productSearchTerm}%`);
      }
      const { data, error, count } = await query
        .range(page * rowsPerPage, page * rowsPerPage + rowsPerPage - 1)
        .order('name');
      if (error) throw error;
      setProducts(data);
      setTotalProducts(count);
    } catch (error) {
      console.error('Error fetching products:', error.message);
    }
  };

  const handleEditEnquiry = (enquiry) => {
    setEditingEnquiry(enquiry);
    setDialogOpen(true);
    setSelectedProducts(parseProducts(enquiry.products));
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingEnquiry(null);
  };

  const handleFormSubmit = async (updatedEnquiry) => {
    try {
      const { error } = await supabase
        .from('enquiries')
        .update(updatedEnquiry)
        .eq('id', updatedEnquiry.id);
      if (error) throw error;
      fetchEnquiries();
      showSnackbar('Enquiry updated successfully', 'success');
    } catch (error) {
      console.error('Error updating enquiry:', error);
      showSnackbar('Error updating enquiry', 'error');
    }
    handleDialogClose();
  };

  const handleDeleteEnquiry = async (id) => {
    if (window.confirm('Are you sure you want to delete this enquiry?')) {
      try {
        const { error } = await supabase.from('enquiries').delete().eq('id', id);
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
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

  const parseProducts = (products) => {
    if (!products) return {};
    if (typeof products === 'string') {
      try {
        return JSON.parse(products);
      } catch (error) {
        console.error('Error parsing products:', error);
        return {};
      }
    }
    return products;
  };

  const downloadCSV = () => {
    const fields = Object.keys(visibleFields).filter((key) => visibleFields[key]);
    const csvData = enquiries.map((enquiry) => {
      const result = {};
      fields.forEach((field) => {
        result[field] = enquiry[field] || '';
      });
      return result;
    });

    const csv = Papa.unparse(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'enquiries.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  return (
    <Box className="flex flex-col min-h-screen bg-gray-100">
      <Box className="flex-grow p-4">
        <Button
          variant="contained"
          color="primary"
          startIcon={<DownloadIcon />}
          onClick={downloadCSV}
          sx={{ mb: 2 }}
        >
          Download as CSV
        </Button>
        <TableContainer component={Paper} className="shadow-md rounded-lg overflow-hidden">
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {Object.entries(visibleFields).map(([field, isVisible]) => 
                  isVisible && <StyledTableCell key={field}>{field.charAt(0).toUpperCase() + field.slice(1).replace('_', ' ')}</StyledTableCell>
                )}
                <StyledTableCell>Actions</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {enquiries.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((enquiry) => (
                <StyledTableRow key={enquiry.id}>
                  {Object.entries(visibleFields).map(([field, isVisible]) => 
                    isVisible && (
                      <TableCell key={field}>
                        {field === 'products' 
                          ? Object.values(parseProducts(enquiry.products)).map((product, index) => (
                              <Typography key={index} variant="body2">
                                {product.item_name} ({product.quantity})
                              </Typography>
                            ))
                          : enquiry[field] || 'N/A'}
                      </TableCell>
                    )
                  )}
                  <TableCell>
                    <IconButton onClick={() => handleEditEnquiry(enquiry)} color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteEnquiry(enquiry.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={enquiries.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </Box>

      {editingEnquiry && (
        <EditEnquiryDialog
          dialogOpen={dialogOpen}
          enquiryData={editingEnquiry}
          handleDialogClose={handleDialogClose}
          handleFormSubmit={handleFormSubmit}
          users={[]} // Replace with actual users data if available
          products={products}
          selectedProducts={selectedProducts}
          handleProductToggle={(product) => {
            setSelectedProducts((prev) => {
              const newSelected = { ...prev };
              if (newSelected[product.product_id]) {
                delete newSelected[product.product_id];
              } else {
                newSelected[product.product_id] = { ...product, quantity: 1 };
              }
              return newSelected;
            });
          }}
          handleQuantityChange={(productId, change) => {
            setSelectedProducts((prev) => ({
              ...prev,
              [productId]: {
                ...prev[productId],
                quantity: Math.max(1, prev[productId].quantity + change),
              },
            }));
          }}
          productSearchTerm={productSearchTerm}
          handleProductSearchChange={(e) => setProductSearchTerm(e.target.value)}
          page={page}
          handlePageChange={(event, value) => setPage(value)}
          totalEstimate={Object.values(selectedProducts).reduce((sum, product) => sum + (product.price || 0) * product.quantity, 0)}
          ITEMS_PER_PAGE={ITEMS_PER_PAGE}
          totalProducts={totalProducts}
          currentUserId={null} // Replace with actual current user ID if available
        />
      )}

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

export default TableView;
