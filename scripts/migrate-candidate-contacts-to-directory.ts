import { TrangThaiLienHe, VaiTroLienHe } from "@prisma/client";

import { prisma } from "@/src/modules/database";

type CandidateRecord = Awaited<ReturnType<typeof loadCandidates>>[number];

type MergedContact = {
  apartmentId: number;
  maCan: string;
  displayName: string;
  phoneNumber: string | null;
  isPrimaryHint: boolean;
  receivesNotification: boolean;
  role: VaiTroLienHe | null;
  status: TrangThaiLienHe;
  sourceRawId: number | null;
  noteParts: string[];
};

function normalizeText(value: string | null | undefined) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUpper(value: string | null | undefined) {
  return normalizeText(value).toUpperCase();
}

function normalizePhone(value: string | null | undefined) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits || null;
}

function extractPhoneCandidates(...values: Array<string | null | undefined>) {
  const phones = new Set<string>();
  for (const value of values) {
    const sanitized = String(value || "").replace(/[\.\s\-]/g, "");
    const matches = sanitized.match(/0\d{9,10}/g) || [];
    for (const match of matches) {
      phones.add(match);
    }
  }
  return [...phones];
}

function compactNoteParts(parts: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of parts) {
    const normalized = normalizeText(part);
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }
  return result;
}

function inferDisplayName(candidate: CandidateRecord, fallbackOwner: string | null) {
  const displayName = [
    candidate.ten_hien_thi_parse,
    candidate.ten_nguoi_su_dung_goc,
    candidate.ten_chu_ho_goc,
    fallbackOwner,
  ]
    .map((value) => normalizeText(value))
    .find(Boolean);

  return displayName || "Chưa rõ tên";
}

function inferPhone(candidate: CandidateRecord) {
  const direct = normalizePhone(candidate.so_dien_thoai_parse) || normalizePhone(candidate.so_dien_thoai_goc);
  if (direct) return direct;
  return extractPhoneCandidates(candidate.thong_tin_cu_dan_goc, candidate.thong_tin_phu_goc, candidate.ghi_chu_goc)[0] || null;
}

function inferRole(candidate: CandidateRecord, displayName: string, fallbackOwner: string | null) {
  if (candidate.vai_tro_du_doan) return candidate.vai_tro_du_doan;
  const owner = normalizeUpper(candidate.ten_chu_ho_goc || fallbackOwner);
  if (owner && normalizeUpper(displayName) === owner) {
    return "CHU_HO";
  }
  return null;
}

function inferStatus(candidate: CandidateRecord) {
  return candidate.co_can_ra_soat ? "CAN_XAC_MINH" : "DANG_DUNG";
}

function buildContactNote(candidate: CandidateRecord) {
  return compactNoteParts([
    candidate.thong_tin_cu_dan_goc ? `Nguồn gốc: ${candidate.thong_tin_cu_dan_goc}` : null,
    candidate.thong_tin_phu_goc ? `Thông tin phụ: ${candidate.thong_tin_phu_goc}` : null,
    candidate.trang_thai_su_dung_goc ? `Trạng thái sử dụng: ${candidate.trang_thai_su_dung_goc}` : null,
    candidate.tinh_trang_goc ? `Tình trạng: ${candidate.tinh_trang_goc}` : null,
    candidate.ghi_chu_goc ? `Ghi chú gốc: ${candidate.ghi_chu_goc}` : null,
    candidate.ly_do_ra_soat ? `Rà soát: ${candidate.ly_do_ra_soat}` : null,
    candidate.ghi_chu_nghiep_vu ? `Nghiệp vụ: ${candidate.ghi_chu_nghiep_vu}` : null,
  ]);
}

async function loadCandidates() {
  return prisma.ungVienLienHeCanHo.findMany({
    orderBy: [{ ma_can: "asc" }, { id: "asc" }],
    select: {
      id: true,
      ma_can: true,
      ten_chu_ho_goc: true,
      thong_tin_cu_dan_goc: true,
      thu_tu_nguon: true,
      ten_nguoi_su_dung_goc: true,
      so_dien_thoai_goc: true,
      thong_tin_phu_goc: true,
      trang_thai_su_dung_goc: true,
      tinh_trang_goc: true,
      ghi_chu_goc: true,
      ten_hien_thi_parse: true,
      so_dien_thoai_parse: true,
      la_lien_he_chinh_du_doan: true,
      vai_tro_du_doan: true,
      nhan_thong_bao_du_doan: true,
      co_can_ra_soat: true,
      ly_do_ra_soat: true,
      ghi_chu_nghiep_vu: true,
      dong_du_lieu_tho_id: true,
    },
  });
}

