-- AlterTable User: add name, phone, profilePictureUrl
ALTER TABLE "User" ADD COLUMN "name" TEXT;
ALTER TABLE "User" ADD COLUMN "phone" TEXT;
ALTER TABLE "User" ADD COLUMN "profilePictureUrl" TEXT;

-- DropTable (order: FK dependents first)
DROP TABLE IF EXISTS "File";
DROP TABLE IF EXISTS "OrganizationMember";
DROP TABLE IF EXISTS "Organization";

-- CreateTable Group
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "parentGroupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable GroupMember
CREATE TABLE "GroupMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable Page
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "coverPhotoUrl" TEXT,
    "parentGroupLogoUrl" TEXT,
    "childGroupLogoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Group_parentGroupId_idx" ON "Group"("parentGroupId");
CREATE UNIQUE INDEX "GroupMember_userId_groupId_key" ON "GroupMember"("userId", "groupId");
CREATE INDEX "GroupMember_userId_idx" ON "GroupMember"("userId");
CREATE INDEX "GroupMember_groupId_idx" ON "GroupMember"("groupId");
CREATE INDEX "Page_groupId_idx" ON "Page"("groupId");

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_parentGroupId_fkey" FOREIGN KEY ("parentGroupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Page" ADD CONSTRAINT "Page_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
