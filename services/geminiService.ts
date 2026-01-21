
import { GoogleGenAI } from "@google/genai";
import { Expense } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const getFinancialAdvice = async (expenses: Expense[], budgetLimit: number) => {
  if (expenses.length === 0) return "Hãy bắt đầu nhập chi tiêu để tôi có thể tư vấn cho bạn!";

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const expenseSummary = expenses
    .map(e => `- ${e.date}: ${e.category} - ${e.amount.toLocaleString('vi-VN')} VND (${e.note})`)
    .join("\n");

  const prompt = `
    Bạn là một chuyên gia quản lý tài chính cá nhân. 
    Dữ liệu chi tiêu:
    - Tổng chi tiêu: ${total.toLocaleString('vi-VN')} VND
    - Ngân sách mục tiêu: ${budgetLimit.toLocaleString('vi-VN')} VND
    - Chi tiết:
    ${expenseSummary}

    Nhiệm vụ:
    1. Đánh giá tình hình chi tiêu so với ngân sách (ngắn gọn).
    2. Chỉ ra 1 hạng mục lãng phí nhất.
    3. Đưa ra 3 hành động cụ thể để tiết kiệm trong tuần tới.
    
    Yêu cầu: Trả lời bằng tiếng Việt, thân thiện, súc tích, dùng icon phù hợp.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Tôi không thể phân tích dữ liệu lúc này.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Đã có lỗi xảy ra khi kết nối với trợ lý AI.";
  }
};
