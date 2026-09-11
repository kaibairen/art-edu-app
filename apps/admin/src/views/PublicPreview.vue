<template>
  <div>
    <h2 class="page-title">公开首页预览</h2>
    <p class="page-hint">GET /api/v1/public/home。未配置 LOGO 也可打开。优秀作品卡不含点评。</p>
    <el-card>
      <div class="hero">
        <el-image v-if="data.brand?.logoUrl" :src="data.brand.logoUrl" class="logo" />
        <div>
          <h1>{{ data.brand?.orgName || '机构公开首页' }}</h1>
          <p v-if="!data.brand?.logoUrl">尚未配置 LOGO（不阻断公开首页）</p>
        </div>
      </div>
      <el-divider />
      <h3>轮播</h3>
      <el-card v-for="item in data.banners" :key="item.id" class="block" shadow="never">
        <h4>{{ item.title }}</h4>
        <p>{{ item.subtitle }}</p>
      </el-card>
      <h3>优秀作品</h3>
      <el-card v-for="item in data.featuredArtworks" :key="item.id" class="block" shadow="never">
        <h4>{{ item.title }}</h4>
        <p>{{ item.studentDisplayName }}</p>
      </el-card>
      <h3>课程</h3>
      <el-card v-for="item in data.courses" :key="item.id" class="block" shadow="never">
        <h4>{{ item.title }}</h4>
        <p>{{ item.summary }}</p>
      </el-card>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { PublicHome } from '@art-edu/api-types';
import { http } from '../api/http';

const data = ref<PublicHome>({
  brand: { orgName: null, logoUrl: null },
  banners: [],
  featuredArtworks: [],
  courses: [],
});

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
