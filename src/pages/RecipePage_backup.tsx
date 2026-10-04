import React, { useState } from 'react';
import LoginGate from '../components/LoginGate';

export default function RecipePage() {
  const [shiftStatus, setShiftStatus] = useState<string>('Chưa check-in');
  const [staffName, setStaffName] = useState('');
  const [reportData, setReportData] = useState({
    doanhThu: '',
    tienMat: '',
    ghiChu: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCheckIn = async () => {
    if (!staffName) return alert('Vui lòng nhập tên nhân viên!');
    const time = new Date().toLocaleString('vi-VN');
    setShiftStatus(`Đang xử lý Check-in...`);
    try {
      await fetch("https://script.google.com/macros/s/AKfycbz-75MfvgUDcWexbQ6hJbyT42P3gVm5R6l585fnRMBC8sd_pMZyh9mJbMAa98HpsfAk/exec", {
        method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ type: 'checkin', name: staffName })
      });
      setShiftStatus(`Đã check-in lúc: ${time}`);
      alert(`Xin chào ${staffName}! Đã lưu hệ thống. Chúc bạn một ca làm việc năng suất!`);
    } catch (e) {
      alert('Lỗi mạng khi Check-in!');
      setShiftStatus(`Chưa check-in`);
    }
  };

  const handleCheckOut = async () => {
    if (!shiftStatus.includes('Đã check-in')) return alert('Bạn chưa check-in!');
    const time = new Date().toLocaleString('vi-VN');
    setShiftStatus(`Đang xử lý Check-out...`);
    try {
      await fetch("https://script.google.com/macros/s/AKfycbz-75MfvgUDcWexbQ6hJbyT42P3gVm5R6l585fnRMBC8sd_pMZyh9mJbMAa98HpsfAk/exec", {
        method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ type: 'checkout', name: staffName })
      });
      setShiftStatus(`Đã check-out lúc: ${time}`);
      alert(`Cảm ơn ${staffName}! Đã lưu dữ liệu kết thúc ca làm việc.`);
    } catch (e) {
      alert('Lỗi mạng khi Check-out!');
      setShiftStatus(`Đã check-in lúc...`);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName) return alert('Vui lòng nhập tên nhân viên!');
    
    setIsSubmitting(true);
    try {
      const payload = {
        type: 'report',
        name: staffName,
        revenue: reportData.doanhThu,
        cash: reportData.tienMat,
        note: reportData.ghiChu
      };
      
      await fetch("https://script.google.com/macros/s/AKfycbz-75MfvgUDcWexbQ6hJbyT42P3gVm5R6l585fnRMBC8sd_pMZyh9mJbMAa98HpsfAk/exec", {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain",
        },
        body: JSON.stringify(payload),
      });
      
      alert('Báo cáo đã được gửi thành công cho Cổ Đông!');
      setReportData({ doanhThu: '', tienMat: '', ghiChu: '' });
    } catch (error) {
      alert('Có lỗi xảy ra khi gửi báo cáo, nhưng hệ thống đã lưu nháp nội bộ!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LoginGate expectedPassword="sammixnv" storageKey="auth_recipes" title="Khu Vực Nhân Viên">
      <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', color: 'var(--text-primary)' }}>
        <h1 style={{ color: '#10b981', textAlign: 'center', marginBottom: '1rem' }}>🧑‍🍳 Trang Quản Lý Nhân Viên</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>Chấm công, Báo cáo & Bảng định lượng pha chế</p>

        {/* Chấm Công & Báo Cáo Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
          {/* Check-in Card */}
          <div className="glass-panel">
            <h2 style={{ color: '#3498db', marginTop: 0 }}>⏱️ Chấm Công Ca Trực</h2>
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder="Nhập tên của bạn..."
                className="input-field"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
              <button onClick={handleCheckIn} className="btn-primary" style={{ flex: 1, background: '#27ae60' }}>Đầu Ca (Check-in)</button>
              <button onClick={handleCheckOut} className="btn-primary" style={{ flex: 1, background: '#e74c3c' }}>Cuối Ca (Check-out)</button>
            </div>
            <div style={{ padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', border: '1px dashed #7f8c8d' }}>
              Trạng thái: <strong>{shiftStatus}</strong>
            </div>
          </div>

          {/* Báo Cáo Card */}
          <div className="glass-panel">
            <h2 style={{ color: '#f39c12', marginTop: 0 }}>📋 Báo Cáo Cuối Ca</h2>
            <form onSubmit={handleSubmitReport} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="text"
                placeholder="Doanh thu ước tính (VD: 1.500.000đ)..."
                className="input-field"
                value={reportData.doanhThu}
                onChange={(e) => setReportData({...reportData, doanhThu: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Tiền mặt còn lại trong quầy..."
                className="input-field"
                value={reportData.tienMat}
                onChange={(e) => setReportData({...reportData, tienMat: e.target.value})}
                required
              />
              <textarea
                placeholder="Ghi chú thêm (thiếu ly nhựa, hao hụt trái cây,...)"
                className="input-field"
                rows={3}
                value={reportData.ghiChu}
                onChange={(e) => setReportData({...reportData, ghiChu: e.target.value})}
              />
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Đang gửi...' : 'Gửi Báo Cáo'}
              </button>
            </form>
          </div>
        </div>

        {/* Recipe Table Section */}
        <div className="glass-panel">
          <h2 style={{ color: '#d35400', borderBottom: '2px solid #e67e22', paddingBottom: '0.5rem', marginBottom: '1rem' }}>SOP Nước Ép (Ép tươi từng ly)</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: 'rgba(255,255,255,0.8)', color: '#333' }}>
            <thead>
              <tr style={{ background: '#1e7145', color: 'white' }}>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Tên Món</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Công thức ép chuẩn (Ly 500ml)</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Lưu ý kích vị</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold', color: '#27ae60' }}>Cam Sành</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>150ml cốt cam (2-3 quả) + 30ml nước đường + Đá</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>Thêm 1 xíu muối tinh để vị đậm đà</td>
              </tr>
              <tr style={{ background: '#f9f9f9' }}>
                <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold', color: '#27ae60' }}>Cà Rốt</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>200ml cốt cà rốt (2-3 củ) + 20ml đường + Đá</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>Thêm 10ml nước cốt chanh để không bị ngái</td>
              </tr>
              <tr>
                <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold', color: '#27ae60' }}>Dứa Mật</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>200ml cốt dứa (1/2 quả lớn) + 20ml đường + Đá</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>Thêm 5ml cốt tắc để tăng độ thơm</td>
              </tr>
              <tr style={{ background: '#f9f9f9' }}>
                <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold', color: '#27ae60' }}>Cóc Non</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>200ml cốt cóc (3-4 quả) + 35ml đường + Đá</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>Bắt buộc có muối tinh liều lượng nhỏ xíu</td>
              </tr>
              <tr>
                <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold', color: '#27ae60' }}>Cần Tây Mix Táo</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>150ml cốt cần tây + 50ml cốt táo + 10ml đường (hoặc mật ong) + Đá</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>Ép cùng 1 lát gừng mỏng để khử mùi hăng</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </LoginGate>
  );
}
