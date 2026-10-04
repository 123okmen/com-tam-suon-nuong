import re

with open('src/pages/StaffPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. State additions
state_find = "const [tab, setTab] = useState<'pos' | 'shift' | 'report' | 'recipes'>('pos');"
state_replace = """const [tab, setTab] = useState<'pos' | 'shift' | 'report' | 'recipes'>('pos');
  const [paymentMethod, setPaymentMethod] = useState<'tienmat' | 'chuyenkhoan'>('tienmat');
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);"""

content = content.replace(state_find, state_replace)

# 2. Add loadRecentOrders & useEffect
load_find = "const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.qty, 0), [cart]);"
load_replace = """const loadRecentOrders = () => {
    try {
      const saved = localStorage.getItem('sam_mix_orders');
      if (saved) setRecentOrders(JSON.parse(saved));
    } catch (e) {}
  };

  useEffect(() => {
    loadRecentOrders();
  }, []);

  const editOrder = (order: Order) => {
    setEditingOrderId(order.id);
    if (order.items && Array.isArray(order.items)) {
      setCart(order.items.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })));
    }
    if (order.paymentMethod) setPaymentMethod(order.paymentMethod);
    setTab('pos');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.qty, 0), [cart]);"""

content = content.replace(load_find, load_replace)

# 3. Update checkout orderData
chk_find = """const newOrder: Order = {
      id: 'ORD-' + Date.now().toString().slice(-6),
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      staff: staff.trim(),
      items: [...cart],
      total,
      paymentMethod: 'tienmat',
      isPromo: false,
      note: ''
    };"""

chk_replace = """const newOrder: Order = {
      id: editingOrderId || ('ORD-' + Date.now().toString().slice(-6)),
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      staff: staff.trim(),
      items: [...cart],
      total,
      paymentMethod,
      isPromo: false,
      note: ''
    };"""

content = content.replace(chk_find, chk_replace)

# 4. Save order toast & reload recent orders
save_find = "saveOrder(newOrder);"
save_replace = """saveOrder(newOrder);
    loadRecentOrders();
    setEditingOrderId(null);"""

content = content.replace(save_find, save_replace)

# 5. Report data state update for tienChuyenKhoan
rep_find = "const [reportData, setReportData] = useState({ doanhThu: '', tienMat: '', ghiChu: '' });"
rep_replace = "const [reportData, setReportData] = useState({ doanhThu: '', tienMat: '', tienChuyenKhoan: '', ghiChu: '' });"

content = content.replace(rep_find, rep_replace)

# 6. Report reset update
res_find = "if (ok) setReportData({ doanhThu: '', tienMat: '', ghiChu: '' });"
res_replace = "if (ok) setReportData({ doanhThu: '', tienMat: '', tienChuyenKhoan: '', ghiChu: '' });"

content = content.replace(res_find, res_replace)

with open('src/pages/StaffPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Patched logic into StaffPage.tsx')
