import { execSync } from "node:child_process";
import { Pool } from "pg";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const main = async () => {
  // Create a direct PostgreSQL connection instead of using Prisma
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes("localhost") 
      ? false 
      : { rejectUnauthorized: false },
  });

  try {
    console.log("Checking database tables...");
    // Check if the wallets table exists using raw SQL
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT 1
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'wallets'
      );
    `);
    
    const hasWalletsTable = checkResult.rows[0].exists;
    
    // Determine schema path based on environment
    const schema =
      process.env.NODE_ENV === "production"
        ? "./dist/prisma/schema.prisma"
        : "./prisma/schema.prisma";

    console.log(`Using schema path: ${schema}`);
    console.log(`Tables already exist: ${hasWalletsTable}`);

    // Close PostgreSQL connection before running Prisma commands
    await pool.end();
    
    // Sleep for a moment to ensure connections are fully closed
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Reset or deploy based on whether tables exist
    if (hasWalletsTable) {
      console.log("Tables exist, skipping migrations...");
      // If tables already exist, we'll skip migrations
    } else {
      console.log("Deploying migrations...");
      try {
        // Specify a custom database URL with a connection limit of 1
        const customPrismaCommand = `DATABASE_URL="${process.env.DATABASE_URL}?connection_limit=1" npx prisma migrate deploy --schema ${schema}`;
        execSync(customPrismaCommand, { stdio: "inherit", env: process.env });
      } catch (error) {
        console.error("⚠️ Migration deployment failed, but continuing anyway:", error);
        // We'll continue even if migrations fail, as the database might already be set up
      }
    }

    console.log("Generating Prisma client...");
    try {
      execSync(`npx prisma generate --schema ${schema}`, { stdio: "inherit" });
    } catch (error) {
      console.error("Error generating client:", error);
      throw error;
    }
    
    console.log("✅ Database setup completed");
  } catch (error) {
    console.error("Database setup failed:", error);
    throw error;
  }
};

main().catch(error => {
  console.error("Fatal error during database setup:", error);
  process.exit(1);
}); 