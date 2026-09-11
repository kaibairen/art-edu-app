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
  final courseTheme = TextEditingController();
  final comment = TextEditingController();
  DateTime createdAt = DateTime.now();
  XFile? file;
  String? error;
  bool loading = false;

  @override
  void dispose() {
    title.dispose();
    courseTheme.dispose();
    comment.dispose();
    super.dispose();
  }

  String get createdAtLabel {
    String two(int n) => n.toString().padLeft(2, '0');
    final d = createdAt;
    return '${d.year}-${two(d.month)}-${two(d.day)} ${two(d.hour)}:${two(d.minute)}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('上传 ${widget.student.name} 的作品')),
      body: ListView(
        padding: const EdgeInsets.all(ArtEduSpace.s24),
        children: [
          TextField(controller: title, decoration: const InputDecoration(labelText: '标题')),
          const SizedBox(height: ArtEduSpace.s8),
          InkWell(
            onTap: _pickCreatedAt,
            child: InputDecorator(
              decoration: const InputDecoration(
                labelText: '创作时间',
                suffixIcon: Icon(Icons.event),
              ),
              child: Text(createdAtLabel, style: ArtEduTypography.body),
            ),
          ),
          TextField(controller: courseTheme, decoration: const InputDecoration(labelText: '课程主题（可选）')),
          TextField(controller: comment, decoration: const InputDecoration(labelText: '文字点评（可选）')),
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

  Future<void> _pickCreatedAt() async {
    final date = await showDatePicker(
      context: context,
      initialDate: createdAt,
      firstDate: DateTime(2018),
      lastDate: DateTime.now().add(const Duration(days: 1)),
    );
    if (date == null || !mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(createdAt),
    );
    if (!mounted) return;
    setState(() {
      createdAt = DateTime(
        date.year,
        date.month,
        date.day,
        time?.hour ?? createdAt.hour,
        time?.minute ?? createdAt.minute,
      );
    });
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
        createdAt: createdAt.toUtc().toIso8601String(),
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
