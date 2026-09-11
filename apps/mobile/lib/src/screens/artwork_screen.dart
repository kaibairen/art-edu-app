import 'package:flutter/material.dart';

import '../api_client.dart';
import '../models.dart';

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
  String? posterUrl;
  String? error;
  bool loading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.artwork.theme)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (widget.artwork.imageUrl.isNotEmpty)
            Image.network(widget.artwork.imageUrl),
          const SizedBox(height: 12),
          Text('学员：${widget.studentName}'),
          Text('创作时间：${widget.artwork.createdOn}'),
          Text('点评：${widget.artwork.textComment ?? '暂无'}'),
          const SizedBox(height: 16),
          const Text('生成分享海报（服务端合成，强制 LOGO + 水印）'),
          Wrap(
            spacing: 8,
            children: [
              for (final key in ['classic', 'gallery', 'festival'])
                FilledButton.tonal(
                  onPressed: loading ? null : () => _poster(key),
                  child: Text(key),
                ),
            ],
          ),
          if (error != null) Text(error!, style: const TextStyle(color: Colors.red)),
          if (posterUrl != null) ...[
            const SizedBox(height: 12),
            Image.network(posterUrl!),
          ],
        ],
      ),
    );
  }

  Future<void> _poster(String key) async {
    setState(() {
      loading = true;
      error = null;
    });
    try {
      final data = await widget.api.generatePoster(widget.role, widget.artwork.id, key);
      setState(() => posterUrl = data['imageUrl'] as String?);
    } catch (e) {
      setState(() => error = e.toString());
    } finally {
      setState(() => loading = false);
    }
  }
}
