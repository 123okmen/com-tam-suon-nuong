import type { Order, OrderLine } from '../lib/store';
import { BRAND_NAME, BRAND_SUBTITLE, shiftLabel, getShift, findMenuPrice, parseOrderItems } from '../lib/store';

/** Kiểm tra thiết bị có phải di động (iPhone / iPad / Android) */
export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
}

/**
 * Kiểm tra xem thiết bị có đang ở chế độ máy tính (Desktop / PC / Laptop hoặc mobile bật Desktop Site) hay không.
 * Trả về true nếu:
 * 1. Màn hình rộng (window.innerWidth >= 768px).
 * 2. User-Agent không phải thiết bị di động (Windows, Mac, Linux...).
 */
export function isComputerMode(): boolean {
  if (typeof window === 'undefined') return false;
  const isWide = window.innerWidth >= 768;
  const isDesktopUA = !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
  return isWide || isDesktopUA;
}

/** Định dạng tiền tệ cho máy in text / Bluetooth ESC/POS (chuẩn ký tự ASCII 'd', tuyệt đối không lỗi font ký tự đ) */
export function fmtPrintPlainVND(n: number): string {
  return (n || 0).toLocaleString('vi-VN') + 'd';
}

/** Định dạng tiền tệ an toàn cho bản in HTML (chuẩn phông Arial/Segoe UI) */
export function fmtPrintHtmlVND(n: number): string {
  return (n || 0).toLocaleString('vi-VN') + ' đ';
}

/** Chuyển tiếng Việt có dấu sang không dấu (dùng cho máy in Bluetooth ESC/POS thuần) */
export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/** Chuẩn hóa danh sách món */
function resolveOrderLines(order: Order): OrderLine[] {
  let lines: OrderLine[] = [];
  if (Array.isArray(order.lines) && order.lines.length > 0) {
    lines = order.lines.map((l, idx) => {
      let p = Number(l.price) || 0;
      const q = Number(l.qty) || 1;
      if (p <= 0 && l.name) p = findMenuPrice(l.name);
      if (p <= 0 && order.total && order.lines.length === 1) p = Math.round(Number(order.total) / q);
      return {
        id: l.id || `line-${idx}`,
        name: l.name,
        price: p,
        qty: q,
        note: l.note
      };
    });
  } else if ((order as any).items) {
    lines = parseOrderItems((order as any).items, order.total);
  }

  if (lines.length === 0 && order.total > 0) {
    lines = [{
      id: 'fallback-item',
      name: (order as any).items || `Đơn hàng #${order.id}`,
      price: Number(order.total),
      qty: 1
    }];
  }
  return lines;
}

/** Tạo nội dung text cho máy in Bluetooth (RawBT / Clipboard) */
export function generateReceiptPlainText(order: Order): string {
  const lines = resolveOrderLines(order);
  const totalQty = lines.reduce((sum, l) => sum + (Number(l.qty) || 1), 0);
  const subTotal = lines.reduce((sum, l) => sum + (Number(l.price) || 0) * (Number(l.qty) || 1), 0);
  const finalTotal = order.total || subTotal || 0;
  const changeMoney = (order.cash || 0) - finalTotal;

  const doubleLine = '================================';
  const singleLine = '--------------------------------';
  const padRight = (s: string, len: number) => (s + ' '.repeat(len)).slice(0, len);
  const padLeft = (s: string, len: number) => (' '.repeat(len) + s).slice(-len);

  let typeLabel = 'TAI QUAN';
  if (order.tableNo) typeLabel = `BAN SỐ ${order.tableNo}`;
  else if (order.orderType === 'mang-ve') typeLabel = 'MANG VE';
  else if (order.paymentMethod === 'app') typeLabel = 'DON APP';

  let dateStr = '';
  try {
    const d = new Date(order.time);
    dateStr = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')} ${d.getDate()}/${d.getMonth() + 1}`;
  } catch {
    dateStr = order.time || '';
  }

  let text = '';
  text += '        ' + removeVietnameseTones(BRAND_NAME) + '\n';
  text += '   ' + removeVietnameseTones(BRAND_SUBTITLE) + '\n';
  text += doubleLine + '\n';
  text += padRight('[' + removeVietnameseTones(typeLabel) + ']', 16) + padLeft('#' + order.id, 16) + '\n';
  text += padRight('Gio: ' + dateStr, 18) + padLeft(removeVietnameseTones(shiftLabel(order.shift || getShift()).split(' ')[1] || ''), 14) + '\n';
  text += padRight('NV: ' + removeVietnameseTones(order.staff || 'Quan'), 18) + padLeft(order.paymentMethod === 'chuyenkhoan' ? 'CK QR' : 'Tien mat', 14) + '\n';
  text += singleLine + '\n';
  text += padRight(`Mon (${totalQty}p)`, 16) + padLeft('SL', 4) + padLeft('Tien', 12) + '\n';
  text += singleLine + '\n';

  lines.forEach(l => {
    const safeName = removeVietnameseTones(l.name).slice(0, 16);
    const qty = String(l.qty || 1);
    const priceStr = fmtPrintPlainVND((l.price || 0) * (l.qty || 1));
    text += padRight(safeName, 16) + padLeft(qty, 4) + padLeft(priceStr, 12) + '\n';
    if (l.note) {
      text += '  * ' + removeVietnameseTones(l.note) + '\n';
    }
  });

  text += singleLine + '\n';
  text += padRight('TONG CONG:', 16) + padLeft(fmtPrintPlainVND(finalTotal), 16) + '\n';
  if (order.cash) {
    text += `Khach: ${fmtPrintPlainVND(order.cash)} - Thoi: ${fmtPrintPlainVND(changeMoney > 0 ? changeMoney : 0)}\n`;
  }
  if (order.note) {
    text += '* Ghi chu: ' + removeVietnameseTones(order.note) + '\n';
  }
  text += doubleLine + '\n';
  text += '   Cam on Quy khach & Hen gap!\n\n\n\n';

  return text;
}

