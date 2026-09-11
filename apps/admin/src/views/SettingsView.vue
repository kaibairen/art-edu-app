<template>
  <div>
    <h2 class="page-title">品牌 / LOGO / 水印</h2>
    <el-alert
      v-if="!brand.logoUrl"
      title="未配置 LOGO"
      type="warning"
      :closable="false"
      description="海报预览与下载都会返回 400 LOGO_NOT_CONFIGURED「请联系机构配置 LOGO」。请先上传。"
      class="logo-alert"
    />
    <el-form label-width="120px" style="max-width: 640px">
      <el-form-item label="机构名称">
        <el-input v-model="form.orgName" />
      </el-form-item>
      <el-form-item label="水印文案">
        <el-input v-model="form.watermarkText" />
      </el-form-item>
      <el-form-item label="水印位置">
        <el-select v-model="form.watermarkPosition" style="width: 220px">
          <el-option v-for="p in positions" :key="p.value" :label="p.label" :value="p.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="水印透明度">
        <el-slider v-model="opacityPercent" :min="0" :max="100" style="width: 280px" />
      </el-form-item>
      <el-form-item label="当前 LOGO">
        <el-image
          v-if="brand.logoUrl"
          :src="brand.logoUrl"
          style="width: 96px; height: 96px"
          fit="contain"
        />
        <span v-else class="muted">未配置</span>
      </el-form-item>
      <el-form-item label="上传 LOGO">
        <input type="file" accept="image/*" @change="onLogo" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="saving" @click="save">保存品牌设置</el-button>
      </el-form-item>
    </el-form>

    <h3 class="sub-title">海报模板（简约 / 画框 / 杂志）</h3>
    <el-table :data="brand.templates" style="max-width: 720px">
      <el-table-column prop="key" label="键" width="120" />
      <el-table-column label="对外名" width="120">
        <template #default="{ row }">{{ templateLabel(row.key) }}</template>
      </el-table-column>
      <el-table-column prop="name" label="显示名" />
      <el-table-column label="启用" width="100">
        <template #default="{ row }">
          <el-switch v-model="row.enabled" @change="saveTemplates" />
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import type { BrandConfigDto, PosterTemplateKey, WatermarkPosition } from '@art-edu/shared';
import { errorMessage } from '../api/errors';
import { getBrand, updateBrand, uploadBrandLogo } from '../api/v1';

const WATERMARK_POSITIONS: WatermarkPosition[] = [
  'topLeft',
  'topRight',
  'bottomLeft',
  'bottomRight',
  'center',
];

const TEMPLATE_LABEL: Record<PosterTemplateKey, string> = {
  simple: '简约',
  frame: '画框',
  magazine: '杂志',
};

const positions = [
  { value: 'topLeft', label: '左上' },
  { value: 'topRight', label: '右上' },
  { value: 'bottomLeft', label: '左下' },
  { value: 'bottomRight', label: '右下' },
  { value: 'center', label: '居中' },
] as const;

const brand = ref<BrandConfigDto>({
  orgName: '',
  logoUrl: null,
  watermarkText: '',
  watermarkOpacity: 0.18,
  watermarkPosition: 'bottomRight',
  templates: [],
});
const form = reactive({
  orgName: '',
  watermarkText: '',
  watermarkPosition: 'bottomRight' as WatermarkPosition,
});
const saving = ref(false);
const opacityPercent = ref(18);

const opacity = computed(() => opacityPercent.value / 100);

function templateLabel(key: string) {
  return TEMPLATE_LABEL[key as PosterTemplateKey] ?? key;
}

function apply(data: BrandConfigDto) {
  brand.value = data;
  form.orgName = data.orgName ?? '';
  form.watermarkText = data.watermarkText ?? '';
  form.watermarkPosition = WATERMARK_POSITIONS.includes(data.watermarkPosition)
    ? data.watermarkPosition
    : 'bottomRight';
  opacityPercent.value = Math.round((data.watermarkOpacity ?? 0.18) * 100);
}

async function load() {
  try {
    apply(await getBrand());
  } catch (e) {
    ElMessage.error(errorMessage(e, '加载品牌失败'));
  }
}

async function save() {
  saving.value = true;
  try {
    apply(
      await updateBrand({
        orgName: form.orgName,
        watermarkText: form.watermarkText,
        watermarkPosition: form.watermarkPosition,
        watermarkOpacity: opacity.value,
      }),
    );
    ElMessage.success('已保存');
  } catch (e) {
    ElMessage.error(errorMessage(e, '保存失败'));
  } finally {
    saving.value = false;
  }
}

async function saveTemplates() {
  try {
    apply(
      await updateBrand({
        templates: brand.value.templates.map((t) => ({
          id: t.id,
          enabled: t.enabled,
          name: t.name,
        })),
      }),
    );
    ElMessage.success('模板已更新');
  } catch (e) {
    ElMessage.error(errorMessage(e, '更新模板失败'));
    await load();
  }
}

async function onLogo(ev: Event) {
  const file = (ev.target as HTMLInputElement).files?.[0];
  if (!file) return;
  try {
    apply(await uploadBrandLogo(file));
    ElMessage.success('LOGO 已更新，后续海报将强制带上');
  } catch (e) {
    ElMessage.error(errorMessage(e, 'LOGO 上传失败'));
  }
}

onMounted(load);
</script>

<style scoped>
.logo-alert {
  margin-bottom: var(--space-4);
  max-width: 640px;
}
.muted {
  color: var(--color-ink-tertiary);
}
.sub-title {
  margin: var(--space-6) 0 var(--space-3);
  font-size: var(--font-title-size);
  line-height: var(--font-title-line);
  font-weight: var(--font-title-weight);
}
</style>
