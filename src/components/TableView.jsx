import React, { useState, useEffect } from 'react';
import {
  Box, IconButton, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Snackbar, Alert, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Checkbox, FormControlLabel, Button
} from '@mui/material';
import {
  Edit as EditIcon, Delete as DeleteIcon, SettingsOutlined as SettingsOutlinedIcon
} from '@mui/icons-material';
import { supabase } from '../supabaseClient';
import { styled } from '@mui/material/styles';
import EditEnquiryDialog from './EditEnquiryDialog';

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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState({});
  const [page, setPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [productSearchTerm, setProductSearchTerm] = useState('');

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
        query = query.or(`product_name.ilike.%${productSearchTerm}%,item_alias.ilike.%${productSearchTerm}%`);
      }

      const { data, error, count } = await query
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1)
        .order('product_name');

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
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  const parseProducts = (products) => {
    if (!products) return {};
    if (typeof products === 'string') {
      try {
        const cleanedProducts = products
          .replace(/""/g, '"')
          .replace(/\\\\"/g, '"')
          .replace(/"({)/g, '$1')
          .replace(/(})"/g, '$1');
        return JSON.parse(cleanedProducts);
      } catch (error) {
        console.error('Error parsing products:', error);
        return {};
      }
    }
    return products; // If it's already an object, return as is
  };

  return (
    <Box className="flex flex-col min-h-screen bg-gray-100">
      <Box className="flex-grow p-4">
        <TableContainer component={Paper} className="shadow-md rounded-lg overflow-hidden">
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {visibleFields.name && <StyledTableCell>Name</StyledTableCell>}
                {visibleFields.mobilenumber1 && <StyledTableCell>Mobile Number 1</StyledTableCell>}
                {visibleFields.mobilenumber2 && <StyledTableCell>Mobile Number 2</StyledTableCell>}
                {visibleFields.address && <StyledTableCell>Address</StyledTableCell>}
                {visibleFields.location && <StyledTableCell>Location</StyledTableCell>}
                {visibleFields.stage && <StyledTableCell>Stage</StyledTableCell>}
                {visibleFields.mailid && <StyledTableCell>Mail ID</StyledTableCell>}
                {visibleFields.leadsource && <StyledTableCell>Lead Source</StyledTableCell>}
                {visibleFields.assignedto && <StyledTableCell>Assigned To</StyledTableCell>}
                {visibleFields.remarks && <StyledTableCell>Remarks</StyledTableCell>}
                {visibleFields.priority && <StyledTableCell>Priority</StyledTableCell>}
                {visibleFields.invoiced && <StyledTableCell>Invoiced</StyledTableCell>}
                {visibleFields.collected && <StyledTableCell>Collected</StyledTableCell>}
                {visibleFields.products && <StyledTableCell>Products</StyledTableCell>}
                {visibleFields.created_at && <StyledTableCell>Created At</StyledTableCell>}
                {visibleFields.salesflow_code && <StyledTableCell>Salesflow Code</StyledTableCell>}
                {visibleFields.last_updated && <StyledTableCell>Last Updated</StyledTableCell>}
                <StyledTableCell>Actions</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {enquiries.length > 0 ? (
                enquiries.map((enquiry) => (
                  <StyledTableRow key={enquiry.id}>
                    {visibleFields.name && <TableCell>{enquiry.name}</TableCell>}
                    {visibleFields.mobilenumber1 && <TableCell>{enquiry.mobilenumber1}</TableCell>}
                    {visibleFields.mobilenumber2 && <TableCell>{enquiry.mobilenumber2}</TableCell>}
                    {visibleFields.address && <TableCell>{enquiry.address}</TableCell>}
                    {visibleFields.location && <TableCell>{enquiry.location}</TableCell>}
                    {visibleFields.stage && <TableCell>{enquiry.stage}</TableCell>}
                    {visibleFields.mailid && <TableCell>{enquiry.mailid}</TableCell>}
                    {visibleFields.leadsource && <TableCell>{enquiry.leadsource}</TableCell>}
                    {visibleFields.assignedto && <TableCell>{enquiry.assignedto}</TableCell>}
                    {visibleFields.remarks && <TableCell>{enquiry.remarks}</TableCell>}
                    {visibleFields.priority && <TableCell>{enquiry.priority}</TableCell>}
                    {visibleFields.invoiced && <TableCell>{enquiry.invoiced ? 'Yes' : 'No'}</TableCell>}
                    {visibleFields.collected && <TableCell>{enquiry.collected ? 'Yes' : 'No'}</TableCell>}
                    {visibleFields.products && (
                      <TableCell>
                        {Object.values(parseProducts(enquiry.products)).map((product, index) => (
                          <Typography key={index} variant="body2">
                            {product.product_name} ({product.quantity})
                          </Typography>
                        ))}
                      </TableCell>
                    )}
                    {visibleFields.created_at && <TableCell>{new Date(enquiry.created_at).toLocaleString()}</TableCell>}
                    {visibleFields.salesflow_code && <TableCell>{enquiry.salesflow_code}</TableCell>}
                    {visibleFields.last_updated && <TableCell>{new Date(enquiry.last_updated).toLocaleString()}</TableCell>}
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
                  <TableCell colSpan={6} align="center">
                    No data to display
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {editingEnquiry && (
        <EditEnquiryDialog
          dialogOpen={dialogOpen}
          enquiryData={editingEnquiry}
          handleDialogClose={handleDialogClose}
          handleFormSubmit={handleFormSubmit}
          users={[]} // Replace with actual users data if available
          products={products} // Pass fetched products
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
          totalEstimate={Object.values(selectedProducts).reduce((sum, product) => sum + product.price * product.quantity, 0)}
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

      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)}>
        <DialogTitle>Customize Contact Card Fields</DialogTitle>
        <DialogContent>
          <DialogContentText>Select which fields to display in the contact card and table.</DialogContentText>
          {Object.keys(visibleFields).map((field) => (
            <FormControlLabel
              key={field}
              control={
                <Checkbox
                  checked={visibleFields[field]}
                  onChange={(e) => setVisibleFields({ ...visibleFields, [field]: e.target.checked })}
                  name={field}
                />
              }
              label={field.charAt(0).toUpperCase() + field.slice(1)}
            />
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TableView;
