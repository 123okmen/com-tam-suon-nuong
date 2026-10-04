import { useEffect, useRef, useState, useMemo } from 'react';
import Chart from 'chart.js/auto';
import LoginGate from '../components/LoginGate';

const API_URL = 'https://script.google.com/macros/s/AKfycbyETg2znWnDrNsgq3G2eB0IJxFeb_GdLKo5N68FkFlJVMvTzdt_M_C3YFzL7fcgiyY1/exec?action=data';

const fmtVND = (v: number) => (v || 0).toLocaleString('vi-VN') + ' đ';

interface StaffPayrollContract {
  id: string;
  name: string;
  phone: string;
  bankName: string;
  accountNumber: string;
  contractCode: string;
  
  bac1Rate: number; // 22.000 đ/h
  bac2Rate: number; // +3.000 đ/h
  bac3Rate: number; // +5.000 đ/h
  extraShiftBonusRate: number; // +30.000 đ/ca (cho ca thứ 26 trở đi)

  shiftsCount: number;
  totalHours: number;
  lateCount: number;
  isFullShifts: boolean;
  isKpiAchieved: boolean;
  hotSalesShifts: number;
  hotSalesBonusPerShift: number;
  
  penalties: number;
  otherBonus: number;
  isPaid: boolean;
}

// Staff list EXCLUDING Khanh (Shareholder/Owner)
// Only actual employees: Nguyen Thi Minh Thu, Le Thi Vy, Tran My Linh
const INITIAL_EMPLOYEE_LIST: Record<string, StaffPayrollContract[]> = {
  '2026-09': [
    {
      id: '1',
      name: 'NGUYỄN THỊ MINH THƯ',
      phone: '0342.872.602',
      bankName: 'MBBank',
      accountNumber: '0704947773',
      contractCode: 'HĐLD-PARTTIME-SAMMIX-THU-2026',
      bac1Rate: 22000,
      bac2Rate: 3000,
      bac3Rate: 5000,
      extraShiftBonusRate: 30000,
      shiftsCount: 9,
      totalHours: 45,
      lateCount: 0,
      isFullShifts: true,
      isKpiAchieved: true,
      hotSalesShifts: 0,
      hotSalesBonusPerShift: 25000,
      penalties: 0,
      otherBonus: 0,
      isPaid: false
    },
    {
      id: '2',
      name: 'THÚY AN',
      phone: '090x.xxx.xxx',
      bankName: 'MBBank',
      accountNumber: '1122334455',
      contractCode: 'HĐTV-PARTTIME-SAMMIX-AN-2026',
      bac1Rate: 22000,
      bac2Rate: 3000,
      bac3Rate: 5000,
      extraShiftBonusRate: 30000,
      shiftsCount: 1,
      totalHours: 5,
      lateCount: 0,
      isFullShifts: false,
      isKpiAchieved: false,
      hotSalesShifts: 0,
      hotSalesBonusPerShift: 25000,
      penalties: 0,
      otherBonus: 0,
      isPaid: false
    }
  ]
};

