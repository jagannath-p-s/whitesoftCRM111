import React, { useState, useMemo } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TextField, Select, MenuItem, IconButton, Typography, FormControl,
  Checkbox, Tooltip, Menu, ListItemIcon, ListItemText, Button, Box,
  InputLabel, Grid
} from '@mui/material';
import {
  GetApp as DownloadIcon, NavigateBefore as PrevIcon, NavigateNext as NextIcon,
  MoreVert as MoreVertIcon, Edit as EditIcon, Delete as DeleteIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { saveAs } from 'file-saver';
import { format, isValid, parseISO } from 'date-fns';

const TableView = ({ columns, visibleFields }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    name: '',
    contactNo: '',
    stage: '',
    dateFrom: '',
    dateTo: '',
  });
  const [selectedRows, setSelectedRows] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);

  const tableData = useMemo(() => {
    return columns.flatMap(column =>
      column.contacts.map(contact => ({
        ...contact,
        name: contact.name,
        stage: column.name,
      }))
    );
  }, [columns]);

  const filteredData = useMemo(() => {
    const dateFrom = filters.dateFrom ? parseISO(filters.dateFrom) : null;
    const dateTo = filters.dateTo ? parseISO(filters.dateTo) : null;
    return tableData.filter(contact => {
      const contactDate = parseISO(contact.created_at);
      return (
        contact.name.toLowerCase().includes(filters.name.toLowerCase()) &&
        contact.mobilenumber1.includes(filters.contactNo) &&
        (!filters.stage || contact.stage === filters.stage) &&
        (!dateFrom || contactDate >= dateFrom) &&
        (!dateTo || contactDate <= dateTo)
      );
    });
  }, [tableData, filters]);

  const pageCount = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  const handleFilterChange = (event) => {
    setFilters({ ...filters, [event.target.name]: event.target.value });
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      name: '',
      contactNo: '',
      stage: '',
      dateFrom: '',
      dateTo: '',
    });
    setCurrentPage(1);
  };

  const handleDownload = () => {
    const csvContent = [
      ['Name', 'Contact No', 'Date Created', 'Stage'],
      ...filteredData.map(contact => [
        contact.name,
        contact.mobilenumber1,
        contact.created_at,
        contact.stage,
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'contacts.csv');
  };

  const handleChangePage = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(1);
  };

  const isSelected = (contact) => selectedRows.includes(contact.mobilenumber1);

  const handleSelectRow = (contact) => {
    setSelectedRows(prev =>
      isSelected(contact)
        ? prev.filter(row => row !== contact.mobilenumber1)
        : [...prev, contact.mobilenumber1]
    );
  };

  const handleSelectAllRows = (event) => {
    setSelectedRows(event.target.checked ? paginatedData.map(contact => contact.mobilenumber1) : []);
  };

  const handleMenuOpen = (event, contact) => {
    setAnchorEl(event.currentTarget);
    setSelectedContact(contact);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    console.log('Editing:', selectedContact);
    handleMenuClose();
  };

  const handleDelete = () => {
    console.log('Deleting:', selectedContact);
    handleMenuClose();
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ borderRadius: 2, position: 'sticky', top: 0, zIndex: 1 }}>
        <Box sx={{ p: 3, bgcolor: '#ffffff', minWidth: 1200 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                label="Name"
                name="name"
                variant="outlined"
                size="small"
                value={filters.name}
                onChange={handleFilterChange}
                sx={{ width: '150px' }}
              />
              <TextField
                label="Mobile No"
                name="contactNo"
                variant="outlined"
                size="small"
                value={filters.contactNo}
                onChange={handleFilterChange}
                sx={{ width: '150px' }}
              />
              <FormControl variant="outlined" size="small" sx={{ width: '150px' }}>
                <InputLabel>Stage</InputLabel>
                <Select
                  value={filters.stage}
                  name="stage"
                  onChange={handleFilterChange}
                  label="Stage"
                >
                  <MenuItem value="">All Stages</MenuItem>
                  {columns.map(column => (
                    <MenuItem key={column.name} value={column.name}>{column.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="From Date"
                name="dateFrom"
                variant="outlined"
                size="small"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={filters.dateFrom}
                onChange={handleFilterChange}
                sx={{ width: '150px' }}
              />
              <TextField
                label="To Date"
                name="dateTo"
                variant="outlined"
                size="small"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={filters.dateTo}
                onChange={handleFilterChange}
                sx={{ width: '150px' }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={handleClearFilters}
              >
                Clear
              </Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
              >
                Download
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>
      <Box sx={{ width: '100%', overflowX: 'auto' }}>
        <Paper elevation={3} sx={{ borderRadius: 2, mb: 3 }}>
          <Box sx={{ maxHeight: '600px', overflowY: 'auto' }}>
            <TableContainer component={Paper}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={selectedRows.length > 0 && selectedRows.length < paginatedData.length}
                        checked={paginatedData.length > 0 && selectedRows.length === paginatedData.length}
                        onChange={handleSelectAllRows}
                      />
                    </TableCell>
                    <TableCell>Actions</TableCell>
                    {visibleFields.name && <TableCell>Name</TableCell>}
                    {visibleFields.mobilenumber1 && <TableCell>Mobile Number</TableCell>}
                    {visibleFields.stage && <TableCell>Stage</TableCell>}
                    {visibleFields.leadsource && <TableCell>Lead Source</TableCell>}
                    {visibleFields.priority && <TableCell>Priority</TableCell>}
                    {visibleFields.invoiced && <TableCell>Invoiced</TableCell>}
                    {visibleFields.collected && <TableCell>Collected</TableCell>}
                    {visibleFields.created_at && <TableCell>Created At</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedData.length > 0 ? paginatedData.map((contact, index) => (
                    <TableRow key={index} hover selected={isSelected(contact)}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isSelected(contact)}
                          onChange={() => handleSelectRow(contact)}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={(event) => handleMenuOpen(event, contact)}>
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                      {visibleFields.name && <TableCell>{contact.name}</TableCell>}
                      {visibleFields.mobilenumber1 && <TableCell>{contact.mobilenumber1}</TableCell>}
                      {visibleFields.stage && <TableCell>{contact.stage}</TableCell>}
                      {visibleFields.leadsource && <TableCell>{contact.leadsource}</TableCell>}
                      {visibleFields.priority && <TableCell>{contact.priority}</TableCell>}
                      {visibleFields.invoiced && <TableCell>{contact.invoiced ? 'Yes' : 'No'}</TableCell>}
                      {visibleFields.collected && <TableCell>{contact.collected ? 'Yes' : 'No'}</TableCell>}
                      {visibleFields.created_at && (
                        <TableCell>
                          {isValid(parseISO(contact.created_at))
                            ? format(parseISO(contact.created_at), 'dd-MM-yyyy')
                            : 'Invalid date'}
                        </TableCell>
                      )}
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={10} align="center">No contacts found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Paper>
      </Box>
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <Typography variant="body2" sx={{ mr: 2 }}>
          {`${(currentPage - 1) * rowsPerPage + 1}-${Math.min(currentPage * rowsPerPage, filteredData.length)} of ${filteredData.length}`}
        </Typography>
        <FormControl variant="outlined" size="small" sx={{ width: '100px', mr: 2 }}>
          <Select
            value={rowsPerPage}
            onChange={handleChangeRowsPerPage}
          >
            {[5, 10, 25, 50].map(option => (
              <MenuItem key={option} value={option}>{option} per page</MenuItem>
            ))}
          </Select>
        </FormControl>
        <IconButton onClick={() => handleChangePage(currentPage - 1)} disabled={currentPage === 1}>
          <PrevIcon />
        </IconButton>
        <IconButton onClick={() => handleChangePage(currentPage + 1)} disabled={currentPage === pageCount}>
          <NextIcon />
        </IconButton>
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default TableView;
