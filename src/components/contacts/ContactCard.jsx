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
  Card,
  CardContent,
  TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import PipelineIcon from '@mui/icons-material/SettingsOutlined';
import Assignment from '@mui/icons-material/Assignment';
import CalendarToday from '@mui/icons-material/CalendarToday';
import Person from '@mui/icons-material/Person';
import ReportProblem from '@mui/icons-material/ReportProblem';
import { supabase } from '../../supabaseClient';
import AddTaskDialog from './AddTaskDialog';
import EditEnquiryDialog from './EditEnquiryDialog';
import PipelineFormJSON from './PipelineFormJSON';
import dayjs from 'dayjs';

const ContactCard = ({ contact, user, color, visibleFields, onUpdate }) => {
  // Use passed user if available; otherwise fallback.
  const userData = user && user.id ? user : { id: null, username: 'Unknown' };

  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [pipelineOpen, setPipelineOpen] = useState(false);
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipeline, setSelectedPipeline] = useState(contact?.pipeline_id || '');
  const [error, setError] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [selectedProducts, setSelectedProducts] = useState({});
  const [products, setProducts] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const ITEMS_PER_PAGE = 10;

  // Special Attention States
  const [isSpecialAttention, setIsSpecialAttention] = useState(false);
  const [specialReason, setSpecialReason] = useState('');
  const [editingSpecial, setEditingSpecial] = useState(false);
  const [newReason, setNewReason] = useState('');

  const userInitial = userData.username ? userData.username.charAt(0).toUpperCase() : 'J';
  const username = userData.username ? userData.username : 'Unknown User';

  useEffect(() => {
    fetchPipelines();
    if (userData.id) {
      fetchUserTasks(userData.id);
    }
    fetchUsers();
    fetchProducts();
    checkSpecialAttention();

    let taskSubscription;
    if (userData.id) {
      taskSubscription = supabase
        .channel('public:tasks')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tasks', filter: `assigned_to=eq.${userData.id}` },
          () => {
            fetchUserTasks(userData.id);
          }
        )
        .subscribe();
    }

    return () => {
      if (taskSubscription) {
        supabase.removeChannel(taskSubscription);
      }
    };
  }, [userData.id]);

  // Fetch Special Attention Status
  const checkSpecialAttention = async () => {
    try {
      const { data, error } = await supabase
        .from('special_attention_customers')
        .select('*')
        .or(`mobilenumber1.eq.${contact.mobilenumber1},mobilenumber2.eq.${contact.mobilenumber2}`);
      if (error) throw error;
      if (data && data.length > 0) {
        setIsSpecialAttention(true);
        setSpecialReason(data[0].reason || '');
      } else {
        setIsSpecialAttention(false);
        setSpecialReason('');
      }
    } catch (error) {
      console.error('Error checking special attention status:', error);
    }
  };

  const markSpecialAttention = async () => {
    try {
      const { error } = await supabase.from('special_attention_customers').insert([
        {
          mobilenumber1: contact.mobilenumber1,
          mobilenumber2: contact.mobilenumber2,
          reason: newReason,
        },
      ]);
      if (error) throw error;
      setIsSpecialAttention(true);
      setSpecialReason(newReason);
      setNewReason('');
      setEditingSpecial(false);
      setSnackbar({ open: true, message: 'Customer marked for special attention.', severity: 'success' });
    } catch (error) {
      console.error('Error marking special attention:', error);
      setSnackbar({ open: true, message: 'Failed to mark special attention.', severity: 'error' });
    }
  };

  const unmarkSpecialAttention = async () => {
    try {
      const { error } = await supabase
        .from('special_attention_customers')
        .delete()
        .or(`mobilenumber1.eq.${contact.mobilenumber1},mobilenumber2.eq.${contact.mobilenumber2}`);
      if (error) throw error;
      setIsSpecialAttention(false);
      setSpecialReason('');
      setSnackbar({ open: true, message: 'Special attention removed.', severity: 'success' });
    } catch (error) {
      console.error('Error unmarking special attention:', error);
      setSnackbar({ open: true, message: 'Failed to remove special attention.', severity: 'error' });
    }
  };

  const updateSpecialReason = async () => {
    try {
      const { error } = await supabase
        .from('special_attention_customers')
        .update({ reason: newReason })
        .or(`mobilenumber1.eq.${contact.mobilenumber1},mobilenumber2.eq.${contact.mobilenumber2}`);
      if (error) throw error;
      setSpecialReason(newReason);
      setNewReason('');
      setEditingSpecial(false);
      setSnackbar({ open: true, message: 'Reason updated.', severity: 'success' });
    } catch (error) {
      console.error('Error updating reason:', error);
      setSnackbar({ open: true, message: 'Failed to update reason.', severity: 'error' });
    }
  };

  const fetchPipelines = async () => {
    try {
      const { data, error } = await supabase.from('pipelines').select('*');
      if (error) throw error;
      setPipelines(data || []);
    } catch (error) {
      console.error('Error fetching pipelines:', error);
      setError('Failed to fetch pipelines. Please try again later.');
    }
  };

  const fetchUserTasks = async (userId) => {
    if (!userId) {
      console.warn('User ID is missing, skipping fetchUserTasks');
      return;
    }
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
        severity: 'error',
      });
      setTasks([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch users. Please try again later.',
        severity: 'error',
      });
    }
  };

  const fetchProducts = async () => {
    try {
      let query = supabase.from('products').select('*', { count: 'exact' });
      if (productSearchTerm) {
        query = query.or(`item_name.ilike.%${productSearchTerm}%,item_alias.ilike.%${productSearchTerm}%`);
      }
      const { data, error, count } = await query
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1)
        .order('item_name');
      if (error) throw error;
      setProducts(data);
      setTotalProducts(count);
    } catch (error) {
      console.error('Error fetching products:', error.message);
    }
  };

  const handleInitialClick = async () => {
    if (userData.id) {
      await fetchUserTasks(userData.id);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleEditClick = () => {
    setSelectedProducts(parseProducts(contact.products));
    setEditOpen(true);
  };

  const handleEditClose = () => {
    fetchUpdatedContact();
    setEditOpen(false);
  };

  const handleAddClick = () => setAddTaskOpen(true);
  const handleAddTaskClose = () => setAddTaskOpen(false);

  const handlePipelineClick = () => setPipelineOpen(true);
  const handlePipelineClose = () => setPipelineOpen(false);

  const handlePipelineChange = (event) => {
    setSelectedPipeline(event.target.value);
  };

  const handleSave = async (updatedEnquiry) => {
    try {
      const productEntries = Object.entries(selectedProducts).reduce((acc, [key, product]) => {
        acc[key] = {
          product_id: product.product_id,
          barcode_number: product.barcode_number,
          item_name: product.item_name,
          quantity: product.quantity,
        };
        return acc;
      }, {});

      const updatedData = {
        ...updatedEnquiry,
        products: productEntries,
      };

      const { error } = await supabase
        .from('enquiries')
        .update(updatedData)
        .eq('id', contact.id);
      if (error) throw error;

      setEditOpen(false);
      fetchUpdatedContact();
    } catch (error) {
      console.error('Error updating enquiry:', error);
      setError('Failed to update enquiry. Please try again later.');
    }
  };

  const fetchUpdatedContact = async () => {
    try {
      const { data, error } = await supabase
        .from('enquiries')
        .select('*')
        .eq('id', contact.id)
        .single();
      if (error) throw error;
      onUpdate(data);
      checkSpecialAttention();
    } catch (error) {
      console.error('Error fetching updated contact:', error);
    }
  };

  const parseProducts = (products) => {
    if (!products) return {};
    if (typeof products === 'string') {
      try {
        return JSON.parse(products);
      } catch (error) {
        console.error('Error parsing products:', error);
        return {};
      }
    }
    return products;
  };

  const getTextColorClass = (color) => {
    const colorMap = {
      blue: 'text-blue-600',
      red: 'text-red-600',
      green: 'text-green-600',
      yellow: 'text-yellow-600',
      purple: 'text-purple-600',
    };
    return colorMap[color] || 'text-gray-600';
  };

  const getRemainingDays = (submissionDate) => {
    const now = dayjs();
    const submission = dayjs(submissionDate);
    const diff = submission.diff(now, 'day');
    return diff >= 0 ? diff : `Overdue by ${Math.abs(diff)} days`;
  };

  const getUsername = (userId) => {
    const foundUser = users.find((u) => u.id === userId);
    return foundUser ? foundUser.username : 'Unknown User';
  };

  return (
    <div
      className={`mb-4 p-4 rounded-lg shadow-md flex flex-col justify-between ${
        isSpecialAttention ? 'bg-red-50 border border-red-300' : 'bg-white border border-gray-200'
      }`}
    >
      {error && <div className="text-red-500 mb-2">{error}</div>}

      {/* Special Attention Indicator */}
      {isSpecialAttention && (
        <Box display="flex" alignItems="center" mb={1}>
          <Tooltip title={`Special Attention: ${specialReason}`}>
            <Typography variant="body2" color="error" className="ml-4">
              See Remarks
            </Typography>
          </Tooltip>
        </Box>
      )}

      <div>
        {visibleFields.name && (
          <div className={`text-sm font-bold ${getTextColorClass(color)} mb-2`}>{contact.name}</div>
        )}
        {visibleFields.mobilenumber1 && <p className="text-sm mb-1">Contact No: {contact.mobilenumber1}</p>}
        {visibleFields.mobilenumber2 && <p className="text-sm mb-1">Contact No 2: {contact.mobilenumber2}</p>}
        {visibleFields.address && <p className="text-sm mb-1">Address: {contact.address}</p>}
        {visibleFields.location && <p className="text-sm mb-1">Location: {contact.location}</p>}
        {visibleFields.stage && <p className="text-sm mb-1">Stage: {contact.stage}</p>}
        {visibleFields.leadsource && <p className="text-sm mb-1">Lead Source: {contact.leadsource}</p>}
        {visibleFields.assignedto && <p className="text-sm mb-1">Assigned To: {username}</p>}
        {visibleFields.remarks && <p className="text-sm mb-1">Remarks: {contact.remarks}</p>}
        {visibleFields.priority && <p className="text-sm mb-1">Priority: {contact.priority}</p>}
        {visibleFields.invoiced && <p className="text-sm mb-1">Invoiced: {contact.invoiced ? 'Yes' : 'No'}</p>}
        {visibleFields.collected && <p className="text-sm mb-1">Collected: {contact.collected ? 'Yes' : 'No'}</p>}
        {visibleFields.created_at && (
          <p className="text-sm mb-1">
            Date Created: {new Date(contact.created_at).toLocaleDateString()}
          </p>
        )}
        {visibleFields.salesflow_code && (
          <p className="text-sm mb-1">Salesflow Code: {contact.salesflow_code}</p>
        )}
        {visibleFields.last_updated && (
          <p className="text-sm mb-1">
            Last Updated: {new Date(contact.last_updated).toLocaleString()}
          </p>
        )}
        {visibleFields.products &&
          Object.values(parseProducts(contact.products)).length > 0 && (
            <Box mt={2}>
              <Typography variant="body2">Products:</Typography>
              {Object.values(parseProducts(contact.products)).map((product, index) => (
                <Chip key={index} label={`${product.item_name} (${product.quantity})`} size="small" sx={{ mr: 1, mt: 1 }} />
              ))}
            </Box>
          )}
      </div>

      {/* Special Attention Actions */}
      <Box mt={2} display="flex" alignItems="center" justifyContent="space-between">
        {isSpecialAttention ? (
          <>
            <Button variant="outlined" color="error" onClick={unmarkSpecialAttention}>
              Unmark
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => {
                setEditingSpecial(true);
                setNewReason(specialReason);
              }}
            >
              Edit
            </Button>
          </>
        ) : (
          <Button variant="outlined" color="secondary" onClick={() => setEditingSpecial(true)}>
            Remark
          </Button>
        )}
      </Box>

      {/* Edit Special Reason Dialog */}
      <Dialog open={editingSpecial} onClose={() => setEditingSpecial(false)}>
        <DialogTitle>{isSpecialAttention ? 'Edit Special Attention Reason' : 'Mark as Special Attention'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Reason"
            type="text"
            fullWidth
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingSpecial(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (isSpecialAttention) {
                updateSpecialReason();
              } else {
                markSpecialAttention();
              }
            }}
            color="primary"
          >
            {isSpecialAttention ? 'Update' : 'Mark'}
          </Button>
        </DialogActions>
      </Dialog>

      <div className="flex justify-end items-center space-x-2 mt-2">
        <Tooltip title="Add">
          <button className="p-1 rounded-full hover:bg-gray-200" onClick={handleAddClick}>
            <AddIcon fontSize="small" />
          </button>
        </Tooltip>
        <Tooltip title="Edit">
          <button className="p-1 rounded-full hover:bg-gray-200" onClick={handleEditClick}>
            <EditIcon fontSize="small" />
          </button>
        </Tooltip>
        <Tooltip title="Pipeline">
          <button className="p-1 rounded-full hover:bg-gray-200" onClick={handlePipelineClick}>
            <PipelineIcon fontSize="small" />
          </button>
        </Tooltip>
        <Tooltip title="Assigned To">
          <div
            className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center cursor-pointer"
            onClick={handleInitialClick}
          >
            {userInitial}
          </div>
        </Tooltip>
      </div>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Assigned Tasks</DialogTitle>
        <DialogContent>
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <Card key={task.id} variant="outlined" sx={{ mb: 3, p: 2 }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Assignment sx={{ mr: 1, fontSize: 20 }} />
                    <Typography variant="h6">
                      <strong>Task Name:</strong> {task.task_name}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" mb={2}>
                    <ReportProblem sx={{ mr: 1, fontSize: 20 }} />
                    <Typography variant="body1">
                      <strong>Task Message:</strong> {task.task_message}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" mb={2}>
                    <ReportProblem sx={{ mr: 1, fontSize: 20 }} />
                    <Typography variant="body2">
                      <strong>Completion Status:</strong> {task.completion_status}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Person sx={{ mr: 1, fontSize: 20 }} />
                    <Typography variant="body2">
                      <strong>Assigned To:</strong> {getUsername(task.assigned_to)}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" mb={2}>
                    <CalendarToday sx={{ mr: 1, fontSize: 20 }} />
                    <Typography variant="body2">
                      <strong>Remaining Days:</strong> {getRemainingDays(task.submission_date)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
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

      <EditEnquiryDialog
        dialogOpen={editOpen}
        enquiryData={contact}
        handleDialogClose={handleEditClose}
        handleFormSubmit={handleSave}
        users={users}
        products={products}
        selectedProducts={selectedProducts}
        setSelectedProducts={setSelectedProducts}
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
        totalEstimate={Object.values(selectedProducts).reduce(
          (sum, product) => sum + (product.price || 0) * product.quantity,
          0
        )}
        ITEMS_PER_PAGE={ITEMS_PER_PAGE}
        totalProducts={totalProducts}
        currentUserId={userData.id}
      />

      <AddTaskDialog
        open={addTaskOpen}
        handleClose={() => setAddTaskOpen(false)}
        enquiryId={contact.id}
        assignedBy={userData.id}
      />

      <Dialog open={pipelineOpen} onClose={handlePipelineClose} maxWidth="md" fullWidth>
        <DialogTitle>Pipeline Form</DialogTitle>
        <DialogContent>
          <PipelineFormJSON enquiryId={contact.id} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePipelineClose} color="primary">
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
    </div>
  );
};

export default ContactCard;
