<template>
  <div>
    <h2 class="page-title">海报模板</h2>
    <p class="page-hint">
      对外名固定为 简约 / 画框 / 杂志（key：simple / frame / magazine）。勿再使用 classic / gallery / festival。
    </p>
    <el-table :data="templates" v-loading="loading">
      <el-table-column prop="key" label="键" width="120" />
      <el-table-column label="对外名" width="120">
        <template #default="{ row }">{{ labels[row.key] ?? row.key }}</template>
      </el-table-column>
      <el-table-column prop="name" label="显示名" />
      <el-table-column label="启用" width="100">
        <template #default="{ row }">
          <el-switch v-model="row.enabled" @change="save(row)" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button text @click="edit(row)">改显示名</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="visible" title="编辑模板显示名">
      <el-form label-width="80px">
        <el-form-item label="对外名">{{ labels[current.key] }}</el-form-item>
        <el-form-item label="显示名"><el-input v-model="current.name" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="save(current)">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import type { BrandTemplateDto } from '@art-edu/shared';
import { errorMessage } from '../api/errors';
import { getBrand, updateBrand } from '../api/v1';

const labels: Record<string, string> = {
  simple: '简约',
  frame: '画框',
  magazine: '杂志',
};

const templates = ref<BrandTemplateDto[]>([]);
const loading = ref(false);
const visible = ref(false);
const current = ref<BrandTemplateDto>({
  id: '',
  key: 'simple',
  name: '',
  enabled: true,
});

async function load() {
  loading.value = true;
  try {
    const brand = await getBrand();
    templates.value = brand.templates ?? [];
  } catch (e) {
    ElMessage.error(errorMessage(e, '加载模板失败'));
  } finally {
    loading.value = false;
  }
}

function edit(row: BrandTemplateDto) {
  current.value = { ...row };
  visible.value = true;
}

async function save(row: BrandTemplateDto) {
  try {
    const brand = await updateBrand({
      templates: templates.value.map((t) =>
        t.id === row.id ? { id: row.id, enabled: row.enabled, name: row.name } : { id: t.id, enabled: t.enabled, name: t.name },
      ),
    });
    templates.value = brand.templates ?? [];
    ElMessage.success('模板已更新');
    visible.value = false;
  } catch (e) {
    ElMessage.error(errorMessage(e, '更新失败'));
    await load();
  }
}

onMounted(load);
</script>

<style scoped>
.page-hint {
  color: var(--color-ink-tertiary);
  font-size: var(--font-caption-size);
  line-height: var(--font-caption-line);
  margin: calc(var(--space-2) * -1) 0 var(--space-4);
}
</style>
