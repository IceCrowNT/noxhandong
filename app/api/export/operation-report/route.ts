import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { getCurrentAdmin } from "@/src/modules/auth/current-user";
import { prisma } from "@/src/modules/database";
import { formatVietnamDate } from "@/src/modules/shared/utils/date-time";

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

  const now = new Date();

  const getDepartmentStats = (dept: string) => {
    const deptTasks = tasks.filter((t) => t.bo_phan === dept);
    
    let onTime = 0;
    let late = 0;
    let inProgress = 0;
    let overdue = 0;

    const taskList = deptTasks.map((t, index) => {
      let statusStr = "Chưa xong";
      if (!t.da_bao_xong) {
        if (t.deadline >= now) {
          inProgress++;
          statusStr = "Đang xử lý (Trong hạn)";
        } else {
          overdue++;
          statusStr = "Quá hạn chưa xong";
        }
      } else {
        if (t.bao_xong_luc && t.deadline && t.bao_xong_luc > t.deadline) {
          late++;
          statusStr = "Đã xong (Trễ hạn)";
        } else {
          onTime++;
          statusStr = "Đã xong (Đúng hạn)";
        }
      }

      let ketQuaDeXuat = "";
      if (t.ghi_chu_bao_xong) ketQuaDeXuat += `Báo xong: ${t.ghi_chu_bao_xong}\n`;
      if (t.ghi_chu_dong) ketQuaDeXuat += `Nghiệm thu: ${t.ghi_chu_dong}`;
      ketQuaDeXuat = ketQuaDeXuat.trim() || "-";

      return {
        stt: index + 1,
        ten_cong_viec: t.ten_cong_viec || "",
        phan_loai: "Thường xuyên",
        ngay_tiep_nhan: formatVietnamDate(t.thoi_diem_giao_viec),
        deadline: formatVietnamDate(t.deadline),
        trang_thai: statusStr,
        ket_qua: ketQuaDeXuat,
      };
    });

    const rate = deptTasks.length > 0 ? Math.round((onTime / deptTasks.length) * 100) : 0;

    return {
      TONG: deptTasks.length,
      DUNG: onTime,
      TRE: late,
      DANG_XU_LY: inProgress,
      QUA_HAN: overdue,
      TY_LE: `${rate}%`,
      TASKS: taskList,
    };
  };

  const kyThuat = getDepartmentStats("KY_THUAT");
  const veSinh = getDepartmentStats("VE_SINH");
  const hanhChinh = getDepartmentStats("HANH_CHINH");
  const tongHop = getDepartmentStats("TONG_HOP");

  // Tong cong
  const tongCongViec = kyThuat.TONG + veSinh.TONG + hanhChinh.TONG + tongHop.TONG;
  const tongDungHan = kyThuat.DUNG + veSinh.DUNG + hanhChinh.DUNG + tongHop.DUNG;
  const tongTreHan = kyThuat.TRE + veSinh.TRE + hanhChinh.TRE + tongHop.TRE;
  const tongDangXuLy = kyThuat.DANG_XU_LY + veSinh.DANG_XU_LY + hanhChinh.DANG_XU_LY + tongHop.DANG_XU_LY;
  const tongQuaHan = kyThuat.QUA_HAN + veSinh.QUA_HAN + hanhChinh.QUA_HAN + tongHop.QUA_HAN;
  const tyLeChung = tongCongViec > 0 ? Math.round((tongDungHan / tongCongViec) * 100) : 0;

  // Overview Generator
  const generateOverview = (deptName: string, deptStats: any) => {
    if (deptStats.TONG === 0) return `${deptName}: Không phát sinh công việc trên hệ thống trong tháng.`;
    
    let text = `${deptName}: `;
    const rate = Math.round((deptStats.DUNG / deptStats.TONG) * 100);
    
    if (rate === 100 && deptStats.DUNG === deptStats.TONG) {
      text += `Hoàn thành xuất sắc ${deptStats.TONG}/${deptStats.TONG} công việc (đạt 100%). `;
    } else {
      text += `Hoàn thành đúng hạn ${deptStats.DUNG}/${deptStats.TONG} công việc (đạt ${rate}%). `;
    }

    if (deptStats.QUA_HAN > 0) {
      const overdueTasks = deptStats.TASKS.filter((t: any) => t.trang_thai === "Quá hạn chưa xong");
      if (overdueTasks.length > 0) {
         const sample = overdueTasks.slice(0, 2).map((t: any) => t.ten_cong_viec).join(", ");
         text += `Tồn đọng ${deptStats.QUA_HAN} việc quá hạn (VD: ${sample}...). `;
      }
    }

    if (deptStats.DUNG > 0) {
      const doneTasks = deptStats.TASKS.filter((t: any) => t.trang_thai === "Đã xong (Đúng hạn)");
      if (doneTasks.length > 0) {
         const sample = doneTasks.slice(0, 2).map((t: any) => t.ten_cong_viec).join(", ");
         text += `Các hạng mục đã xử lý: ${sample}.`;
      }
    }

    return text.trim();
  };

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
    THANG_BAO_CAO: `${statMonthNum}/${statYear}`,
    
    TONG_QUAN_AN: "An ninh trật tự: Toàn khu duy trì ổn định, không ghi nhận sự cố bất thường qua hệ thống phần mềm.",
    TONG_QUAN_KT: generateOverview("Kỹ thuật", kyThuat),
    TONG_QUAN_VS: generateOverview("Vệ sinh", veSinh),
    TONG_QUAN_HC: generateOverview("Hành chính & CSKH", hanhChinh),
    
    // KPI TABLE variables
    KT_TONG: kyThuat.TONG, KT_DUNG: kyThuat.DUNG, KT_TRE: kyThuat.TRE, KT_DANG: kyThuat.DANG_XU_LY, KT_QUA: kyThuat.QUA_HAN, KT_TYLE: kyThuat.TY_LE,
    VS_TONG: veSinh.TONG, VS_DUNG: veSinh.DUNG, VS_TRE: veSinh.TRE, VS_DANG: veSinh.DANG_XU_LY, VS_QUA: veSinh.QUA_HAN, VS_TYLE: veSinh.TY_LE,
    HC_TONG: hanhChinh.TONG, HC_DUNG: hanhChinh.DUNG, HC_TRE: hanhChinh.TRE, HC_DANG: hanhChinh.DANG_XU_LY, HC_QUA: hanhChinh.QUA_HAN, HC_TYLE: hanhChinh.TY_LE,
    
    ALL_TONG: tongCongViec, ALL_DUNG: tongDungHan, ALL_TRE: tongTreHan, ALL_DANG: tongDangXuLy, ALL_QUA: tongQuaHan, ALL_TYLE: `${tyLeChung}%`,
    
    DS_KY_THUAT: kyThuat.TASKS,
    DS_VE_SINH: veSinh.TASKS,
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
