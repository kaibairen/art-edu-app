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

// 5. F-011 classNames
const users = read('apps/admin/src/views/UsersView.vue');
if (!users.includes('classNames')) {
  fail('UsersView 未编辑教师 classNames');
}
const home = read('apps/mobile/lib/src/screens/home_screen.dart');
if (!home.includes('请联系管理员分配班级')) {
  fail('教师端缺少班级空态文案');
}

// 6. 海报三分离
const preview = read('apps/mobile/lib/src/screens/poster_preview_screen.dart');
const result = read('apps/mobile/lib/src/screens/poster_result_screen.dart');
const api = read('apps/mobile/lib/src/api_client.dart');
if (!preview.includes('previewPoster') || !preview.includes('downloadPoster')) {
  fail('预览页必须分别调用 previewPoster / downloadPoster');
}
if (!result.includes('downloadUrl') || result.includes('previewPoster')) {
  fail('结果页应只展示 downloadUrl');
}
if (!api.includes('/posters/preview') || !api.includes('/parent/artworks/')) {
  fail('Flutter client 缺少预览/下载分端点');
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

if (failures.length) {
  console.error('FRONTEND_READY 硬约束自检失败：');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}
console.log('FRONTEND_READY 硬约束自检通过');
