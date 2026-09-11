-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'disabled');
CREATE TYPE "StudentStatus" AS ENUM ('active', 'archived');
CREATE TYPE "WatermarkPosition" AS ENUM ('topLeft', 'topRight', 'bottomLeft', 'bottomRight', 'center');

-- User: name → displayName, status, classNames
ALTER TABLE "User" RENAME COLUMN "name" TO "displayName";
ALTER TABLE "User" ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'active';
ALTER TABLE "User" ADD COLUMN "classNames" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Student: className + status（默认 active）
ALTER TABLE "Student" ADD COLUMN "className" TEXT;
ALTER TABLE "Student" ADD COLUMN "status" "StudentStatus" NOT NULL DEFAULT 'active';

-- 用旧 TeacherStudent 回填班级，保证教师仍能按 classNames 看到原负责学员
UPDATE "Student" AS s
SET "className" = '过渡班'
WHERE s."className" IS NULL
  AND EXISTS (
    SELECT 1 FROM "TeacherStudent" ts WHERE ts."studentId" = s.id
  );

UPDATE "User" AS u
SET "classNames" = ARRAY['过渡班']
WHERE u.role = 'teacher'
  AND (
    COALESCE(array_length(u."classNames", 1), 0) = 0
  )
  AND EXISTS (
    SELECT 1 FROM "TeacherStudent" ts WHERE ts."teacherId" = u.id
  );

-- Artwork: theme/createdOn/textComment → title/createdAt/commentText，并补 thumbUrl
ALTER TABLE "Artwork" ADD COLUMN "title" TEXT;
ALTER TABLE "Artwork" ADD COLUMN "thumbUrl" TEXT;
ALTER TABLE "Artwork" ADD COLUMN "commentText" TEXT;
ALTER TABLE "Artwork" ADD COLUMN "courseTheme" TEXT;
ALTER TABLE "Artwork" ADD COLUMN "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Artwork"
SET
  "title" = "theme",
  "commentText" = "textComment",
  "thumbUrl" = "imageUrl",
  "uploadedAt" = "createdAt",
  "createdAt" = "createdOn";

ALTER TABLE "Artwork" ALTER COLUMN "thumbUrl" SET NOT NULL;
ALTER TABLE "Artwork" DROP COLUMN "theme";
ALTER TABLE "Artwork" DROP COLUMN "createdOn";
ALTER TABLE "Artwork" DROP COLUMN "textComment";
ALTER TABLE "Artwork" DROP COLUMN "voiceCommentUrl";
ALTER TABLE "Artwork" DROP COLUMN "videoCommentUrl";

DROP INDEX IF EXISTS "Artwork_studentId_createdOn_idx";
CREATE INDEX "Artwork_studentId_createdAt_idx" ON "Artwork"("studentId", "createdAt");

-- 有作品的学员禁止硬删：改为 Restrict，避免级联抹掉档案
ALTER TABLE "Artwork" DROP CONSTRAINT "Artwork_studentId_fkey";
ALTER TABLE "Artwork" ADD CONSTRAINT "Artwork_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Brand / OrgSetting
ALTER TABLE "OrgSetting" ALTER COLUMN "orgName" DROP NOT NULL;
ALTER TABLE "OrgSetting" ALTER COLUMN "watermarkText" DROP NOT NULL;
ALTER TABLE "OrgSetting" ADD COLUMN "watermarkOpacity" DOUBLE PRECISION NOT NULL DEFAULT 0.2;
ALTER TABLE "OrgSetting" ADD COLUMN "watermarkPosition" "WatermarkPosition" NOT NULL DEFAULT 'bottomRight';

-- PosterTemplate: previewUrl + 模板 key 迁移 classic/gallery/festival → frame/simple/magazine
ALTER TABLE "PosterTemplate" ADD COLUMN "previewUrl" TEXT;
ALTER TABLE "PosterTemplate" ALTER COLUMN "description" SET DEFAULT '';
ALTER TABLE "PosterTemplate" ALTER COLUMN "metadata" SET DEFAULT '{}';

UPDATE "Poster" SET "templateKey" = 'frame' WHERE "templateKey" = 'classic';
UPDATE "Poster" SET "templateKey" = 'simple' WHERE "templateKey" = 'gallery';
UPDATE "Poster" SET "templateKey" = 'magazine' WHERE "templateKey" = 'festival';

UPDATE "PosterTemplate" SET "key" = 'frame_tmp', "id" = 'frame_tmp' WHERE "key" = 'classic';
UPDATE "PosterTemplate" SET "key" = 'simple_tmp', "id" = 'simple_tmp' WHERE "key" = 'gallery';
UPDATE "PosterTemplate" SET "key" = 'magazine_tmp', "id" = 'magazine_tmp' WHERE "key" = 'festival';

UPDATE "PosterTemplate"
SET "id" = 'frame', "key" = 'frame', "name" = '画框'
WHERE "key" = 'frame_tmp';
UPDATE "PosterTemplate"
SET "id" = 'simple', "key" = 'simple', "name" = '简约'
WHERE "key" = 'simple_tmp';
UPDATE "PosterTemplate"
SET "id" = 'magazine', "key" = 'magazine', "name" = '杂志'
WHERE "key" = 'magazine_tmp';

-- Refresh tokens
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

ALTER TABLE "RefreshToken"
  ADD CONSTRAINT "RefreshToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 教师归属改为 classNames 匹配，停用 TeacherStudent 过滤
DROP TABLE "TeacherStudent";