/** Tạo chuỗi HTML chuẩn khổ 58mm UTF-8 */
export function generateReceiptHtml(order: Order): string {
  const lines = resolveOrderLines(order);
  const totalQty = lines.reduce((sum, l) => sum + (Number(l.qty) || 1), 0);
  const subTotal = lines.reduce((sum, l) => sum + (Number(l.price) || 0) * (Number(l.qty) || 1), 0);
  const finalTotal = order.total || subTotal || 0;
  const changeMoney = (order.cash || 0) - finalTotal;

  let typeLabel = 'TẠI QUÁN';
  if (order.tableNo) typeLabel = `BÀN SỐ ${order.tableNo}`;
  else if (order.orderType === 'mang-ve') typeLabel = 'MANG VỀ';
  else if (order.paymentMethod === 'app') typeLabel = 'ĐƠN APP';
  else if (order.orderType === 'giao-hang') typeLabel = 'GIAO HÀNG';

  let paymentText = 'Tiền mặt';
  if (order.paymentMethod === 'chuyenkhoan') paymentText = 'Chuyển khoản QR';
  else if (order.paymentMethod === 'app') paymentText = 'Đơn App';

  let dateStr = '';
  try {
    const d = new Date(order.time);
    const timeOnly = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const dateOnly = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    dateStr = `${timeOnly} ${dateOnly}`;
  } catch {
    dateStr = order.time || '';
  }

  const shiftName = shiftLabel(order.shift || getShift());

  const linesHtml = lines.map(l => `
    <tr>
      <td style="padding: 2px 0; border-bottom: 1px dotted #000; word-break: break-word;">
        <div style="font-weight: 700; font-size: 11px; color: #000;">${l.name}</div>
        ${l.note ? `<div style="font-size: 9.5px; font-style: italic; color: #000;">➥ ${l.note}</div>` : ''}
      </td>
      <td style="text-align: center; padding: 2px 0; border-bottom: 1px dotted #000; vertical-align: top; font-weight: 700; font-size: 11px; color: #000;">${l.qty}</td>
      <td style="text-align: right; padding: 2px 0; border-bottom: 1px dotted #000; vertical-align: top; font-weight: 700; font-size: 11px; white-space: nowrap; color: #000;">${fmtPrintHtmlVND(l.price * l.qty)}</td>
    </tr>
  `).join('');

  return `
    <div style="width: 48mm; max-width: 48mm; margin: 0 auto; padding: 2px 1px; color: #000; background: #fff; font-family: Arial, 'Segoe UI', Tahoma, sans-serif; font-size: 11px; line-height: 1.25;">
      <div style="text-align: center; margin-bottom: 3px; padding-bottom: 3px; border-bottom: 1px dashed #000;">
        <div style="font-size: 14px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase;">${BRAND_NAME}</div>
        <div style="font-size: 9.5px; font-weight: 600; margin-top: 1px;">${BRAND_SUBTITLE}</div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin: 3px 0; font-size: 11px;">
        <span style="font-weight: 900; border: 1.5px solid #000; padding: 1px 5px; border-radius: 2px; text-transform: uppercase;">${typeLabel}</span>
        <span style="font-weight: 800;">#${order.id}</span>
      </div>

      <div style="font-size: 9.5px; margin-bottom: 3px; padding-bottom: 3px; border-bottom: 1px dashed #000; line-height: 1.3;">
        <div style="display: flex; justify-content: space-between;">
          <span>Giờ: ${dateStr}</span>
          <span>${shiftName.split(' ')[1] || ''}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>NV: ${order.staff || 'Trạm'}</span>
          <span>TT: ${paymentText}</span>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 3px; table-layout: fixed;">
        <thead>
          <tr>
            <th style="text-align: left; width: 58%; border-bottom: 1px solid #000; padding: 2px 0; font-size: 10px;">Món (${totalQty}p)</th>
            <th style="text-align: center; width: 14%; border-bottom: 1px solid #000; padding: 2px 0; font-size: 10px;">SL</th>
            <th style="text-align: right; width: 28%; border-bottom: 1px solid #000; padding: 2px 0; font-size: 10px;">Tiền</th>
          </tr>
        </thead>
        <tbody>
          ${linesHtml}
        </tbody>
      </table>

      <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 3px 0; margin: 3px 0;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; font-size: 14px; font-weight: 900;">
          <span>TỔNG CỘNG:</span>
          <span>${fmtPrintHtmlVND(finalTotal)}</span>
        </div>
        ${order.cash ? `
        <div style="display: flex; justify-content: space-between; font-size: 10px; margin-top: 2px;">
          <span>Khách đưa: ${fmtPrintHtmlVND(order.cash)}</span>
          <span>Thối: ${fmtPrintHtmlVND(changeMoney > 0 ? changeMoney : 0)}</span>
        </div>
        ` : ''}
        ${order.note ? `
        <div style="margin: 2px 0 1px 0; font-size: 9.5px; font-style: italic;">
          * Ghi chú: ${order.note}
        </div>
        ` : ''}
      </div>

      <div style="text-align: center; margin-top: 3px; font-size: 9.5px; font-weight: 700;">
        Cảm ơn Quý khách & Hẹn gặp lại!
      </div>
      <div style="height: 10px;"></div>
    </div>
  `;
}

