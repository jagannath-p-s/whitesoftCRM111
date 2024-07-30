import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Add as AddIcon } from '@mui/icons-material';
import { Menu, MenuItem, Box, Snackbar, Alert } from '@mui/material';
import { supabase } from '../supabaseClient';
import AddEnquiryDialog from './AddEnquiryDialog';
import AddServiceEnquiryDialog from './AddServiceEnquiryDialog';

const SearchBar = ({ onSearch, currentUserId }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState({});
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [totalEstimate, setTotalEstimate] = useState(0);
  const [users, setUsers] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [enquiryData, setEnquiryData] = useState({
    name: '',
    mobilenumber1: '',
    mobilenumber2: '',
    address: '',
    location: '',
    stage: 'Lead',
    mailid: '',
    leadsource: '',
    assignedto: currentUserId,
    remarks: '',
    priority: 'Medium',
    invoiced: false,
    collected: false,
    created_at: new Date().toISOString(),
    salesflow_code: '',
    won_date: null,
  });

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    if (dialogOpen && dialogType === 'product') {
      fetchProducts();
    }
    fetchUsers();
  }, [dialogOpen, dialogType, page, productSearchTerm]);

  useEffect(() => {
    calculateTotalEstimate();
  }, [selectedProducts]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from('users').select('id, username');
      if (error) throw error;
      setUsers(data);
      console.log('Fetched users:', data);
    } catch (error) {
      console.error('Error fetching users:', error.message);
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

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    onSearch(e.target.value);
  };

  const handleProductSearchChange = (e) => {
    setProductSearchTerm(e.target.value);
  };

  const handleAddClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDialogOpen = (type) => {
    console.log('Opening dialog:', type);
    setDialogType(type);
    setDialogOpen(true);
    setAnchorEl(null);
    setSelectedProducts({});
    setPage(1);
    setProductSearchTerm('');
    setEnquiryData((prev) => ({
      ...prev,
      mobilenumber1: searchTerm,
      name: '',
      mobilenumber2: '',
      address: '',
      location: '',
      stage: 'Lead',
      mailid: '',
      leadsource: '',
      assignedto: currentUserId,
      remarks: '',
      priority: 'Medium',
      invoiced: false,
      collected: false,
      created_at: new Date().toISOString(),
      salesflow_code: '',
      won_date: null,
    }));
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleProductToggle = (product) => {
    setSelectedProducts((prev) => {
      const newSelected = { ...prev };
      if (newSelected[product.product_id]) {
        delete newSelected[product.product_id];
      } else {
        newSelected[product.product_id] = { ...product, quantity: 1 };
      }
      return newSelected;
    });
  };

  const handleQuantityChange = (productId, change) => {
    setSelectedProducts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        quantity: Math.max(1, prev[productId].quantity + change),
      },
    }));
  };

  const calculateTotalEstimate = () => {
    const total = Object.values(selectedProducts).reduce((sum, product) => {
      return sum + product.price * product.quantity;
    }, 0);
    setTotalEstimate(total);
  };

  const handleEnquiryDataChange = (e) => {
    const { name, value } = e.target;
    setEnquiryData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFormSubmit = async () => {
    try {
      // Create a deep copy of enquiryData to avoid circular structure issues
      let salesflow_code = enquiryData.salesflow_code ? `${enquiryData.salesflow_code}-${enquiryData.assignedto}` : `${enquiryData.assignedto}`;
      
      const enquiryToSave = JSON.parse(JSON.stringify({
        ...enquiryData,
        products: dialogType === 'product' ? selectedProducts : null,
        salesflow_code, // Set the updated salesflow_code
      }));
  
      console.log('Enquiry to be saved:', enquiryToSave);
  
      const { data: result, error } = await supabase.from('enquiries').insert([enquiryToSave]);
  
      if (error) throw error;
      console.log('Enquiry saved successfully:', result);
      showSnackbar('Enquiry saved successfully!', 'success');
      handleDialogClose();
    } catch (error) {
      console.error('Error saving enquiry:', error.message);
      showSnackbar(`Failed to save the enquiry: ${error.message}`, 'error');
    }
  };
  
  

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 600, margin: 'auto' }}>
      <div className="flex items-center w-full max-w-md bg-white rounded-full border border-gray-300 shadow-sm">
        <div className="pl-4 pr-2 py-2">
          <SearchIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="flex-grow py-2 px-2 bg-transparent outline-none text-sm"
          placeholder="Search"
          value={searchTerm}
          onChange={handleInputChange}
        />
        {searchTerm && (
          <div className="pr-2 py-1.5">
            <button
              type="button"
              className="p-1 rounded-full bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2"
              onClick={handleAddClick}
            >
              <AddIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => handleDialogOpen('service')}>Add Service Enquiry</MenuItem>
        <MenuItem onClick={() => handleDialogOpen('product')}>Add Product Enquiry</MenuItem>
      </Menu>

      {dialogType === 'service' ? (
        <AddServiceEnquiryDialog
          dialogOpen={dialogOpen}
          handleDialogClose={handleDialogClose}
          handleFormSubmit={handleFormSubmit}
          enquiryData={enquiryData}
          handleEnquiryDataChange={handleEnquiryDataChange}
          users={users}
          currentUserId={currentUserId}
        />
      ) : (
        <AddEnquiryDialog
  dialogOpen={dialogOpen}
  dialogType={dialogType}
  enquiryData={enquiryData}
  handleEnquiryDataChange={handleEnquiryDataChange}
  handleDialogClose={handleDialogClose}
  handleFormSubmit={handleFormSubmit}
  users={users}
  products={products}
  selectedProducts={selectedProducts}
  handleProductToggle={handleProductToggle}
  handleQuantityChange={handleQuantityChange}
  productSearchTerm={productSearchTerm}
  handleProductSearchChange={handleProductSearchChange}
  page={page}
  handlePageChange={handlePageChange}
  totalEstimate={totalEstimate}
  ITEMS_PER_PAGE={ITEMS_PER_PAGE}
  totalProducts={totalProducts}
  currentUserId={currentUserId} // Pass currentUserId
/>

      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
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

export default SearchBar;
