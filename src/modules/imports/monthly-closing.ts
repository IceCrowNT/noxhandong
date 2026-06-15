import { prisma } from "@/src/modules/database";

function payloadNumber(payload: unknown, key: string) {
  if (!payload || typeof payload !== "object") return 0;
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export async function createMonthlyClosingLedgerFromPublicBatch(input: {
  publicBatchId: number;
  source: "EXCEL_CHOT" | "SAO_KE_DA_DUYET";
  accountId: number;
  importBatchId?: number;
  fileName?: string;
  closingCutoffAt?: Date | null;
  note?: string;
}) {
  const batch = await prisma.batchTrangThaiPhiPublic.findUnique({
    where: { id: input.publicBatchId },
    include: {
      trang_thai_phi: {
        select: {
          can_ho_id: true,
          ma_can: true,
          thang_da_dong_den_hien_tai: true,
          ghi_chu_public: true,
          payload_public_json: true,
        },
      },
    },
  });

  if (!batch || batch.so_chot_thang_id || !batch.trang_thai_phi.length) return;

  await prisma.$transaction(async (tx) => {
    const closing = await tx.soChotThang.create({
      data: {
        ky_du_lieu: batch.ky_du_lieu,
        lo_excel_chot_id: input.source === "EXCEL_CHOT" ? input.importBatchId : null,
        lo_sao_ke_id: input.source === "SAO_KE_DA_DUYET" ? input.importBatchId : null,
        ten_file_excel_chot: input.source === "EXCEL_CHOT" ? input.fileName : null,
        tong_so_can: batch.trang_thai_phi.length,
        so_can_khop: batch.trang_thai_phi.length,
        so_can_can_ra_soat: 0,
        trang_thai: "DA_CHOT",
        ghi_chu: input.note || null,
        nguoi_chot_id: input.accountId,
        ngay_chot: new Date(),
        metadata_json: {
          publicBatchId: batch.id,
          source: input.source,
          createdFrom: "admin_import_page",
          chotDenThoiDiem: input.closingCutoffAt?.toISOString() || null,
        },
      },
    });

    await tx.soChotCanHo.createMany({
      data: batch.trang_thai_phi.map((item) => ({
        so_chot_thang_id: closing.id,
        can_ho_id: item.can_ho_id,
        ma_can: item.ma_can,
        thang_da_dong_den_hien_tai: item.thang_da_dong_den_hien_tai,
        so_du_chua_du_thang: payloadNumber(item.payload_public_json, "remainderAmount"),
        nguon: input.source,
        ghi_chu: item.ghi_chu_public,
        payload_json: item.payload_public_json ?? undefined,
      })),
    });

    await tx.batchTrangThaiPhiPublic.update({
      where: { id: batch.id },
      data: { so_chot_thang_id: closing.id },
    });
  });
}
