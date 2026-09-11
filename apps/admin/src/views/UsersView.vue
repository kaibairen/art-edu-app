<template>
  <div>
    <h2 class="page-title">用户管理</h2>
    <div class="toolbar">
      <el-select v-model="roleFilter" placeholder="角色" clearable style="width: 140px" @change="load">
        <el-option label="教师" value="teacher" />
        <el-option label="家长" value="parent" />
        <el-option label="管理员" value="admin" />
      </el-select>
      <el-button type="primary" @click="openCreate('teacher')">创建教师</el-button>
      <el-button @click="openCreate('parent')">创建家长</el-button>
    </div>
    <el-table :data="users" stripe>
      <el-table-column prop="name" label="姓名" />
      <el-table-column prop="phone" label="手机号" />
      <el-table-column prop="email" label="邮箱" />
      <el-table-column prop="role" label="角色" />
    </el-table>

    <el-dialog v-model="visible" :title="form.role === 'teacher' ? '创建教师' : '创建家长'">
      <el-form label-width="80px">
        <el-form-item label="姓名"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="手机号"><el-input v-model="form.phone" /></el-form-item>
        <el-form-item label="邮箱"><el-input v-model="form.email" /></el-form-item>
        <el-form-item label="密码"><el-input v-model="form.password" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="create">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { http } from '../api/http';

const users = ref<Array<Record<string, string>>>([]);
const roleFilter = ref('');
const visible = ref(false);
const form = reactive({
  name: '',
  phone: '',
  email: '',
  password: 'Passw0rd',
  role: 'teacher',
});

async function load() {
  const { data } = await http.get('/admin/users', {
    params: roleFilter.value ? { role: roleFilter.value } : {},
  });
  users.value = data;
}

function openCreate(role: 'teacher' | 'parent') {
  form.role = role;
  form.name = '';
  form.phone = '';
  form.email = '';
  form.password = 'Passw0rd';
  visible.value = true;
}

async function create() {
  await http.post('/admin/users', form);
  ElMessage.success('已创建');
  visible.value = false;
  await load();
}

onMounted(load);
</script>
