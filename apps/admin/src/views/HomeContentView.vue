<!--
  US-P1-01 管理端首页内容。正式类型来自 @art-edu/api-types。
  路径：P1_HOME_PATHS
    /admin/home/banners
    /admin/home/courses
    /admin/home/featured-artworks
    /public/home
  硬约束：公开卡无点评；课程无长文。
-->
<template>
  <div>
    <div class="page-bar">
      <div>
        <h2 class="page-title">首页内容</h2>
        <p class="page-hint">
          维护对外公开的轮播、课程介绍和优秀作品。公开卡无点评；课程无长文。
        </p>
      </div>
      <el-button @click="openPreview">公开首页预览</el-button>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="轮播" name="banners">
        <BannersPanel />
      </el-tab-pane>
      <el-tab-pane label="课程介绍" name="courses">
        <CoursesPanel />
      </el-tab-pane>
      <el-tab-pane label="优秀作品公开" name="featured">
        <FeaturedPanel />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import BannersPanel from './home/BannersPanel.vue';
import CoursesPanel from './home/CoursesPanel.vue';
import FeaturedPanel from './home/FeaturedPanel.vue';

const activeTab = ref('banners');
const router = useRouter();

function openPreview() {
  void router.push('/preview');
}
</script>

<style scoped>
.page-bar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}
.page-title {
  margin-bottom: var(--space-2);
}
.page-hint {
  margin: 0;
  max-width: 40rem;
}
</style>
