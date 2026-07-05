"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  FaCheckCircle,
  FaClipboardCheck,
  FaClipboardList,
  FaSpinner,
  FaWindowClose,
} from "react-icons/fa";

import { toast } from "@/components/ui/use-toast";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const STATUS_OPTIONS = [
  {
    value: "0",
    label: "To Do",
    icon: FaClipboardList,
    color: "text-yellow-500",
  },
  {
    value: "1",
    label: "Progress",
    icon: FaSpinner,
    color: "text-blue-500",
    animate: true,
  },
  {
    value: "2",
    label: "Review",
    icon: FaClipboardCheck,
    color: "text-orange-500",
  },
  {
    value: "3",
    label: "Done",
    icon: FaCheckCircle,
    color: "text-green-500",
  },
  {
    value: "4",
    label: "Cancel",
    icon: FaWindowClose,
    color: "text-red-500",
  },
];

const findStatus = (value) =>
  STATUS_OPTIONS.find((option) => option.value === String(value)) ||
  STATUS_OPTIONS[0];

export default function StatusSelectAk({ row, disabled = false, onDataUpdate }) {
  const [selectedStatus, setSelectedStatus] = useState(
    String(row.statusForm ?? 0)
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setSelectedStatus(String(row.statusForm ?? 0));
  }, [row.statusForm]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const updatePosition = () => {
      const buttonRect = buttonRef.current?.getBoundingClientRect();
      if (!buttonRect) return;

      setDropdownPosition({
        top: buttonRect.bottom + window.scrollY,
        left: buttonRect.left + window.scrollX,
        width: buttonRect.width,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen &&
        !dropdownRef.current?.contains(event.target) &&
        !buttonRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSelect = async (option) => {
    const previousStatus = selectedStatus;

    setSelectedStatus(option.value);
    setIsOpen(false);
    setIsLoading(true);

    try {
      const response = await axios.put(
        `${apiUrl}/admin/forms/aqiqah-khitan/${row.uuid || row.id}/status`,
        { statusForm: Number(option.value) },
        { withCredentials: true }
      );
      onDataUpdate?.(response.data?.message);
    } catch (error) {
      console.error("Gagal memperbarui status form Aqiqah/Khitan:", error);
      setSelectedStatus(previousStatus);
      toast({
        title: "Status gagal diperbarui",
        description:
          error.response?.data?.error ||
          "Terjadi kesalahan saat memperbarui status form.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentStatus = findStatus(selectedStatus);
  const CurrentIcon = currentStatus.icon;
  const ButtonIcon = isLoading ? FaSpinner : CurrentIcon;

  const dropdown = (
    <ul
      ref={dropdownRef}
      role="listbox"
      className="absolute z-[9999] max-h-48 overflow-auto rounded-md border border-gray-300 bg-white py-1 shadow-lg"
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
      }}
    >
      {STATUS_OPTIONS.map((option) => {
        const OptionIcon = option.icon;

        return (
          <li key={option.value} role="option" aria-selected={option.value === selectedStatus}>
            <button
              type="button"
              className={`flex w-full cursor-pointer items-center px-2 py-1 text-left text-sm hover:bg-gray-100 ${option.color}`}
              onClick={() => handleSelect(option)}
            >
              <OptionIcon
                className={`mr-2 shrink-0 ${
                  option.animate ? "animate-spin" : ""
                }`}
              />
              <span>{option.label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="relative w-full">
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled || isLoading}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={(event) => {
          event.stopPropagation();
          setIsOpen((current) => !current);
        }}
        className={`block w-full rounded-md border border-gray-300 bg-gray-100 p-2 text-left text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-70 ${currentStatus.color}`}
      >
        <span className="flex items-center">
          <ButtonIcon
            className={`mr-2 shrink-0 ${
              currentStatus.animate || isLoading ? "animate-spin" : ""
            }`}
          />
          <span className="truncate">{currentStatus.label}</span>
        </span>
      </button>

      {isOpen ? createPortal(dropdown, document.body) : null}
    </div>
  );
}
