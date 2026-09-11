import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const TEMPLATES = [
  {
    id: 'classic',
    key: 'classic',
    name: '经典画框',
    description: '米白底 + 深色画框，适合日常课堂作品。',
    metadata: {
      background: '#F6EFE4',
      accent: '#3D2B1F',
      frame: '#8B5A2B',
    },
  },
  {
    id: 'gallery',
    key: 'gallery',
    name: '展厅白墙',
    description: '美术馆白墙风格，突出作品本身。',
    metadata: {
      background: '#F4F1EA',
      accent: '#1F2937',
      frame: '#111827',
    },
  },
  {
    id: 'festival',
    key: 'festival',
    name: '节日彩章',
    description: '暖色节日配色，适合活动展示与分享。',
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
    update: {},
    create: {
      phone: adminPhone,
      email: 'admin@artedu.local',
      passwordHash: adminHash,
      name: '校长',
      role: Role.admin,
    },
  });

  const teacher = await prisma.user.upsert({
    where: { phone: '13800000001' },
    update: {},
    create: {
      phone: '13800000001',
      email: 'teacher@artedu.local',
      passwordHash: teacherHash,
      name: '林老师',
      role: Role.teacher,
    },
  });

  const parentA = await prisma.user.upsert({
    where: { phone: '13800000002' },
    update: {},
    create: {
      phone: '13800000002',
      email: 'parent.ming@artedu.local',
      passwordHash: parentHash,
      name: '小明妈妈',
      role: Role.parent,
    },
  });

  const parentB = await prisma.user.upsert({
    where: { phone: '13800000003' },
    update: {},
    create: {
      phone: '13800000003',
      email: 'parent.hong@artedu.local',
      passwordHash: parentHash,
      name: '小红爸爸',
      role: Role.parent,
    },
  });

  const xiaoming = await prisma.student.upsert({
    where: { id: '11111111-1111-1111-1111-111111111111' },
    update: {},
    create: {
      id: '11111111-1111-1111-1111-111111111111',
      name: '小明',
      gender: '男',
      birthday: new Date('2016-05-12'),
      note: '喜好水彩与线描',
    },
  });

  const xiaohong = await prisma.student.upsert({
    where: { id: '22222222-2222-2222-2222-222222222222' },
    update: {},
    create: {
      id: '22222222-2222-2222-2222-222222222222',
      name: '小红',
      gender: '女',
      birthday: new Date('2017-09-03'),
      note: '喜好彩铅与拼贴',
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

  await prisma.teacherStudent.upsert({
    where: {
      teacherId_studentId: { teacherId: teacher.id, studentId: xiaoming.id },
    },
    update: {},
    create: { teacherId: teacher.id, studentId: xiaoming.id },
  });

  await prisma.teacherStudent.upsert({
    where: {
      teacherId_studentId: { teacherId: teacher.id, studentId: xiaohong.id },
    },
    update: {},
    create: { teacherId: teacher.id, studentId: xiaohong.id },
  });

  await prisma.orgSetting.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      orgName: '星光美术教室',
      logoUrl: null,
      watermarkText: '星光美术 · 作品仅供家校分享',
    },
  });

  for (const tpl of TEMPLATES) {
    await prisma.posterTemplate.upsert({
      where: { key: tpl.key },
      update: {
        name: tpl.name,
        description: tpl.description,
        metadata: tpl.metadata,
      },
      create: tpl,
    });
  }

  const homeCount = await prisma.homeContent.count();
  if (homeCount === 0) {
    await prisma.homeContent.createMany({
      data: [
        {
          type: 'banner',
          title: '把每一次落笔，都变成成长档案',
          body: '作品存档 · 家校点评 · 海报分享',
          sortOrder: 0,
          published: true,
        },
        {
          type: 'about',
          title: '关于星光美术',
          body: '面向 4-15 岁学员的系统美术课程，强调观察力、构图与色彩表达。',
          sortOrder: 1,
          published: true,
        },
        {
          type: 'course',
          title: '少儿创意水彩',
          body: '周六上午 9:30-11:00，小班制，作品纳入成长时间线。',
          sortOrder: 2,
          published: true,
        },
        {
          type: 'announcement',
          title: '本月主题：春天的树',
          body: '请家长在 APP 中查看孩子最新课堂作品与教师点评。',
          sortOrder: 3,
          published: true,
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
