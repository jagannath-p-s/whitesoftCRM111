import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Tooltip,
  Snackbar,
  Alert,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions as MuiDialogActions,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import WarningIcon from '@mui/icons-material/Warning';
import { supabase } from '../../supabaseClient';
import EditEnquiryDialog from '../contacts/EditEnquiryDialog';
import PipelineFormJSON from '../contacts/PipelineFormJSON';

const InfoCard = ({ data, type, onEdit }) => {
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [pipelineOpen, setPipelineOpen] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [selectedProducts, setSelectedProducts] = useState({});
  const [products, setProducts] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [assignedUser, setAssignedUser] = useState('');
  const [users, setUsers] = useState([]);

  const ITEMS_PER_PAGE = 10;

  // ----------------------------------------------------
  // SPECIAL ATTENTION STATES & LOGIC
  // ----------------------------------------------------
  const phoneNumber = data?.mobilenumber1 || data?.customer_mobile || '';
  const [isSpecialAttention, setIsSpecialAttention] = useState(false);
  const [specialReason, setSpecialReason] = useState('');
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
  const [reasonDialogMode, setReasonDialogMode] = useState('mark'); // 'mark' or 'edit'
  const [newReason, setNewReason] = useState('');

  useEffect(() => {
    if (phoneNumber) checkSpecialAttention();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneNumber]);

  const checkSpecialAttention = async () => {
    if (!phoneNumber) return;
    try {
      // Search for either mobilenumber1 or mobilenumber2 = phoneNumber
      const { data: specialRows, error: specialError } = await supabase
        .from('special_attention_customers')
        .select('*')
        .or(`mobilenumber1.eq.${phoneNumber},mobilenumber2.eq.${phoneNumber}`);

      if (specialError) throw specialError;

      if (specialRows?.length > 0) {
        setIsSpecialAttention(true);
        setSpecialReason(specialRows[0].reason || '');
      } else {
        setIsSpecialAttention(false);
        setSpecialReason('');
      }
    } catch (err) {
      console.error('Error checking special attention status:', err);
    }
  };

  const markSpecialAttention = async () => {
    if (!phoneNumber) return;
    try {
      const { error } = await supabase.from('special_attention_customers').insert([
        {
          mobilenumber1: phoneNumber, // or mobilenumber2 if needed
          reason: newReason,
        },
      ]);
      if (error) throw error;
      setIsSpecialAttention(true);
      setSpecialReason(newReason);
      setSnackbar({
        open: true,
        message: 'Customer marked for special attention.',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error marking special attention:', error);
      setSnackbar({
        open: true,
        message: 'Failed to mark special attention.',
        severity: 'error',
      });
    }
  };

  const unmarkSpecialAttention = async () => {
    if (!phoneNumber) return;
    try {
      const { error } = await supabase
        .from('special_attention_customers')
        .delete()
        .or(`mobilenumber1.eq.${phoneNumber},mobilenumber2.eq.${phoneNumber}`);
      if (error) throw error;
      setIsSpecialAttention(false);
      setSpecialReason('');
      setSnackbar({
        open: true,
        message: 'Special attention removed.',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error unmarking special attention:', error);
      setSnackbar({
        open: true,
        message: 'Failed to remove special attention.',
        severity: 'error',
      });
    }
  };

  const updateSpecialReason = async () => {
    if (!phoneNumber) return;
    try {
      const { error } = await supabase
        .from('special_attention_customers')
        .update({ reason: newReason })
        .or(`mobilenumber1.eq.${phoneNumber},mobilenumber2.eq.${phoneNumber}`);
      if (error) throw error;
      setSpecialReason(newReason);
      setSnackbar({
        open: true,
        message: 'Special reason updated successfully.',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error updating reason:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update special reason.',
        severity: 'error',
      });
    }
  };

  const handleOpenReasonDialog = (mode) => {
    setReasonDialogMode(mode);
    if (mode === 'edit') {
      setNewReason(specialReason);
    } else {
      setNewReason('');
    }
    setReasonDialogOpen(true);
  };

  const handleCloseReasonDialog = () => {
    setReasonDialogOpen(false);
    setNewReason('');
  };

  const handleConfirmReason = () => {
    if (reasonDialogMode === 'mark') {
      markSpecialAttention();
    } else if (reasonDialogMode === 'edit') {
      updateSpecialReason();
    }
    handleCloseReasonDialog();
  };

  // ----------------------------------------------------
  // ENQUIRY-SPECIFIC LOGIC
  // ----------------------------------------------------
  useEffect(() => {
    if (type === 'enquiry') {
      fetchProducts();
      fetchAssignedUser();
      fetchUsers();
      initializeSelectedProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, productSearchTerm, page]);

  // Fetch Products with Pagination and Search
  const fetchProducts = async () => {
    try {
      const { data: productData, error, count } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .ilike('item_name', `%${productSearchTerm}%`)
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1)
        .order('item_name');

      if (error) throw error;
      setProducts(productData);
      setTotalProducts(count);
    } catch (error) {
      console.error('Error fetching products:', error.message);
      setSnackbar({
        open: true,
        message: 'Failed to fetch products.',
        severity: 'error',
      });
    }
  };

  // Fetch Assigned User Details
  const fetchAssignedUser = async () => {
    try {
      // 'assignedto' is an ID in the 'users' table
      const { data: userData, error } = await supabase
        .from('users')
        .select('username, employee_code')
        .eq('id', data.assignedto)
        .single();

      if (error) {
        console.error('Error fetching user data:', error.message);
        setAssignedUser('Unknown User');
        return;
      }
      setAssignedUser(`${userData.username} (${userData.employee_code})`);
    } catch (error) {
      console.error('Error fetching assigned user:', error.message);
      setAssignedUser('Unknown User');
    }
  };

  // Fetch Users for Dropdown in Edit Dialog
  const fetchUsers = async () => {
    try {
      const { data: usersData, error } = await supabase.from('users').select('*');
      if (error) throw error;
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error.message);
      setSnackbar({
        open: true,
        message: 'Failed to fetch users.',
        severity: 'error',
      });
    }
  };

  // Initialize Selected Products with Prices
  const initializeSelectedProducts = async () => {
    if (!data.products) return;

    const parsedProducts = parseProducts(data.products);
    const updatedSelectedProducts = {};

    for (const [productId, product] of Object.entries(parsedProducts)) {
      const { data: productData, error } = await supabase
        .from('products')
        .select('price')
        .eq('product_id', productId)
        .single();

      if (error) {
        console.error(`Error fetching price for product ID ${productId}:`, error.message);
        updatedSelectedProducts[productId] = {
          ...product,
          price: 0,
        };
      } else {
        updatedSelectedProducts[productId] = {
          ...product,
          price: parseFloat(productData.price) || 0,
        };
      }
    }
    setSelectedProducts(updatedSelectedProducts);
  };

  // Handle Expand/Collapse of Card
  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  // Handle Edit Button Click
  const handleEditClick = () => {
    setEditOpen(true);
  };

  // Handle Edit Dialog Close
  const handleEditClose = () => setEditOpen(false);

  // Handle Pipeline Button Click
  const handlePipelineClick = () => setPipelineOpen(true);
  const handlePipelineClose = () => setPipelineOpen(false);

  // Handle Save from Edit Dialog
  const handleSave = async (updatedEnquiry) => {
    try {
      const { error } = await supabase
        .from('enquiries')
        .update(updatedEnquiry)
        .eq('id', data.id);

      if (error) throw error;

      setEditOpen(false);
      onEdit(updatedEnquiry);
      setSnackbar({
        open: true,
        message: 'Enquiry updated successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error updating enquiry:', error);
      setError('Failed to update enquiry. Please try again later.');
      setSnackbar({
        open: true,
        message: 'Failed to update enquiry',
        severity: 'error',
      });
    }
  };

  // Parse Products from JSON/String
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

  // Calculate Total Estimate Based on Selected Products
  const calculateTotalEstimate = () => {
    return Object.values(selectedProducts).reduce((sum, product) => {
      return sum + (product.price || 0) * (product.quantity || 1);
    }, 0);
  };

  // Handle Product Selection Toggle
  const handleProductToggle = (product) => {
    setSelectedProducts((prev) => {
      const newSelected = { ...prev };
      if (newSelected[product.product_id]) {
        delete newSelected[product.product_id];
      } else {
        newSelected[product.product_id] = {
          ...product,
          quantity: 1,
          price: parseFloat(product.price) || 0,
        };
      }
      return newSelected;
    });
  };

  // Handle Quantity Change for a Product
  const handleQuantityChange = (productId, change) => {
    setSelectedProducts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        quantity: Math.max(1, prev[productId].quantity + change),
      },
    }));
  };

  // Render Card Content
  const renderCardContent = () => {
    const productsData = parseProducts(data?.products);

    return (
      <>
        {/* Warning icon & highlight if special attention */}
        {isSpecialAttention && (
          <Box display="flex" alignItems="center" mb={1}>
            <WarningIcon color="error" />
            <Tooltip title={`Special Attention: ${specialReason}`}>
              <Typography variant="body2" color="error" sx={{ ml: 1 }}>
                Needs Special Attention
              </Typography>
            </Tooltip>
          </Box>
        )}

        <Typography variant="h6" component="div">
          {data.name || data.customer_name}
        </Typography>
        <Typography variant="body2">
          Date: {new Date(data.created_at || data.date).toLocaleDateString()}
        </Typography>
        <Typography variant="body2">Contact: {phoneNumber}</Typography>

        {expanded && (
          <>
            <Typography variant="body2">Address: {data.address}</Typography>
            <Typography variant="body2">Location: {data.location}</Typography>
            <Typography variant="body2">Stage: {data.stage}</Typography>
            <Typography variant="body2">
              DBT User ID/Password: {data.dbt_userid_password}
            </Typography>
            <Typography variant="body2">Lead Source: {data.leadsource}</Typography>
            {type === 'enquiry' && (
              <Typography variant="body2">Assigned To: {assignedUser}</Typography>
            )}
            <Typography variant="body2">Remarks: {data.remarks}</Typography>
            <Typography variant="body2">Subsidy: {data.subsidy ? 'Yes' : 'No'}</Typography>
            <Typography variant="body2">Invoiced: {data.invoiced ? 'Yes' : 'No'}</Typography>
            <Typography variant="body2">
              Collected: {data.collected ? 'Yes' : 'No'}
            </Typography>
            <Typography variant="body2">
              Salesflow Code: {data.salesflow_code}
            </Typography>
            {Object.values(productsData).length > 0 && (
              <Box mt={2}>
                <Typography variant="body2">Products:</Typography>
                {Object.values(productsData).map((product, index) => (
                  <Chip
                    key={index}
                    label={`${product.item_name} (${product.quantity})`}
                    size="small"
                    sx={{ mr: 1, mt: 1 }}
                  />
                ))}
              </Box>
            )}
          </>
        )}
      </>
    );
  };

  return (
    <Card
      sx={{
        minHeight: '200px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        // Highlight the card if it is special attention
        backgroundColor: isSpecialAttention ? '#ffe6e6' : 'white',
        border: isSpecialAttention ? '1px solid #f44336' : '1px solid #e0e0e0',
      }}
    >
      <CardContent sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {error && <Typography color="error">{error}</Typography>}
        {renderCardContent()}
      </CardContent>
      <CardActions sx={{ justifyContent: 'space-between' }}>
        {/* Special Attention Buttons */}
        {phoneNumber ? (
          <Box ml={1}>
            {isSpecialAttention ? (
              <>
                <Tooltip title="Unmark Special">
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={unmarkSpecialAttention}
                    sx={{ mr: 1 }}
                  >
                    Unmark
                  </Button>
                </Tooltip>
                <Tooltip title="Edit Reason">
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={() => handleOpenReasonDialog('edit')}
                  >
                    Edit Reason
                  </Button>
                </Tooltip>
              </>
            ) : (
              <Tooltip title="Mark as Special Attention">
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  onClick={() => handleOpenReasonDialog('mark')}
                >
                  Mark Special
                </Button>
              </Tooltip>
            )}
          </Box>
        ) : null}

        <Box>
          {type === 'enquiry' && (
            <>
              <Tooltip title="Edit">
                <IconButton onClick={handleEditClick}>
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Pipeline">
                <IconButton onClick={handlePipelineClick}>
                  <SettingsOutlinedIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
          <Tooltip title={expanded ? 'Show Less' : 'Show More'}>
            <IconButton onClick={handleExpandClick}>
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </CardActions>

      {/* Edit Enquiry Dialog */}
      <EditEnquiryDialog
        dialogOpen={editOpen}
        enquiryData={data}
        handleDialogClose={handleEditClose}
        handleFormSubmit={handleSave}
        users={users}
        products={products}
        selectedProducts={selectedProducts}
        setSelectedProducts={setSelectedProducts}
        handleProductToggle={handleProductToggle}
        handleQuantityChange={handleQuantityChange}
        productSearchTerm={productSearchTerm}
        handleProductSearchChange={(e) => setProductSearchTerm(e.target.value)}
        page={page}
        handlePageChange={(event, value) => setPage(value)}
        totalEstimate={calculateTotalEstimate()}
        ITEMS_PER_PAGE={ITEMS_PER_PAGE}
        totalProducts={totalProducts}
        currentUserId={data.assignedto}
      />

      {/* Pipeline Dialog */}
      <Dialog open={pipelineOpen} onClose={handlePipelineClose} maxWidth="md" fullWidth>
        <DialogTitle>Pipeline Form</DialogTitle>
        <DialogContent>
          <PipelineFormJSON enquiryId={data.id} />
        </DialogContent>
        <MuiDialogActions>
          <Button onClick={handlePipelineClose} color="primary">
            Close
          </Button>
        </MuiDialogActions>
      </Dialog>

      {/* Reason Dialog for Marking/Editing Special Attention */}
      <Dialog open={reasonDialogOpen} onClose={handleCloseReasonDialog} className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 sm:mx-auto">
  <DialogTitle className="px-6 py-4 border-b border-gray-200 text-lg font-semibold">
    {reasonDialogMode === 'mark'
      ? 'Mark as Special Attention'
      : 'Edit Special Attention Reason'}
  </DialogTitle>
  
  <DialogContent className="px-6 py-4">
    <Typography variant="body2" className="text-sm text-gray-600 mb-3">
      Please provide a reason:
    </Typography>
    
    <textarea
      className="w-full min-h-[120px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none resize-y"
      value={newReason}
      onChange={(e) => setNewReason(e.target.value)}
    />
  </DialogContent>
  
  <MuiDialogActions className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-2">
    <Button 
      onClick={handleCloseReasonDialog} 
      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      Cancel
    </Button>
    
    <Button
      onClick={handleConfirmReason}
      disabled={!newReason.trim()}
      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {reasonDialogMode === 'mark' ? 'Mark' : 'Update'}
    </Button>
  </MuiDialogActions>
</Dialog>

      {/* Snackbar for Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default InfoCard;
