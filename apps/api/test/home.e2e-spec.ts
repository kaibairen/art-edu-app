import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Role, UserStatus } from '@prisma/client';
import { execSync } from 'child_process';
import { join } from 'path';
import request from 'supertest';
import { PUBLIC_FEATURED_ARTWORK_FIELDS } from '@art-edu/shared';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { applyAppDefaults } from '../src/setup-app';

/**
 * US-P1-01：公开首页。
 * - 未发布 / 未启用不可见
 * - 公开优秀作品卡无点评字段
 * - 非 admin 写 403
 */
describe('US-P1-01 public home e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const prefix = '/api/v1';

  const phones = {
    admin: '13910000000',
    teacher: '13910000001',
    parent: '13910000002',
  };

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required for e2e tests');
    }
    process.env.JWT_SECRET = 'e2e-home-secret';
    process.env.JWT_EXPIRES_IN = '2h';
    process.env.STORAGE_DRIVER = 'local';

    execSync('npx prisma migrate deploy', {
      cwd: join(__dirname, '..'),
      env: process.env,
      stdio: 'inherit',
    });

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    applyAppDefaults(app, 'api/v1');
    prisma = app.get(PrismaService);
    await app.init();

    await resetDb();
    await seedUsers();
  });

  afterAll(async () => {
    await app?.close();
  });

  async function resetDb() {
    await prisma.poster.deleteMany();
    await prisma.artwork.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.parentStudent.deleteMany();
    await prisma.homeCarousel.deleteMany();
    await prisma.homeFeaturedArtwork.deleteMany();
    await prisma.homeCourse.deleteMany();
    await prisma.student.deleteMany();
    await prisma.user.deleteMany();
    await prisma.orgSetting.deleteMany();
    await prisma.posterTemplate.deleteMany();
  }

  async function seedUsers() {
    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash('Passw0rd', 10);
    await Promise.all([
      prisma.user.create({
        data: {
          phone: phones.admin,
          displayName: '管理员',
          role: Role.admin,
          status: UserStatus.active,
          passwordHash: hash,
        },
      }),
      prisma.user.create({
        data: {
          phone: phones.teacher,
          displayName: '林老师',
          role: Role.teacher,
          status: UserStatus.active,
          classNames: ['创意班'],
          passwordHash: hash,
        },
      }),
      prisma.user.create({
        data: {
          phone: phones.parent,
          displayName: '家长A',
          role: Role.parent,
          status: UserStatus.active,
          passwordHash: hash,
        },
      }),
    ]);
    await prisma.orgSetting.create({
      data: {
        id: 'default',
        orgName: '测试画室',
        logoUrl: null,
        watermarkText: '水印',
      },
    });
  }

  async function token(phone: string) {
    const res = await request(app.getHttpServer())
      .post(`${prefix}/auth/login`)
      .send({ phone, password: 'Passw0rd' })
      .expect(200);
    return res.body.accessToken as string;
  }

  it('hides unpublished or disabled items and never leaks comment fields', async () => {
    const adminToken = await token(phones.admin);

    await request(app.getHttpServer())
      .post(`${prefix}/admin/home/carousels`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        imageUrl: '/files/home/on.jpg',
        title: '启用轮播',
        enabled: true,
        sortOrder: 0,
      })
      .expect(201);
    await request(app.getHttpServer())
      .post(`${prefix}/admin/home/carousels`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        imageUrl: '/files/home/off.jpg',
        title: '未启用轮播',
        enabled: false,
        sortOrder: 1,
      })
      .expect(201);

    const featuredDraft = await request(app.getHttpServer())
      .post(`${prefix}/admin/home/featured-artworks`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        imageUrl: '/files/home/draft.jpg',
        title: '草稿作品',
        studentDisplayName: '内部',
        published: false,
        commentText: '这条点评不得入库也不得公开',
      })
      .expect(201);
    expect(featuredDraft.body.published).toBe(false);
    expect(featuredDraft.body).not.toHaveProperty('commentText');

    await request(app.getHttpServer())
      .post(`${prefix}/admin/home/featured-artworks`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        imageUrl: '/files/home/feat.jpg',
        title: '春天的树',
        studentDisplayName: '小明',
        published: true,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`${prefix}/admin/home/courses`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: '公开水彩',
        summary: '小班制简介',
        published: true,
        body: '长文不得出现',
      })
      .expect(201);
    await request(app.getHttpServer())
      .post(`${prefix}/admin/home/courses`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: '草稿课程',
        summary: '不可见',
        published: false,
      })
      .expect(201);

    const adminList = await request(app.getHttpServer())
      .get(`${prefix}/admin/home/featured-artworks`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(adminList.body.items).toHaveLength(2);

    const pub = await request(app.getHttpServer())
      .get(`${prefix}/public/home`)
      .expect(200);

    expect(pub.body.brand.logoUrl).toBeNull();
    expect(pub.body.carousels.map((c: { title: string }) => c.title)).toEqual([
      '启用轮播',
    ]);
    expect(pub.body.featuredArtworks).toHaveLength(1);
    const card = pub.body.featuredArtworks[0];
    expect(Object.keys(card).sort()).toEqual(
      [...PUBLIC_FEATURED_ARTWORK_FIELDS].sort(),
    );
    expect(card.title).toBe('春天的树');
    expect(card.studentDisplayName).toBe('小明');
    expect(card).not.toHaveProperty('commentText');
    expect(card).not.toHaveProperty('comment');
    expect(JSON.stringify(card)).not.toMatch(/点评|commentText/);

    expect(pub.body.courses).toHaveLength(1);
    expect(pub.body.courses[0].title).toBe('公开水彩');
    expect(pub.body.courses[0].summary).toBe('小班制简介');
    expect(pub.body.courses[0]).not.toHaveProperty('body');
  });

  it('rejects non-admin writes with 403', async () => {
    const teacherToken = await token(phones.teacher);
    const parentToken = await token(phones.parent);

    const payload = {
      imageUrl: '/files/x.jpg',
      title: '越权',
      studentDisplayName: '谁',
    };

    for (const tok of [teacherToken, parentToken]) {
      const res = await request(app.getHttpServer())
        .post(`${prefix}/admin/home/featured-artworks`)
        .set('Authorization', `Bearer ${tok}`)
        .send(payload);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    }

    await request(app.getHttpServer())
      .post(`${prefix}/admin/home/carousels`)
      .send({ imageUrl: '/files/x.jpg' })
      .expect(401);

    await request(app.getHttpServer())
      .patch(`${prefix}/admin/home/courses/does-not-exist`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ published: true })
      .expect(403);
  });
});
