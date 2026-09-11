<template>
  <div>
    <div class="tab-head">
      <h3 class="tab-title">优秀作品公开</h3>
      <div class="tab-actions">
        <el-button @click="openFromArtworks">从已有作品挑选</el-button>
        <el-button type="primary" @click="openCreate">手动新建</el-button>
      </div>
    </div>
    <p class="tab-note">公开卡无点评。访客只看到图片、标题和学员称呼。</p>
    <el-alert
      v-if="loadError"
      :title="loadError"
      type="error"
      :closable="false"
      class="tab-alert"
    />
    <el-empty
      v-else-if="!loading && items.length === 0"
      description="还没有公开作品。可以从已有作品挑选，或手动填写图片、标题和学员称呼。"
    />
    <el-table v-else :data="items" v-loading="loading" stripe>
      <el-table-column label="图片" width="88">
        <template #default="{ row }">
          <el-image v-if="row.imageUrl" :src="row.imageUrl" fit="cover" class="thumb" />
        </template>
      </el-table-column>
      <el-table-column prop="title" label="标题" min-width="140" />
      <el-table-column prop="studentDisplayName" label="学员称呼" min-width="120" />
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

    <el-dialog v-model="manualVisible" :title="editingId ? '编辑公开卡' : '手动新建公开卡'" width="480px">
      <el-form label-width="96px">
        <el-form-item label="图片地址" required>
          <el-input v-model="form.imageUrl" placeholder="必填" />
        </el-form-item>
        <el-form-item label="标题" required>
          <el-input v-model="form.title" placeholder="必填" />
        </el-form-item>
        <el-form-item label="学员称呼" required>
          <el-input v-model="form.studentDisplayName" placeholder="必填，对外展示名" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="manualVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveManual">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="pickVisible" title="从已有作品挑选" width="560px">
      <p class="tab-note">只会带上图片、标题和学员称呼，不会带点评。</p>
      <el-form label-width="72px">
        <el-form-item label="学员">
          <el-select
            v-model="pickStudentId"
            filterable
            placeholder="先选学员"
            style="width: 100%"
            @change="loadArtworks"
          >
            <el-option
              v-for="student in students"
              :key="student.id"
              :label="student.name"
              :value="student.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <el-empty v-if="!pickStudentId" description="请先选择学员。" />
      <el-empty v-else-if="!pickLoading && pickArtworks.length === 0" description="这位学员还没有作品。" />
      <el-checkbox-group v-else v-model="pickedIds" class="pick-list" v-loading="pickLoading">
        <label v-for="art in pickArtworks" :key="art.id" class="pick-item">
          <el-checkbox :value="art.id" />
          <el-image :src="art.thumbUrl || art.imageUrl" fit="cover" class="thumb" />
          <span>{{ art.title || art.courseTheme || '未命名作品' }}</span>
        </label>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="pickVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveFromArtworks">加入公开卡</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type {
  AdminFeaturedArtwork,
  CreateFeaturedArtworkRequest,
  UpdateFeaturedArtworkRequest,
} from '@art-edu/api-types';
import type { ArtworkDto, StudentDto } from '@art-edu/shared';
import { errorMessage } from '../../api/errors';
import {
  createFeaturedArtwork,
  createFeaturedFromArtworks,
  deleteFeaturedArtwork,
  listFeaturedArtworks,
  moveOrderedIds,
  reorderFeaturedArtworks,
  updateFeaturedArtwork,
  updateFeaturedArtworkStatus,
} from '../../api/home';
import { listStudents, listTeacherArtworks } from '../../api/v1';

const items = ref<AdminFeaturedArtwork[]>([]);
const loading = ref(false);
const loadError = ref('');
const manualVisible = ref(false);
const pickVisible = ref(false);
const saving = ref(false);
const editingId = ref<string | null>(null);
const form = reactive({
  imageUrl: '',
  title: '',
  studentDisplayName: '',
});
const students = ref<StudentDto[]>([]);
const pickStudentId = ref('');
const pickArtworks = ref<ArtworkDto[]>([]);
const pickLoading = ref(false);
const pickedIds = ref<string[]>([]);

function isFirst(row: AdminFeaturedArtwork) {
  return items.value[0]?.id === row.id;
}

function isLast(row: AdminFeaturedArtwork) {
  return items.value[items.value.length - 1]?.id === row.id;
}

