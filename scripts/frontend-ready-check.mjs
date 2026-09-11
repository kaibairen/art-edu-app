#!/usr/bin/env node
/**
 * FRONTEND_READY P0 硬约束自检（静态）。
 * 失败则 process.exit(1)。
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures = [];

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name === '.dart_tool') continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

function fail(msg) {
  failures.push(msg);
}

// 1. 品牌色
const tokens = read('packages/tokens/src/tokens.css');
if (!/\#2[fF]6[fF][eE][dD]/.test(tokens) && !/--color-brand:\s*#2f6fed/.test(tokens)) {
  fail('packages/tokens 缺少品牌色 #2F6FED');
}
const flutterTokens = read('apps/mobile/lib/src/tokens.dart');
if (!flutterTokens.includes('0xFF2F6FED')) {
  fail('Flutter tokens 缺少 #2F6FED');
}

// 2. 管理端默认 /api/v1
const http = read('apps/admin/src/api/http.ts');
if (!http.includes('/api/v1')) {
  fail('admin http.ts 默认基址必须是 /api/v1');
}
if (http.includes("3000/api'")) {
  fail('admin http.ts 仍默认无 v1 的 /api');
}

// 3. 禁止旧模板 key 出现在业务页
const businessFiles = [
  ...walk(join(root, 'apps/admin/src/views')),
  ...walk(join(root, 'apps/mobile/lib/src/screens')),
];
for (const file of businessFiles) {
  const text = readFileSync(file, 'utf8');
  if (/(['"`])classic\1|(['"`])gallery\1|(['"`])festival\1/.test(text)) {
    fail(`${file.replace(root + '/', '')} 仍使用 classic/gallery/festival`);
  }
}

// 4. 模板对外名
const settings = read('apps/admin/src/views/SettingsView.vue');
const templates = read('apps/admin/src/views/TemplatesView.vue');
const models = read('apps/mobile/lib/src/models.dart');
for (const [name, text] of [
  ['SettingsView', settings],
  ['TemplatesView', templates],
  ['models.dart', models],
]) {
  if (!text.includes('简约') || !text.includes('画框') || !text.includes('杂志')) {
    fail(`${name} 缺少模板对外名 简约/画框/杂志`);
  }
}

// 5. F-011 正式类型：classNames[] / displayName / status；停用走 PATCH .../status
const users = read('apps/admin/src/views/UsersView.vue');
const v1 = read('apps/admin/src/api/v1.ts');
if (!users.includes('classNames')) {
  fail('UsersView 未编辑教师 classNames');
}
if (!users.includes("from '@art-edu/api-types'") || !users.includes('Account')) {
  fail('UsersView 必须用 @art-edu/api-types 的 Account（禁止 AccountDto / 手写旧字段）');
}
if (users.includes('AccountDto') || users.includes('@art-edu/shared')) {
  fail('UsersView 禁止再引用 AccountDto / @art-edu/shared 账号类型');
}
if (/\.disabled\b/.test(users) || /row\.name\b/.test(users) || /form\.name\b/.test(users)) {
  fail('UsersView 禁止旧字段 name / disabled，须用 displayName / status');
}
if (!users.includes('displayName') || !users.includes('status')) {
  fail('UsersView 必须使用正式字段 displayName / status');
}
if (!v1.includes('CreateAccountRequest') || !v1.includes('UpdateAccountRequest')) {
  fail('v1.ts 账号创建/更新必须用正式 CreateAccountRequest / UpdateAccountRequest');
}
if (!v1.includes("from '@art-edu/api-types'")) {
  fail('v1.ts 账号类型必须来自 @art-edu/api-types');
}
if (v1.includes('AccountDto')) {
  fail('v1.ts 禁止 AccountDto，须用正式 Account');
}
if (!v1.includes('/status') || !v1.includes('UpdateAccountStatusRequest')) {
  fail('停用必须走 PATCH .../status（UpdateAccountStatusRequest），不得写入 UpdateAccountRequest');
}
const home = read('apps/mobile/lib/src/screens/home_screen.dart');
if (!home.includes('请联系管理员分配班级')) {
  fail('教师端缺少班级空态文案');
}

// 6. 海报三分离；预览页主按钮标准文案（design/05）
const preview = read('apps/mobile/lib/src/screens/poster_preview_screen.dart');
const result = read('apps/mobile/lib/src/screens/poster_result_screen.dart');
const api = read('apps/mobile/lib/src/api_client.dart');
const upload = read('apps/mobile/lib/src/screens/upload_screen.dart');
const appDart = read('apps/mobile/lib/src/app.dart');
if (!preview.includes('previewPoster') || !preview.includes('downloadPoster')) {
  fail('预览页必须分别调用 previewPoster / downloadPoster');
}
if (!preview.includes("'生成并下载'")) {
  fail('预览页主按钮标准文案必须是「生成并下载」');
}
if (preview.includes('生成正式成片并进入结果页')) {
  fail('预览页主按钮不得再使用长文案「生成正式成片并进入结果页」');
}
if (!preview.includes('点模板可切换预览')) {
  fail('预览页说明必须是「点模板可切换预览」');
}
if (preview.includes('预览接口') || preview.includes('只请求预览接口')) {
  fail('预览页说明不得出现「接口」');
}
if (!result.includes('downloadUrl') || result.includes('previewPoster')) {
  fail('结果页应只展示 downloadUrl');
}
if (
  !result.includes("'分享'") ||
  !result.includes("'再下一张'") ||
  !result.includes("'返回作品'") ||
  !result.includes("'已保存'")
) {
  fail('结果页须：顶栏「已保存」，主「分享」、次「再下一张」、文字「返回作品」');
}
if (!api.includes('/posters/preview') || !api.includes('/parent/artworks/')) {
  fail('Flutter client 缺少预览/下载分端点');
}
if (upload.includes('单独接口') || upload.includes('非本期')) {
  fail('上传页不得出现「接口 / 非本期」工程文案');
}
if (!upload.includes('showDatePicker') || !upload.includes('toIso8601String()')) {
  fail('创作时间须用日期时间选择器，提交再序列化 ISO');
}
if (!appDart.includes('debugShowCheckedModeBanner: false')) {
  fail('体验构建须关闭 DEBUG banner（debugShowCheckedModeBanner: false）');
}

// 7. 登录 phone
const loginVue = read('apps/admin/src/views/LoginView.vue');
const loginDart = read('apps/mobile/lib/src/screens/login_screen.dart');
const auth = read('apps/admin/src/stores/auth.ts');
if (loginVue.includes('账号') && !loginVue.includes('手机号')) {
  fail('管理端登录应使用手机号');
}
if (!auth.includes('phone')) {
  fail('auth store 登录未使用 phone');
}
if (!loginDart.includes('手机号') || !api.includes("'phone':")) {
  fail('Flutter 登录必须提交 phone');
}

// 8. 越权文案
if (!home.includes('无法查看') || !read('apps/mobile/lib/src/screens/timeline_screen.dart').includes('无法查看')) {
  fail('家长/教师端未处理 404「无法查看」');
}

// 9. 文档 / 示例环境变量对齐 /api/v1（勿回退旧前缀或 account 登录）
const rootEnv = read('.env.example');
const apiEnv = read('apps/api/.env.example');
const adminEnv = read('apps/admin/.env.example');
const dockerDoc = read('docs/本机Docker调试一页纸.md');
for (const [name, text] of [
  ['.env.example', rootEnv],
  ['apps/api/.env.example', apiEnv],
]) {
  if (!/^API_PREFIX=api\/v1$/m.test(text)) {
    fail(`${name} 的 API_PREFIX 必须是 api/v1`);
  }
}
if (!adminEnv.includes('localhost:3000/api/v1')) {
  fail('apps/admin/.env.example 默认基址必须是 /api/v1');
}
if (adminEnv.includes('3000/api\n') || adminEnv.includes("3000/api'")) {
  fail('apps/admin/.env.example 仍写无 v1 的 /api');
}
if (!dockerDoc.includes('/api/v1/auth/login')) {
  fail('本机 Docker 一页纸登录路径必须是 /api/v1/auth/login');
}
if (dockerDoc.includes('/api/auth/login') || dockerDoc.includes('"account"')) {
  fail('本机 Docker 一页纸仍写旧 /api 前缀或 account 登录字段');
}

// 10. 管理端视觉打磨（A-01 / A-02 / A-05）：侧栏去 P0/P1、页说明去实现词、LOGO 空槽
const layout = read('apps/admin/src/layouts/AdminLayout.vue');
if (layout.includes('P0 本期') || layout.includes('非本期（P1）')) {
  fail('侧栏不得出现 P0/P1 工程分组文案');
}
if (!layout.includes('常用') && !layout.includes('更多')) {
  fail('侧栏分组应为「常用 / 更多」或隐藏分组');
}
if (!layout.includes('首页内容') || !layout.includes('公开首页预览')) {
  fail('侧栏须有可点的「首页内容」和「公开首页预览」');
}
if (layout.includes('即将开放') || layout.includes('soon-item') || layout.includes('soon-badge')) {
  fail('P1-PREP-01 / A01：首页内容 / 公开首页预览已启用，侧栏不得再标「即将开放」或 soon 弱化');
}
const usersHint = users.match(/<p class="page-hint">([\s\S]*?)<\/p>/);
if (usersHint && /classNames|className|F-011/.test(usersHint[1])) {
  fail('UsersView 页说明不得出现 classNames/className 等实现词');
}
const students = read('apps/admin/src/views/StudentsView.vue');
const studentsHint = students.match(/<p class="page-hint">([\s\S]*?)<\/p>/);
if (studentsHint && /classNames|className/.test(studentsHint[1])) {
  fail('StudentsView 页说明不得出现 classNames/className 等实现词');
}
if (!students.includes('el-dropdown') || !students.includes('归档') || !students.includes('删除')) {
  fail('学员操作列须用 ⋯ 菜单收纳归档/删除');
}
if (!settings.includes('尚未配置 LOGO') || !settings.includes('logo-slot')) {
  fail('品牌页须有 LOGO 预览槽，未配置展示「尚未配置 LOGO」');
}
if (!settings.includes('sr-file')) {
  fail('LOGO 上传须隐藏原生 Choose File 外观');
}

// 11. US-P1-01 管理端：正式类型 + 三 Tab CRUD + 硬约束
const homeContent = read('apps/admin/src/views/HomeContentView.vue');
const publicPreview = read('apps/admin/src/views/PublicPreview.vue');
const homeApi = read('apps/admin/src/api/home.ts');
const bannersPanel = read('apps/admin/src/views/home/BannersPanel.vue');
const coursesPanel = read('apps/admin/src/views/home/CoursesPanel.vue');
const featuredPanel = read('apps/admin/src/views/home/FeaturedPanel.vue');
const homeUi = [homeContent, publicPreview, bannersPanel, coursesPanel, featuredPanel].join('\n');
if (!homeContent.includes('轮播') || !homeContent.includes('课程介绍') || !homeContent.includes('优秀作品公开')) {
  fail('首页内容须有三 Tab：轮播 / 课程介绍 / 优秀作品公开');
}
if (!homeContent.includes('公开首页预览')) {
  fail('首页内容顶栏须有次操作「公开首页预览」');
}
if (!homeContent.includes('公开卡无点评') || !homeContent.includes('课程无长文')) {
  fail('首页内容页须写明硬约束：公开卡无点评；课程无长文');
}
if (
  !homeApi.includes('P1_HOME_PATHS') ||
  !homeApi.includes("from '@art-edu/api-types'") ||
  !homeApi.includes('PublicHome') ||
  !homeApi.includes('AdminBanner') ||
  !homeApi.includes('AdminCourse') ||
  !homeApi.includes('AdminFeaturedArtwork')
) {
  fail('home.ts 必须用 @art-edu/api-types 的 PublicHome / P1_HOME_PATHS / 三块 Admin 类型');
}
if (
  !homeApi.includes('adminBannerStatus') ||
  !homeApi.includes('adminBannersReorder') ||
  !homeApi.includes('adminCourseStatus') ||
  !homeApi.includes('adminFeaturedFromArtworks')
) {
  fail('home.ts 须接 status / reorder / from-artworks');
}
if (homeUi.includes('/admin/home-contents') || homeApi.includes('/admin/home-contents')) {
  fail('禁止再走旧路径 /admin/home-contents');
}
if (
  /v-model="[^"]*comment|label="点评"|prop="commentText"|teacherComment/.test(homeUi)
) {
  fail('优秀作品公开卡禁止点评字段');
}
if (/v-model="[^"]*body"|label="正文"|label="长文"/.test(homeUi)) {
  fail('课程介绍禁止长文 body');
}
if (!coursesPanel.includes('COURSE_SUMMARY_MAX_LENGTH')) {
  fail('课程摘要须使用 COURSE_SUMMARY_MAX_LENGTH');
}
if (!publicPreview.includes('PublicHome') || !publicPreview.includes('getPublicHome')) {
  fail('公开预览须 GET /public/home 并使用 PublicHome');
}
if (publicPreview.includes('settings?.') || publicPreview.includes('item.body') || publicPreview.includes('commentText')) {
  fail('公开预览不得写死旧 contents/body 或点评字段');
}
if (!publicPreview.includes('公开卡无点评') || !publicPreview.includes('课程无长文')) {
  fail('公开预览须写明硬约束：公开卡无点评；课程无长文');
}
const previewOrder = ['轮播', '课程介绍', '优秀作品'].map((label) => publicPreview.indexOf(`<h3>${label}</h3>`));
if (previewOrder.some((i) => i < 0) || previewOrder[0] > previewOrder[1] || previewOrder[1] > previewOrder[2]) {
  fail('P1-PREP-02 / E01：公开预览渲染序必须是 轮播 → 课程 → 优秀作品');
}
if (!/从(已有)?作品选/.test(featuredPanel) || !homeApi.includes('adminFeaturedFromArtworks')) {
  fail('P1-PREP-04 / D01：优秀作品须有「从作品选」并对接 from-artworks');
}
if (!bannersPanel.includes('重试') || !coursesPanel.includes('重试') || !featuredPanel.includes('重试')) {
  fail('F01/F02：管理端各 Tab 加载失败须可重试');
}
if ((publicPreview.match(/重试/g) || []).length < 3) {
  fail('F02：公开预览三区都须可重试');
}

const flutterPublic = read('apps/mobile/lib/src/screens/public_home_screen.dart');
const flutterApi = read('apps/mobile/lib/src/api_client.dart');
const flutterLogin = read('apps/mobile/lib/src/screens/login_screen.dart');
if (!flutterApi.includes('/public/home') || !flutterApi.includes('getPublicHome')) {
  fail('Flutter 须对接 GET /public/home');
}
if (!flutterLogin.includes('先看看公开首页') || !flutterLogin.includes('PublicHomeScreen')) {
  fail('登录页须能未登录进入公开首页');
}
if (!flutterPublic.includes('轮播') || !flutterPublic.includes('课程介绍') || !flutterPublic.includes('优秀作品')) {
  fail('Flutter 公开首页须有三区块');
}
const flutterOrder = ['轮播', '课程介绍', '优秀作品'].map((label) => flutterPublic.indexOf(`title: '${label}'`));
if (flutterOrder.some((i) => i < 0) || flutterOrder[0] > flutterOrder[1] || flutterOrder[1] > flutterOrder[2]) {
  fail('E01：Flutter 公开首页渲染序必须是 轮播 → 课程 → 优秀作品');
}
if (flutterPublic.includes('commentText') || /json\[['"]body['"]\]|item\.body/.test(flutterPublic)) {
  fail('Flutter 公开首页禁止点评 / 长文 body');
}
if (!flutterPublic.includes('公开卡无点评') || !flutterPublic.includes('课程无长文')) {
  fail('Flutter 公开首页须写明硬约束');
}
if ((flutterPublic.match(/重试/g) || []).length < 1) {
  fail('F02：Flutter 公开首页单区须可重试');
}

if (failures.length) {
  console.error('FRONTEND_READY 硬约束自检失败：');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}
console.log('FRONTEND_READY 硬约束自检通过');
