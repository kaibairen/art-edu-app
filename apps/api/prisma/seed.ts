import { PrismaClient, Role, StudentStatus, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const TEMPLATES = [
  {
    id: 'simple',
    key: 'simple',
    name: '简约',
    description: '干净留白，突出作品本身。',
    metadata: {
      background: '#F7F4EE',
      accent: '#1F2937',
      frame: '#D6D3D1',
    },
  },
  {
    id: 'frame',
    key: 'frame',
    name: '画框',
    description: '画框陈列，适合课堂作品展示。',
    metadata: {
      background: '#F6EFE4',
      accent: '#3D2B1F',
      frame: '#8B5A2B',
    },
  },
  {
    id: 'magazine',
    key: 'magazine',
    name: '杂志',
    description: '杂志封面风格，适合分享传播。',
    metadata: {
      background: '#FFF4E6',
      accent: '#9A3412',
      frame: '#C2410C',
    },
  },
];

async function main() {
  const adminPhone = process.env.SEED_ADMIN_PHONE ?? '13800000000';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123';

  const [adminHash, teacherHash, parentHash] = await Promise.all([
    bcrypt.hash(adminPassword, 10),
    bcrypt.hash('Teacher123', 10),
    bcrypt.hash('Parent123', 10),
  ]);

  const admin = await prisma.user.upsert({
    where: { phone: adminPhone },
    update: {
      displayName: '校长',
      status: UserStatus.active,
    },
    create: {
      phone: adminPhone,
      email: 'admin@artedu.local',
      passwordHash: adminHash,
      displayName: '校长',
      role: Role.admin,
      status: UserStatus.active,
    },
  });

  const teacher = await prisma.user.upsert({
    where: { phone: '13800000001' },
    update: {
      displayName: '林老师',
      status: UserStatus.active,
      classNames: ['创意水彩班'],
    },
    create: {
      phone: '13800000001',
      email: 'teacher@artedu.local',
      passwordHash: teacherHash,
      displayName: '林老师',
      role: Role.teacher,
      status: UserStatus.active,
      classNames: ['创意水彩班'],
    },
  });

  const parentA = await prisma.user.upsert({
    where: { phone: '13800000002' },
    update: {
      displayName: '小明妈妈',
      status: UserStatus.active,
    },
    create: {
      phone: '13800000002',
      email: 'parent.ming@artedu.local',
      passwordHash: parentHash,
      displayName: '小明妈妈',
      role: Role.parent,
      status: UserStatus.active,
    },
  });

  const parentB = await prisma.user.upsert({
    where: { phone: '13800000003' },
    update: {
      displayName: '小红爸爸',
      status: UserStatus.active,
    },
    create: {
      phone: '13800000003',
      email: 'parent.hong@artedu.local',
      passwordHash: parentHash,
      displayName: '小红爸爸',
      role: Role.parent,
      status: UserStatus.active,
    },
  });

  const xiaoming = await prisma.student.upsert({
    where: { id: '11111111-1111-1111-1111-111111111111' },
    update: {
      className: '创意水彩班',
      status: StudentStatus.active,
    },
    create: {
      id: '11111111-1111-1111-1111-111111111111',
      name: '小明',
      className: '创意水彩班',
      gender: '男',
      birthday: new Date('2016-05-12'),
      note: '喜好水彩与线描',
      status: StudentStatus.active,
    },
  });

  const xiaohong = await prisma.student.upsert({
    where: { id: '22222222-2222-2222-2222-222222222222' },
    update: {
      className: '创意水彩班',
      status: StudentStatus.active,
    },
    create: {
      id: '22222222-2222-2222-2222-222222222222',
      name: '小红',
      className: '创意水彩班',
      gender: '女',
      birthday: new Date('2017-09-03'),
      note: '喜好彩铅与拼贴',
      status: StudentStatus.active,
    },
  });

  await prisma.parentStudent.upsert({
    where: {
      parentId_studentId: { parentId: parentA.id, studentId: xiaoming.id },
    },
    update: {},
    create: { parentId: parentA.id, studentId: xiaoming.id },
  });

  await prisma.parentStudent.upsert({
    where: {
      parentId_studentId: { parentId: parentB.id, studentId: xiaohong.id },
    },
    update: {},
    create: { parentId: parentB.id, studentId: xiaohong.id },
  });

  await prisma.orgSetting.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      orgName: '星光美术教室',
      logoUrl: null,
      watermarkText: '星光美术 · 作品仅供家校分享',
      watermarkOpacity: 0.2,
      watermarkPosition: 'bottomRight',
    },
  });

  for (const tpl of TEMPLATES) {
    await prisma.posterTemplate.upsert({
      where: { key: tpl.key },
      update: {
        name: tpl.name,
        description: tpl.description,
        metadata: tpl.metadata,
        enabled: true,
      },
      create: tpl,
    });
  }

  const [bannerCount, featuredCount, courseCount] = await Promise.all([
    prisma.homeBanner.count(),
    prisma.homeFeaturedArtwork.count(),
    prisma.homeCourse.count(),
  ]);

  if (bannerCount === 0) {
    await prisma.homeBanner.createMany({
      data: [
        {
          imageUrl: '/files/home/banner-autumn.jpg',
          title: '把每一次落笔，都变成成长档案',
          subtitle: '作品存档 · 家校点评 · 海报分享',
          linkUrl: null,
          sortOrder: 0,
          enabled: true,
        },
        {
          imageUrl: '/files/home/banner-draft.jpg',
          title: '未启用轮播（公开不可见）',
          subtitle: '草稿',
          sortOrder: 10,
          enabled: false,
        },
      ],
    });
  }

  if (featuredCount === 0) {
    await prisma.homeFeaturedArtwork.createMany({
      data: [
        {
          imageUrl: '/files/home/feat-spring-tree.jpg',
          title: '春天的树',
          studentDisplayName: '小明',
          sortOrder: 0,
          published: true,
        },
        {
          imageUrl: '/files/home/feat-color-blocks.jpg',
          title: '彩色色块',
          studentDisplayName: '小红',
          sortOrder: 1,
          published: true,
        },
        {
          imageUrl: '/files/home/feat-draft.jpg',
          title: '未发布作品卡',
          studentDisplayName: '内部预览',
          sortOrder: 20,
          published: false,
        },
      ],
    });
  }

  if (courseCount === 0) {
    await prisma.homeCourse.createMany({
      data: [
        {
          title: '少儿创意水彩',
          summary: '周六上午小班制，观察力、构图与色彩表达。',
          coverUrl: '/files/home/course-watercolor.jpg',
          sortOrder: 0,
          published: true,
        },
        {
          title: '素描基础',
          summary: '线条、明暗与结构，适合 8 岁以上。',
          coverUrl: null,
          sortOrder: 1,
          published: true,
        },
        {
          title: '未发布课程',
          summary: '草稿，公开首页不可见。',
          sortOrder: 20,
          published: false,
        },
      ],
    });
  }

  // eslint-disable-next-line no-console
  console.log('Seed completed', {
    admin: admin.phone,
    teacher: teacher.phone,
    parentA: parentA.phone,
    parentB: parentB.phone,
    students: [xiaoming.name, xiaohong.name],
    className: '创意水彩班',
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