// Biến lưu trữ kết nối Bluetooth đang hoạt động (tránh mất kết nối và tránh phải quét lại)
let cachedBleDevice: any = null;
let cachedBleServer: any = null;
let cachedBleWriteChar: any = null;
let isBleConnecting = false;
let currentModalOrder: Order | null = null;

export const BLE_PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard mini BLE printer
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC transparent UART (MPT-II, EG-58BT)
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // BLE SPP UART
  '0000e0ff-0000-1000-8000-00805f9b34fb', // POS-58 series
  '0000ff00-0000-1000-8000-00805f9b34fb', // Feasycom serial
  '0000ae00-0000-1000-8000-00805f9b34fb',
  '0000af00-0000-1000-8000-00805f9b34fb',
  '0000fee7-0000-1000-8000-00805f9b34fb'
];

/** Kiểm tra thiết bị Bluetooth hiện đang kết nối hay chưa */
export function isBluetoothConnected(): boolean {
  return !!(cachedBleServer && cachedBleServer.connected && cachedBleWriteChar);
}

/** Lấy tên máy in Bluetooth hiện tại */
export function getConnectedDeviceName(): string {
  return cachedBleDevice?.name || 'EG-58BT / MPT-II';
}

/** Tùy chọn tự ngắt kết nối sau khi in */
export function isAutoDisconnectEnabled(): boolean {
  return localStorage.getItem('ble_auto_disconnect') === 'true';
}

export function setAutoDisconnectEnabled(val: boolean): void {
  localStorage.setItem('ble_auto_disconnect', val ? 'true' : 'false');
}

