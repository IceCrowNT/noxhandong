import Link from "next/link";
import { CheckCircle2, ClipboardList, Clock, Filter, ListChecks, Pencil, Trash2 } from "lucide-react";
import type { Prisma } from "@prisma/client";
import type { ReactNode } from "react";

import {
  closeOperationTaskAction,
  createOperationTaskAction,
  deleteOperationTaskAction,
  markOperationTaskDoneAction,
  updateOperationTaskAction,
} from "@/app/admin/operation-tasks/actions";
import { AdminFrame, ScrollPanel } from "@/components/admin/admin-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { requirePermission } from "@/src/modules/auth/current-user";
import { hasPermission } from "@/src/modules/auth/permissions";
import { prisma } from "@/src/modules/database";
import {
  OPERATION_TASK_CLOSE_STATUSES,
  OPERATION_TASK_DEPARTMENTS,
  operationTaskCloseStatusLabel,
  operationTaskComputedStatus,
  operationTaskDepartmentLabel,
  operationTaskLogActionLabel,
  parseOperationTaskSortKey,
  parseOperationTaskStatusFilter,
  parseSortDirection,
  type OperationTaskSortKey,
  type OperationTaskStatusFilter,
  type SortDirection,
} from "@/src/modules/operation-tasks/operation-tasks";
import { adminRoleLabel } from "@/src/modules/shared/labels";
import { formatVietnamDateTime } from "@/src/modules/shared/utils/date-time";

type OperationTasksPageProps = {
  searchParams?: Promise<{
    status?: string;
    department?: string;
    sort?: string;
    dir?: string;
    created?: string;
    updated?: string;
    reported?: string;
    closed?: string;
    deleted?: string;
    error?: string;
  }>;
};

function getStatusMessage(params?: Awaited<OperationTasksPageProps["searchParams"]>) {
  if (params?.created === "1") return "Đã tạo công việc vận hành.";
  if (params?.updated === "1") return "Đã cập nhật công việc.";
  if (params?.reported === "1") return "Đã báo xong, chờ quản trị nghiệm thu.";
  if (params?.closed === "1") return "Đã đóng công việc.";
  if (params?.deleted === "1") return "Đã xóa công việc.";
  if (params?.error === "invalid") return "Dữ liệu không hợp lệ. Vui lòng kiểm tra tên công việc, bộ phận và deadline.";
  if (params?.error === "not_found") return "Không tìm thấy công việc hoặc công việc đã đóng/xóa.";
  return null;
}

