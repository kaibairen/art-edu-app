class AuthSession {
  AuthSession({
    required this.token,
    required this.refreshToken,
    required this.displayName,
    required this.role,
    required this.phone,
    this.id = '',
    this.status = 'active',
  });

  final String token;
  final String refreshToken;
  final String displayName;
  final String role;
  final String phone;
  final String id;
  final String status;

  /// 兼容旧字段名。
  String get name => displayName;
}

class StudentItem {
  StudentItem({
    required this.id,
    required this.name,
    this.note,
    this.className,
    this.status = 'active',
  });

  final String id;
  final String name;
  final String? note;
  final String? className;
  final String status;

  factory StudentItem.fromJson(Map<String, dynamic> json) {
    return StudentItem(
      id: json['id'] as String,
      name: json['name'] as String,
      note: json['note'] as String?,
      className: json['className'] as String?,
      status: json['status'] as String? ?? 'active',
    );
  }
}

class ArtworkItem {
  ArtworkItem({
    required this.id,
    required this.studentId,
    required this.studentName,
    required this.imageUrl,
    required this.thumbUrl,
    required this.createdAt,
    this.title,
    this.commentText,
    this.courseTheme,
  });

  final String id;
  final String studentId;
  final String studentName;
  final String imageUrl;
  final String thumbUrl;
  final String createdAt;
  final String? title;
  final String? commentText;
  final String? courseTheme;

  String get headline =>
      (title != null && title!.isNotEmpty) ? title! : (courseTheme ?? '未命名作品');

  factory ArtworkItem.fromJson(Map<String, dynamic> json) {
    return ArtworkItem(
      id: json['id'] as String,
      studentId: json['studentId'] as String? ?? '',
      studentName: json['studentName'] as String? ?? '',
      imageUrl: json['imageUrl'] as String? ?? '',
      thumbUrl: json['thumbUrl'] as String? ?? json['imageUrl'] as String? ?? '',
      createdAt: json['createdAt'] as String? ?? '',
      title: json['title'] as String?,
      commentText: json['commentText'] as String?,
      courseTheme: json['courseTheme'] as String?,
    );
  }
}

class PosterPreview {
  PosterPreview({required this.previewUrl, required this.templateKey});
  final String previewUrl;
  final String templateKey;

  factory PosterPreview.fromJson(Map<String, dynamic> json) {
    return PosterPreview(
      previewUrl: json['previewUrl'] as String,
      templateKey: json['templateKey'] as String,
    );
  }
}

class PosterDownload {
  PosterDownload({required this.downloadUrl, required this.templateKey});
  final String downloadUrl;
  final String templateKey;

  factory PosterDownload.fromJson(Map<String, dynamic> json) {
    return PosterDownload(
      downloadUrl: json['downloadUrl'] as String,
      templateKey: json['templateKey'] as String,
    );
  }
}

class ApiException implements Exception {
  ApiException(this.status, this.message, {this.code});
  final int status;
  final String message;
  final String? code;

  bool get cannotView => status == 404 && message.contains('无法查看');

  @override
  String toString() => message;
}

class PosterTemplate {
  const PosterTemplate(this.key, this.label);
  final String key;
  final String label;
}

const posterTemplates = [
  PosterTemplate('simple', '简约'),
  PosterTemplate('frame', '画框'),
  PosterTemplate('magazine', '杂志'),
];