async function load() {
  loading.value = true;
  loadError.value = '';
  try {
    items.value = await listFeaturedArtworks();
  } catch (e) {
    loadError.value = errorMessage(e, '加载公开作品失败');
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editingId.value = null;
  form.imageUrl = '';
  form.title = '';
  form.studentDisplayName = '';
  manualVisible.value = true;
}

function openEdit(row: AdminFeaturedArtwork) {
  editingId.value = row.id;
  form.imageUrl = row.imageUrl;
  form.title = row.title;
  form.studentDisplayName = row.studentDisplayName;
  manualVisible.value = true;
}

async function saveManual() {
  const imageUrl = form.imageUrl.trim();
  const title = form.title.trim();
  const studentDisplayName = form.studentDisplayName.trim();
  if (!imageUrl || !title || !studentDisplayName) {
    ElMessage.warning('图片、标题、学员称呼都要填写');
    return;
  }
  saving.value = true;
  try {
    const payload: CreateFeaturedArtworkRequest | UpdateFeaturedArtworkRequest = {
      imageUrl,
      title,
      studentDisplayName,
    };
    if (editingId.value) {
      await updateFeaturedArtwork(editingId.value, payload);
      ElMessage.success('公开卡已更新');
    } else {
      await createFeaturedArtwork({ imageUrl, title, studentDisplayName });
      ElMessage.success('公开卡已创建');
    }
    manualVisible.value = false;
    await load();
  } catch (e) {
    ElMessage.error(errorMessage(e, '保存公开卡失败'));
  } finally {
    saving.value = false;
  }
}

async function openFromArtworks() {
  pickStudentId.value = '';
  pickArtworks.value = [];
  pickedIds.value = [];
  pickVisible.value = true;
  try {
    const page = await listStudents({ limit: 50 });
    students.value = page.items;
  } catch (e) {
    ElMessage.error(errorMessage(e, '加载学员失败'));
  }
}

async function loadArtworks() {
  pickArtworks.value = [];
  pickedIds.value = [];
  if (!pickStudentId.value) return;
  pickLoading.value = true;
  try {
    const page = await listTeacherArtworks(pickStudentId.value);
    pickArtworks.value = page.items;
  } catch (e) {
    ElMessage.error(errorMessage(e, '加载作品失败'));
  } finally {
    pickLoading.value = false;
  }
}

async function saveFromArtworks() {
  if (!pickedIds.value.length) {
    ElMessage.warning('请至少选一件作品');
    return;
  }
  saving.value = true;
  try {
    await createFeaturedFromArtworks({ artworkIds: pickedIds.value });
    ElMessage.success('已加入公开卡（默认草稿）');
    pickVisible.value = false;
    await load();
  } catch (e) {
    ElMessage.error(errorMessage(e, '从作品生成公开卡失败'));
  } finally {
    saving.value = false;
  }
}

async function togglePublished(row: AdminFeaturedArtwork) {
  try {
    await updateFeaturedArtworkStatus(row.id, { published: !row.published });
    ElMessage.success(row.published ? '已改回草稿' : '已发布');
    await load();
  } catch (e) {
    ElMessage.error(errorMessage(e, '更新发布状态失败'));
  }
}

async function move(row: AdminFeaturedArtwork, dir: -1 | 1) {
  const orderedIds = moveOrderedIds(
    items.value.map((item) => item.id),
    row.id,
    dir,
  );
  if (!orderedIds) return;
  try {
    const page = await reorderFeaturedArtworks({ orderedIds });
    items.value = page.items;
  } catch (e) {
    ElMessage.error(errorMessage(e, '调整顺序失败'));
  }
}

async function remove(row: AdminFeaturedArtwork) {
  try {
    await ElMessageBox.confirm('删除后访客首页不再展示这张公开卡。确定删除？', '删除公开卡', {
      type: 'warning',
    });
    await deleteFeaturedArtwork(row.id);
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
.tab-actions {
  display: flex;
  gap: var(--space-3);
}
.tab-note {
  margin: 0 0 var(--space-3);
  color: var(--color-ink-secondary);
  font-size: var(--font-caption-size);
  line-height: var(--font-caption-line);
}
.tab-alert {
  margin-bottom: var(--space-3);
}
.thumb {
  width: 56px;
  height: 36px;
  border-radius: var(--radius-tag);
}
.pick-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  max-height: 320px;
  overflow: auto;
}
.pick-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
</style>
