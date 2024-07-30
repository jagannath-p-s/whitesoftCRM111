import React, { useState, useEffect, useRef } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { Box, Typography, MenuItem, Select, FormControl, InputLabel, Snackbar, Alert } from '@mui/material';
import { supabase } from '../supabaseClient';
import Confetti from 'react-confetti';
import BillContent from './BillContent';

const PrintBillDialog = ({ open, handleClose, customer }) => {
  const [waitingNumber, setWaitingNumber] = useState('');
  const [jobCardNumber, setJobCardNumber] = useState('');
  const [batchCodes, setBatchCodes] = useState({});
  const [batches, setBatches] = useState({});
  const [pipelineName, setPipelineName] = useState('');
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipeline, setSelectedPipeline] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [showConfetti, setShowConfetti] = useState(false);
  const printRef = useRef();

  useEffect(() => {
    if (open && customer) {
      fetchBatches();
      fetchPipelines();
      if (customer.pipeline_id) {
        fetchPipelineName(customer.pipeline_id);
      } else {
        setSelectedPipeline('');
      }
    }
  }, [open, customer]);

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase.from('batches').select('*');
      if (error) throw error;
      const batchData = data.reduce((acc, batch) => {
        if (!acc[batch.product_id]) {
          acc[batch.product_id] = [];
        }
        acc[batch.product_id].push(batch);
        return acc;
      }, {});
      setBatches(batchData);
    } catch (error) {
      console.error('Error fetching batches:', error);
      setSnackbar({ open: true, message: 'Error fetching batches', severity: 'error' });
    }
  };

  const fetchPipelines = async () => {
    try {
      const { data, error } = await supabase.from('pipelines').select('pipeline_id, pipeline_name');
      if (error) throw error;
      setPipelines(data);
    } catch (error) {
      console.error('Error fetching pipelines:', error);
      setSnackbar({ open: true, message: 'Error fetching pipelines', severity: 'error' });
    }
  };

  const fetchPipelineName = async (pipelineId) => {
    try {
      const { data, error } = await supabase.from('pipelines').select('pipeline_name').eq('pipeline_id', pipelineId).single();
      if (error) throw error;
      setPipelineName(data.pipeline_name);
    } catch (error) {
      console.error('Error fetching pipeline name:', error);
      setSnackbar({ open: true, message: 'Error fetching pipeline name', severity: 'error' });
    }
  };

  const parseProducts = (products) => {
    if (!products) return {};
    if (typeof products === 'string') {
      try {
        return JSON.parse(products.replace(/""/g, '"'));
      } catch (error) {
        console.error('Error parsing products:', error);
        return {};
      }
    }
    return products;
  };

  const products = customer ? parseProducts(customer.products) : {};

  const handleBatchCodeChange = (productId, index, value) => {
    setBatchCodes((prevBatchCodes) => {
      const newBatchCodes = { ...prevBatchCodes };
      if (!newBatchCodes[productId]) {
        newBatchCodes[productId] = [];
      }
      newBatchCodes[productId][index] = value;
      return newBatchCodes;
    });
  };

  const handleRemoveFromStock = async () => {
    try {
      for (const [productId, codes] of Object.entries(batchCodes)) {
        for (const code of codes) {
          if (code) {
            const { error } = await supabase
              .from('batches')
              .delete()
              .match({ product_id: parseInt(productId, 10), batch_code: code });
            if (error) throw error;
          } else {
            const { error } = await supabase.rpc('decrement_product_stock', { product_id: parseInt(productId, 10), quantity: 1 });
            if (error) throw error;
          }
        }
      }
    } catch (error) {
      console.error('Error removing products from stock:', error);
      throw error;
    }
  };

  const savePrintedBill = async () => {
    if (!customer) {
      throw new Error('Cannot save bill: customer is null');
    }
    const { data, error } = await supabase.from('printed_bills').insert([
      {
        customer_id: customer.id,
        customer_name: customer.name,
        mobile_number: customer.mobilenumber1,
        waiting_number: waitingNumber || null,
        job_card_number: jobCardNumber || null,
        products: JSON.stringify(batchCodes),
        invoiced: customer.invoiced,
        collected: customer.collected,
        pipeline_name: pipelineName,
        created_at: new Date().toISOString()
      }
    ]);
    if (error) {
      console.error('Error response:', error);
      throw error;
    }
    console.log('Data inserted:', data);
  };

  const saveSoldProducts = async (customer, products, batchCodes) => {
    try {
      const salesflowCode = customer.salesflow_code || '';
      for (const [productId, product] of Object.entries(products)) {
        for (let i = 0; i < product.quantity; i++) {
          const batchCode = batchCodes[productId]?.[i] || null;
          const productIdInt = parseInt(productId, 10); // Ensure productId is an integer
          const priceFloat = parseFloat(product.price); // Ensure price is a float
          if (isNaN(productIdInt) || isNaN(priceFloat)) {
            throw new Error('Invalid product ID or price format.');
          }
          const { data, error } = await supabase.from('sold_products').insert([
            {
              customer_id: customer.id,
              customer_name: customer.name,
              salesflow_code: salesflowCode,
              product_id: productIdInt,
              product_name: product.product_name,
              quantity: 1,
              price: priceFloat,
              batch_code: batchCode,
              sold_at: new Date().toISOString()
            }
          ]);
          if (error) {
            console.error('Error response:', error);
            throw error;
          }
          console.log('Data inserted:', data);
        }
      }
    } catch (error) {
      console.error('Error saving sold products:', error);
      throw error;
    }
  };

  const updateCustomerStage = async () => {
    if (!customer) return;
    const { error } = await supabase
      .from('enquiries')
      .update({ stage: 'Customer-Won' })
      .eq('id', customer.id);
    if (error) {
      console.error('Error updating customer stage:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    if (!customer) {
      setSnackbar({ open: true, message: 'Cannot save bill: customer data is missing', severity: 'error' });
      return;
    }
    if (!pipelineName && !selectedPipeline) {
      setSnackbar({ open: true, message: 'Please select a pipeline before saving the bill.', severity: 'warning' });
      return;
    }
    if (window.confirm('Are you sure you want to save this bill?')) {
      try {
        if (selectedPipeline) {
          await fetchPipelineName(selectedPipeline);
        }
        await handleRemoveFromStock();
        await savePrintedBill();
        await saveSoldProducts(customer, products, batchCodes);
        await updateCustomerStage();
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
        setSnackbar({ open: true, message: 'Bill saved successfully!', severity: 'success' });
        handleClose(true);
      } catch (error) {
        setSnackbar({ open: true, message: `Error saving bill: ${error.message}`, severity: 'error' });
      }
    }
  };

  const handlePrint = async () => {
    try {
      await handleSave();
      if (printRef.current) {
        const content = printRef.current;
        const printWindow = window.open('', '_blank');
        printWindow.document.write('<html><head><title>Print</title>');
        printWindow.document.write('<style>');
        printWindow.document.write(`
          body { font-family: Arial, sans-serif; font-size: 10px; width: 3in; }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .my-1 { margin-top: 0.25rem; margin-bottom: 0.25rem; }
          .border-t { border-top: 1px solid black; }
          .border-b { border-bottom: 1px solid black; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 2px; }
          .text-right { text-align: right; }
          .mt-2 { margin-top: 0.5rem; }
        `);
        printWindow.document.write('</style></head><body>');
        printWindow.document.write(content.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
      }
    } catch (error) {
      console.error('Error printing:', error);
      setSnackbar({ open: true, message: `Error printing bill: ${error.message}`, severity: 'error' });
    }
  };

  const renderProducts = () => {
    return Object.entries(products).map(([productId, product]) => (
      <Box key={productId} mb={2}>
        <Typography variant="subtitle1">{product.product_name}</Typography>
        {Array.from({ length: product.quantity }).map((_, index) => (
          <FormControl key={index} fullWidth margin="dense">
            <InputLabel>Batch Code {index + 1}</InputLabel>
            <Select
              value={batchCodes[productId]?.[index] || ''}
              onChange={(e) => handleBatchCodeChange(productId, index, e.target.value)}
              label={`Batch Code ${index + 1}`}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {batches[productId]?.map((batch) => (
                <MenuItem key={batch.id} value={batch.batch_code}>
                  {batch.batch_code}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ))}
      </Box>
    ));
  };

  return (
    <>
      <Dialog open={open} onClose={() => handleClose(false)} maxWidth="md" fullWidth>
        <DialogTitle>Bill Preview</DialogTitle>
        <DialogContent>
          {customer ? (
            <>
              <TextField
                label="Waiting Number"
                value={waitingNumber}
                onChange={(e) => setWaitingNumber(e.target.value)}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Job Card Number"
                value={jobCardNumber}
                onChange={(e) => setJobCardNumber(e.target.value)}
                fullWidth
                margin="normal"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Select Pipeline</InputLabel>
                <Select
                  value={selectedPipeline}
                  onChange={(e) => setSelectedPipeline(e.target.value)}
                >
                  {pipelines.map((pipeline) => (
                    <MenuItem key={pipeline.pipeline_id} value={pipeline.pipeline_id}>
                      {pipeline.pipeline_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {renderProducts()}
              <div ref={printRef}>
                <BillContent
                  customer={customer}
                  jobCardNumber={jobCardNumber}
                  products={products}
                  waitingNumber={waitingNumber}
                  pipelineName={pipelineName}
                />
              </div>
            </>
          ) : (
            <Typography>No customer data available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSave} color="primary" disabled={!customer}>
            Save
          </Button>
          <Button onClick={handlePrint} color="primary" disabled={!customer}>
            Print
          </Button>
          <Button onClick={() => handleClose(false)} color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      {showConfetti && <Confetti />}
    </>
  );
};

export default PrintBillDialog;
