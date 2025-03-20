"use client";

import { format, getYear } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

const DatePicker = ({ name, value, onDateChange }) => {
  
  useEffect(() => {
    console.log("value", value);
  }
  , [value]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
        >
          {value ? format(value, "dd/MM/yyyy") : "Pilih Tanggal"}
          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <DateTimePicker
          granularity="day"
          mode="single"
          selected={value}
          onSelect={(date) => onDateChange(name, date)}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};

export default DatePicker;
