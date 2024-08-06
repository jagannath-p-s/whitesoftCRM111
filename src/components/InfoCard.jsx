import React from 'react';
import { Card, CardContent, CardActions, Typography, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import dayjs from 'dayjs';

const InfoCard = ({ data, type, onEdit }) => {
  const renderContent = () => {
    switch (type) {
      case 'enquiry':
        return (
          <>
            <Typography variant="h6" component="div">{data.name}</Typography>
            <Typography variant="body2" color="textSecondary">Mobile: {data.mobilenumber1}</Typography>
            <Typography variant="body2" color="textSecondary">Email: {data.mailid}</Typography>
            <Typography variant="body2" color="textSecondary">Priority: {data.priority}</Typography>
            <Typography variant="body2" color="textSecondary">Stage: {data.stage}</Typography>
          </>
        );
      case 'serviceEnquiry':
        return (
          <>
            <Typography variant="h6" component="div">{data.customer_name}</Typography>
            <Typography variant="body2" color="textSecondary">Mobile: {data.customer_mobile}</Typography>
            <Typography variant="body2" color="textSecondary">Job Card No: {data.job_card_no}</Typography>
            <Typography variant="body2" color="textSecondary">Status: {data.status}</Typography>
          </>
        );
      case 'task':
        return (
          <>
            <Typography variant="h6" component="div">{data.task_name}</Typography>
            <Typography variant="body2" color="textSecondary">Message: {data.task_message}</Typography>
            <Typography variant="body2" color="textSecondary">Type: {data.type}</Typography>
            <Typography variant="body2" color="textSecondary">Status: {data.completion_status}</Typography>
            <Typography variant="body2" color="textSecondary">
              Submission Date: {dayjs(data.submission_date).format('DD/MM/YYYY')}
            </Typography>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Card variant="outlined" sx={{ marginBottom: 2 }}>
      <CardContent>
        {renderContent()}
      </CardContent>
      <CardActions>
        <IconButton onClick={() => onEdit(data)} color="primary">
          <EditIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
};

export default InfoCard;
