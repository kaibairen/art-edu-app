import 'dart:convert';
import 'dart:typed_data';

import 'package:http/http.dart' as http;

import 'models.dart';

class ApiClient {
  ApiClient({required this.baseUrl});

  final String baseUrl;
  String? _token;

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      };

  Future<AuthSession> login(String account, String password) async {
    final res = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'account': account, 'password': password}),
    );
    final data = _decode(res);
    _token = data['accessToken'] as String;
    final user = data['user'] as Map<String, dynamic>;
    return AuthSession(
      token: _token!,
      name: user['name'] as String,
      role: user['role'] as String,
      phone: user['phone'] as String,
    );
  }

  Future<List<StudentItem>> listStudents(String role) async {
    final path = role == 'teacher' ? '/teacher/students' : '/parent/children';
    final res = await http.get(Uri.parse('$baseUrl$path'), headers: _headers);
    final data = _decode(res) as List<dynamic>;
    return data
        .map((e) => StudentItem(
              id: e['id'] as String,
              name: e['name'] as String,
              note: e['note'] as String?,
            ))
        .toList();
  }

  Future<List<ArtworkItem>> timeline(String role, String studentId) async {
    final path = role == 'teacher'
        ? '/teacher/students/$studentId/artworks'
        : '/parent/children/$studentId/timeline';
    final res = await http.get(Uri.parse('$baseUrl$path'), headers: _headers);
    final data = _decode(res);
    final items = (data['items'] as List<dynamic>? ?? data as List<dynamic>);
    return items
        .map((e) => ArtworkItem(
              id: e['id'] as String,
              imageUrl: e['imageUrl'] as String,
              theme: e['theme'] as String,
              createdOn: e['createdOn'] as String,
              textComment: e['textComment'] as String?,
            ))
        .toList();
  }

  Future<ArtworkItem> uploadArtwork({
    required String studentId,
    required String theme,
    required String createdOn,
    String? textComment,
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
    req.fields['theme'] = theme;
    req.fields['createdOn'] = createdOn;
    if (textComment != null) {
      req.fields['textComment'] = textComment;
    }
    req.files.add(http.MultipartFile.fromBytes('image', bytes, filename: filename));
    final streamed = await req.send();
    final res = await http.Response.fromStream(streamed);
    final data = _decode(res);
    return ArtworkItem(
      id: data['id'] as String,
      imageUrl: data['imageUrl'] as String,
      theme: data['theme'] as String,
      createdOn: data['createdOn'] as String,
      textComment: data['textComment'] as String?,
    );
  }

  Future<Map<String, dynamic>> generatePoster(String role, String artworkId, String templateKey) async {
    final path = role == 'teacher'
        ? '/teacher/artworks/$artworkId/posters'
        : '/parent/artworks/$artworkId/posters';
    final res = await http.post(
      Uri.parse('$baseUrl$path'),
      headers: _headers,
      body: jsonEncode({'templateKey': templateKey}),
    );
    return _decode(res);
  }

  dynamic _decode(http.Response res) {
    final body = res.body.isEmpty ? {} : jsonDecode(res.body);
    if (res.statusCode >= 400) {
      throw ApiException(res.statusCode, body is Map ? '${body['message']}' : res.body);
    }
    return body;
  }
}

class ApiException implements Exception {
  ApiException(this.status, this.message);
  final int status;
  final String message;
  @override
  String toString() => 'ApiException($status): $message';
}
