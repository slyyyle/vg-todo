"use client"

import React from 'react'
import { format } from 'date-fns'
import { DayPicker, SelectSingleEventHandler } from 'react-day-picker'
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Calendar as CalendarIcon } from "lucide-react"
import { withSourceInfo, useSourceInfo } from "@/components/withSourceInfo"
import { cn } from "@/lib/utils"

interface NesDatePickerProps {
  selectedDate: Date | undefined
  onDateChange: SelectSingleEventHandler // Use the specific handler type from DayPicker
  // Optional: Allow customizing the title if needed later? For now, hardcode "Due Date"
  // title?: string; 
  containerClassName?: string; // Allow passing extra classes to the container
  testIdPrefix?: string; // Optional prefix for data-testid attributes
}

function NesDatePickerComponent({
  selectedDate,
  onDateChange,
  // title = "Due Date", // Default title
  containerClassName,
  testIdPrefix = "nes-date-picker"
}: NesDatePickerProps) {
  const { ref } = useSourceInfo("NesDatePicker", "components/NesDatePicker.tsx")

  // Note: Popover open state is managed internally by the Popover component by default

  return (
    <div 
      ref={ref} 
      // Re-add nes-container styles
      className={cn(
        "nes-container is-dark with-title !mb-0 !pb-2", 
        containerClassName
      )}
      data-testid={`${testIdPrefix}-container`}
    >
      <p className="title">Due Date</p> {/* Re-add hardcoded title */}
      <div className="flex items-center space-x-2">
        <Popover modal={true}>
          <PopoverTrigger 
            className="flex-grow p-0 border-none bg-transparent hover:bg-transparent focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            data-testid={`${testIdPrefix}-trigger-button`}
          >
            {/* This div acts as the styled button */}
            <div
              className={cn(
                "nes-btn justify-start text-left font-normal",
                !selectedDate && "w-full" 
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : <span className="nes-text is-black">Pick a date</span>}
            </div>
          </PopoverTrigger>
          <PopoverContent
            className="w-fit p-0 shadow-none calendar-popover-content bg-transparent border-4 border-[var(--border)] !rounded-none"
            align="start"
            data-testid={`${testIdPrefix}-popover-content`}
          >
            {/* Wrap DayPicker in a nes-container for styling */}
            <div className="nes-container is-dark !p-2 !m-0 !border-none">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={onDateChange} // Pass the handler directly
                initialFocus
                className="nes-calendar-theme" // Use the shared theme class
              />
            </div>
          </PopoverContent>
        </Popover>
        {/* Clear Button */}
        {selectedDate && (
          <button
            type="button"
            className="nes-btn is-error"
            onClick={() => onDateChange(undefined, undefined as any, undefined as any, undefined as any)}
            data-testid={`${testIdPrefix}-clear-button`}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

// Wrap with HOC for source info (optional but good practice here)
const NesDatePicker = withSourceInfo(NesDatePickerComponent, "components/NesDatePicker.tsx")

export default NesDatePicker 