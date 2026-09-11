<template>
  <div>
    <h2 class="page-title">机构 LOGO 与水印</h2>
    <el-form label-width="100px" style="max-width: 560px">
      <el-form-item label="机构名称">
        <el-input v-model="form.orgName" />
      </el-form-item>
      <el-form-item label="水印文案">
        <el-input v-model="form.watermarkText" />
      </el-form-item>
      <el-form-item label="当前 LOGO">
        <el-image v-if="form.logoUrl" :src="form.logoUrl" style="width: 96px; height: 96px" fit="contain" />
        <span v-else>未上传（海报将使用默认 LOGO）</span>
      </el-form-item>
      <el-form-item label="上传 LOGO">
        <input type="file" accept="image/*" @change="onLogo" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="save">保存文案</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { http } from '../api/http';

const form = reactive({ orgName: '', watermarkText: '', logoUrl: '' });

async function load() {
  const { data } = await http.get('/admin/settings');
  Object.assign(form, data);
}

async function save() {
  const { data } = await http.patch('/admin/settings', {
    orgName: form.orgName,
    watermarkText: form.watermarkText,
  });
  Object.assign(form, data);
  ElMessage.success('已保存');
}

async function onLogo(ev: Event) {
  const file = (ev.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const fd = new FormData();
  fd.append('logo', file);
  const { data } = await http.post('/admin/settings/logo', fd);
  Object.assign(form, data);
  ElMessage.success('LOGO 已更新，后续海报将强制带上');
}

onMounted(load);
</script>
