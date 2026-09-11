import 'package:flutter/material.dart';

import 'api_client.dart';
import 'models.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';

enum AppRole { parent, teacher }

class ArtEduApp extends StatefulWidget {
  const ArtEduApp({super.key, required this.role});
  final AppRole role;

  @override
  State<ArtEduApp> createState() => _ArtEduAppState();
}

class _ArtEduAppState extends State<ArtEduApp> {
  late final ApiClient api;
  AuthSession? session;

  @override
  void initState() {
    super.initState();
    const base = String.fromEnvironment(
      'API_BASE_URL',
      defaultValue: 'http://127.0.0.1:3000/api',
    );
    api = ApiClient(baseUrl: base);
  }

  @override
  Widget build(BuildContext context) {
    final isTeacher = widget.role == AppRole.teacher;
    return MaterialApp(
      title: isTeacher ? '美术教培 · 教师端' : '美术教培 · 家长端',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: isTeacher ? const Color(0xFFC05621) : const Color(0xFF1D4E89),
        ),
        useMaterial3: true,
      ),
      home: session == null
          ? LoginScreen(
              role: widget.role,
              api: api,
              onLoggedIn: (s) => setState(() => session = s),
            )
          : HomeScreen(
              role: widget.role,
              api: api,
              session: session!,
              onLogout: () => setState(() => session = null),
            ),
    );
  }
}
