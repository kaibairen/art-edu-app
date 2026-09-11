/// P0 /api/v1 DTO 桩。与 `packages/api-types`、`docs/contracts/openapi-p0.yaml` 对齐。
/// 不要在现有 Screen 里引用本文件（业务页冻结）。

class ApiErrorBody {
  ApiErrorBody({required this.code, required this.message, this.details});

  final String code;
  final String message;
  final Object? details;

  factory ApiErrorBody.fromJson(Map<String, dynamic> json) {
    return ApiErrorBody(
      code: json['code'] as String? ?? 'VALIDATION_ERROR',
      message: json['message'] as String? ?? '请求失败',
      details: json['details'],
    );
  }
}

class P0ApiException implements Exception {
  P0ApiException(this.status, this.body);
  final int status;
  final ApiErrorBody body;

  @override
  String toString() => 'P0ApiException($status ${body.code}): ${body.message}';
}

class AuthUser {
  AuthUser({
    required this.id,
    required this.phone,
    required this.name,
    required this.role,
    required this.disabled,
    this.email,
  });

  final String id;
  final String phone;
  final String? email;
  final String name;
  final String role;
  final bool disabled;

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id'] as String,
      phone: json['phone'] as String,
      email: json['email'] as String?,
      name: json['name'] as String,
      role: json['role'] as String,
      disabled: json['disabled'] as bool? ?? false,
    );
  }
}

class LoginResponse {
  LoginResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });

  final String accessToken;
  final String refreshToken;
  final AuthUser user;

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    return LoginResponse(
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
      user: AuthUser.fromJson(json['user'] as Map<String, dynamic>),
    );
  }
}

class Student {
  Student({
    required this.id,
    required this.name,
    this.birthday,
    this.gender,
    this.note,
    this.avatarUrl,
    this.createdAt,
  });

  final String id;
  final String name;
  final String? birthday;
  final String? gender;
  final String? note;
  final String? avatarUrl;
  final String? createdAt;

  factory Student.fromJson(Map<String, dynamic> json) {
    return Student(
      id: json['id'] as String,
      name: json['name'] as String,
      birthday: json['birthday'] as String?,
      gender: json['gender'] as String?,
      note: json['note'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      createdAt: json['createdAt'] as String?,
    );
  }
}

class ArtworkComment {
  ArtworkComment({required this.text});
  final String text;

  factory ArtworkComment.fromJson(Map<String, dynamic> json) {
    return ArtworkComment(text: json['text'] as String);
  }
}

class Artwork {
  Artwork({
    required this.id,
    required this.studentId,
    required this.teacherId,
    required this.imageUrl,
    required this.theme,
    required this.createdOn,
    this.comment,
    this.createdAt,
  });

  final String id;
  final String studentId;
  final String teacherId;
  final String imageUrl;
  final String theme;
  final String createdOn;
  final ArtworkComment? comment;
  final String? createdAt;

  factory Artwork.fromJson(Map<String, dynamic> json) {
    final raw = json['comment'];
    return Artwork(
      id: json['id'] as String,
      studentId: json['studentId'] as String,
      teacherId: json['teacherId'] as String,
      imageUrl: json['imageUrl'] as String,
      theme: json['theme'] as String,
      createdOn: json['createdOn'] as String,
      comment: raw is Map<String, dynamic> ? ArtworkComment.fromJson(raw) : null,
      createdAt: json['createdAt'] as String?,
    );
  }
}

class ArtworkCursorPage {
  ArtworkCursorPage({required this.items, this.nextCursor});
  final List<Artwork> items;
  final String? nextCursor;

  factory ArtworkCursorPage.fromJson(Map<String, dynamic> json) {
    final items = (json['items'] as List<dynamic>? ?? [])
        .map((e) => Artwork.fromJson(e as Map<String, dynamic>))
        .toList();
    return ArtworkCursorPage(
      items: items,
      nextCursor: json['nextCursor'] as String?,
    );
  }
}

/// POST …/posters/preview
class PosterPreview {
  PosterPreview({required this.previewUrl, required this.templateKey});

  /// 仅屏幕预览，例如 `…-preview.png`。禁止与 [PosterDownload.downloadUrl] 相同。
  final String previewUrl;
  final String templateKey;

  factory PosterPreview.fromJson(Map<String, dynamic> json) {
    return PosterPreview(
      previewUrl: json['previewUrl'] as String,
      templateKey: json['templateKey'] as String,
    );
  }
}

/// POST …/posters
class PosterDownload {
  PosterDownload({required this.downloadUrl, required this.templateKey});

  /// 正式成片，例如 `….png`（无 `-preview` 后缀）。
  final String downloadUrl;
  final String templateKey;

  factory PosterDownload.fromJson(Map<String, dynamic> json) {
    return PosterDownload(
      downloadUrl: json['downloadUrl'] as String,
      templateKey: json['templateKey'] as String,
    );
  }
}

class Brand {
  Brand({
    required this.orgName,
    required this.watermarkText,
    required this.watermarkPosition,
    this.logoUrl,
  });

  final String orgName;
  final String? logoUrl;
  final String watermarkText;

  /// camelCase：topLeft / topRight / bottomLeft / bottomRight / center
  final String watermarkPosition;

  factory Brand.fromJson(Map<String, dynamic> json) {
    return Brand(
      orgName: json['orgName'] as String,
      logoUrl: json['logoUrl'] as String?,
      watermarkText: json['watermarkText'] as String,
      watermarkPosition: json['watermarkPosition'] as String,
    );
  }
}
