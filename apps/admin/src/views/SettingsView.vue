<template>
  <div>
    <h2 class="page-title">品牌 / LOGO / 水印</h2>
    <el-alert
      v-if="!brand.logoUrl"
      title="尚未配置 LOGO"
      type="warning"
      :closable="false"
      description="未上传机构 LOGO 时，家长端无法生成海报。请先在下方上传。"
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
      <el-form-item label="机构 LOGO">
        <div class="logo-field">
          <button type="button" class="logo-slot" :class="{ empty: !brand.logoUrl }" @click="pickLogo">
            <el-image
              v-if="brand.logoUrl"
              :src="brand.logoUrl"
              fit="contain"
              class="logo-preview"
            />
            <span v-else class="logo-placeholder">尚未配置 LOGO</span>
          </button>
          <div class="logo-actions">
            <el-button @click="pickLogo">上传图片</el-button>
            <p class="muted">点击虚框或按钮选择图片，上传后海报将带上机构标识。</p>
          </div>
          <input
            ref="logoInput"
            type="file"
            accept="image/*"
            class="sr-file"
            @change="onLogo"
          />
        </div>
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
const logoInput = ref<HTMLInputElement | null>(null);

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

function pickLogo() {
  logoInput.value?.click();
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
  const input = ev.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
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
.logo-field {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  position: relative;
}
.logo-slot {
  width: 96px;
  height: 96px;
  padding: 0;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-control);
  background: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
}
.logo-slot.empty {
  border-color: var(--color-ink-tertiary);
  background: var(--color-bg-subtle);
}
.logo-preview {
  width: 96px;
  height: 96px;
}
.logo-placeholder {
  color: var(--color-ink-tertiary);
  font-size: var(--font-caption-size);
  line-height: var(--font-caption-line);
  text-align: center;
  padding: 0 8px;
}
.logo-actions .muted,
.muted {
  color: var(--color-ink-tertiary);
  font-size: var(--font-caption-size);
  line-height: var(--font-caption-line);
}
.logo-actions .muted {
  margin: var(--space-2) 0 0;
}
.sr-file {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
.sub-title {
  margin: var(--space-6) 0 var(--space-3);
  font-size: var(--font-title-size);
  line-height: var(--font-title-line);
  font-weight: var(--font-title-weight);
}
</style>
