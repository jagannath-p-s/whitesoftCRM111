import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Snackbar, 
  Alert, 
  Chip,
  LinearProgress,
  Pagination
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { supabase } from '../supabaseClient';
import AddTaskDialog from './AddTaskDialog';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[4],
  },
}));

const StyledCardContent = styled(CardContent)({
  flexGrow: 1,
});

const SearchComponent = ({ searchTerm }) => {
  const [enquiries, setEnquiries] = useState([]);
  const [serviceEnquiries, setServiceEnquiries] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    fetchAllData();
  }, [page, searchTerm]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch enquiries
      const { data: enquiryData, error: enquiryError, count: enquiryCount } = await supabase
        .from('enquiries')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

      // Fetch service enquiries
      const { data: serviceEnquiryData, error: serviceEnquiryError, count: serviceEnquiryCount } = await supabase
        .from('service_enquiries')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

      // Fetch tasks
      const { data: taskData, error: taskError, count: taskCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact' })
        .order('submission_date', { ascending: false })
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

      if (enquiryError || serviceEnquiryError || taskError) {
        throw new Error('Error fetching data');
      }

      setEnquiries(enquiryData);
      setServiceEnquiries(serviceEnquiryData);
      setTasks(taskData);
      setTotalPages(Math.ceil((enquiryCount + serviceEnquiryCount + taskCount) / ITEMS_PER_PAGE));
    } catch (error) {
      console.error('Error fetching data:', error.message);
      setSnackbar({ open: true, message: 'Error fetching data: ' + error.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filteredEnquiries = useMemo(() => {
    if (!searchTerm) return enquiries;
    return enquiries.filter((enquiry) =>
      enquiry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.mobilenumber1.includes(searchTerm) ||
      enquiry.mobilenumber2?.includes(searchTerm)
    );
  }, [enquiries, searchTerm]);

  const filteredServiceEnquiries = useMemo(() => {
    if (!searchTerm) return serviceEnquiries;
    return serviceEnquiries.filter((serviceEnquiry) =>
      serviceEnquiry.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      serviceEnquiry.customer_mobile.includes(searchTerm) ||
      serviceEnquiry.job_card_no.includes(searchTerm)
    );
  }, [serviceEnquiries, searchTerm]);

  const filteredTasks = useMemo(() => {
    if (!searchTerm) return tasks;
    return tasks.filter((task) =>
      task.task_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.task_message.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tasks, searchTerm]);

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const parseProducts = (products) => {
    if (!products) return {};
    try {
      return JSON.parse(products.replace(/""/g, '"'));
    } catch (error) {
      console.error('Error parsing products:', error);
      return {};
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, margin: 'auto', padding: 2 }}>
      <Typography variant="h4" gutterBottom>
        Search Results {searchTerm && `(Filtered by: ${searchTerm})`}
      </Typography>
      
      {loading ? (
        <LinearProgress />
      ) : (
        <>
          <Grid container spacing={3}>
            {filteredEnquiries.map((enquiry) => {
              const products = parseProducts(enquiry.products);
              return (
                <Grid item xs={12} sm={6} md={4} key={enquiry.id}>
                  <StyledCard>
                    <StyledCardContent>
                      <Typography variant="h6" gutterBottom>{enquiry.name}</Typography>
                      <Typography variant="body2">Contact: {enquiry.mobilenumber1}</Typography>
                      {enquiry.mobilenumber2 && (
                        <Typography variant="body2">Alternate: {enquiry.mobilenumber2}</Typography>
                      )}
                      <Typography variant="body2">Email: {enquiry.mailid}</Typography>
                      <Box mt={1}>
                        <Chip label={enquiry.stage} color="primary" size="small" />
                        <Chip label={enquiry.priority} color="secondary" size="small" sx={{ ml: 1 }} />
                      </Box>
                      <Typography variant="body2" mt={1}>
                        Date: {new Date(enquiry.created_at).toLocaleString()}
                      </Typography>
                      <Typography variant="body2" noWrap>Remarks: {enquiry.remarks}</Typography>
                      {Object.values(products).length > 0 && (
                        <Box mt={2}>
                          <Typography variant="body2">Products:</Typography>
                          {Object.values(products).map((product) => (
                            <Chip
                              key={product.product_id}
                              label={`${product.product_name} (${product.quantity})`}
                              size="small"
                              sx={{ mr: 1, mt: 1 }}
                            />
                          ))}
                        </Box>
                      )}
                    </StyledCardContent>
                  </StyledCard>
                </Grid>
              );
            })}

            {filteredServiceEnquiries.map((serviceEnquiry) => (
              <Grid item xs={12} sm={6} md={4} key={serviceEnquiry.id}>
                <StyledCard>
                  <StyledCardContent>
                    <Typography variant="h6" gutterBottom>{serviceEnquiry.customer_name}</Typography>
                    <Typography variant="body2">Job Card No: {serviceEnquiry.job_card_no}</Typography>
                    <Typography variant="body2">Contact: {serviceEnquiry.customer_mobile}</Typography>
                    <Typography variant="body2">Date: {new Date(serviceEnquiry.date).toLocaleString()}</Typography>
                    <Typography variant="body2">Status: {serviceEnquiry.status}</Typography>
                  </StyledCardContent>
                </StyledCard>
              </Grid>
            ))}

            {filteredTasks.map((task) => (
              <Grid item xs={12} sm={6} md={4} key={task.id}>
                <StyledCard>
                  <StyledCardContent>
                    <Typography variant="h6" gutterBottom>{task.task_name}</Typography>
                    <Typography variant="body2">Message: {task.task_message}</Typography>
                    <Typography variant="body2">Date: {new Date(task.submission_date).toLocaleString()}</Typography>
                    <Typography variant="body2">Status: {task.completion_status}</Typography>
                  </StyledCardContent>
                </StyledCard>
              </Grid>
            ))}
          </Grid>
          
          <Box mt={4} display="flex" justifyContent="center">
            <Pagination 
              count={totalPages} 
              page={page} 
              onChange={handlePageChange} 
              color="primary" 
            />
          </Box>
        </>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SearchComponent;
