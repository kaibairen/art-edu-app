import 'package:flutter/material.dart';

import '../api_client.dart';
import '../app.dart';
import '../models.dart';
import 'timeline_screen.dart';
import 'upload_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({
    super.key,
    required this.role,
    required this.api,
    required this.session,
    required this.onLogout,
  });

  final AppRole role;
  final ApiClient api;
  final AuthSession session;
  final VoidCallback onLogout;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late Future<List<StudentItem>> future;

  @override
  void initState() {
    super.initState();
    future = widget.api.listStudents(widget.session.role);
  }

  @override
  Widget build(BuildContext context) {
    final isTeacher = widget.role == AppRole.teacher;
    return Scaffold(
      appBar: AppBar(
        title: Text(isTeacher ? '我负责的学员' : '我的孩子'),
        actions: [
          TextButton(onPressed: widget.onLogout, child: const Text('退出')),
        ],
      ),
      body: FutureBuilder(
        future: future,
        builder: (context, snap) {
          if (snap.hasError) {
            return Center(child: Text('加载失败：${snap.error}'));
          }
          if (!snap.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          final items = snap.data!;
          if (items.isEmpty) {
            return const Center(child: Text('暂无绑定学员'));
          }
          return ListView.builder(
            itemCount: items.length,
            itemBuilder: (context, i) {
              final s = items[i];
              return ListTile(
                title: Text(s.name),
                subtitle: Text(s.note ?? (isTeacher ? '点击查看作品时间线 / 上传' : '点击查看作品时间线')),
                trailing: isTeacher
                    ? IconButton(
                        icon: const Icon(Icons.upload),
                        onPressed: () {
                          Navigator.of(context).push(MaterialPageRoute(
                            builder: (_) => UploadScreen(
                              api: widget.api,
                              student: s,
                            ),
                          ));
                        },
                      )
                    : const Icon(Icons.chevron_right),
                onTap: () {
                  Navigator.of(context).push(MaterialPageRoute(
                    builder: (_) => TimelineScreen(
                      api: widget.api,
                      role: widget.session.role,
                      student: s,
                    ),
                  ));
                },
              );
            },
          );
        },
      ),
    );
  }
}
