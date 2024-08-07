import React, { useState, useEffect } from 'react';
import Tooltip from '@mui/material/Tooltip';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import EventNoteIcon from '@mui/icons-material/EventNote';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import TaskCard from './TaskCard';
import InnerTaskContactCard from './InnerTaskContactCard';
import { supabase } from '../supabaseClient';
import dayjs from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import FilterSelect from './FilterSelect'; // Assuming you have this component created

const dateOptions = ['See All', 'This Month', 'Last 30 Days', 'Last 60 Days', 'Custom Date Range'];

const Activities = ({ userId, userRole }) => {
  const initialExpandedColumns = ['New', 'Ongoing', 'Completed', 'Overdue'];
  const [expanded, setExpanded] = useState(initialExpandedColumns);
  const [columns, setColumns] = useState([]);
  const [users, setUsers] = useState({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [visibleFields, setVisibleFields] = useState({
    task_name: true,
    task_message: true,
    submission_date: true,
    completion_status: true,
    type: true,
    assignedto: false,
    name: true,
    mobilenumber1: true,
    mobilenumber2: false,
    address: false,
    location: false,
    stage: false,
    mailid: false,
    leadsource: false,
    remarks: false,
    priority: true,
    invoiced: true,
    collected: false,
    products: true,
    created_at: true,
    salesflow_code: true,
    last_updated: true,
  });
  const [contactOpen, setContactOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [dateFilter, setDateFilter] = useState('Last 30 Days');
  const [startDate, setStartDate] = useState(dayjs().subtract(30, 'day'));
  const [endDate, setEndDate] = useState(dayjs());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*, enquiries(*)');

    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, username');

    if (tasksError || usersError) {
      console.error('Error fetching data:', tasksError || usersError);
    } else {
      const categorizedData = [
        { name: 'New', color: 'yellow', bgColor: 'bg-yellow-50', tasks: [] },
        { name: 'Ongoing', color: 'blue', bgColor: 'bg-blue-50', tasks: [] },
        { name: 'Completed', color: 'green', bgColor: 'bg-green-50', tasks: [] },
        { name: 'Overdue', color: 'red', bgColor: 'bg-red-50', tasks: [] },
      ];

      tasks.forEach((task) => {
        const category = categorizedData.find(c => c.name.toLowerCase() === task.completion_status);
        if (category) {
          category.tasks.push(task);
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
      setExpanded([...expanded, column]);
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    if (destination.droppableId === 'Overdue') {
      return; // Prevent manual dragging to the Overdue column
    }

    const sourceColumn = columns.find(column => column.name === source.droppableId);
    const destinationColumn = columns.find(column => column.name === destination.droppableId);
    const sourceItems = Array.from(sourceColumn.tasks);
    const [movedItem] = sourceItems.splice(source.index, 1);
    const destinationItems = Array.from(destinationColumn.tasks);
    destinationItems.splice(destination.index, 0, movedItem);

    movedItem.completion_status = destination.droppableId.toLowerCase();

    setColumns(columns.map(column => {
      if (column.name === source.droppableId) {
        column.tasks = sourceItems;
      } else if (column.name === destination.droppableId) {
        column.tasks = destinationItems;
      }
      return column;
    }));

    const { error } = await supabase
      .from('tasks')
      .update({ completion_status: destination.droppableId.toLowerCase() })
      .eq('id', movedItem.id);
    if (error) {
      console.error('Error updating status:', error);
    }
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

  const handleContactOpen = (contact) => {
    setSelectedContact(contact);
    setContactOpen(true);
  };

  const handleContactClose = () => {
    setContactOpen(false);
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

  const getTextColorClass = (color) => {
    switch (color) {
      case 'blue':
        return 'text-blue-600';
      case 'red':
        return 'text-red-600';
      case 'green':
        return 'text-green-600';
      case 'yellow':
        return 'text-yellow-600';
      case 'purple':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const filteredColumns = columns.map(column => {
    let filteredTasks = column.tasks;

    if (dateFilter === 'This Month') {
      filteredTasks = filteredTasks.filter(task =>
        dayjs(task.submission_date).isAfter(dayjs().startOf('month'))
      );
    } else if (dateFilter === 'Last 30 Days') {
      filteredTasks = filteredTasks.filter(task =>
        dayjs(task.submission_date).isAfter(dayjs().subtract(30, 'day'))
      );
    } else if (dateFilter === 'Last 60 Days') {
      filteredTasks = filteredTasks.filter(task =>
        dayjs(task.submission_date).isAfter(dayjs().subtract(60, 'day'))
      );
    } else if (dateFilter === 'Custom Date Range') {
      filteredTasks = filteredTasks.filter(task =>
        dayjs(task.submission_date).isAfter(startDate) && dayjs(task.submission_date).isBefore(endDate)
      );
    }

    return { ...column, tasks: filteredTasks };
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md border-b border-t border-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <EventNoteIcon className="text-blue-500" style={{ fontSize: '1.75rem' }} />
                <h1 className="text-xl font-semibold ml-2">Activities</h1>
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
            </div>
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={handleSettingsClose}>
        <DialogTitle>Customize Activity Card Fields</DialogTitle>
        <DialogContent>
          <DialogContentText>Select which fields to display in the activity card.</DialogContentText>
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

      {/* Content */}
      <div className="flex flex-grow p-4 space-x-4 overflow-x-auto">
        <DragDropContext onDragEnd={onDragEnd}>
          {filteredColumns.map((column) => (
            <Droppable key={column.name} droppableId={column.name}>
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  onClick={() => !expanded.includes(column.name) && toggleExpand(column.name)}
                  className={`flex flex-col transition-all duration-300 ease-in-out
                    ${expanded.includes(column.name) ? 'w-64' : 'w-16'}
                    ${expanded.includes(column.name) ? column.bgColor : 'bg-white'}
                    border ${expanded.includes(column.name) ? `border-${column.color}-300` : 'border-gray-300'}
                    p-4 rounded-lg shadow-md relative cursor-pointer`}
                  style={{ maxHeight: '100vh', overflowY: 'auto', paddingRight: '8px' }}
                >
                  {expanded.includes(column.name) ? (
                    <>
                      <div className="flex justify-between items-center mb-2">
                        <h2 className={`text-lg font-semibold truncate ${getTextColorClass(column.color)}`}>
                          {column.name}
                        </h2>
                        <Tooltip title="Collapse">
                          <button
                            className="text-gray-500 transform rotate-90"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(column.name);
                            }}
                          >
                            <KeyboardDoubleArrowRightIcon />
                          </button>
                        </Tooltip>
                      </div>
                      <div className="flex-grow overflow-y-auto pr-2">
                        {column.tasks.length > 0 ? (
                          column.tasks.map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  <TaskCard
                                    task={task}
                                    user={users[task.assigned_to]}
                                    color={column.color}
                                    visibleFields={visibleFields}
                                    handleContactOpen={handleContactOpen}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                            <p className="mb-2">No tasks</p>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="transform -rotate-90 whitespace-nowrap">
                        <p className={`text-sm font-semibold text-center ${getTextColorClass(column.color)}`}>
                          {column.name}
                        </p>
                      </div>
                      <Tooltip title="Expand">
                        <button
                          className="absolute top-2 right-2 text-gray-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(column.name);
                          }}
                        >
                          <KeyboardDoubleArrowRightIcon />
                        </button>
                      </Tooltip>
                    </div>
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </DragDropContext>
      </div>

      {selectedContact && (
        <Dialog open={contactOpen} onClose={handleContactClose} fullWidth maxWidth="md">
          <DialogTitle>Contact Details</DialogTitle>
          <DialogContent>
            <InnerTaskContactCard contact={selectedContact} visibleFields={visibleFields} />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleContactClose} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
};

export default Activities;
