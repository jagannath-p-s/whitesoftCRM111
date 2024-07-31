import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  InputAdornment,
  IconButton,
  Checkbox,
  FormControlLabel,
  Grid,
  Paper,
  ListSubheader,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import ClearIcon from '@mui/icons-material/Clear';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  position: 'relative',
}));

const BatchDialog = ({ open, onClose, onSave, products }) => {
  const [batchCode, setBatchCode] = useState('');
  const [batchesToAdd, setBatchesToAdd] = useState([]);
  const [searchTerms, setSearchTerms] = useState([]);

  useEffect(() => {
    if (open) {
      setBatchCode('');
      setBatchesToAdd([{ productId: '', expiryDate: '', currentStock: '', hasExpiryDate: false }]);
      setSearchTerms(['']);
    }
  }, [open]);

  const handleAddBatch = () => {
    setBatchesToAdd([...batchesToAdd, { productId: '', expiryDate: '', currentStock: '', hasExpiryDate: false }]);
    setSearchTerms([...searchTerms, '']);
  };

  const handleBatchChange = (index, field, value) => {
    const updatedBatches = [...batchesToAdd];
    updatedBatches[index] = { ...updatedBatches[index], [field]: value };
    setBatchesToAdd(updatedBatches);
  };

  const handleSearchChange = (index, value) => {
    const newSearchTerms = [...searchTerms];
    newSearchTerms[index] = value;
    setSearchTerms(newSearchTerms);
  };

  const handleSaveBatches = () => {
    if (!batchCode.trim()) {
      alert('Please enter a batch code');
      return;
    }

    const isValid = batchesToAdd.every(batch =>
      batch.productId && batch.currentStock !== ''
    );

    if (!isValid) {
      alert('Please fill in all required fields for each product');
      return;
    }

    onSave(batchCode, batchesToAdd.map(batch => ({
      ...batch,
      expiryDate: batch.hasExpiryDate ? batch.expiryDate : null
    })));
    onClose();
  };

  const handleRemoveBatch = (index) => {
    const updatedBatches = batchesToAdd.filter((_, i) => i !== index);
    const updatedSearchTerms = searchTerms.filter((_, i) => i !== index);
    setBatchesToAdd(updatedBatches);
    setSearchTerms(updatedSearchTerms);
  };

  const filteredProducts = (index) => {
    return products.filter(product =>
      product.product_name.toLowerCase().includes(searchTerms[index].toLowerCase())
    );
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Add Batch</DialogTitle>
      <DialogContent>
        <TextField
          label="Batch Code"
          variant="outlined"
          fullWidth
          margin="normal"
          value={batchCode}
          onChange={(e) => setBatchCode(e.target.value)}
        />
        {batchesToAdd.map((batch, index) => (
          <StyledPaper key={index} elevation={3}>
            <Typography variant="h6" gutterBottom>Product {index + 1}</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Product</InputLabel>
                  <Select
                    value={batch.productId}
                    onChange={(e) => handleBatchChange(index, 'productId', e.target.value)}
                    label="Product"
                    MenuProps={{
                      PaperProps: { style: { maxHeight: 300 } },
                    }}
                  >
                    <ListSubheader>
                      <TextField
                        size="small"
                        autoFocus
                        placeholder="Type to search..."
                        fullWidth
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon />
                            </InputAdornment>
                          ),
                        }}
                        onChange={(e) => handleSearchChange(index, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key !== 'Escape') {
                            e.stopPropagation();
                          }
                        }}
                      />
                    </ListSubheader>
                    {filteredProducts(index).map((product) => (
                      <MenuItem key={product.product_id} value={product.product_id}>
                        {product.product_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Number of Units"
                  variant="outlined"
                  fullWidth
                  margin="normal"
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
            <IconButton
              onClick={() => handleRemoveBatch(index)}
              color="secondary"
              sx={{ position: 'absolute', top: 8, right: 8 }}
            >
              <DeleteIcon />
            </IconButton>
          </StyledPaper>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleAddBatch} color="primary" variant="outlined">
          Add Another Product
        </Button>
        <Button onClick={handleSaveBatches} color="primary" variant="contained">
          Save All Batches
        </Button>
        <Button onClick={onClose} color="secondary" variant="outlined">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BatchDialog;
