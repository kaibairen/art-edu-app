<template>
  <el-container class="shell">
    <el-aside width="220px" class="aside">
      <div class="brand">星光美术 · 管理端</div>
      <el-menu :default-active="route.path" router>
        <el-menu-item index="/users">用户管理</el-menu-item>
        <el-menu-item index="/students">学员与绑定</el-menu-item>
        <el-menu-item index="/settings">LOGO / 水印</el-menu-item>
        <el-menu-item index="/templates">海报模板</el-menu-item>
        <el-menu-item index="/home">首页内容</el-menu-item>
        <el-menu-item index="/preview">公开首页预览</el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <span>{{ auth.user?.name }}（{{ auth.user?.phone }}）</span>
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

function onLogout() {
  auth.logout();
  router.push('/login');
}
</script>

<style scoped>
.shell {
  min-height: 100%;
}
.aside {
  background: #fff8f0;
  border-right: 1px solid #eedfd0;
}
.brand {
  padding: 20px 16px;
  font-weight: 700;
}
.header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  background: #fff;
}
</style>
