import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Tooltip,
  Snackbar,
  Alert,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { supabase } from '../supabaseClient';
import AddTaskDialog from './AddTaskDialog';
import EditEnquiryDialog from './EditEnquiryDialog';

const InfoCard = ({ data, type, onEdit }) => {
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [error, setError] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [selectedProducts, setSelectedProducts] = useState({});
  const [products, setProducts] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    if (type === 'task' || type === 'enquiry') {
      fetchUserTasks(data.assigned_to);
    }
    if (type === 'enquiry') {
      fetchProducts();
    }
    const taskSubscription = supabase
      .channel('public:tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `assigned_to=eq.${data.assigned_to}` }, (payload) => {
        fetchUserTasks(data.assigned_to);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(taskSubscription);
    };
  }, [type, data.assigned_to]);

  const fetchUserTasks = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', userId)
        .not('completion_status', 'eq', 'completed');

      if (error) throw error;
      setTasks(data);
    } catch (error) {
      console.error('Error fetching user tasks:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch tasks. Please try again later.',
        severity: 'error'
      });
      setTasks([]);
    }
  };

  const fetchProducts = async () => {
    try {
      let query = supabase.from('products').select('*', { count: 'exact' });

      if (productSearchTerm) {
        query = query.or(`product_name.ilike.%${productSearchTerm}%,item_alias.ilike.%${productSearchTerm}%`);
      }

      const { data, error, count } = await query
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1)
        .order('product_name');

      if (error) throw error;
      setProducts(data);
      setTotalProducts(count);
    } catch (error) {
      console.error('Error fetching products:', error.message);
    }
  };

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const handleEditClick = () => {
    setSelectedProducts(parseProducts(data.products));
    setEditOpen(true);
  };

  const handleEditClose = () => setEditOpen(false);
  const handleAddClick = () => setAddTaskOpen(true);
  const handleAddTaskClose = () => setAddTaskOpen(false);

  const handleSave = async (updatedEnquiry) => {
    try {
      const { error } = await supabase
        .from('enquiries')
        .update(updatedEnquiry)
        .eq('id', data.id);
      if (error) throw error;
      setEditOpen(false);
      onEdit(updatedEnquiry);
      fetchUserTasks(data.assigned_to);
    } catch (error) {
      console.error('Error updating enquiry:', error);
      setError('Failed to update enquiry. Please try again later.');
    }
  };

  const parseProducts = (products) => {
    if (!products) return {};
    if (typeof products === 'string') {
      try {
        const cleanedProducts = products
          .replace(/""/g, '"')
          .replace(/\\\\"/g, '"')
          .replace(/"({)/g, '$1')
          .replace(/(})"/g, '$1');
        return JSON.parse(cleanedProducts);
      } catch (error) {
        console.error('Error parsing products:', error);
        return {};
      }
    }
    return products;
  };

  const renderCardContent = () => {
    const productsData = parseProducts(data?.products);

    switch (type) {
      case 'enquiry':
        return (
          <>
            <Typography variant="h6" component="div">{data.name}</Typography>
            <Typography variant="body2">Date: {new Date(data.created_at).toLocaleDateString()}</Typography>
            <Typography variant="body2">Contact: {data.mobilenumber1}</Typography>
            {expanded && (
              <>
                <Typography variant="body2">Address: {data.address}</Typography>
                <Typography variant="body2">Location: {data.location}</Typography>
                <Typography variant="body2">Stage: {data.stage}</Typography>
                <Typography variant="body2">Email: {data.mailid}</Typography>
                <Typography variant="body2">Lead Source: {data.leadsource}</Typography>
                <Typography variant="body2">Assigned To: {data.assignedto}</Typography>
                <Typography variant="body2">Remarks: {data.remarks}</Typography>
                <Typography variant="body2">Priority: {data.priority}</Typography>
                <Typography variant="body2">Invoiced: {data.invoiced ? 'Yes' : 'No'}</Typography>
                <Typography variant="body2">Collected: {data.collected ? 'Yes' : 'No'}</Typography>
                <Typography variant="body2">Salesflow Code: {data.salesflow_code}</Typography>
                {Object.values(productsData).length > 0 && (
                  <Box mt={2}>
                    <Typography variant="body2">Products:</Typography>
                    {Object.values(productsData).map((product, index) => (
                      <Chip 
                        key={index}
                        label={`${product.product_name} (${product.quantity})`}
                        size="small"
                        sx={{ mr: 1, mt: 1 }}
                      />
                    ))}
                  </Box>
                )}
              </>
            )}
          </>
        );
      case 'serviceEnquiry':
        return (
          <>
            <Typography variant="h6" component="div">{data.customer_name}</Typography>
            <Typography variant="body2">Date: {new Date(data.date).toLocaleDateString()}</Typography>
            <Typography variant="body2">Job Card No: {data.job_card_no}</Typography>
            {expanded && (
              <>
                <Typography variant="body2">Customer Mobile: {data.customer_mobile}</Typography>
                <Typography variant="body2">Service Details: {data.service_details}</Typography>
              </>
            )}
          </>
        );
      case 'task':
        return (
          <>
            <Typography variant="h6" component="div">{data.task_name}</Typography>
            <Typography variant="body2">Submission Date: {new Date(data.submission_date).toLocaleDateString()}</Typography>
            <Typography variant="body2">Assigned To: {data.assigned_to}</Typography>
            {expanded && (
              <>
                <Typography variant="body2">Task Message: {data.task_message}</Typography>
                <Typography variant="body2">Completion Status: {data.completion_status}</Typography>
                <Typography variant="body2">Type: {data.type}</Typography>
              </>
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Card sx={{ minHeight: '200px', height: 'auto', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {error && <Typography color="error">{error}</Typography>}
        {renderCardContent()}
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        {/* {type === 'task' && (
          <Tooltip title="Add Task">
            <IconButton onClick={handleAddClick}>
              <AddIcon />
            </IconButton>
          </Tooltip>
        )} */}
        {type === 'enquiry' && (
          <Tooltip title="Edit">
            <IconButton onClick={handleEditClick}>
              <EditIcon />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title={expanded ? "Show Less" : "Show More"}>
          <IconButton onClick={handleExpandClick}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Tooltip>
      </CardActions>

      <EditEnquiryDialog
        dialogOpen={editOpen}
        enquiryData={data}
        handleDialogClose={handleEditClose}
        handleFormSubmit={handleSave}
        users={[]} // Replace with actual users data if available
        products={products}
        selectedProducts={selectedProducts}
        handleProductToggle={(product) => {
          setSelectedProducts((prev) => {
            const newSelected = { ...prev };
            if (newSelected[product.product_id]) {
              delete newSelected[product.product_id];
            } else {
              newSelected[product.product_id] = { ...product, quantity: 1 };
            }
            return newSelected;
          });
        }}
        handleQuantityChange={(productId, change) => {
          setSelectedProducts((prev) => ({
            ...prev,
            [productId]: {
              ...prev[productId],
              quantity: Math.max(1, prev[productId].quantity + change),
            },
          }));
        }}
        productSearchTerm={productSearchTerm}
        handleProductSearchChange={(e) => setProductSearchTerm(e.target.value)}
        page={page}
        handlePageChange={(event, value) => setPage(value)}
        totalEstimate={Object.values(selectedProducts).reduce((sum, product) => sum + product.price * product.quantity, 0)}
        ITEMS_PER_PAGE={ITEMS_PER_PAGE}
        totalProducts={totalProducts}
        currentUserId={data.assigned_to}
      />

      <AddTaskDialog
        open={addTaskOpen}
        handleClose={handleAddTaskClose}
        enquiryId={data.id}
        assignedBy={data.assigned_to}
      />

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
    </Card>
  );
};

export default InfoCard;