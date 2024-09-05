import { useState, useEffect, useRef } from 'react';
import { FaCheckCircle, FaSpinner, FaClipboardList, FaClipboardCheck } from 'react-icons/fa';
import axios from 'axios';

const statusOptions = [
  { value: '0', label: 'To Do', icon: <FaClipboardList className="inline-block mr-2" />, color: 'text-yellow-500' },
  { value: '1', label: 'Progress', icon: <FaSpinner className="inline-block mr-2 animate-spin" />, color: 'text-blue-500' },
  { value: '2', label: 'Review', icon: <FaClipboardCheck className="inline-block mr-2" />, color: 'text-orange-500' },
  { value: '3', label: 'Done', icon: <FaCheckCircle className="inline-block mr-2" />, color: 'text-green-500' },
];

const StatusSelect = ({ status, onDataUpdate }) => {
  // Ensure that the status is a valid index (0-3), defaulting to 0 if out of bounds
  const initialStatus = statusOptions[status.statusForm];
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState('down'); // State to track dropdown position
  const dropdownRef = useRef(null); // Ref to track dropdown
  const buttonRef = useRef(null);   // Ref to track the button for positioning

  const handleSelect = async (option) => {
    setSelectedStatus(option);
    try {
      // Make the POST request with the correct URL and options
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/update-status-form/${status.id}`,
        { option },  // Empty request body if no data is being sent
        { withCredentials: true } // Pass withCredentials as a config option
      );

      if (onDataUpdate) {
        onDataUpdate(option);
      }

      // Optionally log the response for debugging
      console.log('Response:', response.data);

      // Update the selected status after successful request

    } catch (error) {
      // Handle any errors that occur during the request
      console.error('Error updating status:', error);
      // Optionally show an error message to the user
    }
    setIsOpen(false); // Close the dropdown after selecting an option
  };


  const toggleDropdown = () => {
    setIsOpen(!isOpen); // Toggle dropdown open and close
  };

  // Function to adjust the dropdown's position based on available space
  const adjustDropdownPosition = () => {
    if (dropdownRef.current && buttonRef.current) {
      const dropdown = dropdownRef.current.getBoundingClientRect();
      const button = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - button.bottom - 50; // Adjusted space below with an offset
      const spaceAbove = button.top;

      // Compare available space and decide whether to place the dropdown above or below
      if (spaceBelow < dropdown.height && spaceAbove > dropdown.height) {
        setDropdownPosition('up'); // Position the dropdown above
      } else {
        setDropdownPosition('down'); // Position the dropdown below
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      adjustDropdownPosition(); // Adjust dropdown position when it's opened
    }
  }, [isOpen]);

  // Close dropdown if clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false); // Close dropdown if clicking outside
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setSelectedStatus(statusOptions[status.statusForm]); // Ensure status update from parent
  }, [status]); // Re-run this effect when the `status` prop changes

  return (
    <div className="relative w-full">
      <button
        onClick={toggleDropdown}
        ref={buttonRef}
        className={`block w-full bg-gray-100 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-left ${selectedStatus.color}`}
      >
        {selectedStatus.icon} {selectedStatus.label}
      </button>

      {isOpen && (
        <ul
          ref={dropdownRef}
          className={`absolute w-full bg-white border border-gray-300 rounded-md max-h-48 overflow-auto shadow-lg z-50 ${dropdownPosition === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
            }`}
        >
          {statusOptions.map((option) => (
            <li
              key={option.value} // Use option.value as a unique key
              className={`p-2 hover:bg-gray-100 cursor-pointer flex items-center ${option.color}`}
              onClick={() => handleSelect(option)}
            >
              {option.icon} {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default StatusSelect;
