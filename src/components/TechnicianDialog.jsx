import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { supabase } from '../supabaseClient';

const TechnicianDialog = ({ open, onClose }) => {
  const [technicians, setTechnicians] = useState([]);
  const [newTechnician, setNewTechnician] = useState({ name: '', employee_code: '' });
  const [editingTechnician, setEditingTechnician] = useState(null);

  useEffect(() => {
    if (open) {
      fetchTechnicians();
    }
  }, [open]);

  const fetchTechnicians = async () => {
    try {
      const { data, error } = await supabase
        .from('technicians')
        .select('*')
        .order('name');
      if (error) throw error;
      setTechnicians(data);
    } catch (error) {
      console.error('Error fetching technicians:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editingTechnician) {
      setEditingTechnician({ ...editingTechnician, [name]: value });
    } else {
      setNewTechnician({ ...newTechnician, [name]: value });
    }
  };

  const handleAddTechnician = async () => {
    try {
      const { data, error } = await supabase
        .from('technicians')
        .insert([newTechnician]);
      if (error) throw error;
      fetchTechnicians();
      setNewTechnician({ name: '', employee_code: '' });
    } catch (error) {
      console.error('Error adding technician:', error);
    }
  };

  const handleEditTechnician = (technician) => {
    setEditingTechnician(technician);
  };

  const handleUpdateTechnician = async () => {
    try {
      const { data, error } = await supabase
        .from('technicians')
        .update(editingTechnician)
        .eq('id', editingTechnician.id);
      if (error) throw error;
      fetchTechnicians();
      setEditingTechnician(null);
    } catch (error) {
      console.error('Error updating technician:', error);
    }
  };

  const handleDeleteTechnician = async (id) => {
    if (window.confirm('Are you sure you want to delete this technician?')) {
      try {
        const { data, error } = await supabase
          .from('technicians')
          .delete()
          .eq('id', id);
        if (error) throw error;
        fetchTechnicians();
      } catch (error) {
        console.error('Error deleting technician:', error);
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Manage Technicians</DialogTitle>
      <DialogContent>
        <div className="mb-4">
          <TextField
            name="name"
            label="Technician Name"
            value={editingTechnician ? editingTechnician.name : newTechnician.name}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
          />
          <TextField
            name="employee_code"
            label="Employee Code"
            value={editingTechnician ? editingTechnician.employee_code : newTechnician.employee_code}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
          />
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={editingTechnician ? handleUpdateTechnician : handleAddTechnician}
            className="mt-2"
          >
            {editingTechnician ? 'Update Technician' : 'Add Technician'}
          </Button>
        </div>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Employee Code</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {technicians.map((technician) => (
                <TableRow key={technician.id}>
                  <TableCell>{technician.name}</TableCell>
                  <TableCell>{technician.employee_code}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEditTechnician(technician)} color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteTechnician(technician.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TechnicianDialog;