function vietnamDateTimeInputValue(value: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(value);
  const get = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

function departmentFilter(value: string | null | undefined) {
  return value === "KY_THUAT" || value === "VE_SINH" ? value : "all";
}

function taskWhere(status: OperationTaskStatusFilter, department: string, now: Date): Prisma.CongViecVanHanhWhereInput {
  const where: Prisma.CongViecVanHanhWhereInput = { da_xoa: false };
  if (department === "KY_THUAT" || department === "VE_SINH") {
    where.bo_phan = department;
  }

  if (status === "open") {
    where.trang_thai_dong = "DANG_MO";
  } else if (status === "waiting-review") {
    where.trang_thai_dong = "DANG_MO";
    where.da_bao_xong = true;
  } else if (status === "overdue") {
    where.trang_thai_dong = "DANG_MO";
    where.deadline = { lt: now };
  } else if (status === "closed") {
    where.trang_thai_dong = { not: "DANG_MO" };
  }

  return where;
}

function taskOrderBy(sort: OperationTaskSortKey, dir: SortDirection): Prisma.CongViecVanHanhOrderByWithRelationInput[] {
  if (sort === "assignedAt") return [{ thoi_diem_giao_viec: dir }];
  if (sort === "task") return [{ ten_cong_viec: dir }];
  if (sort === "department") return [{ bo_phan: dir }];
  if (sort === "deadline") return [{ deadline: dir }];
  if (sort === "status") return [{ trang_thai_dong: dir }, { da_bao_xong: dir }];
  return [{ deadline: "asc" }, { stt_hien_thi: "asc" }, { ngay_tao: "desc" }];
}

function buildHref(params: {
  status: OperationTaskStatusFilter;
  department: string;
  sort: OperationTaskSortKey;
  dir: SortDirection;
  nextStatus?: OperationTaskStatusFilter;
  nextDepartment?: string;
  nextSort?: OperationTaskSortKey;
}) {
  const nextSort = params.nextSort || params.sort;
  const nextDir = params.nextSort && params.nextSort === params.sort && params.dir === "asc" ? "desc" : "asc";
  const query = new URLSearchParams({
    status: params.nextStatus || params.status,
    department: params.nextDepartment || params.department,
    sort: nextSort,
    dir: params.nextSort ? nextDir : params.dir,
  });
  return `/admin/operation-tasks?${query.toString()}`;
}

function SelectBox({
  name,
  defaultValue,
  children,
  className = "",
}: {
  name: string;
  defaultValue: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <select
      className={`h-9 rounded-md border border-[var(--line)] bg-white px-3 py-1 text-sm text-[var(--text)] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] ${className}`}
      defaultValue={defaultValue}
      name={name}
    >
      {children}
    </select>
  );
}

function SortHead({
  label,
  column,
  status,
  department,
  sort,
  dir,
}: {
  label: string;
  column: OperationTaskSortKey;
  status: OperationTaskStatusFilter;
  department: string;
  sort: OperationTaskSortKey;
  dir: SortDirection;
}) {
  return (
    <TableHead>
      <Link
        className="inline-flex items-center gap-1 text-[var(--text)] hover:text-[var(--accent)]"
        href={buildHref({ status, department, sort, dir, nextSort: column })}
      >
        {label}
        {sort === column ? <span className="text-xs text-[var(--muted)]">{dir === "asc" ? "↑" : "↓"}</span> : null}
      </Link>
    </TableHead>
  );
}

function StatusBadge({ task, now }: { task: { deadline: Date; da_bao_xong: boolean; trang_thai_dong: any }; now: Date }) {
  const label = operationTaskComputedStatus(task, now);
  const variant =
    task.trang_thai_dong !== "DANG_MO"
      ? "secondary"
      : task.da_bao_xong
        ? "success"
        : task.deadline.getTime() < now.getTime()
          ? "destructive"
          : "warning";
  return <Badge variant={variant}>{label}</Badge>;
}

export default async function OperationTasksPage({ searchParams }: OperationTasksPageProps) {
  const account = await requirePermission("VIEW_OPERATION_TASKS");
  const params = await searchParams;
  const status = parseOperationTaskStatusFilter(params?.status);
  const department = departmentFilter(params?.department);
  const sort = parseOperationTaskSortKey(params?.sort);
  const dir = parseSortDirection(params?.dir);
  const canManage = hasPermission(account.vai_tro, "MANAGE_OPERATION_TASKS");
  const now = new Date();
  const statusMessage = getStatusMessage(params);
  const isError = Boolean(params?.error);

  const [tasks, counts, logs] = await Promise.all([
    prisma.congViecVanHanh.findMany({
      where: taskWhere(status, department, now),
      orderBy: taskOrderBy(sort, dir),
      include: {
        nguoi_tao: { select: { ten_dang_nhap: true, ten_hien_thi: true } },
        nguoi_bao_xong: { select: { ten_dang_nhap: true, ten_hien_thi: true } },
        nguoi_dong: { select: { ten_dang_nhap: true, ten_hien_thi: true } },
      },
      take: 200,
    }),
    Promise.all([
      prisma.congViecVanHanh.count({ where: { da_xoa: false, trang_thai_dong: "DANG_MO" } }),
      prisma.congViecVanHanh.count({ where: { da_xoa: false, trang_thai_dong: "DANG_MO", da_bao_xong: true } }),
      prisma.congViecVanHanh.count({ where: { da_xoa: false, trang_thai_dong: "DANG_MO", deadline: { lt: now } } }),
      prisma.congViecVanHanh.count({ where: { da_xoa: false, trang_thai_dong: { not: "DANG_MO" } } }),
    ]),
    prisma.nhatKyCongViecVanHanh.findMany({
      orderBy: { thoi_diem: "desc" },
      take: 12,
      include: {
        cong_viec: { select: { ten_cong_viec: true, bo_phan: true } },
        nguoi_thuc_hien: { select: { ten_dang_nhap: true, ten_hien_thi: true } },
      },
    }),
  ]);

  const [openCount, waitingReviewCount, overdueCount, closedCount] = counts;
  const filters = [
    { key: "open", label: "Đang mở", value: openCount, icon: ClipboardList },
    { key: "waiting-review", label: "Chờ nghiệm thu", value: waitingReviewCount, icon: CheckCircle2 },
    { key: "overdue", label: "Quá deadline", value: overdueCount, icon: Clock },
    { key: "closed", label: "Đã đóng", value: closedCount, icon: ListChecks },
  ] as const;

  return (
    <AdminFrame
      activeKey="operation-tasks"
      badge={adminRoleLabel(account.vai_tro)}
      title="Công việc vận hành"
      description="Theo dõi công việc kỹ thuật và vệ sinh; bộ phận báo xong, quản trị nghiệm thu và đóng việc."
    >
      {statusMessage ? <Notice tone={isError ? "error" : "success"}>{statusMessage}</Notice> : null}

      <div className="mb-5 grid gap-3 md:grid-cols-4">
        {filters.map((item) => {
          const Icon = item.icon;
          const active = status === item.key;
          return (
            <Link
              key={item.key}
              className={
                active
                  ? "rounded-lg border border-[var(--accent)] bg-[var(--accent-soft)] p-4 text-[var(--accent)] shadow-sm"
                  : "rounded-lg border border-[var(--line)] bg-white/90 p-4 text-[var(--text)] shadow-sm hover:border-[var(--accent)]"
              }
              href={buildHref({ status, department, sort, dir, nextStatus: item.key })}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">{item.label}</span>
                <Icon size={18} aria-hidden="true" />
              </div>
              <strong className="mt-3 block text-3xl leading-none">{item.value}</strong>
            </Link>
          );
        })}
      </div>

      {canManage ? (
        <Card className="mb-5 bg-white/90">
          <CardHeader>
            <CardTitle>Tạo công việc</CardTitle>
            <CardDescription>Admin và quản lý tạo việc cho kỹ thuật hoặc vệ sinh.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createOperationTaskAction} className="grid gap-4 lg:grid-cols-[120px_1fr_180px_220px_auto] lg:items-end">
              <label className="grid gap-2 text-sm font-semibold">
                STT
                <Input name="displayOrder" inputMode="numeric" placeholder="Tự tăng" />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Tên công việc
                <Input name="taskName" required />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Bộ phận
                <SelectBox name="department" defaultValue="KY_THUAT">
                  {OPERATION_TASK_DEPARTMENTS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </SelectBox>
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Deadline
                <Input name="deadline" type="datetime-local" required />
              </label>
              <SubmitButton size="lg" pendingText="Đang tạo...">
                Tạo việc
              </SubmitButton>
              <label className="grid gap-2 text-sm font-semibold lg:col-span-4">
                Mô tả
                <Textarea name="description" placeholder="Thông tin thêm nếu cần" />
              </label>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card className="mb-5 bg-white/90">
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle>Danh sách công việc</CardTitle>
              <CardDescription>Closed task mặc định được ẩn; dùng bộ lọc để xem lại khi cần.</CardDescription>
            </div>
            <form className="flex flex-wrap items-center gap-2" method="get">
              <input name="status" type="hidden" value={status} />
              <input name="sort" type="hidden" value={sort} />
              <input name="dir" type="hidden" value={dir} />
              <SelectBox name="department" defaultValue={department}>
                <option value="all">Tất cả bộ phận</option>
                {OPERATION_TASK_DEPARTMENTS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </SelectBox>
              <Button type="submit" variant="outline">
                <Filter size={16} aria-hidden="true" />
                Lọc
              </Button>
            </form>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollPanel minWidth={1180}>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortHead label="STT" column="stt" status={status} department={department} sort={sort} dir={dir} />
                  <SortHead label="Thời điểm giao" column="assignedAt" status={status} department={department} sort={sort} dir={dir} />
                  <SortHead label="Công việc" column="task" status={status} department={department} sort={sort} dir={dir} />
                  <SortHead label="Bộ phận" column="department" status={status} department={department} sort={sort} dir={dir} />
                  <SortHead label="Deadline" column="deadline" status={status} department={department} sort={sort} dir={dir} />
                  <TableHead>Báo xong</TableHead>
                  <SortHead label="Trạng thái" column="status" status={status} department={department} sort={sort} dir={dir} />
                  {canManage ? <TableHead>Đóng việc</TableHead> : null}
                  {canManage ? <TableHead>Sửa/xóa</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.length === 0 ? (
                  <TableRow>
                    <TableCell className="py-8 text-center text-[var(--muted)]" colSpan={canManage ? 9 : 7}>
                      Chưa có công việc trong bộ lọc hiện tại.
                    </TableCell>
                  </TableRow>
                ) : null}
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-semibold">{task.stt_hien_thi || "-"}</TableCell>
                    <TableCell>{formatVietnamDateTime(task.thoi_diem_giao_viec)}</TableCell>
                    <TableCell className="max-w-[320px]">
                      <strong className="block">{task.ten_cong_viec}</strong>
                      {task.mo_ta ? <span className="mt-1 block whitespace-pre-wrap text-sm text-[var(--muted)]">{task.mo_ta}</span> : null}
                    </TableCell>
                    <TableCell>{operationTaskDepartmentLabel(task.bo_phan)}</TableCell>
                    <TableCell>{formatVietnamDateTime(task.deadline)}</TableCell>
                    <TableCell>
                      {task.da_bao_xong ? (
                        <div className="grid gap-1 text-sm">
                          <span className="inline-flex items-center gap-2 font-semibold text-emerald-700">
                            <CheckCircle2 size={16} aria-hidden="true" />
                            Đã báo xong
                          </span>
                          <span className="text-xs text-[var(--muted)]">
                            {formatVietnamDateTime(task.bao_xong_luc)} ·{" "}
                            {task.nguoi_bao_xong?.ten_hien_thi || task.nguoi_bao_xong?.ten_dang_nhap || "-"}
                          </span>
                        </div>
                      ) : task.trang_thai_dong === "DANG_MO" ? (
                        <form action={markOperationTaskDoneAction}>
                          <input name="id" type="hidden" value={task.id} />
                          <SubmitButton size="sm" variant="outline" pendingText="Đang ghi nhận...">
                            <span className="h-4 w-4 rounded border border-[var(--line)] bg-white" aria-hidden="true" />
                            Tích xong
                          </SubmitButton>
                        </form>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge task={task} now={now} />
                    </TableCell>
                    {canManage ? (
                      <TableCell>
                        {task.trang_thai_dong === "DANG_MO" ? (
                          <form action={closeOperationTaskAction} className="grid min-w-[260px] gap-2">
                            <input name="id" type="hidden" value={task.id} />
                            <SelectBox name="closeStatus" defaultValue="HOAN_THANH">
                              {OPERATION_TASK_CLOSE_STATUSES.map((item) => (
                                <option key={item.value} value={item.value}>
                                  {item.label}
                                </option>
                              ))}
                            </SelectBox>
                            <Input name="closeNote" placeholder="Ghi chú đóng việc" />
                            <SubmitButton size="sm" pendingText="Đang đóng...">
                              Đóng
                            </SubmitButton>
                          </form>
                        ) : (
                          <div className="grid gap-1 text-sm">
                            <strong>{operationTaskCloseStatusLabel(task.trang_thai_dong)}</strong>
                            <span className="text-xs text-[var(--muted)]">
                              {formatVietnamDateTime(task.dong_luc)} · {task.nguoi_dong?.ten_hien_thi || task.nguoi_dong?.ten_dang_nhap || "-"}
                            </span>
                            {task.ghi_chu_dong ? (
                              <span className="text-xs text-[var(--muted)]">Ghi chú: {task.ghi_chu_dong}</span>
                            ) : null}
                          </div>
                        )}
                      </TableCell>
                    ) : null}
                    {canManage ? (
                      <TableCell>
                        {task.trang_thai_dong === "DANG_MO" ? (
                          <details className="min-w-[280px]">
                            <summary className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-[var(--accent)]">
                              <Pencil size={15} aria-hidden="true" />
                              Sửa
                            </summary>
                            <form action={updateOperationTaskAction} className="mt-3 grid gap-2 rounded-md border border-[var(--line)] bg-white p-3">
                              <input name="id" type="hidden" value={task.id} />
                              <Input name="displayOrder" defaultValue={task.stt_hien_thi || ""} inputMode="numeric" placeholder="STT" />
                              <Input name="taskName" defaultValue={task.ten_cong_viec} required />
                              <SelectBox name="department" defaultValue={task.bo_phan}>
                                {OPERATION_TASK_DEPARTMENTS.map((item) => (
                                  <option key={item.value} value={item.value}>
                                    {item.label}
                                  </option>
                                ))}
                              </SelectBox>
                              <Input name="deadline" type="datetime-local" defaultValue={vietnamDateTimeInputValue(task.deadline)} required />
                              <Textarea name="description" defaultValue={task.mo_ta || ""} />
                              <SubmitButton size="sm" pendingText="Đang lưu...">
                                Lưu sửa
                              </SubmitButton>
                            </form>
                          </details>
                        ) : (
                          <span className="text-sm text-[var(--muted)]">Đã đóng</span>
                        )}
                        <form action={deleteOperationTaskAction} className="mt-2">
                          <input name="id" type="hidden" value={task.id} />
                          <SubmitButton size="sm" variant="destructive" pendingText="Đang xóa...">
                            <Trash2 size={15} aria-hidden="true" />
                            Xóa
                          </SubmitButton>
                        </form>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollPanel>
        </CardContent>
      </Card>

      <Card className="bg-white/90">
        <CardHeader>
          <CardTitle>Log công việc</CardTitle>
          <CardDescription>Nhật ký thao tác gần nhất để truy vết ai đã làm gì.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          {logs.length === 0 ? <p className="text-sm text-[var(--muted)]">Chưa có log công việc.</p> : null}
          {logs.map((log) => (
            <div key={log.id} className="grid gap-1 rounded-lg border border-[var(--line)] bg-white p-3 text-sm md:grid-cols-[180px_160px_1fr] md:items-center">
              <span className="font-semibold">{formatVietnamDateTime(log.thoi_diem)}</span>
              <span className="text-[var(--accent)]">{operationTaskLogActionLabel(log.hanh_dong)}</span>
              <span>
                {log.nguoi_thuc_hien?.ten_hien_thi || log.nguoi_thuc_hien?.ten_dang_nhap || "-"} ·{" "}
                {log.noi_dung || log.cong_viec?.ten_cong_viec || "-"}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </AdminFrame>
  );
}
