import axios, { AxiosError, type AxiosInstance } from 'axios';
import {
  ApiError,
  P0_PATHS,
  mapErrorBody,
  type Account,
  type Artwork,
  type ArtworkCursorPage,
  type ArtworkCursorQuery,
  type AuthUser,
  type Binding,
  type BindingQuery,
  type Brand,
  type CreateAccountRequest,
  type CreateArtworkFields,
  type CreateBindingRequest,
  type CreateCommentRequest,
  type CreateStudentRequest,
  type GeneratePosterRequest,
  type LoginRequest,
  type LoginResponse,
  type LogoutResponse,
  type PosterDownload,
  type PosterPreview,
  type RefreshRequest,
  type RefreshResponse,
  type Role,
  type Student,
  type UpdateAccountRequest,
  type UpdateBrandRequest,
  type UpdateStudentRequest,
} from '@art-edu/api-types';
import { P0_TOKEN_STORAGE_KEY, resolveP0BaseURL } from './config';

export type PosterScope = 'parent' | 'teacher';

export interface P0ClientOptions {
  /** 可切换：Mock `http://localhost:4010/api/v1` 或将来真后端 `/api/v1`。 */
  baseURL?: string;
  getAccessToken?: () => string | null | undefined;
  setAccessToken?: (token: string | null) => void;
  onUnauthorized?: () => void;
}

export class P0ApiClient {
  readonly http: AxiosInstance;
  private readonly getAccessToken?: P0ClientOptions['getAccessToken'];
  private readonly setAccessToken?: P0ClientOptions['setAccessToken'];
  private readonly onUnauthorized?: P0ClientOptions['onUnauthorized'];

