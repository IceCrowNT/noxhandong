export const MANAGEMENT_SHEET_NAMES = {
  customers: "Danh sách khách hàng",
  paymentHistory: "Lịch sử đóng phí",
  misc: [
    "Sheet1",
    "Khách ck nhầm vào tk An Điền",
    "Khách nộp bổ sung nợ vàoAn Điền"
  ]
};

export const DEFAULT_CUSTOMER_COLUMN_ALIASES = {
  apartmentCode: [
    "mã căn hộ",
    "ma can ho",
    "mã căn",
    "ma can",
    "số căn hộ",
    "so can ho",
    "số căn",
    "so can"
  ],
  ownerName: ["họ và tên chủ hộ", "ho va ten chu ho", "chủ hộ", "chu ho"],
  residentInfo: ["thông tin cư dân", "thong tin cu dan"],
  status: ["tình trạng", "tinh trang"],
  note: ["ghi chú", "ghi chu"]
} as const;

export const DEFAULT_STATEMENT_COLUMN_ALIASES = {
  transactionDate: ["ngày giao dịch", "ngay giao dich", "date", "posting date"],
  amount: ["số tiền", "so tien", "amount", "credit", "ghi có", "ghi co"],
  description: ["nội dung", "noi dung", "description", "details", "diễn giải", "dien giai"],
  senderName: ["tên người chuyển", "ten nguoi chuyen", "sender name", "name"],
  senderAccount: ["tài khoản chuyển", "tai khoan chuyen", "sender account", "account"],
  transactionId: ["mã giao dịch", "ma giao dich", "transaction id", "ref", "reference"]
} as const;