/** Ngắt kết nối máy in để nhả cho máy khác kết nối hoặc để quét lại */
export function disconnectBluetooth(silent = false): void {
  try {
    if (cachedBleServer && cachedBleServer.connected) {
      cachedBleServer.disconnect();
    }
  } catch (err) {
    console.warn('Lỗi khi ngắt kết nối Bluetooth:', err);
  } finally {
    cachedBleDevice = null;
    cachedBleServer = null;
    cachedBleWriteChar = null;
    refreshModalBleUI();
    if (!silent) {
      alert('Đã ngắt kết nối Bluetooth! Máy in đã giải phóng và sẵn sàng để quét lại hoặc kết nối từ thiết bị khác.');
    }
  }
}

/** Gửi byte mảng qua Characteristic với kích thước gói an toàn */
async function sendBytesToCharacteristic(writeChar: any, rawBytes: Uint8Array): Promise<void> {
  const CHUNK_SIZE = 80;
  for (let i = 0; i < rawBytes.length; i += CHUNK_SIZE) {
    const chunk = rawBytes.slice(i, i + CHUNK_SIZE);
    if (writeChar.properties.writeWithoutResponse) {
      await writeChar.writeValueWithoutResponse(chunk);
    } else {
      await writeChar.writeValue(chunk);
    }
    await new Promise(r => setTimeout(r, 25));
  }
}

/** Kết nối & In trực tiếp qua Web Bluetooth BLE (Dành cho Android Chrome, Bluefy iOS, PC Chrome) */
export async function printViaWebBluetooth(order: Order): Promise<boolean> {
  const nav = navigator as any;
  if (!nav || !nav.bluetooth) {
    alert('Trình duyệt này chưa bật Web Bluetooth.\n- Trên iPhone: Bạn hãy tải trình duyệt miễn phí Bluefy từ App Store để in Bluetooth trực tiếp.\n- Trên Android: Dùng Google Chrome để in trực tiếp nhé!');
    return false;
  }

  if (isBleConnecting) {
    alert('Đang trong quá trình kết nối Bluetooth, vui lòng đợi...');
    return false;
  }

  const textData = generateReceiptPlainText(order);
  const encoder = new TextEncoder();
  const rawBytes = encoder.encode(textData);

  // 1. NẾU ĐÃ KẾT NỐI SẴN: TÁI SỬ DỤNG KẾT NỐI, IN NGAY LẬP TỨC (KHÔNG CẦN QUÉT LẠI)
  if (isBluetoothConnected() && cachedBleWriteChar) {
    try {
      await sendBytesToCharacteristic(cachedBleWriteChar, rawBytes);
      
      if (isAutoDisconnectEnabled()) {
        await new Promise(r => setTimeout(r, 400));
        disconnectBluetooth(true);
      }
      
      alert('Đã in thành công qua máy in Bluetooth!');
      return true;
    } catch (err) {
      console.warn('Lỗi ghi dữ liệu Bluetooth vào kết nối cũ, giải phóng kết nối để kết nối lại:', err);
      // Kết nối cũ bị đứt hoặc lỗi (ví dụ máy in tắt rồi bật lại) -> ngắt sạch để máy in phát sóng trở lại
      disconnectBluetooth(true);
      // Rơi xuống phần kết nối mới bên dưới
    }
  }

  // 2. KẾT NỐI MỚI (CHƯA KẾT NỐI HOẶC VỪA NGẮT KẾT NỐI CŨ ĐỂ QUÉT LẠI)
  isBleConnecting = true;
  try {
    // Đảm bảo không còn kết nối ngầm nào chiếm giữ máy in
    if (cachedBleServer && cachedBleServer.connected) {
      try { cachedBleServer.disconnect(); } catch (_) {}
    }
    cachedBleDevice = null;
    cachedBleServer = null;
    cachedBleWriteChar = null;

    const device = await nav.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: BLE_PRINTER_SERVICES
    });

    device.addEventListener('gattserverdisconnected', () => {
      console.log('Bluetooth GATT disconnected event');
      cachedBleDevice = null;
      cachedBleServer = null;
      cachedBleWriteChar = null;
      refreshModalBleUI();
    });

    const server = await device.gatt.connect();
    const services = await server.getPrimaryServices();

    let writeChar: any = null;
    for (const s of services) {
      try {
        const chars = await s.getCharacteristics();
        for (const c of chars) {
          if (c.properties.write || c.properties.writeWithoutResponse) {
            writeChar = c;
            break;
          }
        }
      } catch (e) {
        console.warn('Không đọc được characteristics của service:', s.uuid, e);
      }
      if (writeChar) break;
    }

    if (!writeChar) {
      alert('Không tìm thấy kênh ghi dữ liệu (Characteristic Write) trên máy in EG-58BT!');
      try { server.disconnect(); } catch (_) {}
      return false;
    }

    // Lưu cache để in các lần sau không cần quét
    cachedBleDevice = device;
    cachedBleServer = server;
    cachedBleWriteChar = writeChar;
    refreshModalBleUI();

    // Gửi dữ liệu in
    await sendBytesToCharacteristic(cachedBleWriteChar, rawBytes);

    if (isAutoDisconnectEnabled()) {
      await new Promise(r => setTimeout(r, 400));
      disconnectBluetooth(true);
    }

    alert('Đã kết nối và gửi lệnh in Bluetooth thành công!');
    return true;
  } catch (err: any) {
    if (err.name !== 'NotFoundError') {
      alert('Lỗi kết nối Bluetooth: ' + (err.message || err));
    }
    disconnectBluetooth(true);
    return false;
  } finally {
    isBleConnecting = false;
    refreshModalBleUI();
  }
}

