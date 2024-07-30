import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
  TextField,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Snackbar,
  Alert,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
  Inventory as InventoryIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { LocalizationProvider, DatePicker } from '@mui/lab';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import BatchDialog from './BatchDialog';

const BatchComponent = () => {
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [anchorEl, setAnchorEl] = useState(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [filter, setFilter] = useState('');
  const [customExpiryDate, setCustomExpiryDate] = useState(null);
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    fetchBatches();
    fetchProducts();
  }, []);

  const fetchBatches = async () => {
    const { data, error } = await supabase.from('batches').select('*');
    if (error) {
      showSnackbar(`Error fetching batches: ${error.message}`, 'error');
    } else {
      setBatches(data);
    }
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*');
    if (error) {
      showSnackbar(`Error fetching products: ${error.message}`, 'error');
    } else {
      setProducts(data);
    }
  };

  const handleFilterMenuOpen = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setFilterAnchorEl(null);
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    handleFilterMenuClose();
  };

  const filterBatches = (batches) => {
    const now = new Date();
    const tenDaysFromNow = new Date();
    tenDaysFromNow.setDate(now.getDate() + 10);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return batches.filter(batch => {
      const expiryDate = new Date(batch.expiry_date);
      switch (filter) {
        case 'expiringInNext10Days':
          return expiryDate <= tenDaysFromNow;
        case 'expiringThisMonth':
          return expiryDate <= endOfMonth;
        case 'customExpiryDate':
          return customExpiryDate && expiryDate <= customExpiryDate;
        default:
          return true;
      }
    }).filter(batch => {
      if (productSearch) {
        const product = products.find(p => p.product_id === batch.product_id);
        return product && product.product_name.toLowerCase().includes(productSearch.toLowerCase());
      }
      return true;
    });
  };

  const handleOpenBatchDialog = () => {
    setSelectedBatch(null);
    setBatchDialogOpen(true);
  };

  const handleCloseBatchDialog = () => {
    setBatchDialogOpen(false);
  };

  const handleSaveBatch = async (batchCode, batchesToAdd) => {
    const batchData = batchesToAdd.map((batch) => ({
      batch_code: batchCode,
      expiry_date: batch.expiryDate,
      current_stock: parseInt(batch.currentStock),
      product_id: batch.productId
    }));

    const { error } = await supabase.from('batches').insert(batchData);
    if (error) {
      showSnackbar(`Error adding batches: ${error.message}`, 'error');
    } else {
      showSnackbar('Batches added successfully', 'success');
      fetchBatches();
      handleCloseBatchDialog();
    }
  };

  const handleEditBatch = (batch) => {
    setSelectedBatch(batch);
    setBatchDialogOpen(true);
  };

  const handleDeleteBatch = async (batch_id) => {
    const { error } = await supabase.from('batches').delete().eq('batch_id', batch_id);
    if (error) {
      showSnackbar(`Error deleting batch: ${error.message}`, 'error');
    } else {
      showSnackbar('Batch deleted successfully', 'success');
      fetchBatches();
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

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-4">
              <InventoryIcon className="text-blue-500" style={{ fontSize: '1.75rem' }} />
              <h1 className="text-xl font-semibold ml-2">Batches</h1>
            </div>
            <div className="flex items-center space-x-2">
              <TextField
                variant="outlined"
                placeholder="Search Product"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <Tooltip title="Filter">
                <IconButton onClick={handleFilterMenuOpen} style={{ backgroundColor: '#e3f2fd', color: '#1e88e5', borderRadius: '12px' }}>
                  <FilterListIcon style={{ fontSize: '1.75rem' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Add">
                <IconButton onClick={handleOpenBatchDialog} style={{ backgroundColor: '#e3f2fd', color: '#1e88e5', borderRadius: '12px' }}>
                  <AddIcon style={{ fontSize: '1.75rem' }} />
                </IconButton>
              </Tooltip>
              <Menu anchorEl={filterAnchorEl} open={Boolean(filterAnchorEl)} onClose={handleFilterMenuClose}>
                <MenuItem onClick={() => handleFilterChange('')}>All</MenuItem>
                <MenuItem onClick={() => handleFilterChange('expiringInNext10Days')}>Expiring in Next 10 Days</MenuItem>
                <MenuItem onClick={() => handleFilterChange('expiringThisMonth')}>Expiring This Month</MenuItem>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <MenuItem>
                    <DatePicker
                      label="Custom Expiry Date"
                      value={customExpiryDate}
                      onChange={(newDate) => setCustomExpiryDate(newDate)}
                      renderInput={(params) => <TextField {...params} />}
                    />
                  </MenuItem>
                </LocalizationProvider>
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
                <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Batch Code</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Expiry Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Stock</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filterBatches(batches).map((batch) => (
                <TableRow key={batch.batch_id} className="bg-white border-b">
                  <TableCell>{batch.batch_code}</TableCell>
                  <TableCell>{batch.expiry_date}</TableCell>
                  <TableCell>{batch.current_stock}</TableCell>
                  <TableCell>{products.find((product) => product.product_id === batch.product_id)?.product_name}</TableCell>
                  <TableCell>
                    <Tooltip title="Delete">
                      <IconButton onClick={() => handleDeleteBatch(batch.batch_id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      <BatchDialog
        open={batchDialogOpen}
        onClose={handleCloseBatchDialog}
        onSave={handleSaveBatch}
        products={products}
      />

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
    </div>
  );
};

export default BatchComponent;
