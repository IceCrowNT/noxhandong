import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/src/modules/auth/current-user";
import { prisma } from "@/src/modules/database";
import { hasPermission } from "@/src/modules/auth/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const account = await getCurrentAdmin();
  if (!account || !hasPermission(account.vai_tro, "MANAGE_OPERATION_TASKS")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const monthStr = searchParams.get("month");
  if (!monthStr || !/^\d{4}-\d{2}$/.test(monthStr)) {
    return new NextResponse("Invalid month format", { status: 400 });
  }

  const year = parseInt(monthStr.substring(0, 4));
  const month = parseInt(monthStr.substring(5, 7));

  const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0);
  const endOfMonth = new Date(year, month, 1, 0, 0, 0);

  const tasks = await prisma.congViecVanHanh.findMany({
    where: {
      da_xoa: false,
      deadline: {
        gte: startOfMonth,
        lt: endOfMonth,
      },
    },
    select: {
      bo_phan: true,
      da_bao_xong: true,
      bao_xong_luc: true,
      deadline: true,
    },
  });

  const stats: Record<string, any> = {
    VE_SINH: { department: "Vệ sinh", onTime: 0, late: 0, incomplete: 0, total: 0 },
    KY_THUAT: { department: "Kỹ thuật", onTime: 0, late: 0, incomplete: 0, total: 0 },
    HANH_CHINH: { department: "Hành chính", onTime: 0, late: 0, incomplete: 0, total: 0 },
    TONG_HOP: { department: "Tổng hợp", onTime: 0, late: 0, incomplete: 0, total: 0 },
  };

  for (const task of tasks) {
    const s = stats[task.bo_phan];
    if (!s) continue;

    s.total++;
    if (!task.da_bao_xong) {
      s.incomplete++;
    } else {
      if (task.bao_xong_luc && task.deadline && task.bao_xong_luc > task.deadline) {
        s.late++;
      } else {
        s.onTime++;
      }
    }
  }

  return NextResponse.json({
    veSinh: stats.VE_SINH,
    kyThuat: stats.KY_THUAT,
    hanhChinh: stats.HANH_CHINH,
    tongHop: stats.TONG_HOP,
  });
}
