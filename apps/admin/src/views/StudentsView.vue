<template>
  <div>
    <h2 class="page-title">学员与绑定</h2>
    <div class="toolbar">
      <el-button type="primary" @click="studentVisible = true">新建学员</el-button>
    </div>
    <el-table :data="students" stripe>
      <el-table-column prop="name" label="姓名" />
      <el-table-column label="家长">
        <template #default="{ row }">
          {{ row.parentBindings.map((b: Binding) => b.parent?.name).filter(Boolean).join('、') || '未绑定' }}
        </template>
      </el-table-column>
      <el-table-column label="教师">
        <template #default="{ row }">
          {{ row.teacherBindings.map((b: Binding) => b.teacher?.name).filter(Boolean).join('、') || '未分配' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220">
        <template #default="{ row }">
          <el-button text @click="openBind(row, 'parent')">绑定家长</el-button>
          <el-button text @click="openBind(row, 'teacher')">分配教师</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="studentVisible" title="新建学员">
      <el-form label-width="80px">
        <el-form-item label="姓名"><el-input v-model="studentForm.name" /></el-form-item>
        <el-form-item label="性别"><el-input v-model="studentForm.gender" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="studentForm.note" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="studentVisible = false">取消</el-button>
        <el-button type="primary" @click="createStudent">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="bindVisible" :title="bindKind === 'parent' ? '绑定家长' : '分配教师'">
      <el-select v-model="bindUserId" filterable style="width: 100%">
        <el-option v-for="u in bindUsers" :key="u.id" :label="`${u.name} ${u.phone}`" :value="u.id" />
      </el-select>
      <template #footer>
        <el-button @click="bindVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmBind">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { http } from '../api/http';

interface Binding {
  parent?: { name: string };
  teacher?: { name: string };
}

const students = ref<Array<Record<string, unknown> & { id: string; parentBindings: Binding[]; teacherBindings: Binding[] }>>([]);
const studentVisible = ref(false);
const bindVisible = ref(false);
const bindKind = ref<'parent' | 'teacher'>('parent');
const bindStudentId = ref('');
const bindUserId = ref('');
const bindUsers = ref<Array<{ id: string; name: string; phone: string }>>([]);
const studentForm = reactive({ name: '', gender: '', note: '' });

async function load() {
  const { data } = await http.get('/admin/students');
  students.value = data;
}

async function createStudent() {
  await http.post('/admin/students', studentForm);
  ElMessage.success('学员已创建');
  studentVisible.value = false;
  studentForm.name = '';
  await load();
}

async function openBind(row: { id: string }, kind: 'parent' | 'teacher') {
  bindKind.value = kind;
  bindStudentId.value = row.id;
  bindUserId.value = '';
  const { data } = await http.get('/admin/users', { params: { role: kind } });
  bindUsers.value = data;
  bindVisible.value = true;
}

async function confirmBind() {
  const path =
    bindKind.value === 'parent'
      ? '/admin/bindings/parent-student'
      : '/admin/bindings/teacher-student';
  await http.post(path, { userId: bindUserId.value, studentId: bindStudentId.value });
  ElMessage.success('绑定成功');
  bindVisible.value = false;
  await load();
}

onMounted(load);
</script>
