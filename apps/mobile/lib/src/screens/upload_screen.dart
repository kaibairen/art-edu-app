import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../api_client.dart';
import '../models.dart';
import '../tokens.dart';

class UploadScreen extends StatefulWidget {
  const UploadScreen({super.key, required this.api, required this.student});
  final ApiClient api;
  final StudentItem student;

  @override
  State<UploadScreen> createState() => _UploadScreenState();
}

class _UploadScreenState extends State<UploadScreen> {
  final title = TextEditingController(text: '课堂写生');
  final createdAt = TextEditingController(text: DateTime.now().toIso8601String());
  final courseTheme = TextEditingController();
  final comment = TextEditingController();
  XFile? file;
  String? error;
  bool loading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('上传 ${widget.student.name} 的作品')),
      body: ListView(
        padding: const EdgeInsets.all(ArtEduSpace.s24),
        children: [
          TextField(controller: title, decoration: const InputDecoration(labelText: '标题')),
          TextField(
            controller: createdAt,
            decoration: const InputDecoration(labelText: '创作时间（ISO，如 2026-09-11T10:00:00.000Z）'),
          ),
          TextField(controller: courseTheme, decoration: const InputDecoration(labelText: '课程主题（可选）')),
          TextField(controller: comment, decoration: const InputDecoration(labelText: '文字点评（可选，单独接口）')),
          const SizedBox(height: ArtEduSpace.s8),
          Text(
            '语音 / 视频点评：非本期。',
            style: ArtEduTypography.caption.copyWith(color: ArtEduColors.inkTertiary),
          ),
          const SizedBox(height: ArtEduSpace.s12),
          OutlinedButton(
            onPressed: () async {
              final picked = await ImagePicker().pickImage(source: ImageSource.gallery);
              setState(() => file = picked);
            },
            child: Text(file == null ? '选择图片' : '已选择 ${file!.name}'),
          ),
          const SizedBox(height: ArtEduSpace.s16),
          FilledButton(onPressed: loading ? null : _submit, child: const Text('上传并点评')),
          if (error != null)
            Padding(
              padding: const EdgeInsets.only(top: ArtEduSpace.s8),
              child: Text(error!, style: const TextStyle(color: ArtEduColors.danger)),
            ),
        ],
      ),
    );
  }

  Future<void> _submit() async {
    if (file == null) {
      setState(() => error = '请先选择图片');
      return;
    }
    setState(() {
      loading = true;
      error = null;
    });
    try {
      final bytes = await file!.readAsBytes();
      final artwork = await widget.api.uploadArtwork(
        studentId: widget.student.id,
        title: title.text.trim(),
        createdAt: createdAt.text.trim(),
        courseTheme: courseTheme.text.trim(),
        bytes: bytes,
        filename: file!.name,
      );
      if (comment.text.trim().isNotEmpty) {
        await widget.api.createComment(artwork.id, text: comment.text.trim());
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('已上传，家长端时间线可见')),
        );
        Navigator.of(context).pop();
      }
    } catch (e) {
      setState(() => error = e is ApiException && e.cannotView ? '无法查看' : e.toString());
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }
}
