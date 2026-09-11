import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../api_client.dart';
import '../models.dart';

class UploadScreen extends StatefulWidget {
  const UploadScreen({super.key, required this.api, required this.student});
  final ApiClient api;
  final StudentItem student;

  @override
  State<UploadScreen> createState() => _UploadScreenState();
}

class _UploadScreenState extends State<UploadScreen> {
  final theme = TextEditingController(text: '课堂写生');
  final createdOn = TextEditingController(
    text: DateTime.now().toIso8601String().substring(0, 10),
  );
  final comment = TextEditingController();
  XFile? file;
  String? error;
  bool loading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('上传 ${widget.student.name} 的作品')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          TextField(controller: theme, decoration: const InputDecoration(labelText: '主题')),
          TextField(controller: createdOn, decoration: const InputDecoration(labelText: '创作时间 YYYY-MM-DD')),
          TextField(controller: comment, decoration: const InputDecoration(labelText: '文字点评')),
          const SizedBox(height: 8),
          const Text('语音 / 视频点评：二期能力，当前为占位。'),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: () async {
              final picked = await ImagePicker().pickImage(source: ImageSource.gallery);
              setState(() => file = picked);
            },
            child: Text(file == null ? '选择图片' : '已选择 ${file!.name}'),
          ),
          const SizedBox(height: 16),
          FilledButton(onPressed: loading ? null : _submit, child: const Text('上传并点评')),
          if (error != null) Text(error!, style: const TextStyle(color: Colors.red)),
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
      await widget.api.uploadArtwork(
        studentId: widget.student.id,
        theme: theme.text,
        createdOn: createdOn.text,
        textComment: comment.text,
        bytes: bytes,
        filename: file!.name,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('已上传，家长端时间线可见')));
        Navigator.of(context).pop();
      }
    } catch (e) {
      setState(() => error = e.toString());
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }
}
