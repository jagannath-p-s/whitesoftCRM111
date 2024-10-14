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
  InputAdornment,
  Divider,
  Tooltip,
  Zoom
} from '@mui/material';
import { styled } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ClearIcon from '@mui/icons-material/Clear';
import InfoIcon from '@mui/icons-material/Info';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  position: 'relative',
  transition: 'box-shadow 0.3s ease-in-out',
  '&:hover': {
    boxShadow: theme.shadows[8],
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

  useEffect(() => {
    if (open) {
      setBatchCode('');
      setBatchesToAdd([{ productId: '', expiryDate: '', currentStock: '', hasExpiryDate: false, store: '', rack_number: '', box_number: '' }]);
      batchRefs.current = [];
    }
  }, [open]);

  const handleAddBatch = () => {
    setBatchesToAdd(prevBatches => [
      ...prevBatches,
      { productId: '', expiryDate: '', currentStock: '', hasExpiryDate: false, store: '', rack_number: '', box_number: '' },
    ]);
    setTimeout(() => {
      batchRefs.current[batchRefs.current.length - 1]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { padding: 2, borderRadius: 3 } }}>
      <DialogTitle>
        <Typography variant="h4" component="div" align="center" gutterBottom>
          Add New Batch
        </Typography>
        <Divider />
      </DialogTitle>
      <DialogContent>
        {products.length === 0 ? (
          <Typography color="error" variant="h6" align="center" sx={{ my: 4 }}>
            Please add at least one product before adding a batch.
          </Typography>
        ) : (
          <>
            <Box mb={4} mt={2}>
              <TextField
                label="Batch Code"
                variant="outlined"
                fullWidth
                value={batchCode}
                onChange={(e) => setBatchCode(e.target.value)}
                helperText="Enter a unique code for this batch"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Batch code must be unique" arrow>
                        <InfoIcon color="action" />
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            {batchesToAdd.map((batch, index) => (
              <Zoom in={true} key={index} style={{ transitionDelay: `${index * 50}ms` }}>
                <StyledPaper elevation={3} ref={el => (batchRefs.current[index] = el)}>
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
                            <Box>
                              <Typography variant="body1">{option.label}</Typography>
                              <Typography variant="caption" color="textSecondary">
                                Current Stock: {option.stock}
                              </Typography>
                            </Box>
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
                            color="primary"
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
                          InputLabelProps={{ shrink: true }}
                          value={batch.expiryDate}
                          onChange={(e) => handleBatchChange(index, 'expiryDate', e.target.value)}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={() => handleBatchChange(index, 'expiryDate', '')}
                                  edge="end"
                                  size="small"
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
                        value={batch.store}
                        onChange={(e) => handleBatchChange(index, 'store', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <TextField
                        label="Rack Number"
                        variant="outlined"
                        fullWidth
                        value={batch.rack_number}
                        onChange={(e) => handleBatchChange(index, 'rack_number', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <TextField
                        label="Box Number"
                        variant="outlined"
                        fullWidth
                        value={batch.box_number}
                        onChange={(e) => handleBatchChange(index, 'box_number', e.target.value)}
                      />
                    </Grid>
                  </Grid>
                  <DeleteButtonWrapper>
                    <Tooltip title="Remove this batch" arrow>
                      <IconButton onClick={() => handleRemoveBatch(index)} sx={{ color: '#d32f2f' }}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </DeleteButtonWrapper>
                </StyledPaper>
              </Zoom>
            ))}
            <Box display="flex" justifyContent="center" mt={3}>
              <Button
                startIcon={<AddCircleOutlineIcon />}
                onClick={handleAddBatch}
                variant="outlined"
                color="primary"
                size="large"
              >
                Add Another Product
              </Button>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ padding: 3 }}>
        <Button onClick={onClose} variant="outlined" color="secondary" size="large">
          Cancel
        </Button>
        <Button 
          onClick={() => onSave(batchCode, batchesToAdd)} 
          color="primary" 
          variant="contained" 
          disabled={isSaveDisabled}
          size="large"
        >
          Save All Batches
        </Button>
      </DialogActions>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default BatchDialog;