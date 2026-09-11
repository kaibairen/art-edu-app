<template>
  <div>
    <div class="tab-head">
      <h3 class="tab-title">轮播</h3>
      <el-button type="primary" @click="openCreate">新建</el-button>
    </div>
    <el-alert
      v-if="loadError"
      :title="loadError"
      type="error"
      :closable="false"
      class="tab-alert"
    >
      <el-button type="primary" size="small" @click="load">重试</el-button>
    </el-alert>
    <el-empty v-else-if="!loading && banners.length === 0" description="还没有轮播。点「新建」加一张图。" />
    <el-table v-else :data="banners" v-loading="loading" stripe>
      <el-table-column label="图片" width="88">
        <template #default="{ row }">
          <el-image v-if="row.imageUrl" :src="row.imageUrl" fit="cover" class="thumb" />
          <span v-else class="muted">无图</span>
        </template>
      </el-table-column>
      <el-table-column label="标题" min-width="140">
        <template #default="{ row }">{{ row.title || '未填写' }}</template>
      </el-table-column>
      <el-table-column label="副标题" min-width="160">
        <template #default="{ row }">{{ row.subtitle || '—' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
            {{ row.enabled ? '已启用' : '未启用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280">
        <template #default="{ row }">
          <el-button text @click="openEdit(row)">编辑</el-button>
          <el-button text @click="toggleEnabled(row)">{{ row.enabled ? '停用' : '启用' }}</el-button>
          <el-button text :disabled="isFirst(row)" @click="move(row, -1)">上移</el-button>
          <el-button text :disabled="isLast(row)" @click="move(row, 1)">下移</el-button>
          <el-button text type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="visible" :title="editingId ? '编辑轮播' : '新建轮播'" width="480px">
      <el-form label-width="88px">
        <el-form-item label="图片地址" required>
          <el-input v-model="form.imageUrl" placeholder="必填，公开页会展示这张图" />
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="form.title" placeholder="可选" />
        </el-form-item>
        <el-form-item label="副标题">
          <el-input v-model="form.subtitle" placeholder="可选" />
        </el-form-item>
        <el-form-item label="跳转链接">
          <el-input v-model="form.linkUrl" placeholder="可选" />
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
import type { AdminBanner, CreateBannerRequest, UpdateBannerRequest } from '@art-edu/api-types';
import { errorMessage } from '../../api/errors';
import {
  createBanner,
  deleteBanner,
  listBanners,
  moveOrderedIds,
  reorderBanners,
  updateBanner,
  updateBannerStatus,
} from '../../api/home';

const banners = ref<AdminBanner[]>([]);
const loading = ref(false);
const loadError = ref('');
const visible = ref(false);
const saving = ref(false);
const editingId = ref<string | null>(null);
const form = reactive({
  imageUrl: '',
  title: '',
  subtitle: '',
  linkUrl: '',
});

function isFirst(row: AdminBanner) {
  return banners.value[0]?.id === row.id;
}

function isLast(row: AdminBanner) {
  return banners.value[banners.value.length - 1]?.id === row.id;
}

async function load() {
  loading.value = true;
  loadError.value = '';
  try {
    banners.value = await listBanners();
  } catch (e) {
    loadError.value = errorMessage(e, '加载轮播失败');
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editingId.value = null;
  form.imageUrl = '';
  form.title = '';
  form.subtitle = '';
  form.linkUrl = '';
  visible.value = true;
}

function openEdit(row: AdminBanner) {
  editingId.value = row.id;
  form.imageUrl = row.imageUrl;
  form.title = row.title ?? '';
  form.subtitle = row.subtitle ?? '';
  form.linkUrl = row.linkUrl ?? '';
  visible.value = true;
}

async function save() {
  if (!form.imageUrl.trim()) {
    ElMessage.warning('请填写图片地址');
    return;
  }
  saving.value = true;
  try {
    const payload: CreateBannerRequest | UpdateBannerRequest = {
      imageUrl: form.imageUrl.trim(),
      title: form.title.trim() || null,
      subtitle: form.subtitle.trim() || null,
      linkUrl: form.linkUrl.trim() || null,
    };
    if (editingId.value) {
      await updateBanner(editingId.value, payload);
      ElMessage.success('轮播已更新');
    } else {
      await createBanner({ ...payload, imageUrl: form.imageUrl.trim() });
      ElMessage.success('轮播已创建');
    }
    visible.value = false;
    await load();
  } catch (e) {
    ElMessage.error(errorMessage(e, '保存轮播失败'));
  } finally {
    saving.value = false;
  }
}

async function toggleEnabled(row: AdminBanner) {
  try {
    await updateBannerStatus(row.id, { enabled: !row.enabled });
    ElMessage.success(row.enabled ? '已停用' : '已启用');
    await load();
  } catch (e) {
    ElMessage.error(errorMessage(e, '更新状态失败'));
  }
}

async function move(row: AdminBanner, dir: -1 | 1) {
  const orderedIds = moveOrderedIds(
    banners.value.map((item) => item.id),
    row.id,
    dir,
  );
  if (!orderedIds) return;
  try {
    const page = await reorderBanners({ orderedIds });
    banners.value = page.items;
  } catch (e) {
    ElMessage.error(errorMessage(e, '调整顺序失败'));
  }
}

async function remove(row: AdminBanner) {
  try {
    await ElMessageBox.confirm('删除后访客首页不再展示这张轮播。确定删除？', '删除轮播', {
      type: 'warning',
    });
    await deleteBanner(row.id);
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
  margin-bottom: var(--space-3);
}
.tab-title {
  margin: 0;
  font-size: var(--font-title-size);
  line-height: var(--font-title-line);
  font-weight: var(--font-title-weight);
}
.tab-alert {
  margin-bottom: var(--space-3);
}
.thumb {
  width: 56px;
  height: 36px;
  border-radius: var(--radius-tag);
}
.muted {
  color: var(--color-ink-tertiary);
}
</style>
