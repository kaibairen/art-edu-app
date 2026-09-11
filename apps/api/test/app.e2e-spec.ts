import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { execSync } from 'child_process';
import { mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * 关键路径 e2e：
 * 1) 家长越权访问未绑定学员必须失败
 * 2) 教师上传作品后，绑定家长可见、另一家长不可见
 * 3) 三套海报模板均含姓名、创作时间、LOGO、水印
 *
 * 依赖：PostgreSQL（DATABASE_URL）
 */
describe('Art edu MVP e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const storageDir = join(process.cwd(), 'storage-e2e');

  const phones = {
    admin: '13900000000',
    teacher: '13900000001',
    parentA: '13900000002',
    parentB: '13900000003',
  };

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required for e2e tests');
    }
    process.env.JWT_SECRET = 'e2e-secret';
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
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
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
    await prisma.parentStudent.deleteMany();
    await prisma.teacherStudent.deleteMany();
    await prisma.homeContent.deleteMany();
    await prisma.student.deleteMany();
    await prisma.user.deleteMany();
    await prisma.orgSetting.deleteMany();
    await prisma.posterTemplate.deleteMany();
  }

  async function seedFixtures() {
    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash('Passw0rd', 10);
    const [admin, teacher, parentA, parentB, ming, hong] = await Promise.all([
      prisma.user.create({
        data: {
          phone: phones.admin,
          name: '管理员',
          role: Role.admin,
          passwordHash: hash,
        },
      }),
      prisma.user.create({
        data: {
          phone: phones.teacher,
          name: '林老师',
          role: Role.teacher,
          passwordHash: hash,
        },
      }),
      prisma.user.create({
        data: {
          phone: phones.parentA,
          name: '家长A',
          role: Role.parent,
          passwordHash: hash,
        },
      }),
      prisma.user.create({
        data: {
          phone: phones.parentB,
          name: '家长B',
          role: Role.parent,
          passwordHash: hash,
        },
      }),
      prisma.student.create({ data: { name: '小明' } }),
      prisma.student.create({ data: { name: '小红' } }),
    ]);

    await prisma.parentStudent.create({
      data: { parentId: parentA.id, studentId: ming.id },
    });
    await prisma.parentStudent.create({
      data: { parentId: parentB.id, studentId: hong.id },
    });
    await prisma.teacherStudent.create({
      data: { teacherId: teacher.id, studentId: ming.id },
    });
    await prisma.orgSetting.create({
      data: {
        id: 'default',
        orgName: '测试画室',
        watermarkText: '测试水印不可去掉',
      },
    });
    await prisma.posterTemplate.createMany({
      data: [
        {
          id: 'classic',
          key: 'classic',
          name: '经典',
          description: 'd',
          metadata: {},
        },
        {
          id: 'gallery',
          key: 'gallery',
          name: '展厅',
          description: 'd',
          metadata: {},
        },
        {
          id: 'festival',
          key: 'festival',
          name: '节日',
          description: 'd',
          metadata: {},
        },
      ],
    });

    return { admin, teacher, parentA, parentB, ming, hong };
  }

  async function login(account: string) {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ account, password: 'Passw0rd' })
      .expect(201);
    return res.body.accessToken as string;
  }

  function pngStub() {
    // 1x1 PNG
    return Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );
  }

  it('public home API is available without auth', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/public/home')
      .expect(200);
    expect(res.body.settings.orgName).toBe('测试画室');
  });

  it('rejects parent access to unbound student and artwork', async () => {
    const tokenA = await login(phones.parentA);
    const tokenB = await login(phones.parentB);

    const childrenA = await request(app.getHttpServer())
      .get('/api/parent/children')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    const childrenB = await request(app.getHttpServer())
      .get('/api/parent/children')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);

    expect(childrenA.body).toHaveLength(1);
    expect(childrenA.body[0].name).toBe('小明');
    expect(childrenB.body[0].name).toBe('小红');

    const mingId = childrenA.body[0].id as string;
    const hongId = childrenB.body[0].id as string;

    await request(app.getHttpServer())
      .get(`/api/parent/children/${hongId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(403);

    await request(app.getHttpServer())
      .get(`/api/parent/children/${hongId}/timeline`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(403);

    await request(app.getHttpServer())
      .get(`/api/parent/children/${mingId}/timeline`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
  });

  it('teacher upload is visible to bound parent and hidden from the other parent', async () => {
    const teacherToken = await login(phones.teacher);
    const parentA = await login(phones.parentA);
    const parentB = await login(phones.parentB);

    const students = await request(app.getHttpServer())
      .get('/api/teacher/students')
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(200);
    const ming = students.body.find((s: { name: string }) => s.name === '小明');
    expect(ming).toBeTruthy();

    const upload = await request(app.getHttpServer())
      .post(`/api/teacher/students/${ming.id}/artworks`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .attach('image', pngStub(), 'tree.png')
      .field('theme', '春天的树')
      .field('createdOn', '2026-03-12')
      .field('textComment', '构图稳定，色彩明亮')
      .expect(201);

    expect(upload.body.theme).toBe('春天的树');
    expect(upload.body.textComment).toContain('构图');

    const timelineA = await request(app.getHttpServer())
      .get(`/api/parent/children/${ming.id}/timeline`)
      .set('Authorization', `Bearer ${parentA}`)
      .expect(200);
    expect(timelineA.body.items).toHaveLength(1);
    expect(timelineA.body.items[0].id).toBe(upload.body.id);

    await request(app.getHttpServer())
      .get(`/api/parent/artworks/${upload.body.id}`)
      .set('Authorization', `Bearer ${parentA}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/parent/artworks/${upload.body.id}`)
      .set('Authorization', `Bearer ${parentB}`)
      .expect(403);

    await request(app.getHttpServer())
      .post(`/api/parent/artworks/${upload.body.id}/posters`)
      .set('Authorization', `Bearer ${parentB}`)
      .send({ templateKey: 'classic' })
      .expect(403);
  });

  it('generates three poster templates with name, date, logo and watermark', async () => {
    const teacherToken = await login(phones.teacher);
    const students = await request(app.getHttpServer())
      .get('/api/teacher/students')
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(200);
    const ming = students.body[0];

    const existing = await request(app.getHttpServer())
      .get(`/api/teacher/students/${ming.id}/artworks`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(200);

    let artworkId = existing.body.items[0]?.id as string | undefined;
    if (!artworkId) {
      const upload = await request(app.getHttpServer())
        .post(`/api/teacher/students/${ming.id}/artworks`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .attach('image', pngStub(), 'tree.png')
        .field('theme', '春天的树')
        .field('createdOn', '2026-03-12')
        .expect(201);
      artworkId = upload.body.id;
    }

    for (const templateKey of ['classic', 'gallery', 'festival']) {
      const poster = await request(app.getHttpServer())
        .post(`/api/teacher/artworks/${artworkId}/posters`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ templateKey })
        .expect(201);
      expect(poster.body.imageUrl).toContain('/files/');
      expect(poster.body.recipe.studentName).toBe('小明');
      expect(poster.body.recipe.createdOn).toBe('2026-03-12');
      expect(poster.body.recipe.watermarkText).toBe('测试水印不可去掉');
      expect(poster.body.recipe.logoEmbedded).toBe(true);
      expect(poster.body.recipe.overlays).toEqual([
        'name',
        'createdOn',
        'logo',
        'watermark',
      ]);
    }
  });

  it('admin can update logo/watermark and home content', async () => {
    const adminToken = await login(phones.admin);
    const updated = await request(app.getHttpServer())
      .patch('/api/admin/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ orgName: '新机构名', watermarkText: '新水印' })
      .expect(200);
    expect(updated.body.orgName).toBe('新机构名');
    expect(updated.body.watermarkText).toBe('新水印');

    const created = await request(app.getHttpServer())
      .post('/api/admin/home-contents')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        type: 'announcement',
        title: '春季招生',
        body: '名额有限',
        published: true,
      })
      .expect(201);
    expect(created.body.title).toBe('春季招生');

    const home = await request(app.getHttpServer())
      .get('/api/public/home')
      .expect(200);
    expect(home.body.settings.watermarkText).toBe('新水印');
    expect(home.body.contents.some((c: { title: string }) => c.title === '春季招生')).toBe(
      true,
    );
  });
});
