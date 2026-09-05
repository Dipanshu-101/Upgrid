-- Consolidate legacy region rows into the canonical India and America UUIDs.
UPDATE "website_tick"
SET "region_id" = '11111111-1111-4111-8111-111111111111'
WHERE "region_id" = '550e8400-e29b-41d4-a716-446655440000';

UPDATE "website_tick"
SET "region_id" = '22222222-2222-4222-8222-222222222222'
WHERE "region_id" = '6ba7b810-9dad-41d1-80b4-00c04fd430c8';

DELETE FROM "Region"
WHERE "id" IN (
  '550e8400-e29b-41d4-a716-446655440000',
  '6ba7b810-9dad-41d1-80b4-00c04fd430c8'
);
