import "dotenv/config";
import { prisma } from "../src/modules/database";

async function main() {
  console.log("Bắt đầu tiến trình dọn dẹp và khôi phục dữ liệu Danh bạ...");

  // 1. Sửa các SĐT bị dính chùm (quá 11 số)
  const contacts = await prisma.lienHeCanHo.findMany({
    where: { so_dien_thoai: { not: null } },
  });

  let fixedCount = 0;
  for (const contact of contacts) {
    if (!contact.so_dien_thoai) continue;
    if (contact.so_dien_thoai.length > 11) {
      const sanitized = contact.so_dien_thoai.replace(/[\.\s\-]/g, "");
      const matches = sanitized.match(/0\d{9,10}/g) || [];
      if (matches.length > 0) {
        const correctPhone = matches[0];
        await prisma.lienHeCanHo.update({
          where: { id: contact.id },
          data: { so_dien_thoai: correctPhone },
        });
        fixedCount++;
      }
    }
  }
  console.log(`[BƯỚC 1] Đã cắt gọt và sửa lỗi thành công ${fixedCount} số điện thoại bị dính chùm.`);

  // 2. Khôi phục các SĐT phụ từ cột Ghi chú
  const allContacts = await prisma.lienHeCanHo.findMany({
    include: { can_ho: true },
  });

  let recoveredCount = 0;
  for (const contact of allContacts) {
    if (!contact.ghi_chu) continue;

    const sanitized = contact.ghi_chu.replace(/[\.\s\-]/g, "");
    const matches = sanitized.match(/0\d{9,10}/g) || [];

    const existingContacts = await prisma.lienHeCanHo.findMany({
      where: { can_ho_id: contact.can_ho_id },
    });
    const existingPhones = new Set(existingContacts.map(c => c.so_dien_thoai).filter(Boolean));

    for (const phone of matches) {
      if (!existingPhones.has(phone)) {
        await prisma.lienHeCanHo.create({
          data: {
            can_ho_id: contact.can_ho_id,
            ten_hien_thi: contact.ten_hien_thi, // Dùng lại tên cũ, BQT sẽ tự sửa lại nếu cần
            so_dien_thoai: phone,
            la_lien_he_chinh: false,
            nhan_thong_bao: false,
            vai_tro_lien_he: null,
            trang_thai_lien_he: "CAN_XAC_MINH",
            thu_tu_uu_tien: existingContacts.length + 1,
            nguon_du_lieu: "RECOVER_FROM_NOTE",
            co_can_ra_soat: true,
            ghi_chu: contact.ghi_chu,
          }
        });
        existingPhones.add(phone);
        existingContacts.push({} as any);
        recoveredCount++;
      }
    }
  }
  console.log(`[BƯỚC 2] Đã bóc tách và khôi phục thành công ${recoveredCount} số điện thoại phụ thành liên hệ mới.`);
  console.log("Hoàn tất toàn bộ tiến trình!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
