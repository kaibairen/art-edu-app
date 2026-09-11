<template>
  <el-container class="shell">
    <el-aside width="228px" class="aside">
      <div class="brand">
        <div class="brand-name">星光美术</div>
        <div class="role-chip">管理端</div>
      </div>
      <el-menu :default-active="route.path" router>
        <el-menu-item-group title="常用">
          <el-menu-item index="/users">账号管理</el-menu-item>
          <el-menu-item index="/students">学员与绑定</el-menu-item>
          <el-menu-item index="/settings">品牌 / LOGO / 水印</el-menu-item>
          <el-menu-item index="/templates">海报模板</el-menu-item>
        </el-menu-item-group>
        <el-menu-item-group title="更多">
          <el-menu-item index="/home" class="soon-item">
            <span>首页内容</span>
            <span class="soon-badge">即将开放</span>
          </el-menu-item>
          <el-menu-item index="/preview" class="soon-item">
            <span>公开首页预览</span>
            <span class="soon-badge">即将开放</span>
          </el-menu-item>
        </el-menu-item-group>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <span class="who">
          {{ auth.displayName }}
          <em>{{ auth.roleLabel }}</em>
          {{ auth.user?.phone }}
        </span>
        <el-button text @click="onLogout">退出</el-button>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

async function onLogout() {
  await auth.logout();
  await router.push('/login');
}
</script>

<style scoped>
.shell {
  min-height: 100%;
}
.aside {
  background: var(--color-bg);
  border-right: 1px solid var(--color-border);
}
.brand {
  padding: 20px var(--space-4);
}
.brand-name {
  font-weight: var(--font-title-weight);
  color: var(--color-brand);
  font-size: var(--font-title-size);
  line-height: var(--font-title-line);
}
.role-chip {
  display: inline-block;
  margin-top: var(--space-2);
  padding: 2px 8px;
  border-radius: var(--radius-tag);
  background: var(--color-bg-subtle);
  color: var(--color-ink-secondary);
  font-size: var(--font-badge-size);
  line-height: var(--font-badge-line);
  font-weight: var(--font-badge-weight);
}
.header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-3);
  background: var(--color-bg);
  color: var(--color-ink-secondary);
}
.who em {
  font-style: normal;
  margin: 0 6px;
  color: var(--color-brand);
  font-weight: var(--font-body-emphasis-weight);
}
.aside :deep(.soon-item) {
  color: var(--color-ink-tertiary) !important;
  opacity: 0.78;
}
.aside :deep(.soon-item.is-active) {
  color: var(--color-ink-secondary) !important;
}
.soon-badge {
  margin-left: auto;
  padding: 0 6px;
  border-radius: var(--radius-tag);
  background: var(--color-bg-subtle);
  color: var(--color-ink-tertiary);
  font-size: var(--font-badge-size);
  line-height: var(--font-badge-line);
  font-weight: var(--font-badge-weight);
}
</style>
