import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Typography,
  Box,
  IconButton
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CloseIcon from '@mui/icons-material/Close';

const DownloadDialog = ({
  open,
  handleClose,
  handleDownloadCSV,
  handleDownloadPDF
}) => {
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            Download Product Data
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Select the format to download the product data:
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
          <Button
            variant="contained"
            onClick={handleDownloadPDF}
            startIcon={<PictureAsPdfIcon />}
            sx={{ flex: 1, mx: 1 }}
          >
            PDF
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleDownloadCSV}
            startIcon={<DownloadIcon />}
            sx={{ flex: 1, mx: 1 }}
          >
            CSV
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default DownloadDialog;
