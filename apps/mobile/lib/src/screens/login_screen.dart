import 'package:flutter/material.dart';

import '../api_client.dart';
import '../app.dart';
import '../models.dart';
import '../tokens.dart';
import 'public_home_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({
    super.key,
    required this.role,
    required this.api,
    required this.onLoggedIn,
  });

  final AppRole role;
  final ApiClient api;
  final ValueChanged<AuthSession> onLoggedIn;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  late final TextEditingController phone;
  late final TextEditingController password;
  String? error;
  bool loading = false;

  @override
  void initState() {
    super.initState();
    final isTeacher = widget.role == AppRole.teacher;
    phone = TextEditingController(text: isTeacher ? '13800000001' : '13800000002');
    password = TextEditingController(text: isTeacher ? 'Teacher123' : 'Parent123');
  }

  @override
  Widget build(BuildContext context) {
    final isTeacher = widget.role == AppRole.teacher;
    return Scaffold(
      appBar: AppBar(
        title: Text(isTeacher ? '教师端登录' : '家长端登录'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(ArtEduSpace.s24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('美术教培', style: ArtEduTypography.display.copyWith(color: ArtEduColors.ink)),
            const SizedBox(height: ArtEduSpace.s8),
            Text(
              isTeacher ? '教师端 · 按班级查看负责学员' : '家长端 · 仅能查看已绑定的孩子',
              style: ArtEduTypography.caption.copyWith(color: ArtEduColors.inkTertiary),
            ),
            const SizedBox(height: ArtEduSpace.s24),
            TextField(
              controller: phone,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(labelText: '手机号'),
            ),
            const SizedBox(height: ArtEduSpace.s12),
            TextField(
              controller: password,
              obscureText: true,
              decoration: const InputDecoration(labelText: '密码'),
            ),
            const SizedBox(height: ArtEduSpace.s16),
            FilledButton(
              onPressed: loading ? null : _submit,
              child: Text(loading ? '登录中…' : '登录'),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(context).push(MaterialPageRoute(
                  builder: (_) => PublicHomeScreen(api: widget.api),
                ));
              },
              child: const Text('先看看公开首页'),
            ),
            if (error != null) ...[
              const SizedBox(height: ArtEduSpace.s12),
              Text(error!, style: const TextStyle(color: ArtEduColors.danger)),
            ],
            const SizedBox(height: ArtEduSpace.s16),
            Text(
              isTeacher
                  ? '演示账号 13800000001 / Teacher123。未分配班级时将提示联系管理员。'
                  : '演示账号 13800000002 / Parent123（小明）。家长 B：13800000003。',
              style: ArtEduTypography.caption.copyWith(color: ArtEduColors.inkTertiary),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submit() async {
    setState(() {
      loading = true;
      error = null;
    });
    try {
      final session = await widget.api.login(phone.text.trim(), password.text);
      final expected = widget.role == AppRole.teacher ? 'teacher' : 'parent';
      if (session.role != expected) {
        throw ApiException(403, '请使用${expected == 'teacher' ? '教师' : '家长'}账号登录本入口');
      }
      widget.onLoggedIn(session);
    } catch (e) {
      setState(() => error = e is ApiException ? e.message : e.toString());
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }
}
