export const FILTER_RULES = {
  hardInternalKeywords: [
    "TRA LAI TAI KHOAN",
    "DDA",
    "BHXH",
    "BHYT",
    "BHTN",
    "LUONG",
    "THU LAO"
  ],
  softInternalKeywords: ["BQT", "NOXH", "BAN QUAN TRI"],
  genericNonApartmentKeywords: [
    "CHUYEN KHOAN NHANH",
    "QUA ZALO",
    "CHUYEN KHOAN",
    "CK NHANH",
    "NHANH QUA",
    "NAP TIEN",
    "HOAN TIEN"
  ],
  apartmentContextKeywords: [
    "CAN",
    "CAN HO",
    "PHI",
    "QLVH",
    "QLCC",
    "DONG",
    "NOP",
    "THANG",
    "CHUNG CU",
    "CC"
  ],
  residentPaymentKeywords: [
    "PHI",
    "QLVH",
    "QLCC",
    "PQLCC",
    "CAN HO",
    "CHUNG CU",
    "NOP PHI",
    "DONG PHI",
    "TU THANG",
    "DEN THANG"
  ],
  minimumResidentAmount: 100000
} as const;

