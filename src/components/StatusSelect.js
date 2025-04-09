import { createPortal } from 'react-dom';
import { useState, useEffect, useRef } from 'react';
import { FaCheckCircle, FaSpinner, FaClipboardList, FaClipboardCheck, FaWindowClose } from 'react-icons/fa';
import axios from 'axios';

const statusOptions = [
  { value: '0', label: 'To Do', icon: <FaClipboardList className="inline-block mr-2" />, color: 'text-yellow-500' },
  { value: '1', label: 'Progress', icon: <FaSpinner className="inline-block mr-2 animate-spin" />, color: 'text-blue-500' },
  { value: '2', label: 'Review', icon: <FaClipboardCheck className="inline-block mr-2" />, color: 'text-orange-500' },
  { value: '3', label: 'Done', icon: <FaCheckCircle className="inline-block mr-2" />, color: 'text-green-500' },
  { value: '4', label: 'Cancel', icon: <FaWindowClose className="inline-block mr-2" />, color: 'text-red-500' },
];

const StatusSelect = ({ status, onDataUpdate }) => {
  const initialStatus = statusOptions[status.statusForm];
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 }); // Track exact position
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  const handleSelect = async (option) => {
    setSelectedStatus(option);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/update-status-form/${status.id}`,
        { option },
        { withCredentials: true }
      );
      if (onDataUpdate) {
        onDataUpdate(option);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const adjustDropdownPosition = () => {
    if (buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: buttonRect.bottom + window.scrollY,
        left: buttonRect.left + window.scrollX
      });
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
  }, [status]);

  // Dropdown menu to be rendered with Portal
  const dropdownMenu = (
    <ul
      ref={dropdownRef}
      className="absolute bg-white border border-gray-300 rounded-md max-h-48 overflow-auto shadow-lg z-[9999]"
      style={{ top: dropdownPosition.top, left: dropdownPosition.left, width: buttonRef.current?.offsetWidth }}
    >
      {statusOptions.map((option) => (
        <li
          key={option.value}
          className={`p-1 hover:bg-gray-100 cursor-pointer flex items-center text-sm ${option.color}`}
          onClick={() => handleSelect(option)}
        >
          {option.icon} {option.label}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="relative w-full">
      <button
        onClick={toggleDropdown}
        ref={buttonRef}
        className={`block w-full bg-gray-100 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-left ${selectedStatus.color}`}
      >
        <span className="flex items-center">
          {selectedStatus.icon}
          <span className="truncate max-w-full">{selectedStatus.label}</span>
        </span>
      </button>


      {isOpen && createPortal(dropdownMenu, document.body)}
    </div>
  );
};

export default StatusSelect;
