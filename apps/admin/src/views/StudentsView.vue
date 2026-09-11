<template>
  <div>
    <h2 class="page-title">学员与绑定</h2>
    <p class="page-hint">
      家长通过绑定查看孩子。教师按班级查看学员：在学员上填写班级，并在账号管理给教师分配相同班级。
    </p>
    <div class="toolbar">
      <el-button type="primary" @click="openCreate">新建学员</el-button>
    </div>
    <el-table :data="students" stripe>
      <el-table-column prop="name" label="姓名" width="120" />
      <el-table-column prop="className" label="班级" width="160">
        <template #default="{ row }">{{ row.className || '未分班' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'warning'" size="small">
            {{ row.status === 'active' ? '在读' : '已归档' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="绑定家长" min-width="200">
        <template #default="{ row }">
          <div v-if="parentsOf(row.id).length" class="bind-names">
            <div v-for="b in parentsOf(row.id)" :key="b.id">{{ parentName(b.parentId) }}</div>
          </div>
          <span v-else class="muted">未绑定</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" class-name="actions-col">
        <template #default="{ row }">
          <div class="actions">
            <el-button text @click="openEdit(row)">编辑</el-button>
            <el-button text @click="openBind(row)">绑定家长</el-button>
            <el-dropdown trigger="click" @command="onMore">
              <el-button text class="more-btn" aria-label="更多">⋯</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-for="b in parentsOf(row.id)"
                    :key="b.id"
                    :command="{ type: 'unbind', id: b.id }"
                  >
                    解除 {{ parentShort(b.parentId) }}
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="row.status === 'active'"
                    :command="{ type: 'archive', row }"
                  >
                    归档
                  </el-dropdown-item>
                  <el-dropdown-item :command="{ type: 'remove', row }" divided>
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="studentVisible" :title="editingStudentId ? '编辑学员' : '新建学员'" width="440px">
      <el-form label-width="80px">
        <el-form-item label="姓名"><el-input v-model="studentForm.name" /></el-form-item>
        <el-form-item label="班级">
          <el-input v-model="studentForm.className" placeholder="如 创意水彩班，需与教师负责班级一致" />
        </el-form-item>
        <el-form-item label="性别"><el-input v-model="studentForm.gender" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="studentForm.note" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="studentVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveStudent">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="bindVisible" title="绑定家长" width="420px">
      <el-select v-model="bindParentId" filterable style="width: 100%" placeholder="选择家长账号">
        <el-option
          v-for="u in parents"
          :key="u.id"
          :label="`${u.displayName} ${u.phone}`"
          :value="u.id"
        />
      </el-select>
      <template #footer>
        <el-button @click="bindVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="confirmBind">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { Account } from '@art-edu/api-types';
import type { BindingDto, StudentDto } from '@art-edu/shared';
import { errorMessage, toAdminApiError } from '../api/errors';
import {
  createBinding,
  createStudent,
  deleteBinding,
  deleteStudent,
  listAccounts,
  listBindings,
  listStudents,
  updateStudent,
} from '../api/v1';

const students = ref<StudentDto[]>([]);
const bindings = ref<BindingDto[]>([]);
const parents = ref<Account[]>([]);
const studentVisible = ref(false);
const bindVisible = ref(false);
const bindStudentId = ref('');
const bindParentId = ref('');
const editingStudentId = ref<string | null>(null);
const saving = ref(false);
const studentForm = reactive({ name: '', className: '', gender: '', note: '' });

function parentsOf(studentId: string) {
  return bindings.value.filter((b) => b.studentId === studentId);
}

function parentName(parentId: string) {
  const p = parents.value.find((u) => u.id === parentId);
  return p ? `${p.displayName} ${p.phone}` : parentId;
}

function parentShort(parentId: string) {
  const p = parents.value.find((u) => u.id === parentId);
  return p?.displayName ?? parentId;
}

type MoreCommand =
  | { type: 'unbind'; id: string }
  | { type: 'archive'; row: StudentDto }
  | { type: 'remove'; row: StudentDto };

function onMore(cmd: MoreCommand) {
  if (cmd.type === 'unbind') void unbind(cmd.id);
  if (cmd.type === 'archive') void archive(cmd.row);
  if (cmd.type === 'remove') void remove(cmd.row);
}

async function load() {
  try {
    const [stu, bind, acc] = await Promise.all([
      listStudents({ limit: 50 }),
      listBindings({ limit: 50 }),
      listAccounts({ role: 'parent', limit: 50 }),
    ]);
    students.value = stu.items;
    bindings.value = bind.items;
    parents.value = acc.items;
  } catch (e) {
    ElMessage.error(errorMessage(e, '加载学员失败'));
  }
}

function openCreate() {
  editingStudentId.value = null;
  studentForm.name = '';
  studentForm.className = '';
  studentForm.gender = '';
  studentForm.note = '';
  studentVisible.value = true;
}

function openEdit(row: StudentDto) {
  editingStudentId.value = row.id;
  studentForm.name = row.name;
  studentForm.className = row.className ?? '';
  studentForm.gender = '';
  studentForm.note = row.note ?? '';
  studentVisible.value = true;
}

async function saveStudent() {
  saving.value = true;
  try {
    const payload = {
      name: studentForm.name.trim(),
      className: studentForm.className.trim() || undefined,
      gender: studentForm.gender.trim() || undefined,
      note: studentForm.note.trim() || undefined,
    };
    if (editingStudentId.value) {
      await updateStudent(editingStudentId.value, payload);
      ElMessage.success('学员已更新');
    } else {
      await createStudent(payload);
      ElMessage.success('学员已创建');
    }
    studentVisible.value = false;
    await load();
  } catch (e) {
    ElMessage.error(errorMessage(e, '保存学员失败'));
  } finally {
    saving.value = false;
  }
}

function openBind(row: StudentDto) {
  bindStudentId.value = row.id;
  bindParentId.value = '';
  bindVisible.value = true;
}

async function confirmBind() {
  if (!bindParentId.value) {
    ElMessage.warning('请选择家长');
    return;
  }
  saving.value = true;
  try {
    await createBinding({ parentId: bindParentId.value, studentId: bindStudentId.value });
    ElMessage.success('绑定成功');
    bindVisible.value = false;
    await load();
  } catch (e) {
    const err = toAdminApiError(e);
    ElMessage.error(err.code === 'CONFLICT_BINDING' ? '已绑定' : errorMessage(e, '绑定失败'));
  } finally {
    saving.value = false;
  }
}

async function unbind(id: string) {
  try {
    await deleteBinding(id);
    ElMessage.success('已解除绑定');
    await load();
  } catch (e) {
    ElMessage.error(errorMessage(e, '解除失败'));
  }
}

async function archive(row: StudentDto) {
  try {
    await updateStudent(row.id, { status: 'archived' });
    ElMessage.success('已归档');
    await load();
  } catch (e) {
    ElMessage.error(errorMessage(e, '归档失败'));
  }
}

async function remove(row: StudentDto) {
  try {
    await ElMessageBox.confirm(
      '有作品的学员不能删除，请改用归档。确定删除该学员？',
      '删除学员',
      { type: 'warning' },
    );
    await deleteStudent(row.id);
    ElMessage.success('已删除');
    await load();
  } catch (e) {
    if (e === 'cancel') return;
    const err = toAdminApiError(e);
    if (err.code === 'CONFLICT_STUDENT_HAS_ARTWORK') {
      ElMessage.error('该学员已有作品，仅支持归档');
      return;
    }
    ElMessage.error(errorMessage(e, '删除失败'));
  }
}

onMounted(load);
</script>

<style scoped>
.page-hint,
.muted {
  color: var(--color-ink-tertiary);
  font-size: var(--font-caption-size);
  line-height: var(--font-caption-line);
}
.page-hint {
  margin: calc(var(--space-2) * -1) 0 var(--space-4);
}
.bind-names {
  line-height: var(--font-body-line);
}
.actions {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  white-space: nowrap;
}
.more-btn {
  padding: 0 8px;
  font-size: 18px;
  letter-spacing: 0.04em;
}
</style>
