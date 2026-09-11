-- US-P1-01：首页拆成轮播 banner / 优秀作品 / 课程。发布过滤在接口层。

CREATE TABLE "HomeBanner" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "linkUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeBanner_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HomeFeaturedArtwork" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "studentDisplayName" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeFeaturedArtwork_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HomeCourse" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "coverUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeCourse_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HomeBanner_enabled_sortOrder_idx" ON "HomeBanner"("enabled", "sortOrder");
CREATE INDEX "HomeFeaturedArtwork_published_sortOrder_idx" ON "HomeFeaturedArtwork"("published", "sortOrder");
CREATE INDEX "HomeCourse_published_sortOrder_idx" ON "HomeCourse"("published", "sortOrder");

INSERT INTO "HomeBanner" ("id", "imageUrl", "title", "subtitle", "linkUrl", "sortOrder", "enabled", "createdAt", "updatedAt")
SELECT
    "id",
    COALESCE(NULLIF("imageUrl", ''), 'https://example.invalid/banner-placeholder.jpg'),
    "title",
    "body",
    NULL,
    "sortOrder",
    "published",
    "createdAt",
    "updatedAt"
FROM "HomeContent"
WHERE "type" = 'banner';

INSERT INTO "HomeCourse" ("id", "title", "summary", "coverUrl", "sortOrder", "published", "createdAt", "updatedAt")
SELECT
    "id",
    "title",
    COALESCE("body", ''),
    "imageUrl",
    "sortOrder",
    "published",
    "createdAt",
    "updatedAt"
FROM "HomeContent"
WHERE "type" = 'course';

DROP TABLE "HomeContent";
