import React, { useState } from 'react';
import { Box, Menu, MenuItem, TextField, Tooltip } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import dayjs from 'dayjs';

const FilterSelect = ({
  label,
  value,
  handleChange,
  options,
  withDatePicker,
  startDate,
  endDate,
  handleStartDateChange,
  handleEndDateChange,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (selectedValue) => {
    handleChange(selectedValue);
    handleClose();
  };

  return (
    <Box display="flex" alignItems="center">
      <Tooltip title={`Filter by ${label}`}>
        <button
          className={`py-2 px-4 rounded-full border ${anchorEl ? 'border-blue-600 bg-blue-100' : 'border-gray-300'} focus:outline-none transition duration-150 ease-in-out`}
          onClick={handleOpen}
        >
          {value || label}
          <ArrowDropDownIcon className="ml-1" />
        </button>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {options.map((option) => (
          <MenuItem key={option} onClick={() => handleSelect(option)}>
            {option}
          </MenuItem>
        ))}
        {withDatePicker && (
          <Box p={2}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={handleStartDateChange}
                renderInput={(params) => <TextField {...params} size="small" />}
              />
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={handleEndDateChange}
                renderInput={(params) => <TextField {...params} size="small" />}
              />
            </LocalizationProvider>
          </Box>
        )}
      </Menu>
    </Box>
  );
};

export default FilterSelect;
