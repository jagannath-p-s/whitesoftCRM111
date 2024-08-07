import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // Ensure this path is correct
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
  Snackbar,
  Alert,
  InputAdornment,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
  Inventory as InventoryIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { LocalizationProvider, DatePicker } from '@mui/lab';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import { format, parse, isValid } from 'date-fns';
import BatchDialog from './BatchDialog';

const BatchComponent = () => {
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [filter, setFilter] = useState('');
  const [customExpiryDate, setCustomExpiryDate] = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState(null);

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

    let filteredBatches = batches.filter(batch => {
      if (!batch.expiry_date) return filter === ''; // Only include items without expiry date when no filter is applied
      const expiryDate = new Date(batch.expiry_date);
      switch (filter) {
        case 'expiringInNext10Days':
          return expiryDate <= tenDaysFromNow && expiryDate >= now;
        case 'expiringThisMonth':
          return expiryDate <= endOfMonth && expiryDate >= now;
        case 'customExpiryDate':
          return customExpiryDate && expiryDate <= customExpiryDate && expiryDate >= now;
        default:
          return true;
      }
    }).filter(batch => {
      if (productSearch) {
        const product = products.find(p => p.product_id === batch.product_id);
        return (
          batch.batch_code.toLowerCase().includes(productSearch.toLowerCase()) ||
          (product && (
            product.product_name.toLowerCase().includes(productSearch.toLowerCase()) ||
            product.item_alias.toLowerCase().includes(productSearch.toLowerCase())
          ))
        );
      }
      return true;
    });

    // Sort batches to move those without expiry dates to the bottom
    filteredBatches = filteredBatches.sort((a, b) => {
      if (!a.expiry_date && !b.expiry_date) return 0;
      if (!a.expiry_date) return 1;
      if (!b.expiry_date) return -1;
      return new Date(a.expiry_date) - new Date(b.expiry_date);
    });

    return filteredBatches;
  };

  const handleOpenBatchDialog = () => {
    setBatchDialogOpen(true);
  };

  const handleCloseBatchDialog = () => {
    setBatchDialogOpen(false);
  };

  const handleSaveBatch = async (batchCode, batchesToAdd) => {
    if (!batchCode.trim()) {
      showSnackbar('Please enter a batch code', 'error');
      return;
    }

    const allValid = batchesToAdd.every(batch => {
      const expiryDateValid = !batch.hasExpiryDate || (batch.expiryDate && isValid(parse(batch.expiryDate, 'yyyy-MM-dd', new Date())));
      return batch.productId && batch.currentStock !== '' && expiryDateValid;
    });

    if (!allValid) {
      showSnackbar('Please fill in all required fields for each product', 'error');
      return;
    }

    try {
      // Fetch the current stock for each product and update it
      const updatedStocks = await Promise.all(batchesToAdd.map(async batch => {
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('current_stock')
          .eq('product_id', batch.productId)
          .single();

        if (productError) throw productError;

        const newStock = productData.current_stock + parseInt(batch.currentStock, 10);
        return { productId: batch.productId, newStock };
      }));

      // Insert the new batches
      const payloads = batchesToAdd.map(batch => {
        let expiryDate = null;
        if (batch.hasExpiryDate && batch.expiryDate) {
          const parsedDate = parse(batch.expiryDate, 'yyyy-MM-dd', new Date());
          expiryDate = isValid(parsedDate) ? format(parsedDate, 'yyyy-MM-dd') : null;
        }

        return {
          product_id: batch.productId,
          batch_code: batchCode, // Use the provided batchCode without modification
          expiry_date: expiryDate,
          current_stock: parseInt(batch.currentStock, 10),
        };
      });

      const { error: batchError } = await supabase.from('batches').insert(payloads);
      if (batchError) throw batchError;

      // Update the stock in the products table
      await Promise.all(updatedStocks.map(async ({ productId, newStock }) => {
        const { error: updateError } = await supabase
          .from('products')
          .update({ current_stock: newStock })
          .eq('product_id', productId);
        if (updateError) throw updateError;
      }));

      showSnackbar('Batches saved successfully', 'success');
      fetchBatches(); // Refresh the batches after adding new ones
      fetchProducts(); // Refresh the products to get updated stock
      handleCloseBatchDialog();
    } catch (error) {
      console.error('Error adding batches:', error.message);
      showSnackbar(`Error adding batches: ${error.message}`, 'error');
    }
  };

  const handleDeleteBatch = async () => {
    const { batch_id, product_id, current_stock } = batchToDelete;
    try {
      // Fetch the current stock for the product
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('current_stock')
        .eq('product_id', product_id)
        .single();

      if (productError) throw productError;

      const newStock = productData.current_stock - current_stock;
      if (newStock < 0) throw new Error('Stock cannot be negative');

      // Delete the batch
      const { error: batchError } = await supabase.from('batches').delete().eq('batch_id', batch_id);
      if (batchError) throw batchError;

      // Update the stock in the products table
      const { error: updateError } = await supabase
        .from('products')
        .update({ current_stock: newStock })
        .eq('product_id', product_id);
      if (updateError) throw updateError;

      showSnackbar('Batch deleted successfully', 'success');
      fetchBatches(); // Refresh the batches after deleting one
      fetchProducts(); // Refresh the products to get updated stock
    } catch (error) {
      console.error('Error deleting batch:', error.message);
      showSnackbar(`Error deleting batch: ${error.message}`, 'error');
    } finally {
      setDeleteDialogOpen(false);
      setBatchToDelete(null);
    }
  };

  const confirmDeleteBatch = (batch) => {
    setBatchToDelete(batch);
    setDeleteDialogOpen(true);
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
                placeholder="Search Product or Batch Code"
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
                <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>No.</TableCell> {/* New column for numbering */}
                <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Batch Code</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Expiry Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Stock</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Alias</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filterBatches(batches).map((batch, index) => (
                <TableRow key={batch.batch_id} className="bg-white border-b">
                  <TableCell>{index + 1}</TableCell> {/* Displaying the index */}
                  <TableCell>{batch.batch_code}</TableCell>
                  <TableCell>{batch.expiry_date}</TableCell>
                  <TableCell>{batch.current_stock}</TableCell>
                  <TableCell>{products.find((product) => product.product_id === batch.product_id)?.product_name}</TableCell>
                  <TableCell>{products.find((product) => product.product_id === batch.product_id)?.item_alias}</TableCell>
                  <TableCell>
                    <Tooltip title="Delete">
                      <IconButton onClick={() => confirmDeleteBatch(batch)}>
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

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Confirm Delete"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this batch? This action will also reduce the product stock accordingly.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteBatch} color="secondary" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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
    </div>
  );
};

export default BatchComponent;
