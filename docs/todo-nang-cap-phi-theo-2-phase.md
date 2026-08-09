# Todo nang cap quy tac phi theo 2 phase

Muc tieu: chuan bi he thong cho viec tang/doi phi trong tuong lai, nhung khong lam xao tron quy trinh van hanh hien tai. Phase 1 uu tien nang loi tinh toan va giu UI quan ly phi o trang thai an. Phase 2 chi mo khi BQT co ke hoach thay doi phi chinh thuc.

## Phase 1 - Nang loi tinh phi, giu van hanh hien tai

Trang thai DB mong muon: khong tao bang moi, khong migrate schema. Chi doc bang `quy_tac_phi` hien co.

- [ ] Kiem tra du lieu hien tai trong `quy_tac_phi`.
  - Co rule `QLVH` cho `CHUNG_CU`.
  - Co rule `QLVH` cho `LIEN_KE`.
  - Rule hien tai co `hieu_luc_tu_ngay` hop le.
  - Rule hien tai co `hieu_luc_den_ngay = NULL`.
  - Khong co rule cung `loai_can + ma_phi` bi chong lan thoi gian.

- [ ] Tao helper tinh phi theo ky hieu luc.
  - Lay muc phi theo `loai_can`, `ma_phi`, va thang can tinh.
  - Hieu `hieu_luc_den_ngay = NULL` la con hieu luc vo thoi han.
  - Co helper tra ve lich phi tung thang trong mot khoang.
  - Bao loi ro neu thieu rule phi cho thang can tinh.

- [ ] Thay logic `unitFee` co dinh trong tinh "thang da dong den".
  - Tinh tien theo tung thang.
  - Neu chua co rule moi, ket qua phai giong logic cu.
  - Giu `remainderAmount` neu so tien con du/chua du cho thang tiep theo.

- [ ] Cap nhat luong tao public preview.
  - Preview van thao tac nhu hien tai.
  - Payload co the luu them thong tin audit noi bo: lich phi da dung, rule id, remainder.
  - Khong lam lui `paidThrough` cua can neu du lieu public cu/moi bi lech ky.

- [ ] Cap nhat thong bao thu phi.
  - Khong tinh `totalFee = monthlyFee * 6`.
  - Tinh tong phi bang cach cong phi tung thang.
  - Neu 6 thang deu cung muc phi, UI/file xuat van co the hien nhu hien tai.
  - Neu sau nay cat qua moc tang phi, co san du lieu de hien chi tiet theo thang.

- [ ] Cap nhat duyet sao ke va goi y phan bo.
  - Dung muc phi theo thoi diem giao dich/ky phi lien quan.
  - Khong dung muc phi hien tai de suy dien giao dich qua khu/tuong lai.
  - Giao dich co noi dung mo ho hoac dong nhieu can van can canh bao nhu hien tai.

- [ ] Cap nhat bao cao/export lien quan den phi.
  - Bao cao tien do van dua tren `paidThrough`.
  - Cac file xuat neu can so tien phi phai doc tu helper moi.
  - Khong de config/hardcode `250000`/`200000` thanh nguon tinh phi chinh.

- [ ] Giu UI quan ly quy tac phi o trang thai an.
  - Khong them menu moi cho nguoi dung.
  - Khong cho them/sua/xoa rule phi tu giao dien.
  - Neu can cap nhat rule sau nay, dung script noi bo truoc.

- [ ] Them test hoi quy.
  - Du lieu phi hien tai cho ket qua giong code cu.
  - Chung cu 250.000d/thang van tinh dung.
  - Lien ke 200.000d/thang van tinh dung.
  - Thieu rule phi thi bao loi, khong fallback im lang.

- [ ] Them test gia lap tang phi T1/2027.
  - Chung cu: T9-T12/2026 tinh 250.000d, T1-T2/2027 tinh 300.000d.
  - Lien ke: T9-T12/2026 tinh 200.000d, T1-T2/2027 tinh 250.000d.
  - Giao dich dong vat nam tinh dung "thang da dong den".
  - So tien le duoc giu dung vao `remainderAmount`.

Tieu chi xong Phase 1:

- [ ] Van hanh hien tai khong doi.
- [ ] Khong can migrate DB.
- [ ] Ket qua tinh phi voi rule hien tai khong lech so voi truoc.
- [ ] Code da san sang cho viec them rule phi tuong lai.

## Phase 2 - Mo quan tri thay doi phi khi co quyet dinh chinh thuc

Trang thai DB co the can cap nhat du lieu, nhung chua chac can sua schema. Chi can migration neu them audit table/constraint DB.

- [ ] Tao/bat menu `Quy tac phi` duoi nhom `Co so du lieu`.
- [ ] Phan quyen:
  - Admin va quan ly duoc them/sua/vo hieu hoa rule.
  - Ky thuat chi duoc xem.

- [ ] Xay UI danh sach rule phi.
  - Loai can.
  - Ma phi.
  - So tien.
  - Hieu luc tu ngay.
  - Hieu luc den ngay.
  - Trang thai.
  - Ghi chu.

- [ ] Xay form them/sua rule phi.
  - Chan so tien <= 0.
  - Chan ngay ket thuc nho hon ngay bat dau.
  - Chan rule chong lan thoi gian.
  - Co tuy chon dong rule cu khi them rule moi.

- [ ] Them script cap nhat phi noi bo.
  - Dong rule cu bang `hieu_luc_den_ngay`.
  - Them rule moi tu ngay hieu luc.
  - Idempotent: chay lai khong tao trung.
  - Co log ket qua truoc/sau.

- [ ] Neu tang phi them 50.000d tu T1/2027, du lieu ky vong:
  - `CHUNG_CU`, `QLVH`, `250000`, tu `2026-01-01`, den `2026-12-31`.
  - `LIEN_KE`, `QLVH`, `200000`, tu `2026-01-01`, den `2026-12-31`.
  - `CHUNG_CU`, `QLVH`, `300000`, tu `2027-01-01`, den `NULL`.
  - `LIEN_KE`, `QLVH`, `250000`, tu `2027-01-01`, den `NULL`.

- [ ] Them man kiem tra thu.
  - Chon loai can/can ho.
  - Chon khoang thang.
  - Hien so phi tung thang va tong tien.

- [ ] Them audit neu can.
  - Ai thay doi.
  - Thoi diem thay doi.
  - Noi dung thay doi.
  - Ly do/ghi chu.

- [ ] Quy trinh deploy VPS.
  - Backup DB.
  - Deploy code.
  - Chay script/migration neu co.
  - Verify rule phi tren production.
  - Test mot can chung cu va mot can lien ke.
  - Tao preview thu truoc khi public that.

Tieu chi xong Phase 2:

- [ ] Admin/quan ly cap nhat duoc rule phi tu UI hoac script noi bo.
- [ ] Rule phi moi khong chong lan rule cu.
- [ ] Cac tinh nang tinh phi tu dong nhan rule moi theo ngay hieu luc.
- [ ] Co the rollback rule moi neu nhap sai.
