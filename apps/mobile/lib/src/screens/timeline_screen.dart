import 'package:flutter/material.dart';

import '../api_client.dart';
import '../models.dart';
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
            return Center(child: Text('无法加载：${snap.error}'));
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
              return ListTile(
                leading: a.imageUrl.isEmpty
                    ? const Icon(Icons.image)
                    : Image.network(a.imageUrl, width: 56, height: 56, fit: BoxFit.cover),
                title: Text(a.theme),
                subtitle: Text('${a.createdOn}\n${a.textComment ?? '暂无文字点评'}'),
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
}
