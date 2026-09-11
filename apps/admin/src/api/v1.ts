import type {
  Account,
  CreateAccountRequest,
  Role,
  UpdateAccountRequest,
  UpdateAccountStatusRequest,
} from '@art-edu/api-types';
import type {
  ArtworkDto,
  AuthMe,
  AuthTokens,
  BindingDto,
  BrandConfigDto,
  Page,
  StudentDto,
  StudentStatus,
  WatermarkPosition,
} from '@art-edu/shared';
import { http } from './http';

export async function login(phone: string, password: string): Promise<AuthTokens> {
  const { data } = await http.post<AuthTokens>('/auth/login', { phone, password });
  return data;
}

export async function logout(): Promise<void> {
  await http.post('/auth/logout');
}

export async function me(): Promise<AuthMe> {
  const { data } = await http.get<AuthMe>('/auth/me');
  return data;
}

export async function listAccounts(params?: {
  role?: Role;
  cursor?: string;
  limit?: number;
}): Promise<Page<Account>> {
  const { data } = await http.get<Page<Account>>('/admin/accounts', { params });
  return data;
}

/** F-011：正式类型 CreateAccountRequest（displayName + classNames[]）。 */
export async function createAccount(body: CreateAccountRequest): Promise<Account> {
  const { data } = await http.post<Account>('/admin/accounts', body);
  return data;
}

/** F-011：正式类型 UpdateAccountRequest。停用禁止走此接口。 */
export async function updateAccount(
  id: string,
  body: UpdateAccountRequest,
): Promise<Account> {
  const { data } = await http.patch<Account>(`/admin/accounts/${id}`, body);
  return data;
}

/** 启停账号：仅 PATCH /admin/accounts/{id}/status。 */
export async function updateAccountStatus(
  id: string,
  body: UpdateAccountStatusRequest['status'] | UpdateAccountStatusRequest,
): Promise<Account> {
  const payload: UpdateAccountStatusRequest =
    typeof body === 'string' ? { status: body } : body;
  const { data } = await http.patch<Account>(`/admin/accounts/${id}/status`, payload);
  return data;
}

export async function listStudents(params?: {
  cursor?: string;
  limit?: number;
}): Promise<Page<StudentDto>> {
  const { data } = await http.get<Page<StudentDto>>('/admin/students', { params });
  return data;
}

export async function createStudent(body: {
  name: string;
  className?: string;
  note?: string;
  gender?: string;
  birthday?: string;
}): Promise<StudentDto> {
  const { data } = await http.post<StudentDto>('/admin/students', body);
  return data;
}

export async function updateStudent(
  id: string,
  body: {
    name?: string;
    className?: string;
    note?: string;
    gender?: string;
    birthday?: string;
    status?: StudentStatus;
  },
): Promise<StudentDto> {
  const { data } = await http.patch<StudentDto>(`/admin/students/${id}`, body);
  return data;
}

export async function deleteStudent(id: string): Promise<{ ok: true }> {
  const { data } = await http.delete<{ ok: true }>(`/admin/students/${id}`);
  return data;
}

export async function listBindings(params?: {
  cursor?: string;
  limit?: number;
}): Promise<Page<BindingDto>> {
  const { data } = await http.get<Page<BindingDto>>('/admin/bindings', { params });
  return data;
}

export async function createBinding(body: {
  parentId: string;
  studentId: string;
}): Promise<BindingDto> {
  const { data } = await http.post<BindingDto>('/admin/bindings', body);
  return data;
}

export async function deleteBinding(id: string): Promise<{ ok: true }> {
  const { data } = await http.delete<{ ok: true }>(`/admin/bindings/${id}`);
  return data;
}

export async function getBrand(): Promise<BrandConfigDto> {
  const { data } = await http.get<BrandConfigDto>('/admin/brand');
  return data;
}

export async function updateBrand(body: {
  orgName?: string;
  watermarkText?: string;
  watermarkOpacity?: number;
  watermarkPosition?: WatermarkPosition;
  templates?: Array<{ id: string; enabled?: boolean; name?: string }>;
}): Promise<BrandConfigDto> {
  const { data } = await http.put<BrandConfigDto>('/admin/brand', body);
  return data;
}

export async function uploadBrandLogo(file: File): Promise<BrandConfigDto> {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await http.post<BrandConfigDto>('/admin/brand/logo', fd);
  return data;
}

/** 仅调试用：教师时间线（管理端不验收上传）。 */
export async function listTeacherStudents(): Promise<Page<StudentDto>> {
  const { data } = await http.get<Page<StudentDto>>('/teacher/students');
  return data;
}

export async function listTeacherArtworks(studentId: string): Promise<Page<ArtworkDto>> {
  const { data } = await http.get<Page<ArtworkDto>>(`/teacher/students/${studentId}/artworks`);
  return data;
}
