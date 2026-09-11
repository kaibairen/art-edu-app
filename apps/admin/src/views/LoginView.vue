<template>
  <div class="login">
    <el-card class="card">
      <h1>美术教培</h1>
      <p class="hint">校长 / 管理员登录 · 管理端</p>
      <el-form @submit.prevent="onSubmit">
        <el-form-item label="手机号">
          <el-input v-model="phone" placeholder="11 位手机号" maxlength="11" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="password" type="password" show-password />
        </el-form-item>
        <el-alert
          v-if="errorText"
          :title="errorText"
          type="error"
          :closable="false"
          class="err"
        />
        <el-button type="primary" native-type="submit" :loading="loading" style="width: 100%">
          登录
        </el-button>
      </el-form>
      <p class="demo">演示账号 13800000000 / Admin123</p>
      <p class="roles">教师端 / 家长端请使用 Flutter 入口，勿在此登录。</p>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { errorMessage, toAdminApiError } from '../api/errors';

const phone = ref('13800000000');
const password = ref('Admin123');
const loading = ref(false);
const errorText = ref('');
const auth = useAuthStore();
const router = useRouter();

async function onSubmit() {
  loading.value = true;
  errorText.value = '';
  try {
    await auth.login(phone.value.trim(), password.value);
    await router.push('/users');
  } catch (e: unknown) {
    const apiErr = toAdminApiError(e);
    if (apiErr.code === 'ACCOUNT_DISABLED') {
      errorText.value = apiErr.message || '账号已停用，请联系机构管理员';
    } else {
      errorText.value = errorMessage(e, '登录失败');
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login {
  min-height: 100%;
  display: grid;
  place-items: center;
  background: var(--color-bg-subtle);
}
.card {
  width: 400px;
  border-radius: var(--radius-card);
}
h1 {
  margin: 0 0 var(--space-2);
  font-size: var(--font-display-size);
  line-height: var(--font-display-line);
  font-weight: var(--font-display-weight);
  color: var(--color-ink);
}
.hint,
.demo,
.roles {
  color: var(--color-ink-tertiary);
  font-size: var(--font-caption-size);
  line-height: var(--font-caption-line);
}
.err {
  margin-bottom: var(--space-3);
}
</style>
