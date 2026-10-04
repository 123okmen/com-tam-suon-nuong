/**
 * Validation utilities for form inputs and shift management
 */

export interface ShiftTime {
  start: string;
  end: string;
}

export const SHIFTS = {
  morning: { start: '07:30', end: '12:30', name: 'Ca Sáng (7h30-12h30)' },
  evening: { start: '13:00', end: '21:00', name: 'Ca Chiều Tối (13h-21h)' }
};

/**
 * Validate if current time is within a valid shift
 */
export const validateShiftTime = (): { isValid: boolean; currentShift: string | null } => {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const currentTime = hour * 60 + minute;

  // Ca sáng: 7:30 - 12:30
  if (currentTime >= 7 * 60 + 30 && currentTime <= 12 * 60 + 30) {
    return { isValid: true, currentShift: 'Ca Sáng (7:30 - 12:30)' };
  }
  
  // Ca chiều tối: 13:00 - 21:00
  if (currentTime >= 13 * 60 && currentTime <= 21 * 60) {
    return { isValid: true, currentShift: 'Ca Chiều Tối (13:00 - 21:00)' };
  }

  return { isValid: true, currentShift: 'Ngoài giờ chính thức' };
};

/**
 * Format money input (remove non-digits, format with commas)
 */
export const formatMoney = (value: string): string => {
  const cleaned = value.replace(/[^\d]/g, '');
  if (!cleaned) return '';
  return parseInt(cleaned).toLocaleString('vi-VN');
};

/**
 * Parse formatted money back to number
 */
export const parseMoney = (value: string): number => {
  const cleaned = value.replace(/[^\d]/g, '');
  return cleaned ? parseInt(cleaned) : 0;
};

/**
 * Validate staff name
 */
export const validateStaffName = (name: string): { isValid: boolean; error?: string } => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Vui lòng nhập tên nhân viên!' };
  }
  
  if (name.trim().length < 2) {
    return { isValid: false, error: 'Tên phải có ít nhất 2 ký tự!' };
  }
  
  if (name.length > 50) {
    return { isValid: false, error: 'Tên không được quá 50 ký tự!' };
  }
  
  return { isValid: true };
};

/**
 * Validate revenue input
 */
export const validateRevenue = (revenue: string): { isValid: boolean; error?: string } => {
  if (!revenue || revenue.trim().length === 0) {
    return { isValid: false, error: 'Vui lòng nhập doanh thu!' };
  }
  
  const amount = parseMoney(revenue);
  
  if (amount <= 0) {
    return { isValid: false, error: 'Doanh thu phải lớn hơn 0!' };
  }
  
  if (amount > 100000000) {
    return { isValid: false, error: 'Doanh thu không hợp lệ (quá 100 triệu)!' };
  }
  
  return { isValid: true };
};

/**
 * Validate cash input
 */
export const validateCash = (cash: string): { isValid: boolean; error?: string } => {
  if (!cash || cash.trim().length === 0) {
    return { isValid: false, error: 'Vui lòng nhập tiền mặt!' };
  }
  
  const amount = parseMoney(cash);
  
  if (amount < 0) {
    return { isValid: false, error: 'Tiền mặt không được âm!' };
  }
  
  if (amount > 50000000) {
    return { isValid: false, error: 'Tiền mặt không hợp lệ (quá 50 triệu)!' };
  }
  
  return { isValid: true };
};

/**
 * Format timestamp to Vietnamese format
 */
export const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

/**
 * Get time difference in hours
 */
export const getTimeDifference = (startTime: string, endTime: string): number => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
};
