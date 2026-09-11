<template>
  <div>
    <div class="page-bar">
      <div>
        <h2 class="page-title">公开首页预览</h2>
        <p class="page-hint">
          按访客看到的样子预览公开首页。未配置 LOGO 也能打开。公开卡无点评；课程无长文。
        </p>
      </div>
      <el-button @click="backHome">返回首页内容</el-button>
    </div>

    <el-card class="hero-card" shadow="never">
      <div class="hero">
        <el-image v-if="data.brand.logoUrl" :src="data.brand.logoUrl" class="logo" fit="contain" />
        <div>
          <h1>{{ data.brand.orgName || '机构公开首页' }}</h1>
          <p v-if="!data.brand.logoUrl" class="muted">尚未配置 LOGO，公开首页仍可打开。</p>
        </div>
      </div>
    </el-card>

    <!-- E01：渲染序强制 轮播 → 课程 → 优秀作品 -->
    <section class="section">
      <h3>轮播</h3>
      <el-empty v-if="loadError" description="这一区没打开。">
        <el-button type="primary" @click="load">重试</el-button>
      </el-empty>
      <el-empty v-else-if="loading" description="正在加载轮播…" />
      <el-empty v-else-if="data.banners.length === 0" description="访客现在看不到轮播。">
        <el-button @click="load">重试</el-button>
      </el-empty>
      <div v-else class="cards">
        <el-card v-for="item in data.banners" :key="item.id" shadow="never">
          <el-image v-if="item.imageUrl" :src="item.imageUrl" class="cover" fit="cover" />
          <h4>{{ item.title || '未填写标题' }}</h4>
          <p v-if="item.subtitle" class="muted">{{ item.subtitle }}</p>
        </el-card>
      </div>
    </section>

    <section class="section">
      <h3>课程介绍</h3>
      <el-empty v-if="loadError" description="这一区没打开。">
        <el-button type="primary" @click="load">重试</el-button>
      </el-empty>
      <el-empty v-else-if="loading" description="正在加载课程…" />
      <el-empty v-else-if="data.courses.length === 0" description="访客现在看不到课程介绍。">
        <el-button @click="load">重试</el-button>
      </el-empty>
      <div v-else class="cards">
        <el-card v-for="item in data.courses" :key="item.id" shadow="never">
          <el-image v-if="item.coverUrl" :src="item.coverUrl" class="cover" fit="cover" />
          <h4>{{ item.title }}</h4>
          <p>{{ item.summary }}</p>
        </el-card>
      </div>
    </section>

    <section class="section">
      <h3>优秀作品</h3>
      <el-empty v-if="loadError" description="这一区没打开。">
        <el-button type="primary" @click="load">重试</el-button>
      </el-empty>
      <el-empty v-else-if="loading" description="正在加载公开作品…" />
      <el-empty v-else-if="data.featuredArtworks.length === 0" description="访客现在看不到公开作品。">
        <el-button @click="load">重试</el-button>
      </el-empty>
      <div v-else class="cards">
        <el-card v-for="item in data.featuredArtworks" :key="item.id" shadow="never">
          <el-image v-if="item.imageUrl" :src="item.imageUrl" class="cover" fit="cover" />
          <h4>{{ item.title }}</h4>
          <p class="muted">{{ item.studentDisplayName }}</p>
        </el-card>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { PublicHome } from '@art-edu/api-types';
import { errorMessage } from '../api/errors';
import { getPublicHome } from '../api/home';

const router = useRouter();
const loading = ref(true);
const loadError = ref('');
const data = ref<PublicHome>({
  brand: { orgName: null, logoUrl: null },
  banners: [],
  featuredArtworks: [],
  courses: [],
});

function backHome() {
  void router.push('/home');
}

async function load() {
  loading.value = true;
  loadError.value = '';
  try {
    data.value = await getPublicHome();
  } catch (e) {
    loadError.value = errorMessage(e, '加载公开首页失败');
  } finally {
    loading.value = false;
  }
}

onMounted(load);
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
.hero-card,
.section {
  margin-bottom: var(--space-4);
}
.hero {
  display: flex;
  gap: var(--space-4);
  align-items: center;
}
.logo {
  width: 72px;
  height: 72px;
}
.cover {
  width: 100%;
  height: 140px;
  margin-bottom: var(--space-3);
  border-radius: var(--radius-tag);
}
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--space-3);
}
h1,
h3,
h4 {
  margin: 0 0 var(--space-2);
}
.muted {
  color: var(--color-ink-tertiary);
  margin: 0;
}
</style>
