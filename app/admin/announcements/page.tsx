import { Bell, FileText } from "lucide-react";

import { createAnnouncementAction, updateAnnouncementStatusAction } from "@/app/admin/announcements/actions";
import { AdminFrame } from "@/components/admin/admin-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Notice } from "@/components/ui/notice";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { requireAdminRole } from "@/src/modules/auth/current-user";
import { prisma } from "@/src/modules/database";
import { formatVietnamDateTime } from "@/src/modules/shared/utils/date-time";

type AnnouncementsPageProps = {
  searchParams?: Promise<{
    created?: string;
    updated?: string;
    error?: string;
  }>;
};

function statusLabel(value: string) {
  if (value === "CONG_KHAI") return "Công khai";
  if (value === "AN") return "Ẩn";
  return "Nháp";
}

function message(params?: Awaited<AnnouncementsPageProps["searchParams"]>) {
  if (params?.created === "1") return "Đã tạo thông báo.";
  if (params?.updated === "1") return "Đã cập nhật trạng thái thông báo.";
  if (params?.error === "not_pdf") return "Chỉ hỗ trợ file PDF.";
  if (params?.error === "file_too_large") return "File PDF quá lớn. Giới hạn 10 MB.";
  if (params?.error) return "Dữ liệu thông báo không hợp lệ.";
  return null;
}

export default async function AnnouncementsPage({ searchParams }: AnnouncementsPageProps) {
  await requireAdminRole("SUPER_ADMIN");
  const params = await searchParams;
  const notice = message(params);
  const announcements = await prisma.thongBaoCongKhai.findMany({
    orderBy: { id: "desc" },
    take: 30,
    include: { nguoi_tao: { select: { ten_dang_nhap: true, ten_hien_thi: true } } },
  });

  return (
    <AdminFrame
      activeKey="announcements"
      badge="Quản trị cao nhất"
      title="Thông báo public"
      description="Đăng PDF/thông báo để cư dân xem từ trang chủ, không cần đăng nhập."
    >
      {notice ? (
        <Notice tone={params?.error ? "error" : "success"}>{notice}</Notice>
      ) : null}

      <Card className="mb-5 bg-white/90">
        <CardHeader>
          <Bell className="text-[var(--accent)]" size={22} aria-hidden="true" />
          <CardTitle>Tạo thông báo PDF</CardTitle>
          <CardDescription>Phase 2 chỉ nhận PDF, tối đa 10 MB/file.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createAnnouncementAction} className="grid gap-4 lg:grid-cols-2">
            <Label className="grid gap-2">
              Tiêu đề
              <Input name="title" required />
            </Label>
            <Label className="grid gap-2">
              File PDF
              <Input name="pdfFile" type="file" accept="application/pdf,.pdf" required />
            </Label>
            <Label className="grid gap-2 lg:col-span-2">
              Mô tả ngắn
              <Textarea name="description" rows={3} />
            </Label>
            <Label className="grid gap-2">
              Trạng thái
              <Select name="status" defaultValue="NHAP">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NHAP">Nháp</SelectItem>
                  <SelectItem value="CONG_KHAI">Công khai ngay</SelectItem>
                </SelectContent>
              </Select>
            </Label>
            <div className="flex items-end">
              <SubmitButton className="w-full lg:w-fit" pendingText="Đang tạo thông báo...">
                Tạo thông báo
              </SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {announcements.map((item) => (
          <Card key={item.id} className="bg-white/90">
            <CardContent className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <FileText size={18} className="text-[var(--accent)]" aria-hidden="true" />
                  <strong className="text-lg">{item.tieu_de}</strong>
                  <Badge variant={item.trang_thai === "CONG_KHAI" ? "success" : "secondary"}>{statusLabel(item.trang_thai)}</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.mo_ta_ngan || "Không có mô tả."}</p>
                <p className="mt-2 truncate text-xs text-[var(--muted)]">
                  File: {item.ten_file_goc || "-"} · Tạo bởi {item.nguoi_tao?.ten_hien_thi || item.nguoi_tao?.ten_dang_nhap || "-"} · {formatVietnamDateTime(item.ngay_tao)}
                </p>
                {item.duong_dan_file ? (
                  <a href={item.duong_dan_file} target="_blank" className="mt-2 inline-block text-sm font-semibold text-[var(--accent)] underline">
                    Mở PDF
                  </a>
                ) : null}
              </div>
              <form action={updateAnnouncementStatusAction} className="grid gap-2">
                <input type="hidden" name="id" value={item.id} />
                <Select name="status" defaultValue={item.trang_thai}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NHAP">Nháp</SelectItem>
                    <SelectItem value="CONG_KHAI">Công khai</SelectItem>
                    <SelectItem value="AN">Ẩn</SelectItem>
                  </SelectContent>
                </Select>
                <SubmitButton variant="secondary" pendingText="Đang cập nhật...">Cập nhật</SubmitButton>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminFrame>
  );
}
