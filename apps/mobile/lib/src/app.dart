import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';

import 'api_client.dart';
import 'models.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'screens/poster_preview_screen.dart';
import 'screens/poster_result_screen.dart';
import 'screens/timeline_screen.dart';
import 'screens/upload_screen.dart';
import 'tokens.dart';

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
  String shot = '';
  PosterPreview? shotPreview;
  PosterDownload? shotDownload;
  bool bootstrapping = false;

  @override
  void initState() {
    super.initState();
    SemanticsBinding.instance.ensureSemantics();
    const base = String.fromEnvironment(
      'API_BASE_URL',
      defaultValue: 'http://127.0.0.1:3000/api/v1',
    );
    api = ApiClient(baseUrl: base);
    shot = Uri.base.queryParameters['shot'] ?? const String.fromEnvironment('SHOT');
    if (shot.isNotEmpty) {
      bootstrapping = true;
      _bootstrapShot();
    }
  }

  Future<void> _bootstrapShot() async {
    try {
      if (shot == 'upload') {
        session = await api.login('13800000001', 'Teacher123');
      } else {
        session = await api.login('13800000002', 'Parent123');
      }
      if (shot == 'preview' || shot == 'result') {
        shotPreview = await api.previewPoster('aw-demo', 'simple');
        shotDownload = await api.downloadPoster('aw-demo', 'simple');
      }
    } catch (_) {
      /* keep login shell if mock is down */
    }
    if (mounted) setState(() => bootstrapping = false);
  }

  @override
  Widget build(BuildContext context) {
    final isTeacher = widget.role == AppRole.teacher;
    final demoStudent = StudentItem(id: 's-ming', name: '小明', className: '创意水彩班');
    final demoArtwork = ArtworkItem(
      id: 'aw-demo',
      studentId: 's-ming',
      studentName: '小明',
      imageUrl: 'http://127.0.0.1:3000/files/artworks/aw-demo.png',
      thumbUrl: 'http://127.0.0.1:3000/files/artworks/aw-demo.png',
      createdAt: '2026-09-11T08:00:00.000Z',
      title: '春天的树',
      commentText: '构图很稳，颜色再大胆一些。',
      courseTheme: '课堂写生',
    );

    Widget home;
    if (bootstrapping) {
      home = const Scaffold(body: Center(child: CircularProgressIndicator()));
    } else if (shot == 'upload' && session != null) {
      home = UploadScreen(api: api, student: demoStudent);
    } else if (shot == 'timeline' && session != null) {
      home = TimelineScreen(api: api, role: 'parent', student: demoStudent);
    } else if (shot == 'preview' && session != null) {
      home = PosterPreviewScreen(api: api, artwork: demoArtwork, studentName: '小明');
    } else if (shot == 'result' && shotDownload != null && shotPreview != null) {
      home = PosterResultScreen(
        downloadUrl: shotDownload!.downloadUrl,
        previewUrl: shotPreview!.previewUrl,
        templateKey: shotDownload!.templateKey,
        studentName: '小明',
      );
    } else if (session == null) {
      home = LoginScreen(
        role: widget.role,
        api: api,
        onLoggedIn: (s) => setState(() => session = s),
      );
    } else {
      home = HomeScreen(
        role: widget.role,
        api: api,
        session: session!,
        onLogout: () => setState(() => session = null),
      );
    }

    return MaterialApp(
      title: isTeacher ? '美术教培 · 教师端' : '美术教培 · 家长端',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: ArtEduColors.brand).copyWith(
          primary: ArtEduColors.brand,
          onPrimary: ArtEduColors.bg,
          primaryContainer: ArtEduColors.brandPressed,
        ),
        scaffoldBackgroundColor: ArtEduColors.bgSubtle,
        useMaterial3: true,
      ),
      home: home,
    );
  }
}
