import 'package:flutter/material.dart';

import '../api_client.dart';
import '../app.dart';
import '../models.dart';
import '../tokens.dart';
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
        title: Text(isTeacher ? '教师端 · 我负责的学员' : '家长端 · 我的孩子'),
        actions: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: ArtEduSpace.s8),
            child: Center(
              child: Text(
                widget.session.displayName,
                style: ArtEduTypography.caption,
              ),
            ),
          ),
          TextButton(onPressed: widget.onLogout, child: const Text('退出')),
        ],
      ),
      body: FutureBuilder(
        future: future,
        builder: (context, snap) {
          if (snap.hasError) {
            final err = snap.error;
            final text = err is ApiException && err.cannotView ? '无法查看' : '加载失败：${snap.error}';
            return Center(child: Text(text));
          }
          if (!snap.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          final items = snap.data!;
          if (items.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(ArtEduSpace.s24),
                child: Text(
                  isTeacher ? '请联系管理员分配班级' : '还没有绑定的孩子，请联系机构管理员。',
                  textAlign: TextAlign.center,
                  style: ArtEduTypography.body.copyWith(color: ArtEduColors.inkSecondary),
                ),
              ),
            );
          }
          return ListView.builder(
            itemCount: items.length,
            itemBuilder: (context, i) {
              final s = items[i];
              return ListTile(
                title: Text(s.name, style: ArtEduTypography.bodyEmphasis),
                subtitle: Text(
                  [
                    if (s.className != null && s.className!.isNotEmpty) s.className,
                    s.note,
                    if (isTeacher) '点击查看时间线 / 上传',
                    if (!isTeacher) '点击查看作品时间线',
                  ].whereType<String>().where((e) => e.isNotEmpty).join(' · '),
                ),
                trailing: isTeacher
                    ? IconButton(
                        icon: const Icon(Icons.upload),
                        onPressed: () {
                          Navigator.of(context).push(MaterialPageRoute(
                            builder: (_) => UploadScreen(api: widget.api, student: s),
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
