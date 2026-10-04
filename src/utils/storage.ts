/**
 * Storage utility for managing shift data persistently
 */

export interface ShiftData {
  name: string;
  action: 'checkin' | 'checkout';
  timestamp: string;
  date: string;
  status: 'active' | 'completed';
}

export interface ReportData {
  name: string;
  revenue: string;
  cash: string;
  note: string;
  timestamp: string;
  date: string;
}

export const ShiftStorage = {
  /**
   * Save check-in/check-out data
   */
  saveShift: (name: string, action: 'checkin' | 'checkout'): ShiftData => {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const timestamp = now.toISOString();
    
    const data: ShiftData = {
      name,
      action,
      timestamp,
      date,
      status: action === 'checkin' ? 'active' : 'completed'
    };
    
    const key = `shift_${date}_${name}_${action}`;
    localStorage.setItem(key, JSON.stringify(data));
    
    // Update current shift status
    if (action === 'checkin') {
      localStorage.setItem(`current_shift_${name}`, JSON.stringify(data));
    } else {
      localStorage.removeItem(`current_shift_${name}`);
    }
    
    return data;
  },

  /**
   * Get current shift status for a staff member
   */
  getCurrentShift: (name: string): ShiftData | null => {
    const data = localStorage.getItem(`current_shift_${name}`);
    return data ? JSON.parse(data) : null;
  },

  /**
   * Get all shifts for today
   */
  getTodayShifts: (): ShiftData[] => {
    const today = new Date().toISOString().split('T')[0];
    const shifts: ShiftData[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`shift_${today}_`)) {
        const data = localStorage.getItem(key);
        if (data) shifts.push(JSON.parse(data));
      }
    }
    
    return shifts.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  },

  /**
   * Get shifts by date range
   */
  getShiftsByDate: (startDate: string, endDate: string): ShiftData[] => {
    const shifts: ShiftData[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('shift_')) {
        const data = localStorage.getItem(key);
        if (data) {
          const shift = JSON.parse(data);
          if (shift.date >= startDate && shift.date <= endDate) {
            shifts.push(shift);
          }
        }
      }
    }
    
    return shifts.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  },

  /**
   * Get active staff members
   */
  getActiveStaff: (): string[] => {
    const activeStaff: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('current_shift_')) {
        const name = key.replace('current_shift_', '');
        activeStaff.push(name);
      }
    }
    
    return activeStaff;
  }
};

export const ReportStorage = {
  /**
   * Save report data
   */
  saveReport: (report: Omit<ReportData, 'timestamp' | 'date'>): ReportData => {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const timestamp = now.toISOString();
    
    const data: ReportData = {
      ...report,
      timestamp,
      date
    };
    
    const key = `report_${date}_${timestamp}_${report.name}`;
    localStorage.setItem(key, JSON.stringify(data));
    
    return data;
  },

  /**
   * Get all reports for today
   */
  getTodayReports: (): ReportData[] => {
    const today = new Date().toISOString().split('T')[0];
    const reports: ReportData[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`report_${today}_`)) {
        const data = localStorage.getItem(key);
        if (data) reports.push(JSON.parse(data));
      }
    }
    
    return reports.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  },

  /**
   * Get reports by date range
   */
  getReportsByDate: (startDate: string, endDate: string): ReportData[] => {
    const reports: ReportData[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('report_')) {
        const data = localStorage.getItem(key);
        if (data) {
          const report = JSON.parse(data);
          if (report.date >= startDate && report.date <= endDate) {
            reports.push(report);
          }
        }
      }
    }
    
    return reports.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }
};