/** Gửi lệnh in sang App RawBT trên điện thoại Android */
export function printViaRawBT(order: Order) {
  const plainText = generateReceiptPlainText(order);
  const rawUrl = 'rawbt:' + encodeURIComponent(plainText);
  window.location.href = rawUrl;
}

/** Đảm bảo nhúng style @media print vào document */
function ensurePrintStyles() {
  if (typeof document === 'undefined') return;
  if (!document.getElementById('receipt-universal-print-style')) {
    const style = document.createElement('style');
    style.id = 'receipt-universal-print-style';
    style.innerHTML = `
      @media screen {
        #receipt-print-stage {
          display: none;
        }
      }
      @media print {
        @page {
          size: 58mm auto;
          margin: 0;
        }
        body > * {
          display: none !important;
        }
        #receipt-print-stage {
          display: block !important;
          position: fixed !important;
          left: 0 !important;
          top: 0 !important;
          width: 48mm !important;
          max-width: 48mm !important;
          margin: 0 !important;
          padding: 2px 1px !important;
          background: #fff !important;
          color: #000 !important;
          z-index: 9999999 !important;
          font-family: Arial, 'Segoe UI', Tahoma, sans-serif !important;
        }
        #receipt-print-stage,
        #receipt-print-stage * {
          font-family: Arial, 'Segoe UI', Tahoma, sans-serif !important;
          color: #000 !important;
          box-sizing: border-box !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        #receipt-print-stage table {
          display: table !important;
          width: 100% !important;
        }
        #receipt-print-stage thead {
          display: table-header-group !important;
        }
        #receipt-print-stage tbody {
          display: table-row-group !important;
        }
        #receipt-print-stage tr {
          display: table-row !important;
        }
        #receipt-print-stage th,
        #receipt-print-stage td {
          display: table-cell !important;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

/** HTML cho cụm điều khiển Bluetooth Web BLE */
function renderBleControlHtml(): string {
  const connected = isBluetoothConnected();
  const devName = getConnectedDeviceName();
  const autoDisconnect = isAutoDisconnectEnabled();

  if (connected) {
    return `
      <div style="background: rgba(16, 185, 129, 0.12); border: 1.5px solid #10b981; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 0.8rem; font-weight: 800; color: #10b981; display: flex; align-items: center; gap: 6px;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981;"></span>
            ĐÃ KẾT NỐI: ${devName}
          </div>
          <button id="btn-ble-disconnect" type="button" style="background: #ef4444; color: #fff; border: none; border-radius: 4px; padding: 3px 8px; font-size: 0.72rem; font-weight: 700; cursor: pointer;">
            🔌 Ngắt kết nối
          </button>
        </div>
        
        <button id="btn-trigger-ble-print" type="button" style="width: 100%; padding: 10px; border-radius: 6px; background: #10b981; color: #0f172a; border: none; font-weight: 900; font-size: 0.92rem; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);">
          <span>⚡</span> IN TIẾP QUA BLUETOOTH (IN NGAY)
        </button>

        <label style="display: flex; align-items: center; gap: 6px; font-size: 0.73rem; color: #a1a1aa; cursor: pointer; margin-top: 2px;">
          <input type="checkbox" id="chk-ble-auto-disconnect" ${autoDisconnect ? 'checked' : ''} style="cursor: pointer;" />
          <span>Tự ngắt kết nối sau khi in (để nhả máy cho điện thoại khác)</span>
        </label>
      </div>
    `;
  }

  return `
    <div style="background: rgba(139, 92, 246, 0.1); border: 1.5px solid rgba(139, 92, 246, 0.35); border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 8px;">
      <button id="btn-trigger-ble-print" type="button" style="width: 100%; padding: 10px; border-radius: 6px; background: #8b5cf6; color: #fff; border: none; font-weight: 800; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);">
        <span>🔵</span> KẾT NỐI & IN BLUETOOTH (WEB BLE)
      </button>

      <label style="display: flex; align-items: center; gap: 6px; font-size: 0.73rem; color: #a1a1aa; cursor: pointer;">
        <input type="checkbox" id="chk-ble-auto-disconnect" ${autoDisconnect ? 'checked' : ''} style="cursor: pointer;" />
        <span>Tự ngắt kết nối sau khi in (để nhả máy cho điện thoại khác)</span>
      </label>
    </div>
  `;
}

/** Gắn sự kiện cho cụm điều khiển Bluetooth */
function bindBleControlEvents(order: Order) {
  const container = document.getElementById('ble-control-section');
  if (!container) return;

  const btnPrint = container.querySelector('#btn-trigger-ble-print');
  btnPrint?.addEventListener('click', async () => {
    await printViaWebBluetooth(order);
    refreshModalBleUI();
  });

  const btnDisconnect = container.querySelector('#btn-ble-disconnect');
  btnDisconnect?.addEventListener('click', () => {
    disconnectBluetooth(false);
  });

  const chkAuto = container.querySelector('#chk-ble-auto-disconnect') as HTMLInputElement | null;
  chkAuto?.addEventListener('change', (e) => {
    setAutoDisconnectEnabled((e.target as HTMLInputElement).checked);
  });
}

/** Cập nhật giao diện Bluetooth theo thời gian thực nếu modal đang mở */
function refreshModalBleUI() {
  const container = document.getElementById('ble-control-section');
  if (!container || !currentModalOrder) return;
  container.innerHTML = renderBleControlHtml();
  bindBleControlEvents(currentModalOrder);
}

/** Đóng hộp thoại in trên màn hình */
export function closePrintModal() {
  currentModalOrder = null;
  const el = document.getElementById('mobile-print-modal-overlay');
  if (el) el.remove();
}

/** Hiển thị hộp thoại in hỗ trợ hoàn hảo cho cả iPhone & Android */
export function showPrintModal(order: Order) {
  ensurePrintStyles();
  closePrintModal();
  currentModalOrder = order;

  // Đặt nội dung vào vùng in @media print
  let stage = document.getElementById('receipt-print-stage');
  if (!stage) {
    stage = document.createElement('div');
    stage.id = 'receipt-print-stage';
    document.body.appendChild(stage);
  }
  stage.innerHTML = generateReceiptHtml(order);

  // Tạo Modal tương tác trên điện thoại
  const modal = document.createElement('div');
  modal.id = 'mobile-print-modal-overlay';
  modal.style.position = 'fixed';
  modal.style.inset = '0';
  modal.style.background = 'rgba(0,0,0,0.85)';
  modal.style.zIndex = '999999';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.padding = '12px';
  modal.style.backdropFilter = 'blur(4px)';

  const card = document.createElement('div');
  card.style.background = '#18181b';
  card.style.color = '#fff';
  card.style.borderRadius = '14px';
  card.style.border = '1px solid #3f3f46';
  card.style.width = '100%';
  card.style.maxWidth = '380px';
  card.style.maxHeight = '92vh';
  card.style.display = 'flex';
  card.style.flexDirection = 'column';
  card.style.boxShadow = '0 20px 40px rgba(0,0,0,0.6)';
  card.style.overflow = 'hidden';

  card.innerHTML = `
    <div style="padding: 14px 16px; border-bottom: 1px solid #27272a; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-weight: 800; font-size: 1rem; color: #10b981; display: flex; align-items: center; gap: 6px;">
          <span>🖨️</span> In Hóa Đơn #${order.id}
        </div>
        <div style="font-size: 0.75rem; color: #a1a1aa; margin-top: 2px;">Tối ưu máy in nhiệt 58mm EG-58BT</div>
      </div>
      <button id="btn-close-print-modal" style="background: none; border: none; color: #a1a1aa; font-size: 1.4rem; cursor: pointer; padding: 4px;">✕</button>
    </div>

    <div style="flex: 1; overflow-y: auto; padding: 14px;">
      <!-- Khung tùy chọn in đa nền tảng -->
      <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px;">
        <button id="btn-trigger-browser-print" style="width: 100%; padding: 10px; border-radius: 8px; background: #10b981; color: #0f172a; border: none; font-weight: 800; font-size: 0.92rem; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer;">
          <span>📱</span> In Trình Duyệt / AirPrint (iPhone & PC)
        </button>

        <button id="btn-trigger-rawbt-print" style="width: 100%; padding: 9px; border-radius: 8px; background: #3b82f6; color: #fff; border: none; font-weight: 700; font-size: 0.88rem; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer;">
          <span>🤖</span> In Qua App RawBT (Android Bluetooth)
        </button>

        <div id="ble-control-section">
          ${renderBleControlHtml()}
        </div>

        <button id="btn-copy-receipt-text" style="width: 100%; padding: 8px; border-radius: 8px; background: #27272a; color: #e4e4e7; border: 1px solid #3f3f46; font-weight: 600; font-size: 0.82rem; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer;">
          <span>📋</span> Sao Chép Nội Dung Bill (Gửi Zalo / App)
        </button>
      </div>

      <!-- Bản xem trước Bill 58mm -->
      <div style="background: #fff; border-radius: 8px; padding: 8px 4px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); overflow: hidden;">
        <div style="text-align: center; font-size: 0.7rem; color: #666; margin-bottom: 4px; font-weight: 600;">— XEM TRƯỚC HÓA ĐƠN 58MM —</div>
        ${generateReceiptHtml(order)}
      </div>
    </div>
  `;

  modal.appendChild(card);
  document.body.appendChild(modal);

  // Xử lý các sự kiện nút bấm
  modal.querySelector('#btn-close-print-modal')?.addEventListener('click', closePrintModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closePrintModal();
  });

  // 1. In trình duyệt / AirPrint
  modal.querySelector('#btn-trigger-browser-print')?.addEventListener('click', () => {
    window.print();
  });

  // 2. In qua RawBT (Android)
  modal.querySelector('#btn-trigger-rawbt-print')?.addEventListener('click', () => {
    printViaRawBT(order);
  });

  // 3. Khởi tạo sự kiện cho BLE section
  bindBleControlEvents(order);

  // 4. Sao chép text
  modal.querySelector('#btn-copy-receipt-text')?.addEventListener('click', () => {
    const text = generateReceiptPlainText(order);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        alert('Đã sao chép nội dung hóa đơn vào bộ nhớ tạm! Bạn có thể dán vào Zalo hoặc app in Bluetooth.');
      }).catch(() => {
        prompt('Sao chép nội dung bên dưới:', text);
      });
    } else {
      prompt('Sao chép nội dung bên dưới:', text);
    }
  });
}

/**
 * Hàm gọi in chính:
 * - Trên điện thoại (iPhone/Android): Mở hộp thoại In Đa Năng tương thích 100% không bị chặn.
 * - Trên máy tính (PC): Tự động mở hộp thoại in của trình duyệt và lưu nội dung sẵn sàng.
 */
export function printReceipt(order: Order) {
  // Khi ở chế độ máy tính (Desktop / Màn hình rộng >= 768px hoặc PC): Không hiển thị / thực thi các chức năng in bill
  if (isComputerMode()) {
    console.log('Chế độ máy tính: Bỏ qua và không hiển thị các chức năng in hóa đơn.');
    return;
  }

  localStorage.setItem('printer_size', '58');
  ensurePrintStyles();

  // Đặt nội dung vào vùng in
  let stage = document.getElementById('receipt-print-stage');
  if (!stage) {
    stage = document.createElement('div');
    stage.id = 'receipt-print-stage';
    document.body.appendChild(stage);
  }
  stage.innerHTML = generateReceiptHtml(order);

  // Trên thiết bị di động (iPhone/Android): Luôn hiển thị Modal để người dùng chọn cách in thuận tiện nhất
  showPrintModal(order);
}
