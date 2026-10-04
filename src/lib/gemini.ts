const BASE_PLAN = `
**Dự Án Trạm Nước Sâm Mix & Mía Mix Healthy**
- **Vị trí:** Khu dân cư Conic Bình Chánh, sân bãi 60m2.
- **Vốn đầu tư:** 80 Triệu VNĐ (Chia cho 4 cổ đông).
- **Mô hình:** Vận hành ca gãy (Ca Sáng: 7h30-12h30, Ca Chiều Tối: 13h00-21h00). Nói không với cafe, bia rượu, thuốc lá.
- **Phong cách:** Cắm trại ngoài trời (Camping), dùng cỏ nhân tạo, bàn ghế gỗ xếp dã ngoại, quầy gỗ mộc mạc, đèn LED búp chanh.
`;

export const generatePlan = async (apiKey: string, newIdeas: string) => {
  if (!apiKey) {
    throw new Error("Vui lòng nhập API Key.");
  }
  const key = apiKey.trim();

  const prompt = `Bạn là một chuyên gia tư vấn chiến lược kinh doanh F&B. 
Dưới đây là thông tin cơ bản về dự án quán nước của chúng tôi:
${BASE_PLAN}

Các cổ đông vừa đóng góp thêm ý tưởng sau:
"${newIdeas}"

Hãy viết một bản kế hoạch kinh doanh ngắn gọn, hấp dẫn, tích hợp các ý tưởng mới này vào bản kế hoạch cơ sở một cách hợp lý. 
Sử dụng định dạng Markdown. Bao gồm các phần: 
1. Tóm tắt mô hình
2. Cập nhật chiến lược từ ý tưởng mới
3. Dự phóng rủi ro & giải pháp
Lưu ý: Viết thật chuyên nghiệp và thực tế.`;

  try {
    if (key.startsWith("AIza")) {
      // Gemini API
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      if (!response.ok) {
        const err = await response.json().catch(()=>({}));
        throw new Error(err.error?.message || "Lỗi API Gemini");
      }
      const data = await response.json();
      return data.candidates[0].content.parts[0].text;

    } else if (key.startsWith("gsk_")) {
      // Groq API
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }]
        })
      });
      if (!response.ok) {
        const err = await response.json().catch(()=>({}));
        throw new Error(err.error?.message || "Lỗi API Groq");
      }
      const data = await response.json();
      return data.choices[0].message.content;

    } else if (key.startsWith("sk-")) {
      // OpenAI API
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }]
        })
      });
      if (!response.ok) {
        const err = await response.json().catch(()=>({}));
        throw new Error(err.error?.message || "Lỗi API OpenAI");
      }
      const data = await response.json();
      return data.choices[0].message.content;

    } else {
      throw new Error("Mã API Key không hợp lệ. Hệ thống chỉ hỗ trợ Key của Gemini (AIza...), Groq (gsk_...) hoặc OpenAI (sk-...).");
    }
  } catch (error: any) {
    console.error("Lỗi khi gọi API:", error);
    throw new Error(error.message || "Đã xảy ra lỗi khi tạo kế hoạch.");
  }
};
