<template>
  <div>
    <h2 class="page-title">账号管理</h2>
    <p class="page-hint">教师班级归属（F-011）：在教师账号上编辑 classNames，与学员 className 匹配。</p>
    <div class="toolbar">
      <el-select v-model="roleFilter" placeholder="角色" clearable style="width: 140px" @change="load">
        <el-option label="教师" value="teacher" />
        <el-option label="家长" value="parent" />
        <el-option label="管理员" value="admin" />
      </el-select>
      <el-button type="primary" @click="openCreate('teacher')">创建教师</el-button>
      <el-button @click="openCreate('parent')">创建家长</el-button>
    </div>
    <el-table :data="accounts" stripe>
      <el-table-column prop="displayName" label="姓名" />
      <el-table-column prop="phone" label="手机号" />
      <el-table-column label="角色" width="100">
        <template #default="{ row }">{{ roleLabel(row.role) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
            {{ row.status === 'active' ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="负责班级 (classNames)" min-width="200">
        <template #default="{ row }">
          <template v-if="row.role === 'teacher'">
            <el-tag v-for="c in row.classNames" :key="c" size="small" class="cls">{{ c }}</el-tag>
            <span v-if="!row.classNames?.length" class="muted">未分配（教师端将提示联系管理员）</span>
          </template>
          <span v-else class="muted">—</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220">
        <template #default="{ row }">
          <el-button v-if="row.role !== 'admin'" text @click="openEdit(row)">编辑</el-button>
          <el-button
            v-if="row.role !== 'admin'"
            text
            @click="toggleStatus(row)"
          >
            {{ row.status === 'active' ? '停用' : '启用' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="visible" :title="dialogTitle" width="480px">
      <el-form label-width="96px">
        <el-form-item label="姓名">
          <el-input v-model="form.displayName" />
        </el-form-item>
        <el-form-item v-if="!editingId" label="手机号">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input
            v-model="form.password"
            :placeholder="editingId ? '留空则不修改' : '至少 6 位'"
          />
        </el-form-item>
        <el-form-item v-if="form.role === 'teacher'" label="负责班级">
          <el-select
            v-model="form.classNames"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="输入班级名后回车，最多 20 个"
            style="width: 100%"
          />
          <p class="field-hint">与学员「班级」字段精确匹配后，教师才能查看该班学员。</p>
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
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import type { Account, Role } from '@art-edu/api-types';
import { errorMessage } from '../api/errors';
import {
  createAccount,
  listAccounts,
  updateAccount,
  updateAccountStatus,
} from '../api/v1';
import { ROLE_LABEL } from '../stores/auth';

const accounts = ref<Account[]>([]);
const roleFilter = ref<Role | ''>('');
const visible = ref(false);
const saving = ref(false);
const editingId = ref<string | null>(null);
const form = reactive({
  displayName: '',
  phone: '',
  password: 'Passw0rd',
  role: 'teacher' as Exclude<Role, 'admin'>,
  classNames: [] as string[],
});

const dialogTitle = computed(() => {
  const who = form.role === 'teacher' ? '教师' : '家长';
  return editingId.value ? `编辑${who}` : `创建${who}`;
});

function roleLabel(role: Role) {
  return ROLE_LABEL[role];
}

async function load() {
  try {
    const page = await listAccounts({
      role: roleFilter.value || undefined,
      limit: 50,
    });
    accounts.value = page.items;
  } catch (e) {
    ElMessage.error(errorMessage(e, '加载账号失败'));
  }
}

function openCreate(role: 'teacher' | 'parent') {
  editingId.value = null;
  form.role = role;
  form.displayName = '';
  form.phone = '';
  form.password = 'Passw0rd';
  form.classNames = [];
  visible.value = true;
}

function openEdit(row: Account) {
  editingId.value = row.id;
  form.role = row.role === 'admin' ? 'teacher' : row.role;
  form.displayName = row.displayName;
  form.phone = row.phone;
  form.password = '';
  form.classNames = [...(row.classNames ?? [])];
  visible.value = true;
}

async function save() {
  saving.value = true;
  try {
    if (editingId.value) {
      await updateAccount(editingId.value, {
        displayName: form.displayName,
        password: form.password || undefined,
        classNames: form.role === 'teacher' ? form.classNames : undefined,
      });
      ElMessage.success('已更新');
    } else {
      await createAccount({
        phone: form.phone.trim(),
        displayName: form.displayName.trim(),
        password: form.password,
        role: form.role,
        classNames: form.role === 'teacher' ? form.classNames : undefined,
      });
      ElMessage.success('已创建');
    }
    visible.value = false;
    await load();
  } catch (e) {
    ElMessage.error(errorMessage(e, '保存失败'));
  } finally {
    saving.value = false;
  }
}

async function toggleStatus(row: Account) {
  try {
    const next = row.status === 'active' ? 'disabled' : 'active';
    await updateAccountStatus(row.id, { status: next });
    ElMessage.success(next === 'disabled' ? '已停用' : '已启用');
    await load();
  } catch (e) {
    ElMessage.error(errorMessage(e, '更新状态失败'));
  }
}

onMounted(load);
</script>

<style scoped>
.page-hint,
.field-hint,
.muted {
  color: var(--color-ink-tertiary);
  font-size: var(--font-caption-size);
  line-height: var(--font-caption-line);
}
.page-hint {
  margin: calc(var(--space-2) * -1) 0 var(--space-4);
}
.cls {
  margin-right: 6px;
}
</style>
