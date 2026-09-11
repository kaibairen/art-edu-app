import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import '../api_client.dart';
import '../models.dart';
import '../tokens.dart';
import 'poster_preview_screen.dart';

class ArtworkScreen extends StatefulWidget {
  const ArtworkScreen({
    super.key,
    required this.api,
    required this.role,
    required this.artwork,
    required this.studentName,
  });

  final ApiClient api;
  final String role;
  final ArtworkItem artwork;
  final String studentName;

  @override
  State<ArtworkScreen> createState() => _ArtworkScreenState();
}

class _ArtworkScreenState extends State<ArtworkScreen> {
  late ArtworkItem artwork;
  final comment = TextEditingController();
  String? error;
  bool saving = false;

  @override
  void initState() {
    super.initState();
    artwork = widget.artwork;
    comment.text = artwork.commentText ?? '';
  }

  @override
  Widget build(BuildContext context) {
    final isTeacher = widget.role == 'teacher';
    final isParent = widget.role == 'parent';
    return Scaffold(
      appBar: AppBar(title: Text(artwork.headline)),
      body: ListView(
        padding: const EdgeInsets.all(ArtEduSpace.s16),
        children: [
          if (artwork.imageUrl.isNotEmpty) Image.network(artwork.imageUrl),
          const SizedBox(height: ArtEduSpace.s12),
          Text('学员：${widget.studentName}', style: ArtEduTypography.body),
          Text('创作时间：${artwork.createdAt}', style: ArtEduTypography.caption),
          if (artwork.courseTheme != null && artwork.courseTheme!.isNotEmpty)
            Text('课程主题：${artwork.courseTheme}', style: ArtEduTypography.caption),
          const SizedBox(height: ArtEduSpace.s12),
          Text('文字点评', style: ArtEduTypography.title),
          if (isTeacher) ...[
            TextField(
              controller: comment,
              maxLines: 3,
              decoration: const InputDecoration(hintText: '写下点评'),
            ),
            const SizedBox(height: ArtEduSpace.s8),
            FilledButton.tonal(
              onPressed: saving ? null : _saveComment,
              child: const Text('保存点评'),
            ),
          ] else
            Text(artwork.commentText ?? '暂无文字点评', style: ArtEduTypography.body),
          if (error != null)
            Text(error!, style: const TextStyle(color: ArtEduColors.danger)),
          if (isParent) ...[
            const SizedBox(height: ArtEduSpace.s24),
            FilledButton(
              onPressed: () {
                Navigator.of(context).push(MaterialPageRoute(
                  builder: (_) => PosterPreviewScreen(
                    api: widget.api,
                    artwork: artwork,
                    studentName: widget.studentName,
                  ),
                ));
              },
              child: const Text('制作海报（预览）'),
            ),
            if (kDebugMode) ...[
              const SizedBox(height: ArtEduSpace.s8),
              Text(
                '预览、下载、结果页三分离。本页不直接下载成片。',
                style: ArtEduTypography.caption.copyWith(color: ArtEduColors.inkTertiary),
              ),
            ],
          ],
        ],
      ),
    );
  }

  Future<void> _saveComment() async {
    setState(() {
      saving = true;
      error = null;
    });
    try {
      final updated = await widget.api.createComment(artwork.id, text: comment.text.trim());
      setState(() => artwork = updated);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('点评已保存')));
      }
    } catch (e) {
      setState(() => error = e is ApiException && e.cannotView ? '无法查看' : e.toString());
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }
}
