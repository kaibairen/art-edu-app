export declare const ROLES: readonly ["admin", "teacher", "parent"];
export type Role = (typeof ROLES)[number];
export declare const POSTER_TEMPLATE_KEYS: readonly ["classic", "gallery", "festival"];
export type PosterTemplateKey = (typeof POSTER_TEMPLATE_KEYS)[number];
export declare const HOME_CONTENT_TYPES: readonly ["banner", "announcement", "about", "course"];
export type HomeContentType = (typeof HOME_CONTENT_TYPES)[number];
export interface LoginRequest {
    account: string;
    password: string;
}
export interface AuthUser {
    id: string;
    phone: string;
    email: string | null;
    name: string;
    role: Role;
}
export interface LoginResponse {
    accessToken: string;
    user: AuthUser;
}
export interface StudentProfile {
    id: string;
    name: string;
    birthday: string | null;
    gender: string | null;
    note: string | null;
    avatarUrl: string | null;
}
export interface ArtworkDto {
    id: string;
    studentId: string;
    teacherId: string;
    imageUrl: string;
    theme: string;
    createdOn: string;
    textComment: string | null;
    voiceCommentUrl: string | null;
    videoCommentUrl: string | null;
    createdAt: string;
}
export interface OrgSettingDto {
    orgName: string;
    logoUrl: string | null;
    watermarkText: string;
}
export interface PublicHomeDto {
    settings: OrgSettingDto;
    contents: Array<{
        id: string;
        type: HomeContentType;
        title: string;
        body: string | null;
        imageUrl: string | null;
        sortOrder: number;
    }>;
}
