import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Grid, Snackbar, Alert, LinearProgress, Pagination
} from '@mui/material';
import { supabase } from '../supabaseClient';
import InfoCard from './InfoCard';

const ITEMS_PER_PAGE = 12;

const SearchComponent = ({ searchTerm }) => {
  const [enquiries, setEnquiries] = useState([]);
  const [serviceEnquiries, setServiceEnquiries] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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

      if (enquiryError) {
        throw new Error('Error fetching enquiries: ' + enquiryError.message);
      }

      // Fetch service enquiries
      const { data: serviceEnquiryData, error: serviceEnquiryError, count: serviceEnquiryCount } = await supabase
        .from('service_enquiries')
        .select('*', { count: 'exact' })
        .order('date', { ascending: false })
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

      if (serviceEnquiryError) {
        throw new Error('Error fetching service enquiries: ' + serviceEnquiryError.message);
      }

      // Fetch tasks
      const { data: taskData, error: taskError, count: taskCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact' })
        .order('submission_date', { ascending: false })
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

      if (taskError) {
        throw new Error('Error fetching tasks: ' + taskError.message);
      }

      setEnquiries(enquiryData);
      setServiceEnquiries(serviceEnquiryData);
      setTasks(taskData);
      setTotalPages(Math.ceil((enquiryCount + serviceEnquiryCount + taskCount) / ITEMS_PER_PAGE));
    } catch (error) {
      console.error('Error fetching data:', error.message);
      setSnackbar({ open: true, message: error.message, severity: 'error' });
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

  const handleEdit = (item) => {
    console.log("Edit item", item);
    // Implement your edit logic here
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, margin: 'auto', padding: 2 }}>
   
      {loading ? (
        <LinearProgress />
      ) : (
        <>
          <Grid container spacing={3}>
            {filteredEnquiries.map((enquiry) => (
              <Grid item xs={12} sm={6} md={4} key={enquiry.id}>
                <InfoCard 
                  data={enquiry} 
                  type="enquiry" 
                  onEdit={handleEdit}
                />
              </Grid>
            ))}

            {filteredServiceEnquiries.map((serviceEnquiry) => (
              <Grid item xs={12} sm={6} md={4} key={serviceEnquiry.id}>
                <InfoCard 
                  data={serviceEnquiry} 
                  type="serviceEnquiry" 
                  onEdit={handleEdit}
                />
              </Grid>
            ))}

            {filteredTasks.map((task) => (
              <Grid item xs={12} sm={6} md={4} key={task.id}>
                <InfoCard 
                  data={task} 
                  type="task" 
                  onEdit={handleEdit}
                />
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
