import 'package:flutter/material.dart';

import '../api_client.dart';
import '../app.dart';
import '../models.dart';

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
  late final TextEditingController account;
  late final TextEditingController password;
  String? error;
  bool loading = false;

  @override
  void initState() {
    super.initState();
    final isTeacher = widget.role == AppRole.teacher;
    account = TextEditingController(text: isTeacher ? '13800000001' : '13800000002');
    password = TextEditingController(text: isTeacher ? 'Teacher123' : 'Parent123');
  }

  @override
  Widget build(BuildContext context) {
    final isTeacher = widget.role == AppRole.teacher;
    return Scaffold(
      appBar: AppBar(title: Text(isTeacher ? '教师端登录' : '家长端登录')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextField(controller: account, decoration: const InputDecoration(labelText: '手机号 / 邮箱')),
            const SizedBox(height: 12),
            TextField(
              controller: password,
              obscureText: true,
              decoration: const InputDecoration(labelText: '密码'),
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: loading ? null : _submit,
              child: Text(loading ? '登录中…' : '登录'),
            ),
            if (error != null) ...[
              const SizedBox(height: 12),
              Text(error!, style: const TextStyle(color: Colors.red)),
            ],
            const SizedBox(height: 16),
            Text(
              isTeacher
                  ? '家长端无法登录本入口。演示账号 13800000001 / Teacher123'
                  : '仅能查看已绑定孩子。演示账号 13800000002 / Parent123',
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
      final session = await widget.api.login(account.text, password.text);
      final expected = widget.role == AppRole.teacher ? 'teacher' : 'parent';
      if (session.role != expected) {
        throw ApiException(403, '请使用${expected == 'teacher' ? '教师' : '家长'}账号登录');
      }
      widget.onLoggedIn(session);
    } catch (e) {
      setState(() => error = e.toString());
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }
}
