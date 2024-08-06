import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Typography,
  Box,
  Tooltip,
  Snackbar,
  Alert,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { supabase } from '../supabaseClient';
import AddTaskDialog from './AddTaskDialog';
import EditEnquiryDialog from './EditEnquiryDialog';

const InfoCard = ({ data, type, onEdit }) => {
  const [open, setOpen] = useState(false);
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

  const userInitial = data?.username ? data.username.charAt(0).toUpperCase() : 'J';
  const username = data?.username ? data.username : 'Unknown User';

  useEffect(() => {
    if (type === 'task') {
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
  }, []);

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

  const handleInitialClick = async () => {
    await fetchUserTasks(data.assigned_to);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
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
    return products; // If it's already an object, return as is
  };

  const productsData = parseProducts(data?.products);

  if (!data) {
    return <div>Error: Data is missing.</div>;
  }

  return (
    <div className="mb-4 p-4 bg-white rounded-lg shadow-md border border-gray-200 flex flex-col justify-between">
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <div>
        {type === 'enquiry' && (
          <>
            <div className={`text-sm font-bold mb-2`}>{data.name}</div>
            <p className="text-sm mb-1">Contact No: {data.mobilenumber1}</p>
            {data.mobilenumber2 && <p className="text-sm mb-1">Contact No 2: {data.mobilenumber2}</p>}
            <p className="text-sm mb-1">Address: {data.address}</p>
            <p className="text-sm mb-1">Location: {data.location}</p>
            <p className="text-sm mb-1">Stage: {data.stage}</p>
            <p className="text-sm mb-1">Email: {data.mailid}</p>
            <p className="text-sm mb-1">Lead Source: {data.leadsource}</p>
            <p className="text-sm mb-1">Assigned To: {username}</p>
            <p className="text-sm mb-1">Remarks: {data.remarks}</p>
            <p className="text-sm mb-1">Priority: {data.priority}</p>
            <p className="text-sm mb-1">Invoiced: {data.invoiced ? 'Yes' : 'No'}</p>
            <p className="text-sm mb-1">Collected: {data.collected ? 'Yes' : 'No'}</p>
            <p className="text-sm mb-1">Date Created: {new Date(data.created_at).toLocaleDateString()}</p>
            <p className="text-sm mb-1">Salesflow Code: {data.salesflow_code}</p>
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
        {type === 'task' && (
          <>
            <p className="text-sm mb-1">Task Name: {data.task_name}</p>
            <p className="text-sm mb-1">Task Message: {data.task_message}</p>
            <p className="text-sm mb-1">Completion Status: {data.completion_status}</p>
            <p className="text-sm mb-1">Type: {data.type}</p>
          </>
        )}
        {type === 'serviceEnquiry' && (
          <>
            <p className="text-sm mb-1">Customer Name: {data.customer_name}</p>
            <p className="text-sm mb-1">Customer Mobile: {data.customer_mobile}</p>
            <p className="text-sm mb-1">Job Card No: {data.job_card_no}</p>
            <p className="text-sm mb-1">Service Details: {data.service_details}</p>
            <p className="text-sm mb-1">Date: {new Date(data.date).toLocaleDateString()}</p>
          </>
        )}
      </div>
      <div className="flex justify-end items-center space-x-2 mt-2">
        {type === 'task' && (
          <Tooltip title="Add Task">
            <button className="p-1 rounded-full hover:bg-gray-200" onClick={handleAddClick}>
              <AddIcon fontSize="small" />
            </button>
          </Tooltip>
        )}
        <Tooltip title="Edit">
          <button className="p-1 rounded-full hover:bg-gray-200" onClick={handleEditClick}>
            <EditIcon fontSize="small" />
          </button>
        </Tooltip>
        {type === 'task' && (
          <Tooltip title="Assigned To">
            <div 
              className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center cursor-pointer"
              onClick={handleInitialClick}
            >
              {userInitial}
            </div>
          </Tooltip>
        )}
      </div>

      {type === 'task' && (
        <Dialog open={open} onClose={handleClose}>
          <DialogTitle>Assigned Tasks</DialogTitle>
          <DialogContent>
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <Box key={task.id} mb={2}>
                  <Typography variant="body1"><strong>Task Name:</strong> {task.task_name}</Typography>
                  <Typography variant="body2"><strong>Task Message:</strong> {task.task_message}</Typography>
                  <Typography variant="body2"><strong>Completion Status:</strong> {task.completion_status}</Typography>
                </Box>
              ))
            ) : (
              <DialogContentText>
                No tasks assigned currently. Assigned to: {username}
              </DialogContentText>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}

      <EditEnquiryDialog
        dialogOpen={editOpen}
        enquiryData={data}
        handleDialogClose={handleEditClose}
        handleFormSubmit={handleSave}
        users={[]} // Replace with actual users data if available
        products={products} // Pass fetched products if available
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
    </div>
  );
};

export default InfoCard;
