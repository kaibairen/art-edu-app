import 'dart:convert';
import 'dart:typed_data';

import 'package:http/http.dart' as http;

import 'models.dart';

/// P0 真后端 `/api/v1` client。默认 `http://127.0.0.1:3000/api/v1`。
class ApiClient {
  ApiClient({required this.baseUrl});

  final String baseUrl;
  String? _token;

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      };

  Future<AuthSession> login(String phone, String password) async {
    final res = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'phone': phone, 'password': password}),
    );
    final data = _decode(res) as Map<String, dynamic>;
    _token = data['accessToken'] as String;
    return AuthSession(
      token: _token!,
      refreshToken: data['refreshToken'] as String? ?? '',
      displayName: data['displayName'] as String? ?? '',
      role: data['role'] as String,
      phone: phone,
    );
  }

  Future<AuthSession> me() async {
    final data = _decode(await http.get(Uri.parse('$baseUrl/auth/me'), headers: _headers))
        as Map<String, dynamic>;
    return AuthSession(
      token: _token ?? '',
      refreshToken: '',
      displayName: data['displayName'] as String? ?? '',
      role: data['role'] as String,
      phone: data['phone'] as String? ?? '',
      id: data['id'] as String? ?? '',
      status: data['status'] as String? ?? 'active',
    );
  }

  Future<List<StudentItem>> listStudents(String role) async {
    final path = role == 'teacher' ? '/teacher/students' : '/parent/children';
    final data = _decode(await http.get(Uri.parse('$baseUrl$path'), headers: _headers));
    final items = data is List
        ? data
        : (data as Map<String, dynamic>)['items'] as List<dynamic>? ?? [];
    return items
        .map((e) => StudentItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<ArtworkItem>> timeline(String role, String studentId) async {
    final path = role == 'teacher'
        ? '/teacher/students/$studentId/artworks'
        : '/parent/children/$studentId/artworks';
    final data = _decode(await http.get(Uri.parse('$baseUrl$path'), headers: _headers));
    final items = data is Map<String, dynamic>
        ? data['items'] as List<dynamic>? ?? []
        : data as List<dynamic>;
    return items
        .map((e) => ArtworkItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<ArtworkItem> getArtwork(String role, String artworkId) async {
    final path = role == 'teacher'
        ? '/teacher/artworks/$artworkId'
        : '/parent/artworks/$artworkId';
    final data = _decode(await http.get(Uri.parse('$baseUrl$path'), headers: _headers))
        as Map<String, dynamic>;
    return ArtworkItem.fromJson(data);
  }

  Future<ArtworkItem> uploadArtwork({
    required String studentId,
    String? title,
    String? createdAt,
    String? courseTheme,
    required Uint8List bytes,
    required String filename,
  }) async {
    final req = http.MultipartRequest(
      'POST',
      Uri.parse('$baseUrl/teacher/students/$studentId/artworks'),
    );
    if (_token != null) {
      req.headers['Authorization'] = 'Bearer $_token';
    }
    if (title != null && title.isNotEmpty) req.fields['title'] = title;
    if (createdAt != null && createdAt.isNotEmpty) req.fields['createdAt'] = createdAt;
    if (courseTheme != null && courseTheme.isNotEmpty) {
      req.fields['courseTheme'] = courseTheme;
    }
    req.files.add(http.MultipartFile.fromBytes('image', bytes, filename: filename));
    final streamed = await req.send();
    final res = await http.Response.fromStream(streamed);
    return ArtworkItem.fromJson(_decode(res) as Map<String, dynamic>);
  }

  Future<ArtworkItem> createComment(String artworkId, {required String text}) async {
    final data = _decode(await http.post(
      Uri.parse('$baseUrl/teacher/artworks/$artworkId/comments'),
      headers: _headers,
      body: jsonEncode({'text': text}),
    )) as Map<String, dynamic>;
    return ArtworkItem.fromJson(data);
  }

  /// 仅屏幕预览。切换模板只打本接口。禁止把 [PosterPreview.previewUrl] 当下载地址。
  Future<PosterPreview> previewPoster(String artworkId, String templateKey) async {
    final data = _decode(await http.post(
      Uri.parse('$baseUrl/parent/artworks/$artworkId/posters/preview'),
      headers: _headers,
      body: jsonEncode({'templateKey': templateKey}),
    )) as Map<String, dynamic>;
    return PosterPreview.fromJson(data);
  }

  /// 正式成片。主按钮下载必须用本接口。
  Future<PosterDownload> downloadPoster(String artworkId, String templateKey) async {
    final data = _decode(await http.post(
      Uri.parse('$baseUrl/parent/artworks/$artworkId/posters'),
      headers: _headers,
      body: jsonEncode({'templateKey': templateKey}),
    )) as Map<String, dynamic>;
    return PosterDownload.fromJson(data);
  }

  dynamic _decode(http.Response res) {
    final body = res.body.isEmpty ? <String, dynamic>{} : jsonDecode(res.body);
    if (res.statusCode >= 400) {
      final map = body is Map<String, dynamic> ? body : <String, dynamic>{};
      throw ApiException(
        res.statusCode,
        map['message'] as String? ?? res.body,
        code: map['code'] as String?,
      );
    }
    return body;
  }
}
