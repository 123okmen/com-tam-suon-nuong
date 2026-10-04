import { useState, useEffect } from 'react';
import { ShiftStorage } from '../utils/storage';
import type { ShiftData } from '../utils/storage';

export const useShiftStatus = (staffName: string) => {
  const [currentShift, setCurrentShift] = useState<ShiftData | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  useEffect(() => {
    if (staffName) {
      const shift = ShiftStorage.getCurrentShift(staffName);
      setCurrentShift(shift);
      setIsCheckedIn(shift !== null);
    }
  }, [staffName]);

  const updateShiftStatus = (name: string, action: 'checkin' | 'checkout') => {
    const shift = ShiftStorage.saveShift(name, action);
    setCurrentShift(action === 'checkin' ? shift : null);
    setIsCheckedIn(action === 'checkin');
    return shift;
  };

  return { currentShift, isCheckedIn, updateShiftStatus };
};
