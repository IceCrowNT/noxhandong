import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { getCurrentAdmin } from "@/src/modules/auth/current-user";
import { prisma } from "@/src/modules/database";
import { formatVietnamDate, formatVietnamDateTime } from "@/src/modules/shared/utils/date-time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const monthStr = searchParams.get("month");
  if (!monthStr || !/^\d{4}-\d{2}$/.test(monthStr)) {
    return new NextResponse("Invalid month format", { status: 400 });
  }

  const statYear = parseInt(monthStr.substring(0, 4));
  const statMonthNum = parseInt(monthStr.substring(5, 7));

  const startOfMonth = new Date(statYear, statMonthNum - 1, 1, 0, 0, 0);
  const endOfMonth = new Date(statYear, statMonthNum, 1, 0, 0, 0);

  const tasks = await prisma.congViecVanHanh.findMany({
    where: {
      da_xoa: false,
      deadline: {
        gte: startOfMonth,
        lt: endOfMonth,
      },
    },
    orderBy: {
      deadline: "asc",
    },
  });

  const getDepartmentStats = (dept: string) => {
    const deptTasks = tasks.filter((t) => t.bo_phan === dept);
    
    let onTime = 0;
    let late = 0;
    let incomplete = 0;

    const taskList = deptTasks.map((t) => {
      let statusStr = "Chưa xong";
      if (!t.da_bao_xong) {
        incomplete++;
        statusStr = "Chưa xong";
      } else {
        statusStr = "Đã xong";
        if (t.bao_xong_luc && t.deadline && t.bao_xong_luc > t.deadline) {
          late++;
        } else {
          onTime++;
        }
      }

      return {
        ten_cong_viec: t.ten_cong_viec || "",
        thoi_gian_giao: formatVietnamDateTime(t.thoi_diem_giao_viec),
        deadline: formatVietnamDateTime(t.deadline),
        trang_thai: statusStr,
        ghi_chu: t.ghi_chu_bao_xong || "-",
        ghi_chu_dong: t.ghi_chu_dong || "-",
      };
    });

    return {
      TONG: deptTasks.length,
      DUNG: onTime,
      TRE: late,
      CHUA: incomplete,
      TASKS: taskList,
    };
  };

  const kyThuat = getDepartmentStats("KY_THUAT");
  const veSinh = getDepartmentStats("VE_SINH");
  const hanhChinh = getDepartmentStats("HANH_CHINH");
  const tongHop = getDepartmentStats("TONG_HOP");

  const tongCongViec = kyThuat.TONG + veSinh.TONG + hanhChinh.TONG + tongHop.TONG;
  const tongDungHan = kyThuat.DUNG + veSinh.DUNG + hanhChinh.DUNG + tongHop.DUNG;
  const tyLe = tongCongViec > 0 ? Math.round((tongDungHan / tongCongViec) * 100) : 0;

  let nhanXetChung = `Trong tháng ${statMonthNum}/${statYear}, Ban Quản lý đã tiếp nhận và xử lý tổng cộng ${tongCongViec} hạng mục công việc sự cố và vận hành nội bộ. Tỷ lệ hoàn thành đúng hạn toàn ban đạt ${tyLe}%. `;
  if (kyThuat.TONG > 0) {
    nhanXetChung += `Bộ phận Kỹ thuật đảm nhiệm ${kyThuat.TONG} công việc (đúng hạn ${kyThuat.DUNG} việc). `;
  }
  if (veSinh.TONG > 0) {
    nhanXetChung += `Bộ phận Vệ sinh xử lý ${veSinh.TONG} công việc (đúng hạn ${veSinh.DUNG} việc). `;
  }
  if (hanhChinh.TONG > 0 || tongHop.TONG > 0) {
    nhanXetChung += `Bộ phận Hành chính & Tổng hợp phụ trách ${hanhChinh.TONG + tongHop.TONG} công việc.`;
  }

  const templatePath = path.resolve(process.cwd(), "templates", "bao-cao-van-hanh.docx");
  
  if (!fs.existsSync(templatePath)) {
    return new NextResponse("Template file not found", { status: 500 });
  }

  const content = fs.readFileSync(templatePath, "binary");
  const zip = new PizZip(content);
  
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  doc.render({
    THANG_BAO_CAO: `Tháng ${statMonthNum}/${statYear}`,
    NHAN_XET_CHUNG: nhanXetChung,
    
    KT_TONG: kyThuat.TONG,
    KT_DUNG: kyThuat.DUNG,
    KT_TRE: kyThuat.TRE,
    KT_CHUA: kyThuat.CHUA,
    DS_KY_THUAT: kyThuat.TASKS,
    
    VS_TONG: veSinh.TONG,
    VS_DUNG: veSinh.DUNG,
    VS_TRE: veSinh.TRE,
    VS_CHUA: veSinh.CHUA,
    DS_VE_SINH: veSinh.TASKS,
    
    HC_TONG: hanhChinh.TONG,
    HC_DUNG: hanhChinh.DUNG,
    HC_TRE: hanhChinh.TRE,
    HC_CHUA: hanhChinh.CHUA,
    DS_HANH_CHINH: hanhChinh.TASKS,
  });

  const buffer = doc.getZip().generate({ type: "nodebuffer" });

  const headers = new Headers();
  headers.set("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  headers.set("Content-Disposition", `attachment; filename="Bao-cao-van-hanh-${monthStr}.docx"`);

  return new NextResponse(buffer, {
    status: 200,
    headers,
  });
}
