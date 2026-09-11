<template>
  <div class="login">
    <el-card class="card">
      <h1>美术教培管理端</h1>
      <p class="hint">校长 / 管理员登录</p>
      <el-form @submit.prevent="onSubmit">
        <el-form-item label="账号">
          <el-input v-model="account" placeholder="手机号或邮箱" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="password" type="password" show-password />
        </el-form-item>
        <el-button type="primary" native-type="submit" :loading="loading" style="width: 100%">
          登录
        </el-button>
      </el-form>
      <p class="demo">演示账号 13800000000 / Admin123</p>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '../stores/auth';

const account = ref('13800000000');
const password = ref('Admin123');
const loading = ref(false);
const auth = useAuthStore();
const router = useRouter();

async function onSubmit() {
  loading.value = true;
  try {
    await auth.login(account.value, password.value);
    await router.push('/users');
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string };
    ElMessage.error(err.response?.data?.message ?? err.message ?? '登录失败');
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
  background: linear-gradient(160deg, #f6e7d4, #f3f0ea);
}
.card {
  width: 380px;
}
.hint,
.demo {
  color: #8a7460;
  font-size: 13px;
}
</style>
