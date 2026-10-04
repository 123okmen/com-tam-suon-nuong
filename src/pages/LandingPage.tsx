import { useState } from 'react';
import './LandingPage.css';

export default function LandingPage() {
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  return (
    <div className="landing-body">
      <div className="menu-board">
          <div className="landing-header" style={{ textAlign: 'center', marginBottom: '25px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <img src={`${import.meta.env.BASE_URL}logo_v2.jpg`} alt="Sâm Mix Logo" style={{ width: '130px', height: '130px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #f39c12', marginBottom: '15px', boxShadow: '0 6px 12px rgba(0,0,0,0.4)' }} />
              <h1 style={{ fontSize: '2.8rem', margin: '0 0 5px 0', textTransform: 'uppercase', letterSpacing: '2px', color: '#f1c40f', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>SÂM MIX</h1>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#ff9f43', margin: '5px 0 0 0', letterSpacing: '1px', textShadow: '2px 2px 4px rgba(0,0,0,0.8)', background: 'rgba(0,0,0,0.3)', padding: '5px 15px', borderRadius: '20px', border: '1px solid rgba(255,159,67,0.3)' }}>"Thanh Mát Tự Nhiên, Trọn Vị Bình Yên"</h2>
          </div>

          <div className="about-section">
              <h3 
                onClick={() => setIsAboutOpen(!isAboutOpen)}
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0 }}
              >
                <span>🏕️ Câu Chuyện & Giá Trị Cốt Lõi</span>
                <span>{isAboutOpen ? '▲' : '▼'}</span>
              </h3>
              
              {isAboutOpen && (
                <div style={{ marginTop: '15px' }}>
                  <p><strong>Ý tưởng hình thành:</strong> Khởi nguồn từ một góc nhỏ bình yên giữa lòng KDC Conic nhộn nhịp, "Sâm Mix Healthy" mang trong mình khao khát tạo ra một trạm dừng chân thư giãn mang phong cách cắm trại (Camping) mộc mạc.</p>
                  <p><strong>Giá trị cộng đồng:</strong> Quán là nơi gắn kết cư dân, tạo không gian giao lưu an toàn, thân thiện. Chúng mình cam kết sử dụng 100% nguyên liệu tự nhiên, không hoá chất.</p>
                </div>
              )}
          </div>

          <div className="columns">
              {/* Sâm Mix Column */}
              <div className="column">
                  <div className="col-title">
                      🌿 NƯỚC SÂM THẢO MỘC
                  </div>
                  
                  <div className="menu-item">
                      <img className="item-thumb" src={`${import.meta.env.BASE_URL}sam_bong_cuc_v2.jpg`} alt="Sâm Bông Cúc Nhãn Lục" />
                      <div className="item-info">
                          <h3 className="item-name">1. Sâm Bông Cúc Nhãn Nhục</h3>
                              <div className="item-note">Thanh nhiệt, mát gan · ngủ ngon</div>
                      </div>
                      <div className="item-price">15K</div>
                  </div>

                  <div className="menu-item">
                      <img className="item-thumb" src={`${import.meta.env.BASE_URL}sam_cu_nang_v2.jpg`} alt="Sâm Củ Năng Táo Đỏ" />
                      <div className="item-info">
                          <h3 className="item-name">2. Sâm Củ Năng Táo Đỏ</h3>
                              <div className="item-note">Bồi bổ khí huyết · giảm mệt mỏi</div>
                      </div>
                      <div className="item-price">15K</div>
                  </div>

                  <div className="menu-item">
                      <img className="item-thumb" src={`${import.meta.env.BASE_URL}sam_mia_lau_v2.jpg`} alt="Sâm Mía Lau" />
                      <div className="item-info">
                          <h3 className="item-name">3. Sâm Mía Lau</h3>
                              <div className="item-note">Thanh nhiệt · bổ sung năng lượng</div>
                      </div>
                      <div className="item-price">15K</div>
                  </div>


              </div>

              
              {/* Cà Phê Phin Column */}
              <div className="column">
                  <div className="col-title">
                      ☕ CÀ PHÊ PHIN
                  </div>
                  
                  <div className="menu-item">
                      <img className="item-thumb" src={`${import.meta.env.BASE_URL}logo_v2.jpg`} alt="Cà Phê Đen" />
                      <div className="item-info">
                          <h3 className="item-name">1. Cà Phê Đen</h3>
                              <div className="item-note">Đậm đà · chuẩn vị phin truyền thống</div>
                      </div>
                      <div className="item-price">15K</div>
                  </div>

                  <div className="menu-item">
                      <img className="item-thumb" src={`${import.meta.env.BASE_URL}logo_v2.jpg`} alt="Cà Phê Sữa" />
                      <div className="item-info">
                          <h3 className="item-name">2. Cà Phê Sữa</h3>
                              <div className="item-note">Thơm béo · đậm đà hài hòa</div>
                      </div>
                      <div className="item-price">20K</div>
                  </div>
              </div>

              {/* Đồ Ăn Vặt Column */}
              <div className="column">
                  <div className="col-title">
                      🍢 ĐỒ ĂN VẶT
                  </div>
                  
                  <div className="menu-item">
                      <img className="item-thumb" src={`${import.meta.env.BASE_URL}nem_nuong.jpg`} alt="Nem Nướng" />
                      <div className="item-info">
                          <h3 className="item-name">1. Nem Nướng Nóng Hổi</h3>
                              <div className="item-note">Thơm lừng · đậm đà chuẩn vị</div>
                      </div>
                      <div className="item-price">15K</div>
                  </div>
                  <div className="menu-item">
                      <img className="item-thumb" src={`${import.meta.env.BASE_URL}oc_buou_nhoi_thit.jpg`} alt="Ốc Bươu Nhồi Thịt" />
                      <div className="item-info">
                          <h3 className="item-name">2. Ốc Bươu Nhồi Thịt</h3>
                              <div className="item-note">Nóng hổi · kèm nước chấm sả tắc</div>
                      </div>
                      <div className="item-price">50K</div>
                  </div>
                  <div className="menu-item">
                      <img className="item-thumb" src={`${import.meta.env.BASE_URL}long_bo_sua_nuong.jpg`} alt="Lòng Bò Sữa Nướng" />
                      <div className="item-info">
                          <h3 className="item-name">3. Lòng Bò Sữa Nướng</h3>
                              <div className="item-note">Béo ngậy · nướng sả ớt đậm đà</div>
                      </div>
                      <div className="item-price">60K</div>
                  </div>
                  <div className="menu-item">
                      <img className="item-thumb" src={`${import.meta.env.BASE_URL}vu_heo_dau_bap.jpg`} alt="Vú Heo Đậu Bắp" />
                      <div className="item-info">
                          <h3 className="item-name">4. Vú Heo Đậu Bắp</h3>
                              <div className="item-note">Giòn sần sật · kèm đậu bắp nướng</div>
                      </div>
                      <div className="item-price">60K</div>
                  </div>
              </div>

              {/* Nước Ép Column */}
              <div className="column">
                  <div className="col-title">
                      🍊 NƯỚC ÉP TRÁI CÂY TƯƠI
                  </div>
                  
                  <div className="menu-item">
                      <img className="item-thumb" src={`${import.meta.env.BASE_URL}cam.jpg`} alt="Cam Sành" />
                      <div className="item-info">
                          <h3 className="item-name">1. Cam Sành Miền Tây</h3>
                              <div className="item-note">Vitamin C · kháng khuẩn, đẹp da</div>
                      </div>
                      <div className="item-price">15K</div>
                  </div>

                  <div className="menu-item">
                      <img className="item-thumb" src={`${import.meta.env.BASE_URL}dua_hau.jpg`} alt="Nước Ép Dưa Hấu" />
                      <div className="item-info">
                          <h3 className="item-name">2. Nước Ép Dưa Hấu</h3>
                              <div className="item-note">Giải nhiệt, tốt tim · giàu lycopene</div>
                      </div>
                      <div className="item-price">15K</div>
                  </div>

                  <div className="menu-item">
                      <img className="item-thumb" src={`${import.meta.env.BASE_URL}carot.jpg`} alt="Cà Rốt" />
                      <div className="item-info">
                          <h3 className="item-name">3. Cà Rốt Đà Lạt</h3>
                              <div className="item-note">Beta-caroten · sáng mắt, đẹp da</div>
                      </div>
                      <div className="item-price">20K</div>
                  </div>

                  <div className="menu-item">
                      <img className="item-thumb" src={`${import.meta.env.BASE_URL}dua.jpeg`} alt="Dứa" />
                      <div className="item-info">
                          <h3 className="item-name">4. Dứa Mật</h3>
                              <div className="item-note">Hỗ trợ tiêu hoá · giàu vitamin</div>
                      </div>
                      <div className="item-price">20K</div>
                  </div>

                  <div className="menu-item">
                      <img className="item-thumb" src={`${import.meta.env.BASE_URL}coc.jpeg`} alt="Cóc" />
                      <div className="item-info">
                          <h3 className="item-name">5. Cóc Non</h3>
                              <div className="item-note">Vitamin C · tăng đề kháng</div>
                      </div>
                      <div className="item-price">20K</div>
                  </div>

                  <div className="menu-item">
                      <img className="item-thumb" src={`${import.meta.env.BASE_URL}cantay.JPG`} alt="Cần Tây" />
                      <div className="item-info">
                          <h3 className="item-name">6. Ép Trái Cây Mix</h3>
                              <div className="item-note">Kết hợp trái cây tươi · thơm ngon, bổ dưỡng</div>
                      </div>
                      <div className="item-price">25K</div>
                  </div>
              </div>
          </div>

          <div className="location-section" style={{ textAlign: 'center', padding: '30px 15px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '15px', margin: '20px 0' }}>
              <h3 style={{ marginBottom: '15px', color: '#f1c40f' }}>📍 Bản Đồ & Chỉ Đường</h3>
              <p style={{ marginBottom: '15px' }}>
                 <a href="https://www.google.com/maps/place/Conic+Garden+A,+B%C3%ACnh+H%C6%B0ng,+H%E1%BB%93+Ch%C3%AD+Minh,+Vi%E1%BB%87t+Nam/@10.7178461,106.63765,17z/data=!4m6!3m5!1s0x31752e0f0b58e75b:0xf97af1f03aa15943!8m2!3d10.7178461!4d106.63765!16s%2Fg%2F12hqyml_q?entry=ttu&g_ep=EgoyMDI2MDcyMi4wIKXMDSoASAFQAw%3D%3D" target="_blank" rel="noopener noreferrer" style={{ color: '#27ae60', fontWeight: 'bold', textDecoration: 'none', fontSize: '1.1em', display: 'inline-block', padding: '10px 15px', backgroundColor: '#fff', borderRadius: '8px' }}>
                     🗺️ Xem vị trí: Chung cư Conic Garden A, Bình Hưng, Bình Chánh
                 </a>
              </p>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent("https://www.google.com/maps/place/Conic+Garden+A,+B%C3%ACnh+H%C6%B0ng,+H%E1%BB%93+Ch%C3%AD+Minh,+Vi%E1%BB%87t+Nam/@10.7178461,106.63765,17z/data=!4m6!3m5!1s0x31752e0f0b58e75b:0xf97af1f03aa15943!8m2!3d10.7178461!4d106.63765!16s%2Fg%2F12hqyml_q?entry=ttu&g_ep=EgoyMDI2MDcyMi4wIKXMDSoASAFQAw%3D%3D")}`} alt="QR Code Google Maps" style={{ marginTop: '10px', borderRadius: '10px', border: '3px solid #fff' }} />
              <p style={{ fontSize: '0.9em', color: '#bdc3c7', marginTop: '10px' }}>(Quét mã để mở Bản đồ chỉ đường trên điện thoại)</p>
          </div>

          <div className="landing-footer">
              📍 Địa chỉ: Chung cư Conic Garden, Khu dân cư Conic, Bình Chánh &nbsp;|&nbsp; ⏰ Giờ mở cửa: Ca Sáng 07:30 - 12:30 | Ca Chiều Tối 13:00 - 21:00 &nbsp;|&nbsp; 🍃 Healthy & Fresh
          </div>
      </div>
    </div>
  );
}
