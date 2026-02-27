-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'member');

-- Drop legacy column from User (superseded by profileImageUrl)
ALTER TABLE "User" DROP COLUMN IF EXISTS "profilePictureUrl";

-- Handle GroupMember: drop the legacy `id` primary key column
ALTER TABLE "GroupMember" DROP CONSTRAINT IF EXISTS "GroupMember_pkey";
ALTER TABLE "GroupMember" DROP COLUMN IF EXISTS "id";

-- Convert GroupMember.role from TEXT to Role enum
-- Must drop default before changing type, then restore default
ALTER TABLE "GroupMember" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "GroupMember" ALTER COLUMN "role" TYPE "Role" USING ("role"::"Role");
ALTER TABLE "GroupMember" ALTER COLUMN "role" SET DEFAULT 'member'::"Role";

-- Convert OrganizationMember.role from TEXT to Role enum
ALTER TABLE "OrganizationMember" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "OrganizationMember" ALTER COLUMN "role" TYPE "Role" USING ("role"::"Role");
ALTER TABLE "OrganizationMember" ALTER COLUMN "role" SET DEFAULT 'member'::"Role";

-- Add VarChar constraints on Group
ALTER TABLE "Group" ALTER COLUMN "name" TYPE VARCHAR(100);
ALTER TABLE "Group" ALTER COLUMN "description" TYPE VARCHAR(500);

-- Add VarChar constraints on Page
ALTER TABLE "Page" ALTER COLUMN "title" TYPE VARCHAR(200);
ALTER TABLE "Page" ALTER COLUMN "description" TYPE VARCHAR(500);
