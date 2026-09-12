const { Client } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL not found in .env");
  process.exit(1);
}

const client = new Client({ connectionString });

async function sync() {
  console.log("Connecting to Neon database...");
  await client.connect();
  console.log("Connected successfully.");

  // 1. Check existing tables
  const tablesRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public';
  `);
  const existingTables = new Set(tablesRes.rows.map(r => r.table_name));
  console.log("Existing tables:", Array.from(existingTables));

  // 2. Create WebsiteStatus enum if it doesn't exist
  await client.query(`
    DO $$ BEGIN
      CREATE TYPE "WebsiteStatus" AS ENUM ('Up', 'Down', 'Unknown');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  // 3. Ensure User table has NextAuth nullable fields and columns
  if (existingTables.has('User')) {
    console.log("Checking User columns...");
    const userCols = (await client.query(`
      SELECT column_name, is_nullable, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'User';
    `)).rows;
    const colNames = new Set(userCols.map(c => c.column_name));

    // Make username and password nullable if they exist
    if (colNames.has('username')) {
      await client.query(`ALTER TABLE "User" ALTER COLUMN "username" DROP NOT NULL;`);
    }
    if (colNames.has('password')) {
      await client.query(`ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;`);
    }
    if (!colNames.has('name')) {
      await client.query(`ALTER TABLE "User" ADD COLUMN "name" TEXT;`);
    }
    if (!colNames.has('email')) {
      await client.query(`ALTER TABLE "User" ADD COLUMN "email" TEXT UNIQUE;`);
    }
    if (!colNames.has('emailVerified')) {
      await client.query(`ALTER TABLE "User" ADD COLUMN "emailVerified" TIMESTAMP(3);`);
    }
    if (!colNames.has('image')) {
      await client.query(`ALTER TABLE "User" ADD COLUMN "image" TEXT;`);
    }
    console.log("User table columns verified & updated.");
  }

  // 4. Create Account table if not exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS "Account" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "provider" TEXT NOT NULL,
      "providerAccountId" TEXT NOT NULL,
      "refresh_token" TEXT,
      "access_token" TEXT,
      "expires_at" INTEGER,
      "token_type" TEXT,
      "scope" TEXT,
      "id_token" TEXT,
      "session_state" TEXT,
      CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Account_provider_providerAccountId_key" UNIQUE ("provider", "providerAccountId")
    );
  `);
  console.log("Account table verified.");

  // 5. Create Session table if not exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS "Session" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "sessionToken" TEXT NOT NULL UNIQUE,
      "userId" TEXT NOT NULL,
      "expires" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);
  console.log("Session table verified.");

  // 6. Create VerificationToken table if not exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS "VerificationToken" (
      "identifier" TEXT NOT NULL,
      "token" TEXT NOT NULL UNIQUE,
      "expires" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "VerificationToken_identifier_token_key" UNIQUE ("identifier", "token")
    );
  `);
  console.log("VerificationToken table verified.");

  // 7. Verify Website table columns (interval, lastProbedAt)
  if (existingTables.has('Website')) {
    const siteCols = (await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Website';
    `)).rows.map(c => c.column_name);
    const siteColSet = new Set(siteCols);

    if (!siteColSet.has('interval')) {
      await client.query(`ALTER TABLE "Website" ADD COLUMN "interval" INTEGER NOT NULL DEFAULT 180;`);
    }
    if (!siteColSet.has('lastProbedAt')) {
      await client.query(`ALTER TABLE "Website" ADD COLUMN "lastProbedAt" TIMESTAMP(3);`);
    }
    console.log("Website table columns verified.");
  }

  // 8. Verify _RegionToWebsite join table
  await client.query(`
    CREATE TABLE IF NOT EXISTS "_RegionToWebsite" (
      "A" TEXT NOT NULL REFERENCES "Region"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "B" TEXT NOT NULL REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "_RegionToWebsite_AB_unique" UNIQUE ("A", "B")
    );
    CREATE INDEX IF NOT EXISTS "_RegionToWebsite_B_index" ON "_RegionToWebsite"("B");
  `);
  console.log("_RegionToWebsite join table verified.");

  // 9. Query final status
  const finalTables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  console.log("\nAll synchronized database tables:", finalTables.rows.map(r => r.table_name));

  await client.end();
  console.log("\nDatabase migration and synchronization COMPLETED successfully!");
}

sync().catch(err => {
  console.error("Database sync failed:", err);
  process.exit(1);
});
