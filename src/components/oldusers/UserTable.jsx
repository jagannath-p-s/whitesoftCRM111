import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import HistoryIcon from '@mui/icons-material/History';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  IconButton,
  MenuItem,
  Select,
  Button,
  InputLabel,
  FormControl,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  TablePagination,
  Box,
  Tooltip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';

const UserTable = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [updatedUser, setUpdatedUser] = useState({});
  const [filterStage, setFilterStage] = useState('');
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchUsers();
  }, [filterStage]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('user_details').select('*');
    if (error) {
      console.error('Error fetching users:', error);
    } else {
      setUsers(data);
      setStages([...new Set(data.map((user) => user.stage))]);
    }
    setLoading(false);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedUser({ ...updatedUser, [name]: value });
  };

  const saveUser = async () => {
    const { data, error } = await supabase
      .from('user_details')
      .update(updatedUser)
      .eq('id', editingUser);

    if (error) {
      console.error('Error updating user:', error);
    } else {
      fetchUsers();
      setEditingUser(null);
    }
  };

  const startEditUser = (user) => {
    setEditingUser(user.id);
    setUpdatedUser({ ...user });
  };

  const filteredUsers = users
    .filter((user) => (filterStage ? user.stage === filterStage : true))
    .filter((user) =>
      Object.values(user).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to the first page whenever rows per page changes
  };

  return (
    <Box className="bg-white rounded-lg shadow-md min-h-screen">
      {/* Header */}
      <Box className="bg-white shadow-md">
        <Box className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Box className="flex justify-between items-center py-3">
            <Box className="flex items-center space-x-4">
              <HistoryIcon className="text-blue-500" style={{ fontSize: '1.75rem' }} />
              <h1 className="text-xl font-semibold ml-2">Previous Users</h1>
            </Box>
            <Box className="flex items-center space-x-4">
              <TextField
                type="text"
                placeholder="Search for users"
                value={searchTerm}
                onChange={handleSearch}
                variant="outlined"
                size="small"
                sx={{ pl: 1, pr: 1, py: 1, borderRadius: 2 }}
                autoComplete="off"
                InputProps={{
                  startAdornment: (
                    <IconButton size="small">
                      <SearchIcon />
                    </IconButton>
                  ),
                }}
              />
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Filter by Stage</InputLabel>
                <Select
                  value={filterStage}
                  onChange={(e) => setFilterStage(e.target.value)}
                  label="Filter by Stage"
                >
                  <MenuItem value="">See All</MenuItem>
                  {stages.map((stage, idx) => (
                    <MenuItem key={idx} value={stage}>
                      {stage}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Box>
      </Box>

      <div className="p-4 pt-0">
        {/* Table */}
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', boxShadow: 'none', mt: 2 }}>
          {loading ? (
            <Box style={{ margin: 'auto', display: 'block' }} /> 
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>No</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Stage</TableCell>
                    <TableCell>First Name</TableCell>
                    <TableCell>Second Name</TableCell>
                    <TableCell>Contact Number</TableCell>
                    <TableCell>Alternate Contact</TableCell>
                    <TableCell>User ID</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((user, index) => (
                      <TableRow key={user.id} hover>
                        <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                        <TableCell>{user.title}</TableCell>
                        <TableCell>{user.stage}</TableCell>
                        <TableCell>{user.first_name}</TableCell>
                        <TableCell>{user.second_name}</TableCell>
                        <TableCell>{user.contact_number}</TableCell>
                        <TableCell>{user.alternate_contact_number}</TableCell>
                        <TableCell>{user.user_id}</TableCell>
                        <TableCell>{user.description}</TableCell>
                        <TableCell>
                          <IconButton onClick={() => startEditUser(user)} color="primary" size="small">
                            <EditIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filteredUsers.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </TableContainer>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={editingUser !== null} onClose={() => setEditingUser(null)} fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <DialogContentText>Edit the user details and save changes.</DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            name="title"
            fullWidth
            value={updatedUser.title || ''}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            label="Stage"
            name="stage"
            fullWidth
            value={updatedUser.stage || ''}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            label="First Name"
            name="first_name"
            fullWidth
            value={updatedUser.first_name || ''}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            label="Second Name"
            name="second_name"
            fullWidth
            value={updatedUser.second_name || ''}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            label="Contact Number"
            name="contact_number"
            fullWidth
            value={updatedUser.contact_number || ''}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            label="Alternate Contact"
            name="alternate_contact_number"
            fullWidth
            value={updatedUser.alternate_contact_number || ''}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            label="User ID"
            name="user_id"
            fullWidth
            value={updatedUser.user_id || ''}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            label="Description"
            name="description"
            fullWidth
            value={updatedUser.description || ''}
            onChange={handleInputChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingUser(null)} color="secondary">
            Cancel
          </Button>
          <Button onClick={saveUser} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserTable;
