import 'package:flutter/material.dart';

import '../models.dart';
import '../tokens.dart';

/// 家长海报结果页：只展示正式 downloadUrl，与预览页、下载动作分离。
class PosterResultScreen extends StatelessWidget {
  const PosterResultScreen({
    super.key,
    required this.downloadUrl,
    required this.previewUrl,
    required this.templateKey,
    required this.studentName,
  });

  final String downloadUrl;
  final String previewUrl;
  final String templateKey;
  final String studentName;

  @override
  Widget build(BuildContext context) {
    final label = posterTemplates
        .firstWhere((t) => t.key == templateKey, orElse: () => PosterTemplate(templateKey, templateKey))
        .label;
    final same = downloadUrl == previewUrl;
    return Scaffold(
      appBar: AppBar(title: const Text('海报结果')),
      body: ListView(
        padding: const EdgeInsets.all(ArtEduSpace.s16),
        children: [
          Text('$studentName · $label', style: ArtEduTypography.title),
          const SizedBox(height: ArtEduSpace.s8),
          if (same)
            const Text(
              '硬约束失败：downloadUrl 不得等于 previewUrl',
              style: TextStyle(color: ArtEduColors.danger),
            )
          else
            Text(
              '本页只展示正式成片 downloadUrl，与预览 URL 不同。',
              style: ArtEduTypography.caption.copyWith(color: ArtEduColors.inkSecondary),
            ),
          const SizedBox(height: ArtEduSpace.s12),
          Image.network(downloadUrl),
          const SizedBox(height: ArtEduSpace.s12),
          Text('downloadUrl\n$downloadUrl', style: ArtEduTypography.caption),
          const SizedBox(height: ArtEduSpace.s8),
          Text(
            'previewUrl（对照，未用作下载）\n$previewUrl',
            style: ArtEduTypography.caption.copyWith(color: ArtEduColors.inkTertiary),
          ),
        ],
      ),
    );
  }
}
