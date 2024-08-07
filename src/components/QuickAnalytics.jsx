import React, { useState } from 'react';
import { Box, Typography, IconButton, Button } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const QuickAnalytics = ({ totalIncome, technicianPerformance, filteredEnquiries }) => {
  const [expanded, setExpanded] = useState(false);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    doc.text('Quick Report', 14, 16);
    doc.text(`Total Service Income: ${totalIncome.toFixed(2)}`, 14, 24);

    const performanceData = Object.keys(technicianPerformance).map((technician) => [
      technician,
      technicianPerformance[technician].total,
      technicianPerformance[technician].completed,
      technicianPerformance[technician].ongoing,
    ]);

    const enquiryData = filteredEnquiries.map((enquiry, index) => [
      index + 1,
      new Date(enquiry.date).toLocaleDateString(),
      enquiry.job_card_no,
      enquiry.customer_name,
      enquiry.customer_mobile,
      enquiry.technician_name,
      `₹${enquiry.total_amount?.toFixed(2) || 'N/A'}`,
      enquiry.status,
      new Date(enquiry.expected_completion_date).toLocaleDateString(),
    ]);

    doc.autoTable({
      head: [['Technician', 'Total Enquiries', 'Completed', 'Ongoing']],
      body: performanceData,
      startY: 30,
    });

    doc.autoTable({
      head: [['No.', 'Date', 'Job Card No', 'Customer Name', 'Customer Mobile', 'Technician Name', 'Total Amount', 'Status', 'Expected Completion']],
      body: enquiryData,
      startY: doc.lastAutoTable.finalY + 10,
    });

    doc.save('quick_report.pdf');
  };

  return (
    <Box className="bg-white shadow-md p-4 mb-4 border-t border-gray-200">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Quick Report</Typography>
        <Box display="flex" alignItems="center">
          <Button variant="contained" color="primary" onClick={handleDownloadPDF} style={{ marginRight: '8px' }}>
            Download Report
          </Button>
          <IconButton onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
      </Box>
      {expanded && (
        <Box mt={2}>
          <Typography variant="subtitle1" gutterBottom>
            Total Service Income: ₹{totalIncome.toFixed(2)}
          </Typography>
          {Object.keys(technicianPerformance).map((technician) => (
            <Box key={technician} mb={1}>
              <Typography variant="subtitle1">
                {technician}: {technicianPerformance[technician].total} enquiries
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {technicianPerformance[technician].completed} completed, {technicianPerformance[technician].ongoing} ongoing
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default QuickAnalytics;
