<template>
  <div>
    <h2 class="page-title">首页运营</h2>
    <p class="page-hint">
      轮播 / 优秀作品 / 课程三块。公开优秀作品卡只有图片、标题、学员展示名，不含点评。
    </p>
    <el-tabs v-model="tab">
      <el-tab-pane label="轮播" name="carousels">
        <el-button type="primary" @click="openCarousel()">新增轮播</el-button>
        <el-table :data="carousels" stripe class="table">
          <el-table-column prop="title" label="标题" />
          <el-table-column prop="sortOrder" label="排序" width="80" />
          <el-table-column label="启用" width="80">
            <template #default="{ row }">{{ row.enabled ? '是' : '否' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="180">
            <template #default="{ row }">
              <el-button text @click="openCarousel(row)">编辑</el-button>
              <el-button text type="danger" @click="remove('/admin/home/carousels', row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="优秀作品" name="featured">
        <el-button type="primary" @click="openFeatured()">新增作品卡</el-button>
        <el-table :data="featured" stripe class="table">
          <el-table-column prop="title" label="标题" />
          <el-table-column prop="studentDisplayName" label="学员" />
          <el-table-column prop="sortOrder" label="排序" width="80" />
          <el-table-column label="发布" width="80">
            <template #default="{ row }">{{ row.published ? '是' : '否' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="180">
            <template #default="{ row }">
              <el-button text @click="openFeatured(row)">编辑</el-button>
              <el-button text type="danger" @click="remove('/admin/home/featured-artworks', row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="课程" name="courses">
        <el-button type="primary" @click="openCourse()">新增课程</el-button>
        <el-table :data="courses" stripe class="table">
          <el-table-column prop="title" label="标题" />
          <el-table-column prop="summary" label="简介" />
          <el-table-column prop="sortOrder" label="排序" width="80" />
          <el-table-column label="发布" width="80">
            <template #default="{ row }">{{ row.published ? '是' : '否' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="180">
            <template #default="{ row }">
              <el-button text @click="openCourse(row)">编辑</el-button>
              <el-button text type="danger" @click="remove('/admin/home/courses', row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="carouselVisible" :title="carouselForm.id ? '编辑轮播' : '新增轮播'">
      <el-form label-width="90px">
        <el-form-item label="图片 URL"><el-input v-model="carouselForm.imageUrl" /></el-form-item>
        <el-form-item label="标题"><el-input v-model="carouselForm.title" /></el-form-item>
        <el-form-item label="副标题"><el-input v-model="carouselForm.subtitle" /></el-form-item>
        <el-form-item label="链接"><el-input v-model="carouselForm.linkUrl" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="carouselForm.sortOrder" /></el-form-item>
        <el-form-item label="启用"><el-switch v-model="carouselForm.enabled" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="carouselVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCarousel">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="featuredVisible" :title="featuredForm.id ? '编辑作品卡' : '新增作品卡'">
      <el-form label-width="90px">
        <el-form-item label="图片 URL"><el-input v-model="featuredForm.imageUrl" /></el-form-item>
        <el-form-item label="标题"><el-input v-model="featuredForm.title" /></el-form-item>
        <el-form-item label="学员名"><el-input v-model="featuredForm.studentDisplayName" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="featuredForm.sortOrder" /></el-form-item>
        <el-form-item label="发布"><el-switch v-model="featuredForm.published" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="featuredVisible = false">取消</el-button>
        <el-button type="primary" @click="saveFeatured">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="courseVisible" :title="courseForm.id ? '编辑课程' : '新增课程'">
      <el-form label-width="90px">
        <el-form-item label="标题"><el-input v-model="courseForm.title" /></el-form-item>
        <el-form-item label="简介"><el-input v-model="courseForm.summary" type="textarea" :maxlength="200" /></el-form-item>
        <el-form-item label="封面 URL"><el-input v-model="courseForm.coverUrl" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="courseForm.sortOrder" /></el-form-item>
        <el-form-item label="发布"><el-switch v-model="courseForm.published" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="courseVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCourse">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import type { AdminCarousel, AdminCourse, AdminFeaturedArtwork } from '@art-edu/api-types';
import { http } from '../api/http';

