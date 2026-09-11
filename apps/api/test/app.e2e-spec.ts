import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Role, StudentStatus, UserStatus } from '@prisma/client';
import { execSync } from 'child_process';
import { mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { applyAppDefaults } from '../src/setup-app';

/**
 * P0 契约验收：
 * 登录成功 / 错密码 / 禁用
 * 越权读 404「无法查看」
 * 绑定 409、有作品删除 409
 * 无 LOGO 预览/下载均 400、预览与下载 URL 不同
 * 家长儿童直接返回数组
 */
describe('Art edu API-MVP-P0-0.1 e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const storageDir = join(process.cwd(), 'storage-e2e');
  const prefix = '/api/v1';

  const phones = {
    admin: '13900000000',
    teacher: '13900000001',
    parentA: '13900000002',
    parentB: '13900000003',
    disabled: '13900000009',
  };

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required for e2e tests');
    }
    process.env.JWT_SECRET = 'e2e-secret';
    process.env.JWT_EXPIRES_IN = '2h';
    process.env.STORAGE_DRIVER = 'local';
    process.env.STORAGE_LOCAL_DIR = storageDir;
    process.env.STORAGE_PUBLIC_BASE_URL = 'http://127.0.0.1:3999/files';
    rmSync(storageDir, { recursive: true, force: true });
    mkdirSync(storageDir, { recursive: true });

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
    await seedFixtures();
  });

  afterAll(async () => {
    await app?.close();
    rmSync(storageDir, { recursive: true, force: true });
  });

  async function resetDb() {
    await prisma.poster.deleteMany();
    await prisma.artwork.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.parentStudent.deleteMany();
    await prisma.homeBanner.deleteMany();
    await prisma.homeFeaturedArtwork.deleteMany();
    await prisma.homeCourse.deleteMany();
    await prisma.student.deleteMany();
    await prisma.user.deleteMany();
    await prisma.orgSetting.deleteMany();
    await prisma.posterTemplate.deleteMany();
  }

  async function seedFixtures() {
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
          phone: phones.parentA,
          displayName: '家长A',
          role: Role.parent,
          status: UserStatus.active,
          passwordHash: hash,
        },
      }),
      prisma.user.create({
        data: {
          phone: phones.parentB,
          displayName: '家长B',
          role: Role.parent,
          status: UserStatus.active,
          passwordHash: hash,
        },
      }),
      prisma.user.create({
        data: {
          phone: phones.disabled,
          displayName: '停用账号',
          role: Role.parent,
          status: UserStatus.disabled,
          passwordHash: hash,
        },
      }),
      prisma.student.create({
        data: { name: '小明', className: '创意班', status: StudentStatus.active },
      }),
      prisma.student.create({
        data: { name: '小红', className: '素描班', status: StudentStatus.active },
      }),
    ]);

    const parentA = await prisma.user.findUniqueOrThrow({ where: { phone: phones.parentA } });
    const parentB = await prisma.user.findUniqueOrThrow({ where: { phone: phones.parentB } });
    const ming = await prisma.student.findFirstOrThrow({ where: { name: '小明' } });
    const hong = await prisma.student.findFirstOrThrow({ where: { name: '小红' } });

    await prisma.parentStudent.create({
      data: { parentId: parentA.id, studentId: ming.id },
    });
    await prisma.parentStudent.create({
      data: { parentId: parentB.id, studentId: hong.id },
    });
    await prisma.orgSetting.create({
      data: {
        id: 'default',
        orgName: '测试画室',
        watermarkText: '测试水印不可去掉',
        watermarkOpacity: 0.2,
        watermarkPosition: 'bottomRight',
        logoUrl: null,
      },
    });
    await prisma.posterTemplate.createMany({
      data: [
        { id: 'simple', key: 'simple', name: '简约', description: 'd', metadata: {} },
        { id: 'frame', key: 'frame', name: '画框', description: 'd', metadata: {} },
        { id: 'magazine', key: 'magazine', name: '杂志', description: 'd', metadata: {} },
      ],
    });
  }

  async function login(phone: string, password = 'Passw0rd') {
    const res = await request(app.getHttpServer())
      .post(`${prefix}/auth/login`)
      .send({ phone, password });
    return res;
  }

  async function token(phone: string) {
    const res = await login(phone);
    expect(res.status).toBe(200);
    return res.body.accessToken as string;
  }

  function pngStub() {
    return Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );
  }

  it('logs in with phone and returns contract tokens', async () => {
    const res = await login(phones.admin);
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
    expect(res.body.role).toBe('admin');
    expect(res.body.displayName).toBe('管理员');
    expect(typeof res.body.expiresIn).toBe('number');
    expect(res.body.user).toBeUndefined();
  });

  it('rejects wrong password with 401 and disabled account with ACCOUNT_DISABLED', async () => {
    const bad = await login(phones.admin, 'wrong-password');
    expect(bad.status).toBe(401);
    expect(bad.body).toMatchObject({
      code: 'UNAUTHORIZED',
      message: '手机号或密码不正确',
    });

    const disabled = await login(phones.disabled);
    expect(disabled.status).toBe(403);
    expect(disabled.body).toMatchObject({
      code: 'ACCOUNT_DISABLED',
      message: '账号已停用，请联系机构管理员',
    });
  });

  it('returns disabled token as 401 UNAUTHORIZED, not ACCOUNT_DISABLED', async () => {
    const adminToken = await token(phones.admin);
    const created = await request(app.getHttpServer())
      .post(`${prefix}/admin/accounts`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        phone: '13900000088',
        displayName: '临时教师',
        password: 'Passw0rd',
        role: 'teacher',
        classNames: ['创意班'],
      })
      .expect(201);

    const session = await login('13900000088');
    expect(session.status).toBe(200);
    const liveToken = session.body.accessToken as string;

    await request(app.getHttpServer())
      .patch(`${prefix}/admin/accounts/${created.body.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'disabled' })
      .expect(200);

    const me = await request(app.getHttpServer())
      .get(`${prefix}/auth/me`)
      .set('Authorization', `Bearer ${liveToken}`);
    expect(me.status).toBe(401);
    expect(me.body.code).toBe('UNAUTHORIZED');
    expect(me.body.code).not.toBe('ACCOUNT_DISABLED');
  });

  it('returns parent children as a raw Student array', async () => {
    const tokenA = await token(phones.parentA);
    const childrenA = await request(app.getHttpServer())
      .get(`${prefix}/parent/children`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    expect(Array.isArray(childrenA.body)).toBe(true);
    expect(childrenA.body.items).toBeUndefined();
    expect(childrenA.body).toHaveLength(1);
    expect(childrenA.body[0].name).toBe('小明');
    expect(childrenA.body[0].className).toBe('创意班');
  });

  it('hides unauthorized parent/teacher reads as 404 无法查看', async () => {
    const tokenA = await token(phones.parentA);
    const tokenB = await token(phones.parentB);
    const teacherToken = await token(phones.teacher);

    const childrenB = await request(app.getHttpServer())
      .get(`${prefix}/parent/children`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);
    const hongId = childrenB.body[0].id as string;

    const forbiddenChild = await request(app.getHttpServer())
      .get(`${prefix}/parent/children/${hongId}/artworks`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(forbiddenChild.status).toBe(404);
    expect(forbiddenChild.body).toEqual({ code: 'NOT_FOUND', message: '无法查看' });

    const teacherStudents = await request(app.getHttpServer())
      .get(`${prefix}/teacher/students`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(200);
    expect(teacherStudents.body.items.some((s: { name: string }) => s.name === '小明')).toBe(
      true,
    );
    expect(teacherStudents.body.items.some((s: { name: string }) => s.name === '小红')).toBe(
      false,
    );

    const teacherHong = await request(app.getHttpServer())
      .get(`${prefix}/teacher/students/${hongId}/artworks`)
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(teacherHong.status).toBe(404);
    expect(teacherHong.body).toEqual({ code: 'NOT_FOUND', message: '无法查看' });
  });

  it('rejects duplicate bindings with CONFLICT_BINDING', async () => {
    const adminToken = await token(phones.admin);
    const parentA = await prisma.user.findUniqueOrThrow({ where: { phone: phones.parentA } });
    const ming = await prisma.student.findFirstOrThrow({ where: { name: '小明' } });

    const dup = await request(app.getHttpServer())
      .post(`${prefix}/admin/bindings`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ parentId: parentA.id, studentId: ming.id });
    expect(dup.status).toBe(409);
    expect(dup.body).toEqual({ code: 'CONFLICT_BINDING', message: '已绑定' });
  });

  it('rejects deleting a student that already has artworks', async () => {
    const teacherToken = await token(phones.teacher);
    const adminToken = await token(phones.admin);
    const students = await request(app.getHttpServer())
      .get(`${prefix}/teacher/students`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(200);
    const ming = students.body.items.find((s: { name: string }) => s.name === '小明');

    await request(app.getHttpServer())
      .post(`${prefix}/teacher/students/${ming.id}/artworks`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .attach('image', pngStub(), 'tree.png')
      .field('title', '春天的树')
      .field('createdAt', '2026-03-12T00:00:00.000Z')
      .field('courseTheme', '春天')
      .expect(201);

    const del = await request(app.getHttpServer())
      .delete(`${prefix}/admin/students/${ming.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(del.status).toBe(409);
    expect(del.body).toEqual({
      code: 'CONFLICT_STUDENT_HAS_ARTWORK',
      message: '该学员已有作品，仅支持归档',
    });
  });

  it('blocks preview and download without logo, then returns distinct URLs', async () => {
    const teacherToken = await token(phones.teacher);
    const parentA = await token(phones.parentA);
    const parentB = await token(phones.parentB);
    const adminToken = await token(phones.admin);

    const students = await request(app.getHttpServer())
      .get(`${prefix}/teacher/students`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(200);
    const ming = students.body.items.find((s: { name: string }) => s.name === '小明');

    const existing = await request(app.getHttpServer())
      .get(`${prefix}/teacher/students/${ming.id}/artworks`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(200);
    let artworkId = existing.body.items[0]?.id as string | undefined;
    if (!artworkId) {
      const upload = await request(app.getHttpServer())
        .post(`${prefix}/teacher/students/${ming.id}/artworks`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .attach('image', pngStub(), 'tree.png')
        .field('title', '春天的树')
        .field('createdAt', '2026-03-12T00:00:00.000Z')
        .expect(201);
      artworkId = upload.body.id;
      expect(upload.body.studentName).toBe('小明');
      expect(upload.body.commentText).toBeNull();
    }

    const noLogoPreview = await request(app.getHttpServer())
      .post(`${prefix}/parent/artworks/${artworkId}/posters/preview`)
      .set('Authorization', `Bearer ${parentA}`)
      .send({ templateKey: 'simple' });
    expect(noLogoPreview.status).toBe(400);
    expect(noLogoPreview.body).toEqual({
      code: 'LOGO_NOT_CONFIGURED',
      message: '请联系机构配置 LOGO',
    });

    const noLogo = await request(app.getHttpServer())
      .post(`${prefix}/parent/artworks/${artworkId}/posters`)
      .set('Authorization', `Bearer ${parentA}`)
      .send({ templateKey: 'simple' });
    expect(noLogo.status).toBe(400);
    expect(noLogo.body).toEqual({
      code: 'LOGO_NOT_CONFIGURED',
      message: '请联系机构配置 LOGO',
    });

    await request(app.getHttpServer())
      .post(`${prefix}/admin/brand/logo`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', pngStub(), 'logo.png')
      .expect(201);

    const hidden = await request(app.getHttpServer())
      .get(`${prefix}/parent/artworks/${artworkId}`)
      .set('Authorization', `Bearer ${parentB}`);
    expect(hidden.status).toBe(404);
    expect(hidden.body).toEqual({ code: 'NOT_FOUND', message: '无法查看' });

    const preview = await request(app.getHttpServer())
      .post(`${prefix}/parent/artworks/${artworkId}/posters/preview`)
      .set('Authorization', `Bearer ${parentA}`)
      .send({ templateKey: 'frame' })
      .expect(201);
    const download = await request(app.getHttpServer())
      .post(`${prefix}/parent/artworks/${artworkId}/posters`)
      .set('Authorization', `Bearer ${parentA}`)
      .send({ templateKey: 'frame' })
      .expect(201);
    expect(preview.body.templateKey).toBe('frame');
    expect(download.body.templateKey).toBe('frame');
    expect(preview.body.previewUrl).toContain('/files/posters/previews/');
    expect(download.body.downloadUrl).toContain('/files/posters/downloads/');
    expect(preview.body.previewUrl).not.toBe(download.body.downloadUrl);
    expect(preview.body.downloadUrl).toBeUndefined();
    expect(download.body.previewUrl).toBeUndefined();
    expect(await prisma.poster.count()).toBe(1);
  });

  it('archives students and refreshes tokens', async () => {
    const adminToken = await token(phones.admin);
    const created = await request(app.getHttpServer())
      .post(`${prefix}/admin/students`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '小刚', className: '创意班' })
      .expect(201);

    const archived = await request(app.getHttpServer())
      .patch(`${prefix}/admin/students/${created.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'archived' })
      .expect(200);
    expect(archived.body.status).toBe('archived');

    const session = await login(phones.admin);
    const refreshed = await request(app.getHttpServer())
      .post(`${prefix}/auth/refresh`)
      .send({ refreshToken: session.body.refreshToken })
      .expect(200);
    expect(refreshed.body.accessToken).toBeTruthy();
    expect(refreshed.body.refreshToken).toBeTruthy();

    await request(app.getHttpServer())
      .post(`${prefix}/auth/logout`)
      .set('Authorization', `Bearer ${session.body.accessToken}`)
      .expect(204);
  });

  it('serves public home under v1 even without a logo', async () => {
    const res = await request(app.getHttpServer())
      .get(`${prefix}/public/home`)
      .expect(200);
    expect(res.body.brand.orgName).toBe('测试画室');
    expect(res.body.brand.logoUrl).toBeNull();
    expect(res.body.banners).toEqual([]);
    expect(res.body.featuredArtworks).toEqual([]);
    expect(res.body.courses).toEqual([]);
  });
});
