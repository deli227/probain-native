import { useState, useCallback } from "react";
import { CALENDAR_YEARS } from "@/components/shared/CalendarModal";

interface UseCalendarModalOptions {
  initialDate?: Date;
  onDateChange?: (date: Date | undefined) => void;
}

export function useCalendarModal({ initialDate, onDateChange }: UseCalendarModalOptions = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date | undefined>(undefined);
  const [currentYear, setCurrentYear] = useState<number>(
    initialDate ? initialDate.getFullYear() : new Date().getFullYear()
  );
  const [currentMonth, setCurrentMonth] = useState<Date>(
    initialDate ? new Date(initialDate) : new Date()
  );

  const open = useCallback((currentDate?: Date) => {
    const d = currentDate || initialDate;
    if (d) {
      setTempDate(d);
      setCurrentYear(d.getFullYear());
      setCurrentMonth(new Date(d));
    } else {
      setTempDate(undefined);
      setCurrentYear(new Date().getFullYear());
      setCurrentMonth(new Date());
    }
    setIsOpen(true);
  }, [initialDate]);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const confirm = useCallback(() => {
    onDateChange?.(tempDate);
    setIsOpen(false);
  }, [tempDate, onDateChange]);

  const clear = useCallback(() => {
    setTempDate(undefined);
    onDateChange?.(undefined);
    setIsOpen(false);
  }, [onDateChange]);

  const handleYearChange = useCallback((yearStr: string) => {
    const year = parseInt(yearStr, 10);
    setCurrentYear(year);
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setFullYear(year);
      return newMonth;
    });
  }, []);

  const prevYear = useCallback(() => {
    setCurrentYear(prev => {
      const newYear = prev - 1;
      const minYear = CALENDAR_YEARS[CALENDAR_YEARS.length - 1];
      if (newYear < minYear) return prev;
      setCurrentMonth(m => {
        const newMonth = new Date(m);
        newMonth.setFullYear(newYear);
        return newMonth;
      });
      return newYear;
    });
  }, []);

  const nextYear = useCallback(() => {
    setCurrentYear(prev => {
      const newYear = prev + 1;
      const maxYear = CALENDAR_YEARS[0];
      if (newYear > maxYear) return prev;
      setCurrentMonth(m => {
        const newMonth = new Date(m);
        newMonth.setFullYear(newYear);
        return newMonth;
      });
      return newYear;
    });
  }, []);

  return {
    isOpen,
    tempDate,
    setTempDate,
    currentYear,
    setCurrentYear,
    currentMonth,
    setCurrentMonth,
    open,
    close,
    confirm,
    clear,
    handleYearChange,
    prevYear,
    nextYear,
  };
}
