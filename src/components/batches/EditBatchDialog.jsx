// EditBatchDialog.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  Grid,
  Autocomplete,
  Snackbar,
  Alert,
  IconButton,
  InputAdornment,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import { format, parse, isValid } from 'date-fns';

const EditBatchDialog = ({ open, onClose, onSave, batch, products }) => {
  const [batchCode, setBatchCode] = useState('');
  const [currentStock, setCurrentStock] = useState('');
  const [hasExpiryDate, setHasExpiryDate] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [store, setStore] = useState('');
  const [rackNumber, setRackNumber] = useState('');
  const [boxNumber, setBoxNumber] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const productOptions = useMemo(
    () =>
      products.map((product) => ({
        id: product.barcode_number, // Use barcode_number as the unique identifier
        label: `${product.item_name} (${product.item_alias || ''}) [${product.barcode_number || ''}]`,
      })),
    [products]
  );

  useEffect(() => {
    if (batch && open) {
      setBatchCode(batch.batch_code || '');
      setCurrentStock(batch.current_stock || '');
      setHasExpiryDate(!!batch.expiry_date);
      setExpiryDate(batch.expiry_date ? format(new Date(batch.expiry_date), 'yyyy-MM-dd') : '');
      setStore(batch.store || '');
      setRackNumber(batch.rack_number || '');
      setBoxNumber(batch.box_number || '');
      const selectedOption = productOptions.find(option => option.id === batch.barcode_number);
      setSelectedProduct(selectedOption || null);
    }
  }, [batch, open, productOptions]);

  const isSaveDisabled = useMemo(() => {
    if (!batchCode.trim()) {
      return true;
    }
    if (!selectedProduct) {
      return true;
    }
    if (currentStock === '' || isNaN(currentStock) || parseInt(currentStock, 10) < 0) {
      return true;
    }
    if (hasExpiryDate && (!expiryDate || !isValid(parse(expiryDate, 'yyyy-MM-dd', new Date())))) {
      return true;
    }
    return false;
  }, [batchCode, selectedProduct, currentStock, hasExpiryDate, expiryDate]);

  const handleSave = () => {
    if (isSaveDisabled) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields correctly.',
        severity: 'error',
      });
      return;
    }

    const formattedExpiryDate = hasExpiryDate ? expiryDate : null;

    const updatedBatch = {
      batch_id: batch.batch_id,
      barcode_number: selectedProduct.id, // Use the id from selectedProduct
      batch_code: batchCode,
      expiry_date: formattedExpiryDate,
      current_stock: parseInt(currentStock, 10),
      store: store || null,
      rack_number: rackNumber || null,
      box_number: boxNumber || null,
    };

    onSave(updatedBatch)
      .then(() => {
        setSnackbar({ open: true, message: 'Batch updated successfully!', severity: 'success' });
        onClose();
      })
      .catch((error) => {
        console.error('Error updating batch:', error);
        setSnackbar({ open: true, message: 'Error updating batch.', severity: 'error' });
      });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h5" component="div" align="center">
          Edit Batch
        </Typography>
      </DialogTitle>
      <DialogContent>
        {products.length === 0 ? (
          <Typography color="error" variant="h6">
            No products available. Please add products before editing a batch.
          </Typography>
        ) : (
          <Box mt={2}>
            <Grid container spacing={2}>
             
             
              <Grid item xs={12}>
                <TextField
                  label="Number of Units"
                  type="number"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(e.target.value)}
                  helperText="Enter the number of units"
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={hasExpiryDate}
                      onChange={(e) => setHasExpiryDate(e.target.checked)}
                    />
                  }
                  label="Has Expiry Date"
                />
              </Grid>
              {hasExpiryDate && (
                <Grid item xs={12}>
                  <TextField
                    label="Expiry Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    InputProps={{
                      endAdornment: expiryDate ? (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setExpiryDate('')}>
                            <ClearIcon />
                          </IconButton>
                        </InputAdornment>
                      ) : null,
                    }}
                    fullWidth
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField
                  label="Store"
                  value={store}
                  onChange={(e) => setStore(e.target.value)}
                  helperText="Enter the store location"
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Rack Number"
                  value={rackNumber}
                  onChange={(e) => setRackNumber(e.target.value)}
                  helperText="Enter the rack number"
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Box Number"
                  value={boxNumber}
                  onChange={(e) => setBoxNumber(e.target.value)}
                  helperText="Enter the box number"
                  fullWidth
                />
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          
          disabled={isSaveDisabled}
        >
          Save Changes
        </Button>
      </DialogActions>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
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
    </Dialog>
  );
};

export default EditBatchDialog;
