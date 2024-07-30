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
  ListSubheader
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';

const BatchDialog = ({ open, onClose, onSave, products }) => {
  const [batchCode, setBatchCode] = useState('');
  const [batchesToAdd, setBatchesToAdd] = useState([]);
  const [searchTerms, setSearchTerms] = useState([]);

  useEffect(() => {
    if (open) {
      setBatchCode('');
      setBatchesToAdd([{ productId: '', expiryDate: '', currentStock: '' }]);
      setSearchTerms(['']);
    }
  }, [open]);

  const handleAddBatch = () => {
    setBatchesToAdd([...batchesToAdd, { productId: '', expiryDate: '', currentStock: '' }]);
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
      expiryDate: batch.expiryDate || null
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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Add Batch</DialogTitle>
      <DialogContent>
        <TextField
          label="Batch Code"
          variant="outlined"
          fullWidth
          margin="dense"
          value={batchCode}
          onChange={(e) => setBatchCode(e.target.value)}
        />
        {batchesToAdd.map((batch, index) => (
          <Box key={index} sx={{ mt: 2, mb: 2, border: '1px solid gray', padding: '16px', position: 'relative' }}>
            <Typography variant="subtitle1" gutterBottom>Product {index + 1}</Typography>
            <FormControl fullWidth margin="dense">
              <InputLabel>Product</InputLabel>
              <Select
                value={batch.productId}
                onChange={(e) => handleBatchChange(index, 'productId', e.target.value)}
                label="Product"
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                    },
                  },
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
            <TextField
              label="Expiry Date"
              variant="outlined"
              fullWidth
              margin="dense"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={batch.expiryDate}
              onChange={(e) => handleBatchChange(index, 'expiryDate', e.target.value)}
            />
            <TextField
              label="Number of Units"
              variant="outlined"
              fullWidth
              margin="dense"
              type="number"
              value={batch.currentStock}
              onChange={(e) => handleBatchChange(index, 'currentStock', e.target.value)}
            />
            <IconButton
              onClick={() => handleRemoveBatch(index)}
              color="secondary"
              sx={{ position: 'absolute', top: 8, right: 8 }}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleAddBatch} color="primary">
          Add Another Product
        </Button>
        <Button onClick={handleSaveBatches} color="primary">
          Save All Batches
        </Button>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BatchDialog;
