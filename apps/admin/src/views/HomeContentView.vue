<template>
  <div>
    <h2 class="page-title">首页内容 CRUD</h2>
    <p class="page-hint">非 P0 验收（P1 运营页）。接口仍挂在 /api/v1，勿当作本期交付。</p>
    <div class="toolbar">
      <el-button type="primary" @click="openCreate">新增内容</el-button>
    </div>
    <el-table :data="items" stripe>
      <el-table-column prop="type" label="类型" width="140" />
      <el-table-column prop="title" label="标题" />
      <el-table-column prop="sortOrder" label="排序" width="80" />
      <el-table-column label="发布" width="80">
        <template #default="{ row }">{{ row.published ? '是' : '否' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button text @click="openEdit(row)">编辑</el-button>
          <el-button text type="danger" @click="remove(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="visible" :title="form.id ? '编辑内容' : '新增内容'">
      <el-form label-width="80px">
        <el-form-item label="类型">
          <el-select v-model="form.type">
            <el-option label="横幅" value="banner" />
            <el-option label="公告" value="announcement" />
            <el-option label="关于" value="about" />
            <el-option label="课程" value="course" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="正文"><el-input v-model="form.body" type="textarea" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sortOrder" /></el-form-item>
        <el-form-item label="发布"><el-switch v-model="form.published" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { http } from '../api/http';

interface Item {
  id?: string;
  type: string;
  title: string;
  body: string;
  sortOrder: number;
  published: boolean;
}

const items = ref<Item[]>([]);
const visible = ref(false);
const form = reactive<Item>({
  type: 'announcement',
  title: '',
  body: '',
  sortOrder: 0,
  published: true,
});

async function load() {
  const { data } = await http.get('/admin/home-contents');
  items.value = Array.isArray(data) ? data : data.items ?? [];
}

function openCreate() {
  Object.assign(form, {
    id: undefined,
    type: 'announcement',
    title: '',
    body: '',
    sortOrder: 0,
    published: true,
  });
  visible.value = true;
}

function openEdit(row: Item) {
  Object.assign(form, row);
  visible.value = true;
}

async function save() {
  if (form.id) {
    await http.patch(`/admin/home-contents/${form.id}`, form);
  } else {
    await http.post('/admin/home-contents', form);
  }
  ElMessage.success('已保存');
  visible.value = false;
  await load();
}

async function remove(id: string) {
  await http.delete(`/admin/home-contents/${id}`);
  ElMessage.success('已删除');
  await load();
}

onMounted(load);
</script>