const tab = ref('carousels');
const carousels = ref<AdminCarousel[]>([]);
const featured = ref<AdminFeaturedArtwork[]>([]);
const courses = ref<AdminCourse[]>([]);

const carouselVisible = ref(false);
const featuredVisible = ref(false);
const courseVisible = ref(false);

const carouselForm = reactive({
  id: '',
  imageUrl: '',
  title: '',
  subtitle: '',
  linkUrl: '',
  sortOrder: 0,
  enabled: false,
});
const featuredForm = reactive({
  id: '',
  imageUrl: '',
  title: '',
  studentDisplayName: '',
  sortOrder: 0,
  published: false,
});
const courseForm = reactive({
  id: '',
  title: '',
  summary: '',
  coverUrl: '',
  sortOrder: 0,
  published: false,
});

async function load() {
  const [c, f, k] = await Promise.all([
    http.get('/admin/home/carousels'),
    http.get('/admin/home/featured-artworks'),
    http.get('/admin/home/courses'),
  ]);
  carousels.value = c.data.items ?? [];
  featured.value = f.data.items ?? [];
  courses.value = k.data.items ?? [];
}

function openCarousel(row?: AdminCarousel) {
  Object.assign(carouselForm, {
    id: row?.id ?? '',
    imageUrl: row?.imageUrl ?? '',
    title: row?.title ?? '',
    subtitle: row?.subtitle ?? '',
    linkUrl: row?.linkUrl ?? '',
    sortOrder: row?.sortOrder ?? 0,
    enabled: row?.enabled ?? false,
  });
  carouselVisible.value = true;
}

function openFeatured(row?: AdminFeaturedArtwork) {
  Object.assign(featuredForm, {
    id: row?.id ?? '',
    imageUrl: row?.imageUrl ?? '',
    title: row?.title ?? '',
    studentDisplayName: row?.studentDisplayName ?? '',
    sortOrder: row?.sortOrder ?? 0,
    published: row?.published ?? false,
  });
  featuredVisible.value = true;
}

function openCourse(row?: AdminCourse) {
  Object.assign(courseForm, {
    id: row?.id ?? '',
    title: row?.title ?? '',
    summary: row?.summary ?? '',
    coverUrl: row?.coverUrl ?? '',
    sortOrder: row?.sortOrder ?? 0,
    published: row?.published ?? false,
  });
  courseVisible.value = true;
}

async function saveCarousel() {
  const body = {
    imageUrl: carouselForm.imageUrl,
    title: carouselForm.title || null,
    subtitle: carouselForm.subtitle || null,
    linkUrl: carouselForm.linkUrl || null,
    sortOrder: carouselForm.sortOrder,
    enabled: carouselForm.enabled,
  };
  if (carouselForm.id) {
    await http.patch(`/admin/home/carousels/${carouselForm.id}`, body);
  } else {
    await http.post('/admin/home/carousels', body);
  }
  ElMessage.success('已保存');
  carouselVisible.value = false;
  await load();
}

async function saveFeatured() {
  const body = {
    imageUrl: featuredForm.imageUrl,
    title: featuredForm.title,
    studentDisplayName: featuredForm.studentDisplayName,
    sortOrder: featuredForm.sortOrder,
    published: featuredForm.published,
  };
  if (featuredForm.id) {
    await http.patch(`/admin/home/featured-artworks/${featuredForm.id}`, body);
  } else {
    await http.post('/admin/home/featured-artworks', body);
  }
  ElMessage.success('已保存');
  featuredVisible.value = false;
  await load();
}

async function saveCourse() {
  const body = {
    title: courseForm.title,
    summary: courseForm.summary,
    coverUrl: courseForm.coverUrl || null,
    sortOrder: courseForm.sortOrder,
    published: courseForm.published,
  };
  if (courseForm.id) {
    await http.patch(`/admin/home/courses/${courseForm.id}`, body);
  } else {
    await http.post('/admin/home/courses', body);
  }
  ElMessage.success('已保存');
  courseVisible.value = false;
  await load();
}

async function remove(path: string, id: string) {
  await http.delete(`${path}/${id}`);
  ElMessage.success('已删除');
  await load();
}

onMounted(load);
</script>

<style scoped>
.table {
  margin-top: 12px;
}
</style>
