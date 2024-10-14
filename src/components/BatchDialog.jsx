import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Paper,
  Autocomplete,
  Snackbar,
  Alert,
  IconButton,
  InputAdornment
} from '@mui/material';
import { styled } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ClearIcon from '@mui/icons-material/Clear';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(2),
  borderRadius: theme.shape.borderRadius * 2,
  position: 'relative',
  '&:hover': {
    boxShadow: theme.shadows[4],
  },
}));

const DeleteButtonWrapper = styled('div')({
  position: 'absolute',
  top: 12,
  right: 12,
});

const BatchDialog = ({ open, onClose, onSave, products }) => {
  const [batchCode, setBatchCode] = useState('');
  const [batchesToAdd, setBatchesToAdd] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const batchRefs = useRef([]);

  // Logs the state when dialog opens and resets values
  useEffect(() => {
    if (open) {
      console.log('Dialog opened. Resetting batch data.');
      setBatchCode('');
      setBatchesToAdd([{ productId: '', expiryDate: '', currentStock: '', hasExpiryDate: false, store: '', rack_number: '', box_number: '' }]);
      batchRefs.current = [];
    }
  }, [open]);

  const handleAddBatch = () => {
    console.log('Adding new batch row.');
    setBatchesToAdd(prevBatches => [
      ...prevBatches,
      { productId: '', expiryDate: '', currentStock: '', hasExpiryDate: false, store: '', rack_number: '', box_number: '' },
    ]);
    setTimeout(() => {
      batchRefs.current[batchRefs.current.length - 1]?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleBatchChange = (index, field, value) => {
    console.log(`Updating batch index: ${index}, field: ${field}, value: ${value}`);
    const updatedBatches = [...batchesToAdd];
    updatedBatches[index] = { ...updatedBatches[index], [field]: value };
    setBatchesToAdd(updatedBatches);
  };

  const handleRemoveBatch = (index) => {
    console.log(`Removing batch at index: ${index}`);
    const updatedBatches = batchesToAdd.filter((_, i) => i !== index);
    setBatchesToAdd(updatedBatches);
  };

  const productOptions = useMemo(() =>
    products.map(product => ({
      id: product.product_id,
      label: `${product.item_name} (${product.item_alias || ''}) [${product.barcode_number || ''}]`,
      stock: product.current_stock,
      barcode: product.barcode_number,
      alias: product.item_alias,
    })),
    [products]
  );

  // Disable save button if any required fields are missing
  const isSaveDisabled = useMemo(() => {
    if (!batchCode.trim()) {
      return true;
    }
    return batchesToAdd.length === 0 || batchesToAdd.some(batch => !batch.productId || batch.currentStock === '');
  }, [batchCode, batchesToAdd]);

  // Handle save, log the data being saved
  const handleSave = async () => {
    console.log('Trying to save batches');
    console.log('Batch Code:', batchCode);
    console.log('Batches to Add:', batchesToAdd);

    if (isSaveDisabled) {
      setSnackbar({ open: true, message: 'Please fill in all required fields for each product.', severity: 'error' });
      return;
    }

    try {
      await onSave(batchCode, batchesToAdd);
      console.log('Batches saved successfully!');
      setSnackbar({ open: true, message: 'Batches saved successfully!', severity: 'success' });
      onClose();
    } catch (error) {
      console.error('Error saving batches:', error);
      setSnackbar({ open: true, message: 'Error saving batches.', severity: 'error' });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { padding: 2, borderRadius: 2 } }}>
      <DialogTitle>
        <Typography variant="h5" component="div" align="center">
          Add New Batch
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        {products.length === 0 ? (
          <Typography color="error" variant="h6">
            Please add at least one product before adding a batch.
          </Typography>
        ) : (
          <>
            <Box mb={3}>
              <TextField
                label="Batch Code"
                variant="outlined"
                fullWidth
                margin="dense"
                value={batchCode}
                onChange={(e) => setBatchCode(e.target.value)}
                helperText="Enter a unique code for this batch"
              />
            </Box>
            {batchesToAdd.map((batch, index) => (
              <StyledPaper key={index} elevation={2} ref={el => (batchRefs.current[index] = el)}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      options={productOptions}
                      getOptionLabel={(option) => option.label}
                      value={productOptions.find(option => option.id === batch.productId) || null}
                      onChange={(_, newValue) => handleBatchChange(index, 'productId', newValue ? newValue.id : '')}
                      renderInput={(params) => <TextField {...params} label="Product" fullWidth />}
                      renderOption={(props, option) => (
                        <li {...props}>
                          <Typography variant="body1">{option.label}</Typography>
                          <Typography variant="caption" color="textSecondary" style={{ marginLeft: 'auto' }}>
                            Stock: {option.stock}
                          </Typography>
                        </li>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Number of Units"
                      variant="outlined"
                      fullWidth
                      type="number"
                      margin="dense"
                      value={batch.currentStock}
                      onChange={(e) => handleBatchChange(index, 'currentStock', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={batch.hasExpiryDate}
                          onChange={(e) => handleBatchChange(index, 'hasExpiryDate', e.target.checked)}
                        />
                      }
                      label="Has Expiry Date"
                    />
                  </Grid>
                  {batch.hasExpiryDate && (
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Expiry Date"
                        variant="outlined"
                        fullWidth
                        type="date"
                        margin="dense"
                        InputLabelProps={{ shrink: true }}
                        value={batch.expiryDate}
                        onChange={(e) => handleBatchChange(index, 'expiryDate', e.target.value)}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => handleBatchChange(index, 'expiryDate', '')}
                                edge="end"
                              >
                                <ClearIcon />
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  )}
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Store"
                      variant="outlined"
                      fullWidth
                      margin="dense"
                      value={batch.store}
                      onChange={(e) => handleBatchChange(index, 'store', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      label="Rack Number"
                      variant="outlined"
                      fullWidth
                      margin="dense"
                      value={batch.rack_number}
                      onChange={(e) => handleBatchChange(index, 'rack_number', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      label="Box Number"
                      variant="outlined"
                      fullWidth
                      margin="dense"
                      value={batch.box_number}
                      onChange={(e) => handleBatchChange(index, 'box_number', e.target.value)}
                    />
                  </Grid>
                </Grid>
                <DeleteButtonWrapper>
                  <IconButton onClick={() => handleRemoveBatch(index)} sx={{ color: '#d32f2f' }}>
                    <DeleteIcon />
                  </IconButton>
                </DeleteButtonWrapper>
              </StyledPaper>
            ))}
            <Box display="flex" justifyContent="center" mt={2}>
              <Button
                startIcon={<AddCircleOutlineIcon />}
                onClick={handleAddBatch}
                variant="outlined"
                color="primary"
              >
                Add Another Product
              </Button>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined" color="secondary">
          Cancel
        </Button>
        <Button onClick={handleSave} color="primary" variant="contained" disabled={isSaveDisabled}>
          Save All Batches
        </Button>
      </DialogActions>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default BatchDialog;
