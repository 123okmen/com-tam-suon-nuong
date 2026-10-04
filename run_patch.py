with open('src/pages/StaffPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update order creation ID & paymentMethod
content = content.replace("const order: Order = {", "const order: Order = {
      id: editingOrderId || ('ORD-' + Date.now().toString().slice(-6)),")
content = content.replace("paymentMethod: 'tienmat',", "paymentMethod,")

# 2. Add Payment Method UI
pos_pay_find = "<div style={{ marginTop: '1rem' }}>
                <label style={{ fontSize: '0.85rem' }}>Tiền khách đưa (VNĐ)</label>"
pos_pay_replace = """<div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Hình thức thanh toán</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={() => setPaymentMethod('tienmat')}
                    style={{ flex: 1, padding: '8px', borderRadius: '8px', border: paymentMethod === 'tienmat' ? '2px solid #10b981' : '1px solid gray', background: paymentMethod === 'tienmat' ? 'rgba(16,185,129,0.2)' : 'transparent', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
                    Tien mat
                  </button>
                  <button type="button" onClick={() => setPaymentMethod('chuyenkhoan')}
                    style={{ flex: 1, padding: '8px', borderRadius: '8px', border: paymentMethod === 'chuyenkhoan' ? '2px solid #3498db' : '1px solid gray', background: paymentMethod === 'chuyenkhoan' ? 'rgba(52,152,219,0.2)' : 'transparent', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
                    Chuyen khoan
                  </button>
                </div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <label style={{ fontSize: '0.85rem' }}>Tiền khách đưa (VNĐ)</label>"""

content = content.replace(pos_pay_find, pos_pay_replace)

# 3. Add Recent Orders Table below POS
recent_table_find = "{/* Báo cáo nhanh */}"
recent_table_replace = """<div className="glass-panel" style={{ marginTop: '2rem', padding: '1.2rem' }}>
            <h3 style={{ marginTop: 0, color: '#f39c12' }}>Danh sach don hang vua nhap</h3>
            {recentOrders.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Chua co don hang nao duoc luu thiet bi nay.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                      <th style={{ padding: '8px' }}>Ma don</th>
                      <th style={{ padding: '8px' }}>Thoi gian</th>
                      <th style={{ padding: '8px' }}>Mon</th>
                      <th style={{ padding: '8px' }}>Thanh toan</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Tong tien</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>Thao tac</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.slice(0, 15).map(o => (
                      <tr key={o.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '8px', fontWeight: 'bold' }}>{o.id}</td>
                        <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>{o.time}</td>
                        <td style={{ padding: '8px' }}>
                          {o.items ? o.items.map((i: any) => i.name + ' x' + i.qty).join(', ') : ''}
                        </td>
                        <td style={{ padding: '8px' }}>
                          {o.paymentMethod === 'chuyenkhoan' ? 'Chuyen khoan' : 'Tien mat'}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', color: '#10b981', fontWeight: 'bold' }}>
                          {fmtVND(o.total || 0)}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <button className="btn-primary" style={{ padding: '4px 10px', fontSize: '0.8rem', background: '#3498db' }}
                            onClick={() => editOrder(o)}>
                            Sua
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Báo cáo nhanh */}"""

content = content.replace(recent_table_find, recent_table_replace)

# 4. Add tienChuyenKhoan input in report tab
report_ck_find = """<div>
                <label style={{ fontSize: '0.85rem' }}>Tiền mặt POS (VNĐ)</label>
                <input className="input-field" type="number" value={reportData.tienMat} onChange={e => setReportData({ ...reportData, tienMat: e.target.value })} />
              </div>"""

report_ck_replace = """<div>
                <label style={{ fontSize: '0.85rem' }}>Tiền mặt POS (VNĐ)</label>
                <input className="input-field" type="number" value={reportData.tienMat} onChange={e => setReportData({ ...reportData, tienMat: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem' }}>Tiền chuyển khoản (VNĐ)</label>
                <input className="input-field" type="number" value={reportData.tienChuyenKhoan} onChange={e => setReportData({ ...reportData, tienChuyenKhoan: e.target.value })} />
              </div>"""

content = content.replace(report_ck_find, report_ck_replace)

with open('src/pages/StaffPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated UI in StaffPage.tsx successfully!')