  constructor(options: P0ClientOptions = {}) {
    this.getAccessToken = options.getAccessToken;
    this.setAccessToken = options.setAccessToken;
    this.onUnauthorized = options.onUnauthorized;
    this.http = axios.create({
      baseURL: resolveP0BaseURL(options.baseURL),
    });

    this.http.interceptors.request.use((config) => {
      const token = this.getAccessToken?.();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.http.interceptors.response.use(
      (res) => res,
      (err: AxiosError) => {
        const status = err.response?.status ?? 0;
        if (status === 401) {
          this.setAccessToken?.(null);
          this.onUnauthorized?.();
        }
        if (err.response) {
          throw mapErrorBody(status, err.response.data);
        }
        throw new ApiError(status, {
          code: 'UNAUTHORIZED',
          message: err.message || '网络错误',
        });
      },
    );
  }

  get baseURL(): string {
    return String(this.http.defaults.baseURL ?? '');
  }

  setBaseURL(baseURL: string): void {
    this.http.defaults.baseURL = resolveP0BaseURL(baseURL);
  }

  async login(body: LoginRequest): Promise<LoginResponse> {
    const { data } = await this.http.post<LoginResponse>(P0_PATHS.login, body);
    this.setAccessToken?.(data.accessToken);
    return data;
  }

  async logout(refreshToken?: string): Promise<LogoutResponse> {
    const { data } = await this.http.post<LogoutResponse>(P0_PATHS.logout, {
      refreshToken,
    });
    this.setAccessToken?.(null);
    return data;
  }

  async me(): Promise<AuthUser> {
    const { data } = await this.http.get<AuthUser>(P0_PATHS.me);
    return data;
  }

  async refresh(body: RefreshRequest): Promise<RefreshResponse> {
    const { data } = await this.http.post<RefreshResponse>(
      P0_PATHS.refresh,
      body,
    );
    this.setAccessToken?.(data.accessToken);
    return data;
  }

  async getPublicBrand(): Promise<Brand> {
    const { data } = await this.http.get<Brand>(P0_PATHS.brand);
    return data;
  }

  async listParentChildren(): Promise<Student[]> {
    const { data } = await this.http.get<Student[]>(P0_PATHS.parentChildren);
    return data;
  }

  async listParentArtworks(
    studentId: string,
    query: ArtworkCursorQuery = {},
  ): Promise<ArtworkCursorPage> {
    const { data } = await this.http.get<ArtworkCursorPage>(
      P0_PATHS.parentArtworks(studentId),
      { params: query },
    );
    return data;
  }

  async getParentArtwork(artworkId: string): Promise<Artwork> {
    const { data } = await this.http.get<Artwork>(
      P0_PATHS.parentArtwork(artworkId),
    );
    return data;
  }

  /**
   * 屏幕预览：POST …/posters/preview → { previewUrl, templateKey }。
   * 切换模板只应调用本方法。
   */
  async previewPoster(
    artworkId: string,
    body: GeneratePosterRequest,
    scope: PosterScope = 'parent',
  ): Promise<PosterPreview> {
    const path =
      scope === 'teacher'
        ? P0_PATHS.teacherPosterPreview(artworkId)
        : P0_PATHS.parentPosterPreview(artworkId);
    const { data } = await this.http.post<PosterPreview>(path, body);
    return data;
  }

  /**
   * 正式成片：POST …/posters → { downloadUrl, templateKey }。
   * 主按钮下载用本方法；禁止回退使用 previewUrl。
   */
  async downloadPoster(
    artworkId: string,
    body: GeneratePosterRequest,
    scope: PosterScope = 'parent',
  ): Promise<PosterDownload> {
    const path =
      scope === 'teacher'
        ? P0_PATHS.teacherPosterDownload(artworkId)
        : P0_PATHS.parentPosterDownload(artworkId);
    const { data } = await this.http.post<PosterDownload>(path, body);
    return data;
  }

  async listTeacherStudents(): Promise<Student[]> {
    const { data } = await this.http.get<Student[]>(P0_PATHS.teacherStudents);
    return data;
  }

  async uploadArtwork(
    studentId: string,
    fields: CreateArtworkFields,
    image: Blob,
    filename = 'artwork.jpg',
  ): Promise<Artwork> {
    const form = new FormData();
    form.append('image', image, filename);
    form.append('theme', fields.theme);
    form.append('createdOn', fields.createdOn);
    const { data } = await this.http.post<Artwork>(
      P0_PATHS.teacherArtworks(studentId),
      form,
    );
    return data;
  }

  async createComment(
    artworkId: string,
    body: CreateCommentRequest,
  ): Promise<Artwork> {
    const { data } = await this.http.post<Artwork>(
      P0_PATHS.teacherComments(artworkId),
      body,
    );
    return data;
  }

  async listAccounts(role?: Role): Promise<Account[]> {
    const { data } = await this.http.get<Account[]>(P0_PATHS.adminAccounts, {
      params: role ? { role } : undefined,
    });
    return data;
  }

  async createAccount(body: CreateAccountRequest): Promise<Account> {
    const { data } = await this.http.post<Account>(P0_PATHS.adminAccounts, body);
    return data;
  }

  async getAccount(accountId: string): Promise<Account> {
    const { data } = await this.http.get<Account>(
      P0_PATHS.adminAccount(accountId),
    );
    return data;
  }

  async updateAccount(
    accountId: string,
    body: UpdateAccountRequest,
  ): Promise<Account> {
    const { data } = await this.http.patch<Account>(
      P0_PATHS.adminAccount(accountId),
      body,
    );
    return data;
  }

  async listAdminStudents(): Promise<Student[]> {
    const { data } = await this.http.get<Student[]>(P0_PATHS.adminStudents);
    return data;
  }

  async createStudent(body: CreateStudentRequest): Promise<Student> {
    const { data } = await this.http.post<Student>(P0_PATHS.adminStudents, body);
    return data;
  }

  async getAdminStudent(studentId: string): Promise<Student> {
    const { data } = await this.http.get<Student>(
      P0_PATHS.adminStudent(studentId),
    );
    return data;
  }

  async updateStudent(
    studentId: string,
    body: UpdateStudentRequest,
  ): Promise<Student> {
    const { data } = await this.http.patch<Student>(
      P0_PATHS.adminStudent(studentId),
      body,
    );
    return data;
  }

  async deleteStudent(studentId: string): Promise<{ ok: true }> {
    const { data } = await this.http.delete<{ ok: true }>(
      P0_PATHS.adminStudent(studentId),
    );
    return data;
  }

  async listBindings(query: BindingQuery = {}): Promise<Binding[]> {
    const { data } = await this.http.get<Binding[]>(P0_PATHS.adminBindings, {
      params: query,
    });
    return data;
  }

  async createBinding(body: CreateBindingRequest): Promise<Binding> {
    const { data } = await this.http.post<Binding>(P0_PATHS.adminBindings, body);
    return data;
  }

  async deleteBinding(bindingId: string): Promise<{ ok: true }> {
    const { data } = await this.http.delete<{ ok: true }>(
      P0_PATHS.adminBinding(bindingId),
    );
    return data;
  }

  async getAdminBrand(): Promise<Brand> {
    const { data } = await this.http.get<Brand>(P0_PATHS.adminBrand);
    return data;
  }

  async updateBrand(body: UpdateBrandRequest): Promise<Brand> {
    const { data } = await this.http.patch<Brand>(P0_PATHS.adminBrand, body);
    return data;
  }

  async uploadBrandLogo(logo: Blob, filename = 'logo.png'): Promise<Brand> {
    const form = new FormData();
    form.append('logo', logo, filename);
    const { data } = await this.http.post<Brand>(P0_PATHS.adminBrandLogo, form);
    return data;
  }
}

/** 浏览器默认：token 与现网管理端隔离，避免冲掉业务页登录态。 */
export function createBrowserP0Client(
  options: P0ClientOptions = {},
): P0ApiClient {
  return new P0ApiClient({
    getAccessToken:
      options.getAccessToken ??
      (() => localStorage.getItem(P0_TOKEN_STORAGE_KEY)),
    setAccessToken:
      options.setAccessToken ??
      ((token) => {
        if (token) localStorage.setItem(P0_TOKEN_STORAGE_KEY, token);
        else localStorage.removeItem(P0_TOKEN_STORAGE_KEY);
      }),
    ...options,
  });
}
