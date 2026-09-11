import 'package:flutter/material.dart';

import '../api_client.dart';
import '../models.dart';
import '../tokens.dart';
import 'artwork_screen.dart';

class TimelineScreen extends StatefulWidget {
  const TimelineScreen({
    super.key,
    required this.api,
    required this.role,
    required this.student,
  });

  final ApiClient api;
  final String role;
  final StudentItem student;

  @override
  State<TimelineScreen> createState() => _TimelineScreenState();
}

class _TimelineScreenState extends State<TimelineScreen> {
  late Future<List<ArtworkItem>> future;

  @override
  void initState() {
    super.initState();
    future = widget.api.timeline(widget.role, widget.student.id);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('${widget.student.name} 的作品时间线')),
      body: FutureBuilder(
        future: future,
        builder: (context, snap) {
          if (snap.hasError) {
            final err = snap.error;
            final text = err is ApiException && err.cannotView ? '无法查看' : '无法加载：${snap.error}';
            return Center(child: Text(text));
          }
          if (!snap.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          final items = snap.data!;
          if (items.isEmpty) {
            return const Center(child: Text('还没有作品'));
          }
          return ListView.separated(
            itemCount: items.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (context, i) {
              final a = items[i];
              final thumb = a.thumbUrl.isNotEmpty ? a.thumbUrl : a.imageUrl;
              return ListTile(
                leading: thumb.isEmpty
                    ? const Icon(Icons.image)
                    : Image.network(thumb, width: 56, height: 56, fit: BoxFit.cover),
                title: Text(a.headline),
                subtitle: Text(
                  '${_fmt(a.createdAt)}\n${a.commentText ?? '暂无文字点评'}',
                  style: ArtEduTypography.caption,
                ),
                isThreeLine: true,
                onTap: () {
                  Navigator.of(context).push(MaterialPageRoute(
                    builder: (_) => ArtworkScreen(
                      api: widget.api,
                      role: widget.role,
                      artwork: a,
                      studentName: widget.student.name,
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

  String _fmt(String iso) {
    if (iso.length >= 10) return iso.substring(0, 10);
    return iso;
  }
}
