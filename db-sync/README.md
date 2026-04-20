# Đồng bộ database qua Git

Thư mục này dùng để lưu **logical snapshot** của database dev.

## Mục tiêu

- đồng bộ dữ liệu thử nghiệm giữa các máy cá nhân
- không commit toàn bộ `postgres-data`
- giữ repo nhẹ hơn và an toàn hơn so với copy data directory của PostgreSQL

## File chính

- `apartment_fee_reviewer.latest.sql`
- `apartment_fee_reviewer.latest.meta.json`

## Nguyên tắc

- chỉ giữ **1 snapshot mới nhất**
- snapshot này dùng cho môi trường dev/test nội bộ
- không lưu dữ liệu nhạy cảm nếu sau này hệ thống có dữ liệu thật

## Quy trình

### Backup DB hiện tại vào repo

```bash
bash scripts/setup/backup-db-to-repo.sh
```

### Commit snapshot nếu cần đồng bộ sang máy khác

```bash
git add db-sync
git commit -m "Cập nhật snapshot database dev"
git push
```

### Restore trên máy khác

```bash
bash scripts/setup/restore-db-from-repo.sh
```

## Lưu ý

- đây là phương án **đồng bộ dữ liệu dev**
- không phải chiến lược backup production
- nếu snapshot phình to quá mức, nên quay lại cách:
  - chỉ commit migrations
  - và import lại từ file Excel/sao kê mẫu
