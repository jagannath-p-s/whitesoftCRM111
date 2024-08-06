import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  IconButton,
  Typography,
  Pagination,
  Box,
} from '@mui/material';
import { supabase } from '../supabaseClient';

const EditEnquiryDialog = ({
  dialogOpen,
  enquiryData,
  handleDialogClose,
  handleFormSubmit,
  users,
  products,
  selectedProducts,
  handleProductToggle,
  handleQuantityChange,
  productSearchTerm,
  handleProductSearchChange,
  page,
  handlePageChange,
  totalEstimate,
  ITEMS_PER_PAGE,
  totalProducts,
  currentUserId,
}) => {
  const [leadSources, setLeadSources] = useState([]);
  const [localEnquiryData, setLocalEnquiryData] = useState(enquiryData || {});
  const [localSelectedProducts, setLocalSelectedProducts] = useState(selectedProducts);

  useEffect(() => {
    const fetchLeadSources = async () => {
      const { data, error } = await supabase.from('lead_sources').select();
      if (error) {
        console.error('Error fetching lead sources:', error);
      } else {
        console.log('Lead sources fetched:', data);
        setLeadSources(data);
      }
    };

    fetchLeadSources();
  }, []);

  useEffect(() => {
    setLocalEnquiryData(enquiryData || {});
    setLocalSelectedProducts(selectedProducts);
  }, [enquiryData, selectedProducts]);

  const handleEnquiryDataChange = (e) => {
    const { name, value } = e.target;
    setLocalEnquiryData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLeadSourceChange = (e) => {
    const selectedLeadSource = e.target.value;
    const selectedSource = leadSources.find(source => source.lead_source === selectedLeadSource);
    console.log('Selected Lead Source:', selectedSource);

    setLocalEnquiryData((prev) => ({
      ...prev,
      leadsource: selectedLeadSource,
      state: selectedSource?.state || '',
      district: selectedSource?.district || '',
    }));
  };

  const handleFormSubmission = () => {
    const updatedEnquiry = {
      ...localEnquiryData,
      products: JSON.stringify(localSelectedProducts),
    };
    handleFormSubmit(updatedEnquiry);
  };

  const handleProductToggleLocal = (product) => {
    setLocalSelectedProducts((prev) => {
      const newSelected = { ...prev };
      if (newSelected[product.product_id]) {
        delete newSelected[product.product_id];
      } else {
        newSelected[product.product_id] = { ...product, quantity: 1 };
      }
      return newSelected;
    });
  };

  const handleQuantityChangeLocal = (productId, change) => {
    setLocalSelectedProducts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        quantity: Math.max(1, prev[productId].quantity + change),
      },
    }));
  };

  const calculateTotalEstimateLocal = () => {
    return Object.values(localSelectedProducts).reduce((sum, product) => {
      return sum + product.price * product.quantity;
    }, 0);
  };

  return (
    <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Enquiry</DialogTitle>
      <DialogContent>
        <TextField
          name="name"
          label="Name"
          variant="outlined"
          fullWidth
          margin="dense"
          value={localEnquiryData.name || ''}
          onChange={handleEnquiryDataChange}
        />
        <TextField
          name="mobilenumber1"
          label="Mobile Number 1"
          variant="outlined"
          fullWidth
          margin="dense"
          value={localEnquiryData.mobilenumber1 || ''}
          onChange={handleEnquiryDataChange}
        />
        <TextField
          name="mobilenumber2"
          label="Mobile Number 2"
          variant="outlined"
          fullWidth
          margin="dense"
          value={localEnquiryData.mobilenumber2 || ''}
          onChange={handleEnquiryDataChange}
        />
        <TextField
          name="address"
          label="Address"
          variant="outlined"
          fullWidth
          margin="dense"
          value={localEnquiryData.address || ''}
          onChange={handleEnquiryDataChange}
        />
        <TextField
          name="location"
          label="Location"
          variant="outlined"
          fullWidth
          margin="dense"
          value={localEnquiryData.location || ''}
          onChange={handleEnquiryDataChange}
        />
        <FormControl fullWidth margin="dense">
          <InputLabel>Stage</InputLabel>
          <Select
            name="stage"
            value={localEnquiryData.stage || ''}
            onChange={handleEnquiryDataChange}
            label="Stage"
          >
            <MenuItem value="Lead">Lead</MenuItem>
            <MenuItem value="Prospect">Prospect</MenuItem>
            <MenuItem value="Opportunity">Opportunity</MenuItem>
            <MenuItem value="Customer Won">Customer Won</MenuItem>
            <MenuItem value="Customer Lost">Customer Lost</MenuItem>
          </Select>
        </FormControl>
        <TextField
          name="mailid"
          label="Email"
          variant="outlined"
          fullWidth
          margin="dense"
          value={localEnquiryData.mailid || ''}
          onChange={handleEnquiryDataChange}
        />
        <FormControl fullWidth margin="dense">
          <InputLabel>Lead Source</InputLabel>
          <Select
            name="leadsource"
            value={localEnquiryData.leadsource || ''}
            onChange={handleLeadSourceChange}
            label="Lead Source"
          >
            {leadSources.map((source) => (
              <MenuItem key={source.id} value={source.lead_source}>
                {source.lead_source}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth margin="dense">
          <InputLabel>Assigned To</InputLabel>
          <Select
            name="assignedto"
            value={localEnquiryData.assignedto || currentUserId}
            onChange={handleEnquiryDataChange}
            label="Assigned To"
          >
            {users.map((user) => (
              <MenuItem key={user.id} value={user.id}>
                {user.username} ({user.id})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          name="remarks"
          label="Remarks"
          variant="outlined"
          fullWidth
          margin="dense"
          multiline
          rows={2}
          value={localEnquiryData.remarks || ''}
          onChange={handleEnquiryDataChange}
        />
        <FormControl fullWidth margin="dense">
          <InputLabel>Priority</InputLabel>
          <Select
            name="priority"
            value={localEnquiryData.priority || ''}
            onChange={handleEnquiryDataChange}
            label="Priority"
          >
            <MenuItem value="Low">Low</MenuItem>
            <MenuItem value="Medium">Medium</MenuItem>
            <MenuItem value="High">High</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth margin="dense">
          <InputLabel>Invoiced</InputLabel>
          <Select
            name="invoiced"
            value={localEnquiryData.invoiced ? 'true' : 'false'}
            onChange={(e) =>
              handleEnquiryDataChange({
                target: {
                  name: 'invoiced',
                  value: e.target.value === 'true',
                },
              })
            }
            label="Invoiced"
          >
            <MenuItem value="true">Yes</MenuItem>
            <MenuItem value="false">No</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth margin="dense">
          <InputLabel>Collected</InputLabel>
          <Select
            name="collected"
            value={localEnquiryData.collected ? 'true' : 'false'}
            onChange={(e) =>
              handleEnquiryDataChange({
                target: {
                  name: 'collected',
                  value: e.target.value === 'true',
                },
              })
            }
            label="Collected"
          >
            <MenuItem value="true">Yes</MenuItem>
            <MenuItem value="false">No</MenuItem>
          </Select>
        </FormControl>
        <TextField
          name="expected_completion_date"
          label="Expected Completion Date"
          type="date"
          variant="outlined"
          fullWidth
          margin="dense"
          InputLabelProps={{ shrink: true }}
          value={localEnquiryData.expected_completion_date || ''}
          onChange={handleEnquiryDataChange}
        />
        <TextField
          name="salesflow_code"
          label="Salesflow Code"
          variant="outlined"
          fullWidth
          margin="dense"
          value={localEnquiryData.salesflow_code || ''}
          onChange={handleEnquiryDataChange}
        />
        {products.length > 0 && (
          <>
            <TextField
              label="Search Products"
              variant="outlined"
              fullWidth
              margin="normal"
              value={productSearchTerm}
              onChange={handleProductSearchChange}
            />
            <List sx={{ width: '100%', maxHeight: 300, overflow: 'auto' }}>
              {products
                .filter((product) => localSelectedProducts[product.product_id])
                .concat(products.filter((product) => !localSelectedProducts[product.product_id]))
                .map((product) => (
                  <ListItem key={product.product_id} dense>
                    <Checkbox
                      edge="start"
                      checked={Boolean(localSelectedProducts[product.product_id])}
                      tabIndex={-1}
                      disableRipple
                      onClick={() => handleProductToggleLocal(product)}
                      sx={{ color: 'blue' }}
                    />
                    <ListItemText
                      primary={product.product_name}
                      secondary={`Price: ₹${product.price.toFixed(2)}`}
                    />
                    {localSelectedProducts[product.product_id] && (
                      <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                        <IconButton
                          size="large"
                          onClick={() => handleQuantityChangeLocal(product.product_id, -1)}
                          color="primary"
                          sx={{ borderRadius: '50%', width: '40px', height: '40px' }}
                        >
                          -
                        </IconButton>
                        <Typography sx={{ mx: 1 }}>
                          {localSelectedProducts[product.product_id].quantity}
                        </Typography>
                        <IconButton
                          size="large"
                          onClick={() => handleQuantityChangeLocal(product.product_id, 1)}
                          color="primary"
                          sx={{ borderRadius: '50%', width: '40px', height: '40px' }}
                        >
                          +
                        </IconButton>
                      </Box>
                    )}
                  </ListItem>
                ))}
            </List>
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <Pagination
                count={Math.ceil(totalProducts / ITEMS_PER_PAGE)}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
            <Typography variant="h6" sx={{ mt: 2 }}>
              Total Estimate: ₹{calculateTotalEstimateLocal().toFixed(2)}
            </Typography>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDialogClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleFormSubmission} color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};


export default EditEnquiryDialog;