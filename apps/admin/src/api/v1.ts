import type {
  AccountDto,
  ArtworkDto,
  AuthMe,
  AuthTokens,
  BindingDto,
  BrandConfigDto,
  Page,
  Role,
  StudentDto,
  StudentStatus,
  UserStatus,
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
}): Promise<Page<AccountDto>> {
  const { data } = await http.get<Page<AccountDto>>('/admin/accounts', { params });
  return data;
}

/** F-011：真后端 POST /admin/accounts 已接受 classNames[]（仅教师写入）。不依赖 OpenAPI。 */
export async function createAccount(body: {
  phone: string;
  displayName: string;
  password: string;
  role: Exclude<Role, 'admin'>;
  email?: string;
  classNames?: string[];
}): Promise<AccountDto> {
  const { data } = await http.post<AccountDto>('/admin/accounts', body);
  return data;
}

/** F-011：真后端 PATCH /admin/accounts/:id 已接受 classNames[]（仅已是教师时更新）。 */
export async function updateAccount(
  id: string,
  body: { displayName?: string; email?: string; password?: string; classNames?: string[] },
): Promise<AccountDto> {
  const { data } = await http.patch<AccountDto>(`/admin/accounts/${id}`, body);
  return data;
}

export async function updateAccountStatus(id: string, status: UserStatus): Promise<AccountDto> {
  const { data } = await http.patch<AccountDto>(`/admin/accounts/${id}/status`, { status });
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
