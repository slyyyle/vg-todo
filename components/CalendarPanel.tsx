"use client"

import React, { useState } from 'react';
import { DayPicker, SelectSingleEventHandler } from 'react-day-picker';

interface CalendarPanelProps {
  selected: Date | undefined;
  onSelect: SelectSingleEventHandler;
}

export default function CalendarPanel({ selected, onSelect }: CalendarPanelProps) {
  // You can add internal state here if needed later

  return (
    <div className="nes-container is-dark with-title">
      <p className="title">Calendar</p>
      <div className="flex justify-center">
        <DayPicker
          mode="single"
          selected={selected}
          onSelect={onSelect}
          className="nes-calendar-theme"
          // Add any other DayPicker props you were using or want to configure
        />
      </div>
    </div>
  );
} 