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
  Paper,
  Autocomplete,
  IconButton,
  Tooltip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  position: 'relative',
  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
}));

const DeleteButtonWrapper = styled('div')({
  position: 'absolute',
  top: 8,
  right: 8,
});

const BatchDialog = ({ open, onClose, onSave, products }) => {
  const [batchCode, setBatchCode] = useState('');
  const [batchesToAdd, setBatchesToAdd] = useState([{ productId: '', expiryDate: '', currentStock: '', hasExpiryDate: false, store: '', rack_number: '', box_number: '' }]);

  useEffect(() => {
    if (open) {
      setBatchCode('');
      setBatchesToAdd([{ productId: '', expiryDate: '', currentStock: '', hasExpiryDate: false, store: '', rack_number: '', box_number: '' }]);
    }
  }, [open]);

  const handleAddBatch = () => {
    setBatchesToAdd(prevBatches => [...prevBatches, { productId: '', expiryDate: '', currentStock: '', hasExpiryDate: false, store: '', rack_number: '', box_number: '' }]);
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
    })),
    [products]
  );

  const isSaveDisabled = useMemo(() => {
    if (!batchCode.trim()) return true;
    return batchesToAdd.length === 0 || batchesToAdd.some(batch => !batch.productId || batch.currentStock === '');
  }, [batchCode, batchesToAdd]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ style: { borderRadius: 8 } }}>
      <DialogTitle>
        <Typography variant="h5" align="center">Add New Batch</Typography>
      </DialogTitle>
      <DialogContent>
        <Box mb={3}>
          <TextField
            label="Batch Code"
            variant="outlined"
            fullWidth
            value={batchCode}
            onChange={(e) => setBatchCode(e.target.value)}
            helperText="Enter a unique code for this batch"
            InputProps={{
              endAdornment: (
                <Tooltip title="Batch code must be unique">
                  <IconButton edge="end">
                    <InfoOutlinedIcon />
                  </IconButton>
                </Tooltip>
              ),
            }}
          />
        </Box>
        {batchesToAdd.map((batch, index) => (
          <StyledPaper key={index}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={productOptions}
                  getOptionLabel={(option) => option.label}
                  value={productOptions.find(option => option.id === batch.productId) || null}
                  onChange={(_, newValue) => handleBatchChange(index, 'productId', newValue ? newValue.id : '')}
                  renderInput={(params) => <TextField {...params} label="Product" fullWidth />}
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
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={batch.expiryDate}
                    onChange={(e) => handleBatchChange(index, 'expiryDate', e.target.value)}
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
              <IconButton onClick={() => handleRemoveBatch(index)} size="small" style={{ color: 'red' }}>
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined" color="secondary">
          Cancel
        </Button>
        <Button onClick={() => onSave(batchCode, batchesToAdd)} color="primary" variant="contained" disabled={isSaveDisabled}>
          Save All Batches
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BatchDialog;