import React, { useState, useEffect, useCallback } from 'react';
import Tooltip from '@mui/material/Tooltip';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import ViewListIcon from '@mui/icons-material/ViewList';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import Column from './Column';
import TableView from './TableView';
import { supabase } from '../supabaseClient';
import { DragDropContext } from 'react-beautiful-dnd';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import PrintBillDialog from './PrintBillDialog';
import Dash from './Dash';
import dayjs from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import FilterSelect from './FilterSelect'; // Assuming you have this component created

const dateOptions = ['See All', 'This Month', 'Last 30 Days', 'Last 60 Days', 'Custom Date Range'];

const Sales = () => {
  const initialExpandedColumns = ['Lead', 'Prospect', 'Opportunity', 'Customer-Won', 'Lost/Rejected'];
  const [expanded, setExpanded] = useState(initialExpandedColumns);
  const [view, setView] = useState('cards');
  const [columns, setColumns] = useState([]);
  const [users, setUsers] = useState({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [visibleFields, setVisibleFields] = useState({
    name: true,
    mobilenumber1: true,
    mobilenumber2: false,
    address: false,
    location: false,
    stage: false,
    mailid: false,
    leadsource: false,
    assignedto: false,
    remarks: false,
    priority: true,
    invoiced: true,
    collected: false,
    products: true,
    created_at: true,
    salesflow_code: true,
    last_updated: true, // Added last updated field
  });
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [dragResult, setDragResult] = useState(null);
  const [viewCompletedSales, setViewCompletedSales] = useState(false); // State for viewing completed sales
  const [dateFilter, setDateFilter] = useState('Last 30 Days');
  const [startDate, setStartDate] = useState(dayjs().subtract(30, 'day'));
  const [endDate, setEndDate] = useState(dayjs());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: enquiries, error: enquiriesError } = await supabase
      .from('enquiries')
      .select('*');

    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, username');

    if (enquiriesError || usersError) {
      console.error('Error fetching data:', enquiriesError || usersError);
    } else {
      const categorizedData = [
        { name: 'Lead', color: 'purple', bgColor: 'bg-purple-50', contacts: [] },
        { name: 'Prospect', color: 'blue', bgColor: 'bg-blue-50', contacts: [] },
        { name: 'Opportunity', color: 'indigo', bgColor: 'bg-indigo-50', contacts: [] },
        { name: 'Customer-Won', color: 'green', bgColor: 'bg-green-50', contacts: [] },
        { name: 'Lost/Rejected', color: 'red', bgColor: 'bg-red-50', contacts: [] },
      ];

      enquiries.forEach((contact) => {
        const category = categorizedData.find(c => c.name === contact.stage);
        if (category) {
          category.contacts.push(contact);
        }
      });

      const usersMap = usersData.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {});

      setUsers(usersMap);
      setColumns(categorizedData);
    }
  };

  const toggleExpand = (column) => {
    if (expanded.includes(column)) {
      setExpanded(expanded.filter((c) => c !== column));
    } else {
      if (expanded.length < 4) {
        setExpanded([...expanded, column]);
      } else {
        const [first, ...rest] = expanded;
        setExpanded([...rest, column]);
      }
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const sourceColumn = columns.find(column => column.name === source.droppableId);
    const destinationColumn = columns.find(column => column.name === destination.droppableId);
    
    // Prevent moving cards out of "Customer-Won"
    if (sourceColumn.name === 'Customer-Won' && destinationColumn.name !== 'Customer-Won') {
      return;
    }

    const sourceItems = Array.from(sourceColumn.contacts);
    const [movedItem] = sourceItems.splice(source.index, 1);
    const destinationItems = Array.from(destinationColumn.contacts);
    destinationItems.splice(destination.index, 0, movedItem);

    movedItem.stage = destination.droppableId;

    setColumns(columns.map(column => {
      if (column.name === source.droppableId) {
        column.contacts = sourceItems;
      } else if (column.name === destination.droppableId) {
        column.contacts = destinationItems;
      }
      return column;
    }));

    if (destination.droppableId === 'Customer-Won') {
      setCustomerDetails(movedItem);
      setPrintDialogOpen(true);
      setDragResult(result);
    } else {
      const { error } = await supabase
        .from('enquiries')
        .update({ stage: destination.droppableId })
        .eq('id', movedItem.id);
      if (error) {
        console.error('Error updating stage:', error);
      }
    }
  };

  const handlePrintClose = async (shouldMove) => {
    setPrintDialogOpen(false);
    if (shouldMove && dragResult) {
      const { source, destination } = dragResult;
      const movedItem = columns
        .find(column => column.name === destination.droppableId)
        .contacts.find(contact => contact.id === customerDetails.id);
      
      movedItem.stage = destination.droppableId;
      movedItem.won_date = new Date().toISOString();
      
      const { error } = await supabase
        .from('enquiries')
        .update({ stage: destination.droppableId, won_date: movedItem.won_date })
        .eq('id', movedItem.id);
      if (error) {
        console.error('Error updating stage:', error);
      }
    } else if (dragResult) {
      const { source, destination } = dragResult;
      const destinationColumn = columns.find(column => column.name === destination.droppableId);
      const sourceColumn = columns.find(column => column.name === source.droppableId);
      const destinationItems = Array.from(destinationColumn.contacts);
      const sourceItems = Array.from(sourceColumn.contacts);
      const [movedItem] = destinationItems.splice(destination.index, 1);
      sourceItems.splice(source.index, 0, movedItem);

      setColumns(columns.map(column => {
        if (column.name === destination.droppableId) {
          column.contacts = destinationItems;
        } else if (column.name === source.droppableId) {
          column.contacts = sourceItems;
        }
        return column;
      }));
    }
    fetchData(); // Fetch data again to update the columns
  };

  const handleSettingsOpen = () => {
    setSettingsOpen(true);
  };

  const handleSettingsClose = () => {
    setSettingsOpen(false);
  };

  const handleFieldChange = (event) => {
    setVisibleFields({ ...visibleFields, [event.target.name]: event.target.checked });
  };

  const handleDateFilterChange = (value) => {
    setDateFilter(value);
  };

  const handleStartDateChange = (date) => {
    setStartDate(date);
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
  };

  const filteredColumns = columns.map(column => {
    let filteredContacts = column.contacts;

    if (dateFilter === 'This Month') {
      filteredContacts = filteredContacts.filter(contact =>
        dayjs(contact.date).isAfter(dayjs().startOf('month'))
      );
    } else if (dateFilter === 'Last 30 Days') {
      filteredContacts = filteredContacts.filter(contact =>
        dayjs(contact.date).isAfter(dayjs().subtract(30, 'day'))
      );
    } else if (dateFilter === 'Last 60 Days') {
      filteredContacts = filteredContacts.filter(contact =>
        dayjs(contact.date).isAfter(dayjs().subtract(60, 'day'))
      );
    } else if (dateFilter === 'Custom Date Range') {
      filteredContacts = filteredContacts.filter(contact =>
        dayjs(contact.date).isAfter(startDate) && dayjs(contact.date).isBefore(endDate)
      );
    }

    return { ...column, contacts: filteredContacts };
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <ShoppingBagOutlinedIcon className="text-blue-500" style={{ fontSize: '1.75rem' }} />
                <h1 className="text-xl font-semibold ml-2">Sales</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <FilterSelect
                label="Date Range"
                value={dateFilter}
                handleChange={handleDateFilterChange}
                options={dateOptions}
                withDatePicker={dateFilter === 'Custom Date Range'}
                startDate={startDate}
                endDate={endDate}
                handleStartDateChange={handleStartDateChange}
                handleEndDateChange={handleEndDateChange}
              />
              <Tooltip title="Settings">
                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full" onClick={handleSettingsOpen}>
                  <SettingsOutlinedIcon style={{ fontSize: '1.75rem' }} />
                </button>
              </Tooltip>
              <Tooltip title={view === 'cards' ? "Table View" : "Card View"}>
                <button
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                  onClick={() => setView(view === 'cards' ? 'table' : 'cards')}
                >
                  {view === 'cards' ? (
                    <TableChartOutlinedIcon style={{ fontSize: '1.75rem' }} />
                  ) : (
                    <ViewListIcon style={{ fontSize: '1.75rem' }} />
                  )}
                </button>
              </Tooltip>
              <Tooltip title="View Completed Sales">
                <button
                  className={`flex items-center p-2 rounded-full ${viewCompletedSales ? 'text-blue-500 bg-blue-100' : 'text-gray-500 hover:bg-gray-100'}`}
                  onClick={() => setViewCompletedSales(!viewCompletedSales)}  // Toggle view to completed sales
                >
                  <CheckCircleOutlineIcon style={{ fontSize: '1.75rem' }} />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={handleSettingsClose}>
        <DialogTitle>Customize Contact Card Fields</DialogTitle>
        <DialogContent>
          <DialogContentText>Select which fields to display in the contact card.</DialogContentText>
          {Object.keys(visibleFields).map((field) => (
            <FormControlLabel
              key={field}
              control={
                <Checkbox
                  checked={visibleFields[field]}
                  onChange={handleFieldChange}
                  name={field}
                />
              }
              label={field.charAt(0).toUpperCase() + field.slice(1)}
            />
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSettingsClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <PrintBillDialog
        open={printDialogOpen}
        handleClose={(shouldMove) => handlePrintClose(shouldMove)}
        customer={customerDetails}
        onCustomerUpdate={fetchData} // Add this line to update the data when customer is updated
      />

      {/* Content */}
      {viewCompletedSales ? (
        <Dash />  // Render the Dash component when viewing completed sales
      ) : (
        <div className="flex flex-grow p-4 space-x-4 overflow-x-auto">
          <DragDropContext onDragEnd={onDragEnd}>
            {view === 'cards' ? (
              filteredColumns.map((column) => (
                <Column
                  key={column.name}
                  column={column}
                  expanded={expanded}
                  toggleExpand={toggleExpand}
                  users={users}
                  visibleFields={visibleFields}
                />
              ))
            ) : (
              <TableView columns={filteredColumns} users={users} visibleFields={visibleFields} />
            )}
          </DragDropContext>
        </div>
      )}
    </div>
  );
};

export default Sales;
