-- Seed stable UUIDs shared by the database, Redis streams, and workers.
ALTER TABLE "Region" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX "Region_name_key" ON "Region" ("name");

INSERT INTO "Region" ("id", "name") VALUES
  ('11111111-1111-4111-8111-111111111111', 'India'),
  ('22222222-2222-4222-8222-222222222222', 'America')
ON CONFLICT ("name") DO NOTHING;
