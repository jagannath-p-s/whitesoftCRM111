import React, { useState, useEffect, useMemo, useRef, forwardRef } from 'react';
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
import { supabase } from '../supabaseClient'; // Adjust the import path as necessary

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  position: 'relative',
  '&:hover': {
    boxShadow: theme.shadows[4],
  },
}));

const DeleteButtonWrapper = styled('div')({
  position: 'absolute',
  bottom: 8,
  right: 8,
});

const BatchDialog = ({ open, onClose, onSave, products }) => {
  const [batchCode, setBatchCode] = useState('');
  const [batchesToAdd, setBatchesToAdd] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const batchRefs = useRef([]);

  useEffect(() => {
    if (open) {
      setBatchCode('');
      setBatchesToAdd([{ productId: '', expiryDate: '', currentStock: '', hasExpiryDate: false }]);
      batchRefs.current = [];
    }
  }, [open]);

  const handleAddBatch = () => {
    setBatchesToAdd(prevBatches => [
      ...prevBatches,
      { productId: '', expiryDate: '', currentStock: '', hasExpiryDate: false },
    ]);
    setTimeout(() => {
      batchRefs.current[batchRefs.current.length - 1]?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleBatchChange = (index, field, value) => {
    const updatedBatches = [...batchesToAdd];
    updatedBatches[index] = { ...updatedBatches[index], [field]: value };
    setBatchesToAdd(updatedBatches);
  };

  const handleRemoveBatch = (index) => {
    const updatedBatches = batchesToAdd.filter((_, i) => i !== index);
    setBatchesToAdd(updatedBatches);
  };

  const productOptions = useMemo(() =>
    products.map(product => ({
      id: product.product_id,
      label: `${product.product_name} (${product.item_alias})`,
      stock: product.current_stock,
      alias: product.item_alias,
    })),
    [products]
  );

  const isSaveDisabled = useMemo(() => {
    if (!batchCode.trim()) {
      return true;
    }
    return batchesToAdd.length === 0 || batchesToAdd.some(batch => !batch.productId || batch.currentStock === '');
  }, [batchCode, batchesToAdd]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        <Typography variant="h5" component="div">
          Add New Batch
        </Typography>
      </DialogTitle>
      <DialogContent>
        {products.length === 0 ? (
          <Typography color="error" variant="h6">
            Please add at least one product before adding a batch.
          </Typography>
        ) : (
          <>
            <TextField
              label="Batch Code"
              variant="outlined"
              fullWidth
              margin="normal"
              value={batchCode}
              onChange={(e) => setBatchCode(e.target.value)}
              helperText="Enter a unique code for this batch"
            />
            {batchesToAdd.map((batch, index) => (
              <StyledPaper key={index} elevation={3} ref={el => (batchRefs.current[index] = el)}>
                <Grid container spacing={3}>
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
                        margin="normal"
                        type="date"
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
        <Button onClick={onClose}  variant="outlined">
          Cancel
        </Button>
        <Button onClick={() => onSave(batchCode, batchesToAdd)} color="primary" variant="contained" disabled={isSaveDisabled}>
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
