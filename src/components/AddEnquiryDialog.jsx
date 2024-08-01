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
  MenuItem as SelectMenuItem,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  IconButton,
  Typography,
  Pagination,
  Box,
} from '@mui/material';
import { supabase } from '../supabaseClient'; // Adjust the import path as necessary

const AddEnquiryDialog = ({
  dialogOpen,
  dialogType,
  enquiryData,
  handleEnquiryDataChange,
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
  
  useEffect(() => {
    const fetchLeadSources = async () => {
      const { data, error } = await supabase.from('lead_sources').select();
      if (error) {
        console.error('Error fetching lead sources:', error);
      } else {
        setLeadSources(data);
      }
    };

    fetchLeadSources();
  }, []);

  const handleLeadSourceChange = (e) => {
    handleEnquiryDataChange(e);
    const selectedLeadSource = e.target.value;
    const selectedSource = leadSources.find(source => source.lead_source === selectedLeadSource);
    handleEnquiryDataChange({ target: { name: 'state', value: selectedSource?.state || '' } });
    handleEnquiryDataChange({ target: { name: 'district', value: selectedSource?.district || '' } });
  };

  return (
    <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
      <DialogTitle>{dialogType === 'service' ? 'Add Service Enquiry' : 'Add Product Enquiry'}</DialogTitle>
      <DialogContent>
        <TextField
          name="name"
          label="Name"
          variant="outlined"
          fullWidth
          margin="dense"
          value={enquiryData.name || ''}
          onChange={handleEnquiryDataChange}
        />
        <TextField
          name="mobilenumber1"
          label="Mobile Number 1"
          variant="outlined"
          fullWidth
          margin="dense"
          value={enquiryData.mobilenumber1 || ''}
          onChange={handleEnquiryDataChange}
        />
        <TextField
          name="mobilenumber2"
          label="Mobile Number 2"
          variant="outlined"
          fullWidth
          margin="dense"
          value={enquiryData.mobilenumber2 || ''}
          onChange={handleEnquiryDataChange}
        />
        <TextField
          name="address"
          label="Address"
          variant="outlined"
          fullWidth
          margin="dense"
          value={enquiryData.address || ''}
          onChange={handleEnquiryDataChange}
        />
        <TextField
          name="location"
          label="Location"
          variant="outlined"
          fullWidth
          margin="dense"
          value={enquiryData.location || ''}
          onChange={handleEnquiryDataChange}
        />
        <FormControl fullWidth margin="dense">
          <InputLabel>Stage</InputLabel>
          <Select
            name="stage"
            value={enquiryData.stage || ''}
            onChange={handleEnquiryDataChange}
            label="Stage"
          >
            <SelectMenuItem value="Lead">Lead</SelectMenuItem>
            <SelectMenuItem value="Prospect">Prospect</SelectMenuItem>
            <SelectMenuItem value="Opportunity">Opportunity</SelectMenuItem>
            <SelectMenuItem value="Customer Won">Customer Won</SelectMenuItem>
            <SelectMenuItem value="Customer Lost">Customer Lost</SelectMenuItem>
          </Select>
        </FormControl>
        <TextField
          name="mailid"
          label="Email"
          variant="outlined"
          fullWidth
          margin="dense"
          value={enquiryData.mailid || ''}
          onChange={handleEnquiryDataChange}
        />
        <FormControl fullWidth margin="dense">
          <InputLabel>Lead Source</InputLabel>
          <Select
            name="leadsource"
            value={enquiryData.leadsource || ''}
            onChange={handleLeadSourceChange}
            label="Lead Source"
          >
            {leadSources.map((source) => (
              <SelectMenuItem key={source.id} value={source.lead_source}>
                {source.lead_source}
              </SelectMenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth margin="dense">
          <InputLabel>Assigned To</InputLabel>
          <Select
            name="assignedto"
            value={enquiryData.assignedto || currentUserId}
            onChange={handleEnquiryDataChange}
            label="Assigned To"
          >
            {users.map((user) => (
              <SelectMenuItem key={user.id} value={user.id}>
                {user.username} ({user.id})
              </SelectMenuItem>
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
          value={enquiryData.remarks || ''}
          onChange={handleEnquiryDataChange}
        />
        <FormControl fullWidth margin="dense">
          <InputLabel>Priority</InputLabel>
          <Select
            name="priority"
            value={enquiryData.priority || ''}
            onChange={handleEnquiryDataChange}
            label="Priority"
          >
            <SelectMenuItem value="Low">Low</SelectMenuItem>
            <SelectMenuItem value="Medium">Medium</SelectMenuItem>
            <SelectMenuItem value="High">High</SelectMenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth margin="dense">
          <InputLabel>Invoiced</InputLabel>
          <Select
            name="invoiced"
            value={enquiryData.invoiced ? 'true' : 'false'}
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
            <SelectMenuItem value="true">Yes</SelectMenuItem>
            <SelectMenuItem value="false">No</SelectMenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth margin="dense">
          <InputLabel>Collected</InputLabel>
          <Select
            name="collected"
            value={enquiryData.collected ? 'true' : 'false'}
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
            <SelectMenuItem value="true">Yes</SelectMenuItem>
            <SelectMenuItem value="false">No</SelectMenuItem>
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
          value={enquiryData.expected_completion_date || ''}
          onChange={handleEnquiryDataChange}
        />
        {dialogType === 'product' && (
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
              {products.map((product) => (
                <ListItem key={product.product_id} dense>
                  <Checkbox
                    edge="start"
                    checked={Boolean(selectedProducts[product.product_id])}
                    tabIndex={-1}
                    disableRipple
                    onClick={() => handleProductToggle(product)}
                  />
                  <ListItemText
                    primary={product.product_name}
                    secondary={`Price: ₹${product.price.toFixed(2)}`}
                  />
                  {selectedProducts[product.product_id] && (
                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                      <IconButton
                        size="large"
                        onClick={() => handleQuantityChange(product.product_id, -1)}
                        color="primary"
                        sx={{ borderRadius: '50%', width: '40px', height: '40px' }}
                      >
                        -
                      </IconButton>
                      <Typography sx={{ mx: 1 }}>
                        {selectedProducts[product.product_id].quantity}
                      </Typography>
                      <IconButton
                        size="large"
                        onClick={() => handleQuantityChange(product.product_id, 1)}
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
              Total Estimate: ₹{totalEstimate.toFixed(2)}
            </Typography>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDialogClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleFormSubmit} color="primary">
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddEnquiryDialog;
