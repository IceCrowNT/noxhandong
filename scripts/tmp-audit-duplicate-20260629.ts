import "dotenv/config";
import fs from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const statementPath = "C:\\Users\\IceCrow\\Desktop\\lich-su-giao-dich(01-07-2026 02_56_48).xls";
const exportPath =
  "D:\\VS code\\Quản lý nội bộ\\Nh-p-li-u-t--sao-k-\\.local\\exports\\So-theo-doi-thu-phi-T6-2026-FINAL.xlsx";

function viDate(value: Date | null | undefined) {
  if (!value) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(value);
}

function readRows(filePath: string) {
  if (!fs.existsSync(filePath)) {
    console.log(`MISSING FILE: ${filePath}`);
    return;
  }
  const workbook = XLSX.readFile(filePath, { cellDates: false });
  console.log(`\n== ${filePath}`);
  console.log(`Sheets: ${workbook.SheetNames.join(", ")}`);
  for (const sheetName of workbook.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], {
      defval: "",
      raw: false,
    });
    const matched = rows
      .map((row, index) => ({ index: index + 2, row, text: Object.values(row).join(" | ") }))
      .filter(({ text }) => /29[\/-]0?6[\/-]2026|01:41:06|164D0629|29RRBMVR1/i.test(text));
    if (matched.length > 0) {
      console.log(`\n-- Sheet ${sheetName}: ${matched.length} matched rows`);
      for (const item of matched) {
        console.log(`#${item.index}: ${item.text}`);
      }
    }
  }
}

async function main() {
  readRows(statementPath);
  readRows(exportPath);

  const from = new Date("2026-06-28T17:00:00.000Z");
  const to = new Date("2026-06-28T20:00:00.000Z");
  const transactions = await prisma.giaoDichNganHang.findMany({
    where: { ngay_giao_dich: { gte: from, lte: to } },
    orderBy: [{ ngay_giao_dich: "asc" }, { id: "asc" }],
    include: {
      lo_nhap_du_lieu: { select: { id: true, ten_file: true, thoi_diem_nhap: true } },
      phan_bo_giao_dich: { include: { can_ho: { select: { ma_can: true } } } },
      lich_su_dong_phi: { include: { can_ho: { select: { ma_can: true } } } },
    },
  });

  console.log("\n== DB giao_dich_ngan_hang around 29/06/2026 01:41:06 VN");
  for (const tx of transactions) {
    console.log({
      id: tx.id,
      ngay_vn: viDate(tx.ngay_giao_dich),
      so_tien: String(tx.so_tien),
      nguoi_chuyen: tx.ten_nguoi_chuyen,
      tham_chieu: tx.tham_chieu_ngan_hang,
      fingerprint: tx.van_tay_giao_dich,
      trang_thai: tx.trang_thai_duyet,
      lo_nhap: tx.lo_nhap_du_lieu && {
        id: tx.lo_nhap_du_lieu.id,
        file: tx.lo_nhap_du_lieu.ten_file,
        imported_vn: viDate(tx.lo_nhap_du_lieu.thoi_diem_nhap),
      },
      noi_dung: tx.noi_dung_goc,
      allocations: tx.phan_bo_giao_dich.map((item) => ({
        id: item.id,
        can: item.can_ho.ma_can,
        so_tien: String(item.so_tien_phan_bo),
      })),
      histories: tx.lich_su_dong_phi.map((item) => ({
        id: item.id,
        can: item.can_ho.ma_can,
        ky: item.ky_du_lieu,
        so_tien: String(item.so_tien),
        nguon: item.loai_nguon,
        batch: item.batch_phi_public_id,
        phan_bo: item.phan_bo_giao_dich_id,
        tao_vn: viDate(item.ngay_tao),
      })),
    });
  }

  const duplicateHistory = await prisma.$queryRaw<
    Array<{
      giao_dich_ngan_hang_id: number | null;
      can_ho_id: number;
      so_tien: unknown;
      loai_nguon: string;
      count: bigint;
      ids: string;
    }>
  >`
    select
      giao_dich_ngan_hang_id,
      can_ho_id,
      so_tien,
      loai_nguon,
      count(*) as count,
      string_agg(id::text, ',' order by id) as ids
    from lich_su_dong_phi_can_ho
    where ky_du_lieu in ('T6-2026', 'T6-2026+')
      and giao_dich_ngan_hang_id is not null
    group by giao_dich_ngan_hang_id, can_ho_id, so_tien, loai_nguon
    having count(*) > 1
    order by count(*) desc, giao_dich_ngan_hang_id
    limit 30
  `;
  console.log("\n== Duplicate history groups in June-like periods");
  console.table(
    duplicateHistory.map((row) => ({
      giao_dich_ngan_hang_id: row.giao_dich_ngan_hang_id,
      can_ho_id: row.can_ho_id,
      so_tien: String(row.so_tien),
      loai_nguon: row.loai_nguon,
      count: Number(row.count),
      ids: row.ids,
    })),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
