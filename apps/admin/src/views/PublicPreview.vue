<template>
  <div>
    <h2 class="page-title">公开首页预览</h2>
    <p class="page-hint">非 P0 验收。GET /api/v1/public/home。</p>
    <el-card>
      <div class="hero">
        <el-image v-if="data.settings?.logoUrl" :src="data.settings.logoUrl" class="logo" />
        <div>
          <h1>{{ data.settings?.orgName }}</h1>
          <p>{{ data.settings?.watermarkText }}</p>
        </div>
      </div>
      <el-divider />
      <el-card v-for="item in data.contents" :key="item.id" class="block" shadow="never">
        <el-tag>{{ item.type }}</el-tag>
        <h3>{{ item.title }}</h3>
        <p>{{ item.body }}</p>
      </el-card>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { http } from '../api/http';

const data = ref<{
  settings?: { orgName: string; logoUrl: string | null; watermarkText: string };
  contents: Array<{ id: string; type: string; title: string; body: string }>;
}>({ contents: [] });

onMounted(async () => {
  const res = await http.get('/public/home');
  data.value = res.data;
});
</script>

<style scoped>
.hero {
  display: flex;
  gap: 16px;
  align-items: center;
}
.logo {
  width: 72px;
  height: 72px;
}
.block {
  margin-bottom: 12px;
}
</style>
