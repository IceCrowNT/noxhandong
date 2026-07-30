"use server";

export async function submitResidentFeedbackAction(formData: FormData) {
  try {
    // Giả lập thời gian xử lý
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const apartmentCode = formData.get("apartmentCode") as string;
    const category = formData.get("category") as string;
    const content = formData.get("content") as string;
    const phoneNumber = formData.get("phoneNumber") as string;

    if (!apartmentCode || apartmentCode.trim().length === 0) {
      throw new Error("Vui lòng nhập mã căn hộ");
    }
    if (!category || category.trim().length === 0) {
      throw new Error("Vui lòng chọn loại phản ánh");
    }
    if (!content || content.trim().length < 5) {
      throw new Error("Nội dung phản ánh quá ngắn");
    }

    const message = `🚨 CÓ PHẢN ÁNH MỚI TỪ CƯ DÂN 🚨
🏠 Căn hộ: ${apartmentCode}
📞 SĐT liên hệ: ${phoneNumber || "Không cung cấp"}
🏷 Loại sự cố: ${category}
📝 Nội dung:
${content}
`;

    // TODO: Thực tế sẽ dùng fetch() để gọi Zalo ZNS Webhook hoặc Telegram Bot API ở đây.
    console.log("=== SENT TO WEBHOOK ===");
    console.log(message);
    console.log("=======================");

    return { success: true, message: "Gửi phản ánh thành công! Ban Quản Lý đã ghi nhận thông tin của bạn." };
  } catch (error: any) {
    console.error("Lỗi khi gửi phản ánh:", error);
    return { success: false, error: error.message || "Đã xảy ra lỗi hệ thống, vui lòng thử lại sau." };
  }
}
