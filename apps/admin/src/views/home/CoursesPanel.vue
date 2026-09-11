<template>
  <div>
    <div class="tab-head">
      <h3 class="tab-title">课程介绍</h3>
      <el-button type="primary" @click="openCreate">新建</el-button>
    </div>
    <p class="tab-note">课程无长文，只写短介绍（最多 {{ summaryMax }} 字）。</p>
    <el-alert
      v-if="loadError"
      :title="loadError"
      type="error"
      :closable="false"
      class="tab-alert"
    />
    <el-empty
      v-else-if="!loading && courses.length === 0"
      description="还没有课程介绍。标题和摘要必填，封面可以以后再补。"
    />
    <el-table v-else :data="courses" v-loading="loading" stripe>
      <el-table-column label="封面" width="88">
        <template #default="{ row }">
          <el-image v-if="row.coverUrl" :src="row.coverUrl" fit="cover" class="thumb" />
          <span v-else class="muted">无封面</span>
        </template>
      </el-table-column>
      <el-table-column prop="title" label="标题" min-width="140" />
      <el-table-column prop="summary" label="摘要" min-width="220" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.published ? 'success' : 'info'" size="small">
            {{ row.published ? '已发布' : '草稿' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280">
        <template #default="{ row }">
          <el-button text @click="openEdit(row)">编辑</el-button>
          <el-button text @click="togglePublished(row)">
            {{ row.published ? '改回草稿' : '发布' }}
          </el-button>
          <el-button text :disabled="isFirst(row)" @click="move(row, -1)">上移</el-button>
          <el-button text :disabled="isLast(row)" @click="move(row, 1)">下移</el-button>
          <el-button text type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="visible" :title="editingId ? '编辑课程' : '新建课程'" width="480px">
      <el-form label-width="88px">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" placeholder="必填" />
        </el-form-item>
        <el-form-item label="摘要" required>
          <el-input
            v-model="form.summary"
            type="textarea"
            :rows="3"
            :maxlength="summaryMax"
            show-word-limit
            placeholder="短介绍，不要长文"
          />
        </el-form-item>
        <el-form-item label="封面地址">
          <el-input v-model="form.coverUrl" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { AdminCourse, CreateCourseRequest, UpdateCourseRequest } from '@art-edu/api-types';
import { COURSE_SUMMARY_MAX_LENGTH } from '@art-edu/api-types';
import { errorMessage } from '../../api/errors';
import {
  createCourse,
  deleteCourse,
  listCourses,
  moveOrderedIds,
  reorderCourses,
  updateCourse,
  updateCourseStatus,
} from '../../api/home';

const summaryMax = COURSE_SUMMARY_MAX_LENGTH;
const courses = ref<AdminCourse[]>([]);
const loading = ref(false);
const loadError = ref('');
const visible = ref(false);
const saving = ref(false);
const editingId = ref<string | null>(null);
const form = reactive({
  title: '',
  summary: '',
  coverUrl: '',
});

function isFirst(row: AdminCourse) {
  return courses.value[0]?.id === row.id;
}

function isLast(row: AdminCourse) {
  return courses.value[courses.value.length - 1]?.id === row.id;
}

async function load() {
  loading.value = true;
  loadError.value = '';
  try {
    courses.value = await listCourses();
  } catch (e) {
    loadError.value = errorMessage(e, '加载课程失败');
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editingId.value = null;
  form.title = '';
  form.summary = '';
  form.coverUrl = '';
  visible.value = true;
}

function openEdit(row: AdminCourse) {
  editingId.value = row.id;
  form.title = row.title;
  form.summary = row.summary;
  form.coverUrl = row.coverUrl ?? '';
  visible.value = true;
}

async function save() {
  const title = form.title.trim();
  const summary = form.summary.trim();
  if (!title || !summary) {
    ElMessage.warning('标题和摘要都要填写');
    return;
  }
  if (summary.length > summaryMax) {
    ElMessage.warning(`摘要最多 ${summaryMax} 字，课程无长文`);
    return;
  }
  saving.value = true;
  try {
    const payload: CreateCourseRequest | UpdateCourseRequest = {
      title,
      summary,
      coverUrl: form.coverUrl.trim() || null,
    };
    if (editingId.value) {
      await updateCourse(editingId.value, payload);
      ElMessage.success('课程已更新');
    } else {
      await createCourse({ title, summary, coverUrl: form.coverUrl.trim() || null });
      ElMessage.success('课程已创建');
    }
    visible.value = false;
    await load();
  } catch (e) {
    ElMessage.error(errorMessage(e, '保存课程失败'));
  } finally {
    saving.value = false;
  }
}

async function togglePublished(row: AdminCourse) {
  try {
    await updateCourseStatus(row.id, { published: !row.published });
    ElMessage.success(row.published ? '已改回草稿' : '已发布');
    await load();
  } catch (e) {
    ElMessage.error(errorMessage(e, '更新发布状态失败'));
  }
}

async function move(row: AdminCourse, dir: -1 | 1) {
  const orderedIds = moveOrderedIds(
    courses.value.map((item) => item.id),
    row.id,
    dir,
  );
  if (!orderedIds) return;
  try {
    const page = await reorderCourses({ orderedIds });
    courses.value = page.items;
  } catch (e) {
    ElMessage.error(errorMessage(e, '调整顺序失败'));
  }
}

async function remove(row: AdminCourse) {
  try {
    await ElMessageBox.confirm('删除后访客首页不再展示这门课。确定删除？', '删除课程', {
      type: 'warning',
    });
    await deleteCourse(row.id);
    ElMessage.success('已删除');
    await load();
  } catch (e) {
    if (e === 'cancel') return;
    ElMessage.error(errorMessage(e, '删除失败'));
  }
}

onMounted(load);
</script>

<style scoped>
.tab-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
}
.tab-title {
  margin: 0;
  font-size: var(--font-title-size);
  line-height: var(--font-title-line);
  font-weight: var(--font-title-weight);
}
.tab-note,
.muted {
  color: var(--color-ink-secondary);
  font-size: var(--font-caption-size);
  line-height: var(--font-caption-line);
}
.tab-note {
  margin: 0 0 var(--space-3);
}
.tab-alert {
  margin-bottom: var(--space-3);
}
.thumb {
  width: 56px;
  height: 36px;
  border-radius: var(--radius-tag);
}
</style>
