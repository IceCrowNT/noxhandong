#!/usr/bin/env node

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

if (!process.env.DATABASE_URL) {
  throw new Error("Thiếu DATABASE_URL trong .env");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function markdownEscape(value) {
  return String(value ?? "").replace(/\|/g, "\\|").trim();
}

async function main() {
  const residents = await prisma.resident.findMany({
    include: {
      occupancies: {
        where: { isCurrent: true },
        include: {
          apartment: true,
        },
        orderBy: {
          apartment: {
            code: "asc",
          },
        },
      },
    },
    orderBy: {
      fullName: "asc",
    },
  });

  const duplicates = residents
    .map((resident) => {
      const apartmentCodes = resident.occupancies.map((occupancy) => occupancy.apartment.code);
      return {
        fullName: resident.fullName,
        phoneNumber: resident.phoneNumber || "",
        occupancyCount: apartmentCodes.length,
        apartmentCodes,
      };
    })
    .filter((resident) => resident.occupancyCount > 1)
    .sort((left, right) => {
      if (right.occupancyCount !== left.occupancyCount) {
        return right.occupancyCount - left.occupancyCount;
      }

      return left.fullName.localeCompare(right.fullName, "vi");
    });

  const lines = [
    "# Bảng cư dân đang gắn nhiều căn",
    "",
    `- Ngày tạo: ${new Date().toISOString()}`,
    `- Số cư dân có từ 2 căn trở lên: ${duplicates.length}`,
    "",
    "| STT | Họ tên cư dân | Số điện thoại | Số căn | Mã căn |",
    "| --- | --- | --- | ---: | --- |",
  ];

  duplicates.forEach((resident, index) => {
    lines.push(
      `| ${index + 1} | ${markdownEscape(resident.fullName)} | ${markdownEscape(
        resident.phoneNumber || "-"
      )} | ${resident.occupancyCount} | ${markdownEscape(resident.apartmentCodes.join(", "))} |`
    );
  });

  const outputPath = path.resolve(
    process.cwd(),
    "docs/reports/bao-cao-cu-dan-bi-double.md"
  );

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        outputPath,
        duplicateResidentCount: duplicates.length,
        sample: duplicates.slice(0, 5),
      },
      null,
      2
    )
  );
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
