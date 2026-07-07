import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";

// Danh sách các loại file (MIME type) thường được upload
const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathArray } = await params;
    
    if (!pathArray || pathArray.length === 0) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    // Nối các đoạn URL lại với nhau (vd: ['evidence', 'file.jpg'] -> 'evidence/file.jpg')
    const filePathSegment = pathArray.join("/");
    
    // Xác định thư mục uploads an toàn trong ổ cứng
    const UPLOADS_DIR = path.resolve(process.cwd(), "public", "uploads");
    const targetPath = path.resolve(UPLOADS_DIR, filePathSegment);
    
    // [BẢO MẬT] Chặn lỗ hổng Path Traversal (Tuyệt đối không cho truy cập ra ngoài thư mục uploads)
    if (!targetPath.startsWith(UPLOADS_DIR)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Kiểm tra file có tồn tại không
    if (!existsSync(targetPath)) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Xác định định dạng file để trả về đúng kiểu dữ liệu
    const ext = path.extname(targetPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    // Đọc nội dung file từ ổ cứng
    const fileBuffer = await fs.readFile(targetPath);
    
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        // Yêu cầu trình duyệt tự động cache file này trong vòng 1 năm để giảm tải cho VPS
        "Cache-Control": "public, max-age=31536000, immutable", 
      },
    });
  } catch (error) {
    console.error("[Upload Route] Lỗi phục vụ file tĩnh:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
