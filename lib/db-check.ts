import { prisma } from "./prisma";

export async function checkDb() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Database connected");
  } catch (err) {
    console.error("❌ Database connection failed");
    throw err;
  }
}
