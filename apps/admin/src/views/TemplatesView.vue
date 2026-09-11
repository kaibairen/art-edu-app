<template>
  <div>
    <h2 class="page-title">海报模板元数据</h2>
    <el-table :data="templates">
      <el-table-column prop="key" label="键" width="120" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="description" label="说明" />
      <el-table-column label="启用" width="100">
        <template #default="{ row }">
          <el-switch v-model="row.enabled" @change="save(row)" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button text @click="edit(row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="visible" title="编辑模板">
      <el-form label-width="80px">
        <el-form-item label="名称"><el-input v-model="current.name" /></el-form-item>
        <el-form-item label="说明"><el-input v-model="current.description" type="textarea" /></el-form-item>
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
import { http } from '../api/http';

interface Template {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
}

const templates = ref<Template[]>([]);
const visible = ref(false);
const current = ref<Template>({
  id: '',
  key: '',
  name: '',
  description: '',
  enabled: true,
});

async function load() {
  const { data } = await http.get('/admin/poster-templates');
  templates.value = data;
}

function edit(row: Template) {
  current.value = { ...row };
  visible.value = true;
}

async function save(row: Template) {
  await http.patch(`/admin/poster-templates/${row.id}`, {
    name: row.name,
    description: row.description,
    enabled: row.enabled,
  });
  ElMessage.success('模板已更新');
  visible.value = false;
  await load();
}

onMounted(load);
</script>
