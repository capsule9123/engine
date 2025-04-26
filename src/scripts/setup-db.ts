import { execSync } from "node:child_process";
import { prisma } from "../shared/db/client";

const main = async () => {
  try {
    const [{ exists: hasWalletsTable }]: [{ exists: boolean }] =
      await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT 1
          FROM   pg_tables
          WHERE  schemaname = 'public'
          AND    tablename = 'wallets'
        );
      `;

    const schema =
      process.env.NODE_ENV === "production"
        ? "./dist/prisma/schema.prisma"
        : "./prisma/schema.prisma";

    // Close connection before running migrations
    await prisma.$disconnect();

    if (hasWalletsTable) {
      console.log("Resetting database...");
      try {
        execSync(`npx prisma migrate reset --force --schema ${schema}`, {
          stdio: "inherit",
        });
      } catch (error) {
        console.error("Error resetting database:", error);
        throw error;
      }
    } else {
      console.log("Deploying migrations...");
      try {
        execSync(`npx prisma migrate deploy --schema ${schema}`, {
          stdio: "inherit",
        });
      } catch (error) {
        console.error("Error deploying migrations:", error);
        throw error;
      }
    }

    console.log("Generating Prisma client...");
    try {
      execSync(`npx prisma generate --schema ${schema}`, { stdio: "inherit" });
    } catch (error) {
      console.error("Error generating client:", error);
      throw error;
    }
  } catch (error) {
    console.error("Database setup failed:", error);
    throw error;
  } finally {
    // Make sure we disconnect in all cases
    await prisma.$disconnect();
  }
};

main().catch(error => {
  console.error("Fatal error during database setup:", error);
  process.exit(1);
});
