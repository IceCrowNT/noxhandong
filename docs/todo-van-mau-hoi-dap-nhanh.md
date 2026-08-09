# Todo: Tinh nang Van mau / Hoi dap nhanh

## 1. Nghiep vu

- [ ] Them muc moi trong sidebar, nam duoi nhom `Co so du lieu`.
- [ ] Ten muc hien thi: `Van mau` hoac `Hoi dap nhanh`.
- [ ] Dung de luu cac doan text tra loi nhanh kem tieu de.
- [ ] Cho phep tim kiem theo tieu de, noi dung, nhom.
- [ ] Cho phep copy nhanh noi dung van mau.
- [ ] Uu tien an/xoa mem thay vi xoa cung de tranh mat du lieu.

## 2. Phan quyen

- [ ] Admin/Super Admin: xem, them, sua, an/xoa.
- [ ] Quan ly: xem, them, sua, an/xoa.
- [ ] Ky thuat: chi xem va copy noi dung.
- [ ] Kiem tra lai ten role thuc te trong DB/code truoc khi map quyen.
- [ ] An nut them/sua/xoa tren UI neu user khong co quyen.
- [ ] Van validate quyen o server action, khong chi dua vao UI.

## 3. Thiet ke bang DB

- [ ] Them enum trang thai van mau.
- [ ] Them model Prisma moi.
- [ ] Tao migration local bang:

```bash
npx prisma migrate dev --name add_quick_reply_templates
```

- [ ] Commit ca `schema.prisma` va folder migration moi.
- [ ] Tren VPS chi chay:

```bash
npx prisma migrate deploy
```

### Bang de xuat: `mau_van_ban_nhanh`

| Cot | Kieu | Y nghia |
| --- | --- | --- |
| `id` | `Int` | ID tu tang |
| `tieu_de` | `String` | Tieu de van mau |
| `noi_dung` | `Text` | Noi dung tra loi |
| `nhom` | `String?` | Nhom/chuyen muc |
| `trang_thai` | enum | `DANG_DUNG` / `DA_AN` |
| `thu_tu_hien_thi` | `Int` | Sap xep thu cong |
| `so_lan_su_dung` | `Int` | Dem so lan copy/dung |
| `nguoi_tao_id` | `Int?` | Tai khoan tao |
| `nguoi_cap_nhat_id` | `Int?` | Tai khoan sua gan nhat |
| `ngay_tao` | `DateTime` | Thoi diem tao |
| `ngay_cap_nhat` | `DateTime` | Thoi diem cap nhat |

## 4. Prisma model du kien

```prisma
enum TrangThaiMauVanBan {
  DANG_DUNG
  DA_AN
}

model MauVanBanNhanh {
  id                 Int                 @id @default(autoincrement())
  tieu_de            String
  noi_dung           String              @db.Text
  nhom               String?
  trang_thai         TrangThaiMauVanBan  @default(DANG_DUNG)
  thu_tu_hien_thi    Int                 @default(0)
  so_lan_su_dung     Int                 @default(0)
  nguoi_tao_id       Int?
  nguoi_cap_nhat_id  Int?
  ngay_tao           DateTime            @default(now())
  ngay_cap_nhat      DateTime            @updatedAt

  nguoi_tao          TaiKhoanQuanTri?    @relation("NguoiTaoMauVanBan", fields: [nguoi_tao_id], references: [id], onDelete: SetNull)
  nguoi_cap_nhat     TaiKhoanQuanTri?    @relation("NguoiCapNhatMauVanBan", fields: [nguoi_cap_nhat_id], references: [id], onDelete: SetNull)

  @@index([trang_thai, thu_tu_hien_thi])
  @@index([nhom])
  @@map("mau_van_ban_nhanh")
}
```

## 5. Backend actions

- [ ] `createQuickReplyTemplateAction`
- [ ] `updateQuickReplyTemplateAction`
- [ ] `archiveQuickReplyTemplateAction`
- [ ] `restoreQuickReplyTemplateAction` neu can khoi phuc mau da an.
- [ ] `incrementQuickReplyUsageAction` khi bam copy, neu can thong ke.
- [ ] Validate:
  - [ ] Tieu de khong rong.
  - [ ] Noi dung khong rong.
  - [ ] Role co quyen moi duoc them/sua/an.

## 6. UI trang quan tri

- [ ] Tao route moi, vi du: `/admin/quick-replies`.
- [ ] Dat menu duoi nhom `Co so du lieu`.
- [ ] Icon goi y: `MessageSquareText` hoac `FileText`.
- [ ] Layout dong bo theme hien tai: card gon, bang/list de scan.
- [ ] Thanh tim kiem.
- [ ] Filter theo nhom/trang thai.
- [ ] Nut `Copy` hien cho moi role duoc xem.
- [ ] Nut `Them van mau` chi hien voi Admin/Quan ly.
- [ ] Nut `Sua`, `An` chi hien voi Admin/Quan ly.

## 7. Form them/sua

- [ ] Input `Tieu de`.
- [ ] Input hoac Select `Nhom`.
- [ ] Textarea `Noi dung`.
- [ ] Switch/Select `Trang thai`.
- [ ] Input `Thu tu hien thi` neu can sap xep thu cong.
- [ ] Preview noi dung neu can.

## 8. Kiem thu

- [ ] Admin them/sua/an duoc van mau.
- [ ] Quan ly them/sua/an duoc van mau.
- [ ] Ky thuat xem va copy duoc, khong thay nut them/sua/an.
- [ ] User khong du quyen goi server action se bi chan.
- [ ] Tim kiem theo tieu de/noi dung hoat dong.
- [ ] Filter theo nhom/trang thai hoat dong.
- [ ] Noi dung dai khong vo layout.
- [ ] Migration local chay thanh cong.

## 9. Deploy VPS

- [ ] Backup DB VPS truoc khi deploy.
- [ ] Pull code moi len VPS.
- [ ] Chay:

```bash
npm install
npx prisma migrate deploy
npx prisma generate
```

- [ ] Build lai app.
- [ ] Restart service/PM2.
- [ ] Kiem tra trang Van mau tren VPS.
- [ ] Kiem tra role Ky thuat chi xem/copy.