export default function PlannerPage() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const [payrollMonth, setPayrollMonth] = useState('2026-09');

  const [staffList, setStaffList] = useState<StaffPayrollContract[]>(() => {
    try {
      const saved = localStorage.getItem(`sammix_payroll_${payrollMonth}`);
      return saved ? JSON.parse(saved) : (INITIAL_EMPLOYEE_LIST[payrollMonth] || INITIAL_EMPLOYEE_LIST['2026-09']);
    } catch { 
      return INITIAL_EMPLOYEE_LIST[payrollMonth] || INITIAL_EMPLOYEE_LIST['2026-09']; 
    }
  });

  const [selectedStaffId, setSelectedStaffId] = useState<string>('1');

  // Chart references
  const chGio = useRef<HTMLCanvasElement>(null);
  const chNV = useRef<HTMLCanvasElement>(null);
  const ch7 = useRef<HTMLCanvasElement>(null);
  const chartsRef = useRef<Chart[]>([]);

  // When month changes, load corresponding month data
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`sammix_payroll_${payrollMonth}`);
      if (saved) {
        setStaffList(JSON.parse(saved));
      } else {
        setStaffList(INITIAL_EMPLOYEE_LIST[payrollMonth] || INITIAL_EMPLOYEE_LIST['2026-09']);
      }
    } catch {}
  }, [payrollMonth]);

  // Save changes to current month
  useEffect(() => {
    localStorage.setItem(`sammix_payroll_${payrollMonth}`, JSON.stringify(staffList));
  }, [staffList, payrollMonth]);

  // Fetch real-time dashboard data from Google Sheets API
  const fetchData = async () => {
    try {
      const r = await fetch(API_URL, { headers: { 'Accept': 'application/json' } });
      const d = await r.json();
      if (d && d.ok) {
        setData(d);
        setErr(null);
        setLastUpdate(new Date().toLocaleTimeString('vi-VN'));

        // Tự động đối soát và tính số ca/doanh số thực tế từ Báo Cáo Cuối Ca cho 2 NV: Minh Thư & Thúy An
        if (d.baoCao && Array.isArray(d.baoCao)) {
          const sepBaoCao = d.baoCao.filter((b: any) => (b.ngay || '').endsWith('/09/2026'));
          
          let thuShifts = 0;
          let thuRev = 0;
          let anShifts = 0;
          let anRev = 0;

          sepBaoCao.forEach((b: any) => {
            const nv = (b.nv || '').toLowerCase();
            const rev = Number(b.doanhThu || 0);
            if (nv.includes('thư')) {
              thuShifts += 1;
              thuRev += rev;
            } else if (nv.includes('an')) {
              anShifts += 1;
              anRev += rev;
            }
          });

          setStaffList(prev => prev.map(s => {
            if (s.name.includes('MINH THƯ')) {
              return {
                ...s,
                shiftsCount: thuShifts > 0 ? thuShifts : s.shiftsCount,
                totalHours: (thuShifts > 0 ? thuShifts : s.shiftsCount) * 5,
                isFullShifts: (thuShifts >= 20 || thuShifts * 5 >= 90),
                isKpiAchieved: thuShifts > 0 ? (thuRev / thuShifts) >= 350000 : s.isKpiAchieved
              };
            }
            if (s.name.includes('THÚY AN')) {
              return {
                ...s,
                shiftsCount: anShifts > 0 ? anShifts : s.shiftsCount,
                totalHours: (anShifts > 0 ? anShifts : s.shiftsCount) * 5,
                isFullShifts: (anShifts >= 20 || anShifts * 5 >= 90),
                isKpiAchieved: anShifts > 0 ? (anRev / anShifts) >= 350000 : s.isKpiAchieved
              };
            }
            return s;
          }));
        }
      }
    } catch (e: any) {
      setErr('Kết nối Google Sheets: ' + e.message);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 30000);
    return () => clearInterval(timer);
  }, []);

  // Render Charts
  useEffect(() => {
    chartsRef.current.forEach(c => c.destroy());
    chartsRef.current = [];

    if (!data) return;

    // Filter out Khanh from staff charts if present
    let filteredNvNames: string[] = [];
    let filteredNvVals: number[] = [];
    let filteredNvDonVals: number[] = [];

    if (data.nv && data.nv.names) {
      data.nv.names.forEach((name: string, i: number) => {
        if (!name.toLowerCase().includes('khanh')) {
          filteredNvNames.push(name);
          filteredNvVals.push(data.nv.vals?.[i] || 0);
          filteredNvDonVals.push(data.nv.donVals?.[i] || 0);
        }
      });
    }

    if (chGio.current && data.gio) {
      const c1 = new Chart(chGio.current, {
        type: 'line',
        data: {
          labels: data.gio.keys || [],
          datasets: [{
            label: 'Doanh thu (VNĐ)',
            data: data.gio.vals || [],
            borderColor: '#2ecc71',
            backgroundColor: 'rgba(46, 204, 113, 0.15)',
            fill: true,
            tension: 0.4
          }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
      chartsRef.current.push(c1);
    }

    if (chNV.current) {
      const c2 = new Chart(chNV.current, {
        type: 'bar',
        data: {
          labels: filteredNvNames.length ? filteredNvNames : ['Minh Thư', 'Lê Vy', 'Mỹ Linh'],
          datasets: [
            { label: 'Doanh thu NV', data: filteredNvVals.length ? filteredNvVals : [8800000, 6500000, 7200000], backgroundColor: '#3498db', borderRadius: 6 },
            { label: 'Số đơn NV', data: filteredNvDonVals.length ? filteredNvDonVals : [220, 160, 180], backgroundColor: '#f1c40f', borderRadius: 6 }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
      chartsRef.current.push(c2);
    }

    if (ch7.current && data.ngay) {
      const c3 = new Chart(ch7.current, {
        type: 'bar',
        data: {
          labels: data.ngay.keys || [],
          datasets: [{
            label: 'Doanh thu 7 ngày',
            data: data.ngay.vals || [],
            backgroundColor: '#e74c3c',
            borderRadius: 6
          }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
      chartsRef.current.push(c3);
    }
  }, [data]);

  const activeStaff = useMemo(() => {
    return staffList.find(s => s.id === selectedStaffId) || staffList[0];
  }, [staffList, selectedStaffId]);

  // Salary calculation
  const calcContractSalary = (s: StaffPayrollContract) => {
    const bac1Amount = s.totalHours * s.bac1Rate;
    const isBac2Qualified = s.isFullShifts && s.shiftsCount >= 20 && s.lateCount <= 3;
    const bac2Amount = isBac2Qualified ? s.totalHours * s.bac2Rate : 0;
    const isBac3Qualified = isBac2Qualified && s.isKpiAchieved;
    const bac3Amount = isBac3Qualified ? s.totalHours * s.bac3Rate : 0;

    const effectiveHourlyRate = s.bac1Rate + (isBac2Qualified ? s.bac2Rate : 0) + (isBac3Qualified ? s.bac3Rate : 0);
    const extraShiftsCount = Math.max(0, s.shiftsCount - 25);
    const extraShiftBonusAmount = extraShiftsCount * s.extraShiftBonusRate;
    const hotSalesBonusAmount = s.hotSalesShifts * s.hotSalesBonusPerShift;
    const totalEarnings = bac1Amount + bac2Amount + bac3Amount + extraShiftBonusAmount + hotSalesBonusAmount + s.otherBonus;
    const netSalary = Math.max(0, totalEarnings - s.penalties);

    return {
      bac1Amount,
      bac2Amount,
      isBac2Qualified,
      bac3Amount,
      isBac3Qualified,
      effectiveHourlyRate,
      extraShiftsCount,
      extraShiftBonusAmount,
      hotSalesBonusAmount,
      totalEarnings,
      netSalary
    };
  };

  const currentCalc = calcContractSalary(activeStaff);

  const totalPayrollAllStaff = useMemo(() => {
    return staffList.reduce((acc, s) => acc + calcContractSalary(s).netSalary, 0);
  }, [staffList]);

  const updateActiveStaff = (fields: Partial<StaffPayrollContract>) => {
    setStaffList(prev => prev.map(s => s.id === selectedStaffId ? { ...s, ...fields } : s));
  };

  const togglePaidStatus = (id: string) => {
    setStaffList(prev => prev.map(s => s.id === id ? { ...s, isPaid: !s.isPaid } : s));
  };

  return (
    <LoginGate expectedPassword="sammixgymer" storageKey="auth_planner" title="Khu Vực Quản Lý Cổ Đông">
      <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif', color: '#fff' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.08)', padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h1 style={{ margin: 0, color: '#f1c40f', fontSize: '2rem' }}>📜 BẢNG LƯƠNG NHÂN VIÊN CA (ĐỒNG BỘ CHẤM CÔNG & ĐƠN HÀNG)</h1>
          <p style={{ margin: '8px 0 0 0', opacity: 0.8, fontSize: '0.95rem' }}>
            Chốt Lương Ngày 05 Hàng Tháng | Đã Thanh Toán Hết Đến 05/09 | Khánh (Cổ Đông) Không Tính Vào Lương NV
          </p>
          <div style={{ display: 'inline-block', background: '#27ae60', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', marginTop: '10px' }}>
            🟢 LIVE - Đồng bộ dữ liệu Đơn hàng & Chấm công Real-time {lastUpdate && `(${lastUpdate})`}
          </div>
        </div>

        {err && (
          <div style={{ background: '#e74c3c', padding: '12px', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center', fontWeight: 'bold' }}>
            ⚠️ {err}
          </div>
        )}

        {/* 4 KPI Cards Realtime */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1.2rem', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.15)' }}>
            <div style={{ fontSize: '0.85rem', opacity: 0.8, textTransform: 'uppercase' }}>Doanh Thu Hôm Nay</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#2ecc71', marginTop: '6px' }}>
              {data ? fmtVND(data.kpi?.doanhThu) : '---'}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1.2rem', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.15)' }}>
            <div style={{ fontSize: '0.85rem', opacity: 0.8, textTransform: 'uppercase' }}>Tiền Mặt Tại Quầy</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#f1c40f', marginTop: '6px' }}>
              {data ? fmtVND(data.kpi?.tienMat) : '---'}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1.2rem', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.15)' }}>
            <div style={{ fontSize: '0.85rem', opacity: 0.8, textTransform: 'uppercase' }}>Số Đơn Hàng</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#3498db', marginTop: '6px' }}>
              {data ? `${data.kpi?.soDon || 0} đơn` : '---'}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1.2rem', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.15)' }}>
            <div style={{ fontSize: '0.85rem', opacity: 0.8, textTransform: 'uppercase' }}>Tổng Số Món Bán</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#e74c3c', marginTop: '6px' }}>
              {data ? `${data.kpi?.soMon || 0} ly` : '---'}
            </div>
          </div>
        </div>

        {/* BẢNG TÍNH LƯƠNG CHUẨN ĐIỀU KHOẢN HỢP ĐỒNG 3 BẬC */}
        <div style={{ background: 'rgba(255,255,255,0.09)', padding: '1.8rem', borderRadius: '16px', border: '2px solid #f1c40f', marginBottom: '2rem', backdropFilter: 'blur(10px)' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '1.5rem', borderBottom: '2px solid rgba(241,196,15,0.4)', paddingBottom: '1rem' }}>
            <div>
              <h2 style={{ color: '#f1c40f', margin: 0, fontSize: '1.5rem' }}>🎯 BẢNG LƯƠNG 3 BẬC HÀNG THÁNG (ĐÃ T/TOÁN ĐẾN 05/09)</h2>
              <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>Chuyển khoản trực tiếp STK MBBank 0704947773 (Nguyễn Thị Minh Thư) từ 05 - 07 hàng tháng</span>
            </div>

            {/* Selector Tháng Lương từ Tháng 6 */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '10px', border: '1px solid #f1c40f' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#f1c40f' }}>📅 Chọn Tháng Lương:</label>
              <select
                value={payrollMonth}
                onChange={(e) => setPayrollMonth(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #f1c40f', background: '#2c3e50', color: '#fff', fontWeight: 'bold', fontSize: '0.95rem' }}
              >
                <option value="2026-06">Tháng 06 / 2026 (✅ Đã thanh toán 05/07)</option>
                <option value="2026-07">Tháng 07 / 2026 (✅ Đã thanh toán 05/08)</option>
                <option value="2026-08">Tháng 08 / 2026 (✅ Đã thanh toán 05/09)</option>
                <option value="2026-09">Tháng 09 / 2026 (✅ Đã chốt & Thanh toán đợt 1)</option>
              </select>
            </div>
          </div>

          {/* Calculator Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            
            {/* Form chỉnh thông số theo Hợp đồng */}
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1.2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#3498db', fontSize: '1.1rem' }}>⚙️ Thông Tin Nhân Viên & Dữ Liệu Chấm Công</h3>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', opacity: 0.9 }}>Danh Sách Nhân Viên (Không bao gồm Cổ đông):</label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#34495e', color: '#fff', border: '1px solid #3498db', fontWeight: 'bold', fontSize: '0.95rem' }}
                >
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.contractCode})</option>
                  ))}
                </select>
              </div>

              {/* Thông tin HĐ & Tài khoản ngân hàng */}
              <div style={{ background: 'rgba(52, 152, 219, 0.15)', padding: '10px 12px', borderRadius: '8px', border: '1px solid #3498db', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <div><strong>Mã Hợp Đồng:</strong> {activeStaff.contractCode}</div>
                <div><strong>SĐT Nhân Viên:</strong> {activeStaff.phone}</div>
                <div><strong>STK Nhận Lương:</strong> <span style={{ color: '#f1c40f', fontWeight: 'bold' }}>{activeStaff.accountNumber}</span> ({activeStaff.bankName})</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '0.8rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.8 }}>Số ca làm việc (ca):</label>
                  <input
                    type="number"
                    value={activeStaff.shiftsCount}
                    onChange={(e) => updateActiveStaff({ shiftsCount: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #555', background: '#2c3e50', color: '#fff', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.8 }}>Tổng số giờ làm (h):</label>
                  <input
                    type="number"
                    value={activeStaff.totalHours}
                    onChange={(e) => updateActiveStaff({ totalHours: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #555', background: '#2c3e50', color: '#fff', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Checkbox điều kiện Bậc 2 & Bậc 3 */}
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer', marginBottom: '6px' }}>
                  <input
                    type="checkbox"
                    checked={activeStaff.isFullShifts}
                    onChange={(e) => updateActiveStaff({ isFullShifts: e.target.checked })}
                  />
                  <span><strong>BẬC 2 (+3.000đ/h):</strong> Đạt ≥ 20 ca/tháng & Trễ ≤ 3 lần</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={activeStaff.isKpiAchieved}
                    onChange={(e) => updateActiveStaff({ isKpiAchieved: e.target.checked })}
                  />
                  <span><strong>BẬC 3 (+5.000đ/h):</strong> Đạt KPI Doanh số (≥350k/ca) & Vận hành</span>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '0.8rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.8 }}>Số ca bán tốt (&gt;500k):</label>
                  <input
                    type="number"
                    value={activeStaff.hotSalesShifts}
                    onChange={(e) => updateActiveStaff({ hotSalesShifts: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #555', background: '#2c3e50', color: '#fff', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.8 }}>Số lần đi trễ:</label>
                  <input
                    type="number"
                    value={activeStaff.lateCount}
                    onChange={(e) => updateActiveStaff({ lateCount: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #555', background: '#2c3e50', color: '#fff', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#e74c3c' }}>Tiền phạt vi phạm HĐ:</label>
                  <input
                    type="number"
                    value={activeStaff.penalties}
                    onChange={(e) => updateActiveStaff({ penalties: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e74c3c', background: '#2c3e50', color: '#fff', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#2ecc71' }}>Thưởng khác / Lễ Tết:</label>
                  <input
                    type="number"
                    value={activeStaff.otherBonus}
                    onChange={(e) => updateActiveStaff({ otherBonus: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #2ecc71', background: '#2c3e50', color: '#fff', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>

            {/* Phiếu lương chi tiết 3 Bậc theo Hợp đồng */}
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.2rem', borderRadius: '12px', border: '1px solid #2ecc71', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px dashed rgba(255,255,255,0.2)', paddingBottom: '0.8rem' }}>
                  <h3 style={{ margin: 0, color: '#2ecc71', fontSize: '1.2rem' }}>🧾 Phiếu Lương Chi Tiết</h3>
                  <span style={{ fontSize: '0.85rem', background: '#27ae60', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>Tháng {payrollMonth}</span>
                </div>

                <div style={{ fontSize: '0.9rem', lineHeight: '1.8' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Họ & Tên Nhân Viên:</span>
                    <strong style={{ color: '#f1c40f', fontSize: '1rem' }}>{activeStaff.name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', opacity: 0.85 }}>
                    <span>STK Nhận Lương ({activeStaff.bankName}):</span>
                    <span style={{ fontWeight: 'bold', color: '#3498db' }}>{activeStaff.accountNumber}</span>
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '8px 0' }} />

                  {/* 3 BẬC LƯƠNG */}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>BẬC 1: Lương cứng ({activeStaff.totalHours}h x 22.000đ/h):</span>
                    <strong>{fmtVND(currentCalc.bac1Amount)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>BẬC 2: Phụ cấp Đủ ca & Chuyên cần (+3k/h):</span>
                    <span style={{ color: currentCalc.isBac2Qualified ? '#2ecc71' : '#888' }}>
                      {currentCalc.isBac2Qualified ? `+${fmtVND(currentCalc.bac2Amount)}` : '❌ Chưa đạt (Cần ≥20 ca)'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>BẬC 3: Thưởng hiệu suất KPI (+5k/h):</span>
                    <span style={{ color: currentCalc.isBac3Qualified ? '#2ecc71' : '#888' }}>
                      {currentCalc.isBac3Qualified ? `+${fmtVND(currentCalc.bac3Amount)}` : '❌ Chưa đạt KPI'}
                    </span>
                  </div>

                  <div style={{ background: 'rgba(241, 196, 15, 0.1)', padding: '4px 8px', borderRadius: '6px', margin: '6px 0', fontSize: '0.85rem' }}>
                    <strong>Mức lương thực đạt:</strong> <span style={{ color: '#f1c40f', fontWeight: 'bold' }}>{fmtVND(currentCalc.effectiveHourlyRate)}/giờ</span> (Mục tiêu 30.000đ/h)
                  </div>

                  {/* THƯỞNG VƯỢT CA & KHÁC */}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Thưởng vượt mốc 25 ca ({currentCalc.extraShiftsCount} ca x 30k/ca):</span>
                    <span style={{ color: '#2ecc71' }}>+{fmtVND(currentCalc.extraShiftBonusAmount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Thưởng nóng ca bán tốt &gt;500k ({activeStaff.hotSalesShifts} ca):</span>
                    <span style={{ color: '#2ecc71' }}>+{fmtVND(currentCalc.hotSalesBonusAmount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Thưởng khác / Làm lễ Tết:</span>
                    <span style={{ color: '#2ecc71' }}>+{fmtVND(activeStaff.otherBonus)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Trừ phạt vi phạm HĐ / Đi trễ:</span>
                    <span style={{ color: '#e74c3c' }}>-{fmtVND(activeStaff.penalties)}</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1rem', background: 'rgba(46, 204, 113, 0.15)', padding: '1rem', borderRadius: '10px', border: '1px solid #2ecc71', textAlign: 'center' }}>
                <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', opacity: 0.9 }}>👉 TỔNG THỰC LĨNH CHUYỂN KHOẢN (ĐÃ THANH TOÁN TẤT CẢ THÁNG NÀY)</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2ecc71', marginTop: '4px' }}>
                  {fmtVND(currentCalc.netSalary)}
                </div>
                <button
                  type="button"
                  onClick={() => togglePaidStatus(activeStaff.id)}
                  style={{ marginTop: '8px', padding: '6px 16px', borderRadius: '6px', border: 'none', background: activeStaff.isPaid ? '#27ae60' : '#e67e22', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {activeStaff.isPaid ? '✅ Đã Thanh Toán Lương (Đã chốt sổ)' : '⏳ Chưa CK (Bấm xác nhận đã chuyển)'}
                </button>
              </div>
            </div>

          </div>

          {/* BẢNG TỔNG HỢP TOÀN BỘ QUỸ LƯƠNG HỢP ĐỒNG */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ margin: 0, color: '#f1c40f', fontSize: '1.1rem' }}>📋 BẢNG TỔNG HỢP QUỸ LƯƠNG NHÂN VIÊN THÁNG {payrollMonth}</h3>
              <div style={{ fontSize: '1rem', fontWeight: 'bold', background: '#27ae60', padding: '6px 12px', borderRadius: '8px' }}>
                Tổng Chi Lương NV Tháng {payrollMonth}: {fmtVND(totalPayrollAllStaff)}
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: 'rgba(0,0,0,0.3)', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#2c3e50', color: '#f1c40f', borderBottom: '2px solid #555' }}>
                    <th style={{ padding: '8px', border: '1px solid #444' }}>Nhân Viên</th>
                    <th style={{ padding: '8px', border: '1px solid #444' }}>Số Ca / Giờ</th>
                    <th style={{ padding: '8px', border: '1px solid #444' }}>Đơn Giá h (Mục tiêu 30k)</th>
                    <th style={{ padding: '8px', border: '1px solid #444' }}>Lương Lũy Tiến</th>
                    <th style={{ padding: '8px', border: '1px solid #444' }}>Thưởng Vượt Ca/Nóng</th>
                    <th style={{ padding: '8px', border: '1px solid #444' }}>Trừ Phạt</th>
                    <th style={{ padding: '8px', border: '1px solid #444' }}>Thực Lĩnh (CK)</th>
                    <th style={{ padding: '8px', border: '1px solid #444', textAlign: 'center' }}>Trạng Thái CK MBBank</th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.map(s => {
                    const c = calcContractSalary(s);
                    return (
                      <tr key={s.id} style={{ background: selectedStaffId === s.id ? 'rgba(241, 196, 15, 0.15)' : 'transparent', borderBottom: '1px solid #444' }}>
                        <td style={{ padding: '8px', border: '1px solid #444', fontWeight: 'bold', color: '#fff', cursor: 'pointer' }} onClick={() => setSelectedStaffId(s.id)}>
                          {s.name}
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #444' }}>{s.shiftsCount} ca ({s.totalHours}h)</td>
                        <td style={{ padding: '8px', border: '1px solid #444', color: '#f1c40f', fontWeight: 'bold' }}>{fmtVND(c.effectiveHourlyRate)}/h</td>
                        <td style={{ padding: '8px', border: '1px solid #444' }}>{fmtVND(c.bac1Amount + c.bac2Amount + c.bac3Amount)}</td>
                        <td style={{ padding: '8px', border: '1px solid #444', color: '#2ecc71' }}>+{fmtVND(c.extraShiftBonusAmount + c.hotSalesBonusAmount + s.otherBonus)}</td>
                        <td style={{ padding: '8px', border: '1px solid #444', color: '#e74c3c' }}>-{fmtVND(s.penalties)}</td>
                        <td style={{ padding: '8px', border: '1px solid #444', fontWeight: 'bold', color: '#2ecc71', fontSize: '0.95rem' }}>{fmtVND(c.netSalary)}</td>
                        <td style={{ padding: '8px', border: '1px solid #444', textAlign: 'center', fontSize: '0.8rem' }}>
                          <span style={{ color: '#27ae60', fontWeight: 'bold' }}>✅ Đã Thanh Toán</span> ({s.accountNumber})
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Charts Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.08)', padding: '1.2rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.12)' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#2ecc71', fontSize: '1.1rem' }}>📈 Doanh Thu Theo Giờ Hôm Nay</h3>
            <div style={{ height: '240px', position: 'relative' }}>
              <canvas ref={chGio}></canvas>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.08)', padding: '1.2rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.12)' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#3498db', fontSize: '1.1rem' }}>👥 Doanh Thu & Số Đơn Theo Nhân Viên (Không tính Cổ Đông)</h3>
            <div style={{ height: '240px', position: 'relative' }}>
              <canvas ref={chNV}></canvas>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.08)', padding: '1.2rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.12)' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#e74c3c', fontSize: '1.1rem' }}>📊 Doanh Thu 7 Ngày Gần Nhất</h3>
            <div style={{ height: '240px', position: 'relative' }}>
              <canvas ref={ch7}></canvas>
            </div>
          </div>
        </div>

      </div>
    </LoginGate>
  );
}
