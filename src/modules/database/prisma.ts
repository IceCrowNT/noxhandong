import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Thiếu DATABASE_URL trong môi trường.");
}

const adapter = new PrismaPg({ connectionString });

declare global {
  // eslint-disable-next-line no-var
  var __apartmentFeePrisma__: PrismaClient | undefined;
}

export const prisma =
  global.__apartmentFeePrisma__ ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__apartmentFeePrisma__ = prisma;
}
