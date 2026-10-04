const fs = require('fs');
const path = require('path');

const code = `import { useEffect, useRef, useState, useMemo } from 'react';
import Chart from 'chart.js/auto';
import LoginGate from '../components/LoginGate';

const API_URL = 'https://script.google.com/macros/s/AKfycbyETg2znWnDrNsgq3G2eB0IJxFeb_GdLKo5N68FkFlJVMvTzdt_M_C3YFzL7fcgiyY1/exec?action=data';

const fmt = (v: number) => (v || 0).toLocaleString('vi-VN') + ' đ';

export default function PlannerPage() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Phân hệ tính lương state (Hợp đồng Nguyễn Thị Minh Thư)
  const [payrollMonth, setPayrollMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedStaff, setSelectedStaff] = useState('Nguyễn Thị Minh Thư');
  const [manualShiftsCount, setManualShiftsCount] = useState(22);
  const [manualTotalHours, setManualTotalHours] = useState(110);
  const [manualOrdersCount, setManualOrdersCount] = useState(245);
  const [manualTotalRev, setManualTotalRev] = useState(8800000);
  const [manualLateCount, setManualLateCount] = useState(0);
  const [manualHotShifts, setManualHotShifts] = useState(3);
  const [manualPenalties, setManualPenalties] = useState(0);
  const [manualExtraBonus, setManualExtraBonus] = useState(0);

  const chGio = useRef<HTMLCanvasElement>(null);
  const chNV = useRef<HTMLCanvasElement>(null);
  const ch7 = useRef<HTMLCanvasElement>(null);
  const chartsRef = useRef<Chart[]>([]);

  const load = async () => {
    try {
      const r = await fetch(API_URL);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      if (!j.ok) throw new Error(j.msg || 'Lỗi API');
      setData(j);
      setErr(null);
      setLastUpdate(new Date().toLocaleTimeString('vi-VN'));

      if (j.nv && j.nv.names && j.nv.names.length > 0) {
        const idx = j.nv.names.findIndex((n: string) => n.toLowerCase().includes('thư') || n.toLowerCase().includes('minh thư'));
        if (idx !== -1) {
          if (j.nv.vals && j.nv.vals[idx]) setManualTotalRev(j.nv.vals[idx]);
          if (j.nv.don && j.nv.don[idx]) setManualOrdersCount(j.nv.don[idx]);
        }
      }
    } catch (e: any) {
      setErr(e.message || 'Không tải được dữ liệu');
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!data) return;
    chartsRef.current.forEach(c => c.destroy());
    chartsRef.current = [];

    const gio = data.gio || { keys: [], vals: [] };
    const nv = data.nv || { names: [], vals: [], don: [] };
    const ngay = data.ngay || { keys: [], vals: [] };

    const mk = (el: HTMLCanvasElement | null, cfg: any) => {
      if (!el) return;
      chartsRef.current.push(new Chart(el, cfg));
    };

    mk(chGio.current, {
      type: 'line',
      data: { labels: gio.keys, datasets: [{ label: 'Doanh thu', data: gio.vals, borderColor: '#69f0ae', backgroundColor: 'rgba(105,240,174,.15)', fill: true, tension: .4, pointRadius: 4 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#cfd8dc' } }, tooltip: { callbacks: { label: (c: any) => ' ' + fmt(c.parsed.y) } } }, scales: { x: { ticks: { color: '#cfd8dc' } }, y: { ticks: { color: '#cfd8dc', callback: (v: any) => (v / 1000) + 'k' } } } }
    });

    mk(chNV.current, {
      type: 'bar',
      data: { labels: nv.names, datasets: [
        { label: 'Doanh thu', data: nv.vals, backgroundColor: '#40c4ff', borderRadius: 6 },
        { label: 'Số đơn', data: nv.don, backgroundColor: '#ffd740', borderRadius: 6 }
      ] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#cfd8dc' } }, tooltip: { callbacks: { label: (c: any) => c.dataset.label + ': ' + (c.dataset.label === 'Doanh thu' ? fmt(c.parsed.y) : c.parsed.y + ' đơn') } } }, scales: { x: { ticks: { color: '#cfd8dc' } }, y: { ticks: { color: '#cfd8dc', callback: (v: any) => (v / 1000) + 'k' } } } }
    });

    mk(ch7.current, {
      type: 'bar',
      data: { labels: ngay.keys, datasets: [{ label: 'Doanh thu', data: ngay.vals, backgroundColor: '#ff80ab', borderRadius: 6 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#cfd8dc' } }, tooltip: { callbacks: { label: (c: any) => ' ' + fmt(c.parsed.y) } } }, scales: { x: { ticks: { color: '#cfd8dc' } }, y: { ticks: { color: '#cfd8dc', callback: (v: any) => (v / 1000) + 'k' } } } }
    });
  }, [data]);

  const payrollResult = useMemo(() => {
    const hours = manualTotalHours || (manualShiftsCount * 5);
    const avgRevShift = manualShiftsCount > 0 ? manualTotalRev / manualShiftsCount : 0;
    
    const baseRate = 22000;
    const basePay = hours * baseRate;

    const isDiligenceQualified = (manualShiftsCount >= 20 || hours >= 90) && manualLateCount <= 3;
    const diligenceRate = isDiligenceQualified ? 3000 : 0;
    const diligencePay = hours * diligenceRate;

    const isKpiQualified = isDiligenceQualified && (avgRevShift >= 350000);
    const kpiRate = isKpiQualified ? 5000 : 0;
    const kpiPay = hours * kpiRate;

    const over25Shifts = Math.max(0, manualShiftsCount - 25);
    const over25Pay = over25Shifts * 30000;

    const hotBonusesAmount = manualHotShifts * 25000;

    const totalGross = basePay + diligencePay + kpiPay + over25Pay + hotBonusesAmount + manualExtraBonus;

    const netPay = totalGross - manualPenalties;
    const effRate = hours > 0 ? netPay / hours : 0;

    return {
      name: selectedStaff, month: payrollMonth, shiftsCount: manualShiftsCount, totalHours: hours,
      ordersCount: manualOrdersCount, totalRevenue: manualTotalRev, avgRevenuePerShift: avgRevShift,
      lateCount: manualLateCount, baseRate, diligenceBonusRate: diligenceRate, kpiBonusRate: kpiRate,
      isDiligenceQualified, isKpiQualified, over25ShiftsBonus: 30000, hotBonusesCount: manualHotShifts,
      hotBonusesAmount, basePay, diligencePay, kpiPay, over25Pay, totalGrossPay: totalGross,
      penalties: manualPenalties, finalNetPay: netPay, effectiveHourlyRate: effRate
    };
  }, [selectedStaff, payrollMonth, manualShiftsCount, manualTotalHours, manualOrdersCount, manualTotalRev, manualLateCount, manualHotShifts, manualPenalties, manualExtraBonus]);

  return (
    <LoginGate expectedPassword="sammixgymer" storageKey="auth_planner" title="Khu Vực Cổ Đông">
      <div style={{ padding: '1.5rem', maxWidth: 1080, margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: '1.5rem', position: 'relative' }}>
          <h1 style={{ fontSize: '2rem', margin: '0 0 0.3rem 0', color: '#10b981' }}>🧃 Sâm Mix — Báo Cáo Cổ Đông</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '0.8rem' }}>
            Doanh thu real-time · Phân hệ Tính Lương Nhân Viên {lastUpdate ? '· Cập nhật ' + lastUpdate : ''}
          </p>
          <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <span style={{ background: '#00c853', color: '#fff', padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 'bold' }}>🟢 LIVE — tự động cập nhật 30s</span>
          </div>
        </header>

        {err ? <div style={{ background: 'rgba(239,68,68,.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '10px 14px', borderRadius: 10, marginBottom: '
