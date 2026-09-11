import 'dart:convert';
import 'dart:typed_data';

import 'package:http/http.dart' as http;

import 'models.dart';

/// Prism Mock `/api/v1` client 桩（字段仍偏 OpenAPI 旧名）。
/// 业务页已改走 `lib/src/api_client.dart` 对接真后端。
class P0ApiClient {
  P0ApiClient({
    this.baseUrl = 'http://127.0.0.1:4010/api/v1',
    this.getAccessToken,
  });

  String baseUrl;
  String? Function()? getAccessToken;
  String? _token;

  void setAccessToken(String? token) {
    _token = token;
  }

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_effectiveToken != null) 'Authorization': 'Bearer $_effectiveToken',
      };

  String? get _effectiveToken => getAccessToken?.call() ?? _token;

  Future<LoginResponse> login(String account, String password) async {
    final data = await _send(
      'POST',
      '/auth/login',
      body: {'account': account, 'password': password},
      auth: false,
    );
    final session = LoginResponse.fromJson(data as Map<String, dynamic>);
    setAccessToken(session.accessToken);
    return session;
  }

  Future<void> logout({String? refreshToken}) async {
    await _send('POST', '/auth/logout', body: {
      if (refreshToken != null) 'refreshToken': refreshToken,
    });
    setAccessToken(null);
  }

  Future<AuthUser> me() async {
    final data = await _send('GET', '/auth/me');
    return AuthUser.fromJson(data as Map<String, dynamic>);
  }

  Future<LoginResponse> refresh(String refreshToken) async {
    final data = await _send(
      'POST',
      '/auth/refresh',
      body: {'refreshToken': refreshToken},
      auth: false,
    );
    final tokens = data as Map<String, dynamic>;
    setAccessToken(tokens['accessToken'] as String);
    return LoginResponse(
      accessToken: tokens['accessToken'] as String,
      refreshToken: tokens['refreshToken'] as String,
      user: AuthUser(
        id: '',
        phone: '',
        name: '',
        role: '',
        disabled: false,
      ),
    );
  }

  Future<Brand> getPublicBrand() async {
    final data = await _send('GET', '/brand', auth: false);
    return Brand.fromJson(data as Map<String, dynamic>);
  }

  Future<List<Student>> listParentChildren() async {
    final data = await _send('GET', '/parent/children');
    return (data as List<dynamic>)
        .map((e) => Student.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<ArtworkCursorPage> listParentArtworks(
    String studentId, {
    String? cursor,
    int? limit,
  }) async {
    final q = <String, String>{
      if (cursor != null) 'cursor': cursor,
      if (limit != null) 'limit': '$limit',
    };
    final data = await _send(
      'GET',
      '/parent/children/$studentId/artworks',
      query: q,
    );
    return ArtworkCursorPage.fromJson(data as Map<String, dynamic>);
  }

  Future<Artwork> getParentArtwork(String artworkId) async {
    final data = await _send('GET', '/parent/artworks/$artworkId');
    return Artwork.fromJson(data as Map<String, dynamic>);
  }

  /// POST /parent/artworks/{id}/posters/preview → { previewUrl, templateKey }
  Future<PosterPreview> previewPoster(
    String artworkId,
    String templateKey, {
    String role = 'parent',
  }) async {
    final prefix = role == 'teacher' ? 'teacher' : 'parent';
    final data = await _send(
      'POST',
      '/$prefix/artworks/$artworkId/posters/preview',
      body: {'templateKey': templateKey},
    );
    return PosterPreview.fromJson(data as Map<String, dynamic>);
  }

  /// POST /parent/artworks/{id}/posters → { downloadUrl, templateKey }
  Future<PosterDownload> downloadPoster(
    String artworkId,
    String templateKey, {
    String role = 'parent',
  }) async {
    final prefix = role == 'teacher' ? 'teacher' : 'parent';
    final data = await _send(
      'POST',
      '/$prefix/artworks/$artworkId/posters',
      body: {'templateKey': templateKey},
    );
    return PosterDownload.fromJson(data as Map<String, dynamic>);
  }

  Future<List<Student>> listTeacherStudents() async {
    final data = await _send('GET', '/teacher/students');
    return (data as List<dynamic>)
        .map((e) => Student.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Artwork> uploadArtwork({
    required String studentId,
    required String theme,
    required String createdOn,
    required Uint8List bytes,
    required String filename,
  }) async {
    final req = http.MultipartRequest(
      'POST',
      Uri.parse('$baseUrl/teacher/students/$studentId/artworks'),
    );
    if (_effectiveToken != null) {
      req.headers['Authorization'] = 'Bearer $_effectiveToken';
    }
    req.fields['theme'] = theme;
    req.fields['createdOn'] = createdOn;
    req.files.add(http.MultipartFile.fromBytes('image', bytes, filename: filename));
    final streamed = await req.send();
    final res = await http.Response.fromStream(streamed);
    return Artwork.fromJson(_decode(res) as Map<String, dynamic>);
  }

  Future<Artwork> createComment(String artworkId, {required String text}) async {
    final data = await _send(
      'POST',
      '/teacher/artworks/$artworkId/comments',
      body: {'text': text},
    );
    return Artwork.fromJson(data as Map<String, dynamic>);
  }

  Future<dynamic> _send(
    String method,
    String path, {
    Map<String, dynamic>? body,
    Map<String, String>? query,
    bool auth = true,
  }) async {
    final uri = Uri.parse('$baseUrl$path').replace(
      queryParameters: query?.isEmpty ?? true ? null : query,
    );
    final headers = auth
        ? _headers
        : {'Content-Type': 'application/json'};
    late http.Response res;
    switch (method) {
      case 'GET':
        res = await http.get(uri, headers: headers);
        break;
      case 'POST':
        res = await http.post(
          uri,
          headers: headers,
          body: body == null ? null : jsonEncode(body),
        );
        break;
      default:
        throw UnsupportedError(method);
    }
    return _decode(res);
  }

  dynamic _decode(http.Response res) {
    final body = res.body.isEmpty ? <String, dynamic>{} : jsonDecode(res.body);
    if (res.statusCode >= 400) {
      throw P0ApiException(
        res.statusCode,
        body is Map<String, dynamic>
            ? ApiErrorBody.fromJson(body)
            : ApiErrorBody(code: 'VALIDATION_ERROR', message: res.body),
      );
    }
    return body;
  }
}