async function main() {
  const replace = process.argv.includes("--replace");
  const officialCount = await prisma.lienHeCanHo.count();
  if (officialCount > 0 && !replace) {
    throw new Error(
      `Bảng lien_he_can_ho đang có ${officialCount} dòng. Dùng --replace nếu muốn xóa và migrate lại.`,
    );
  }

  const [apartments, candidates] = await Promise.all([
    prisma.canHo.findMany({
      select: {
        id: true,
        ma_can: true,
        chu_ho_ten_goc: true,
      },
    }),
    loadCandidates(),
  ]);

  const apartmentMap = new Map(
    apartments.map((apartment) => [normalizeUpper(apartment.ma_can), apartment]),
  );

  const grouped = new Map<number, Map<string, MergedContact>>();
  let skippedNoApartment = 0;
  let skippedNoIdentity = 0;

  for (const candidate of candidates) {
    const apartment = apartmentMap.get(normalizeUpper(candidate.ma_can));
    if (!apartment) {
      skippedNoApartment += 1;
      continue;
    }

    const displayName = inferDisplayName(candidate, apartment.chu_ho_ten_goc);
    const phoneNumber = inferPhone(candidate);
    const dedupeKey = `${normalizeUpper(displayName)}|${phoneNumber || ""}`;
    if (!displayName && !phoneNumber) {
      skippedNoIdentity += 1;
      continue;
    }

    const perApartment = grouped.get(apartment.id) || new Map<string, MergedContact>();
    const existing = perApartment.get(dedupeKey);
    const role = inferRole(candidate, displayName, apartment.chu_ho_ten_goc);
    const noteParts = buildContactNote(candidate);

    if (existing) {
      existing.isPrimaryHint ||= candidate.la_lien_he_chinh_du_doan;
      existing.receivesNotification ||= candidate.nhan_thong_bao_du_doan ?? false;
      existing.role ||= role;
      existing.status =
        existing.status === "CAN_XAC_MINH" || inferStatus(candidate) === "CAN_XAC_MINH"
          ? "CAN_XAC_MINH"
          : "DANG_DUNG";
      existing.sourceRawId ||= candidate.dong_du_lieu_tho_id;
      existing.noteParts = compactNoteParts([...existing.noteParts, ...noteParts]);
    } else {
      perApartment.set(dedupeKey, {
        apartmentId: apartment.id,
        maCan: apartment.ma_can,
        displayName,
        phoneNumber,
        isPrimaryHint: candidate.la_lien_he_chinh_du_doan,
        receivesNotification: candidate.nhan_thong_bao_du_doan ?? true,
        role,
        status: inferStatus(candidate),
        sourceRawId: candidate.dong_du_lieu_tho_id,
        noteParts,
      });
    }

    grouped.set(apartment.id, perApartment);
  }

  const rowsToCreate: Array<{
    can_ho_id: number;
    ten_hien_thi: string;
    so_dien_thoai: string | null;
    la_lien_he_chinh: boolean;
    nhan_thong_bao: boolean;
    vai_tro_lien_he: VaiTroLienHe | null;
    trang_thai_lien_he: TrangThaiLienHe;
    thu_tu_uu_tien: number;
    nguon_du_lieu: string;
    nguon_dong_du_lieu_tho_id: number | null;
    co_can_ra_soat: boolean;
    ghi_chu: string | null;
  }> = [];

  for (const [apartmentId, contactMap] of grouped) {
    const contacts = [...contactMap.values()];
    const apartment = apartments.find((item) => item.id === apartmentId) || null;

    contacts.sort((left, right) => {
      const primaryDelta = Number(right.isPrimaryHint) - Number(left.isPrimaryHint);
      if (primaryDelta !== 0) return primaryDelta;
      return left.displayName.localeCompare(right.displayName, "vi");
    });

    const primaryIndex = contacts.findIndex((contact) => contact.isPrimaryHint);
    const ownerIndex =
      primaryIndex === -1 && apartment?.chu_ho_ten_goc
        ? contacts.findIndex(
            (contact) => normalizeUpper(contact.displayName) === normalizeUpper(apartment.chu_ho_ten_goc),
          )
        : -1;
    const chosenPrimaryIndex = primaryIndex >= 0 ? primaryIndex : ownerIndex >= 0 ? ownerIndex : 0;

    contacts.forEach((contact, index) => {
      rowsToCreate.push({
        can_ho_id: apartmentId,
        ten_hien_thi: contact.displayName,
        so_dien_thoai: contact.phoneNumber,
        la_lien_he_chinh: index === chosenPrimaryIndex,
        nhan_thong_bao: contact.receivesNotification,
        vai_tro_lien_he: contact.role,
        trang_thai_lien_he: contact.status,
        thu_tu_uu_tien: index + 1,
        nguon_du_lieu: "MIGRATE_UNG_VIEN_LIEN_HE_CAN_HO",
        nguon_dong_du_lieu_tho_id: contact.sourceRawId,
        co_can_ra_soat: contact.status === "CAN_XAC_MINH",
        ghi_chu: contact.noteParts.length ? contact.noteParts.join(" | ") : null,
      });
    });
  }

  await prisma.$transaction(async (tx) => {
    if (officialCount > 0 && replace) {
      await tx.lienHeCanHo.deleteMany({});
    }

    if (rowsToCreate.length) {
      await tx.lienHeCanHo.createMany({ data: rowsToCreate });
    }
  });

  const finalCount = await prisma.lienHeCanHo.count();

  console.log(
    JSON.stringify(
      {
        officialCountBefore: officialCount,
        officialCountAfter: finalCount,
        candidateCount: candidates.length,
        apartmentCount: apartments.length,
        migratedRows: rowsToCreate.length,
        apartmentsWithContacts: grouped.size,
        skippedNoApartment,
        skippedNoIdentity,
      },
      null,
      2,
    ),
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
