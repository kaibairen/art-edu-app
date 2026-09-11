import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

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
    this.showDebugApiHints = kDebugMode,
  });

  final String downloadUrl;
  final String previewUrl;
  final String templateKey;
  final String studentName;
  final bool showDebugApiHints;

  @override
  Widget build(BuildContext context) {
    final label = posterTemplates
        .firstWhere((t) => t.key == templateKey, orElse: () => PosterTemplate(templateKey, templateKey))
        .label;
    final same = downloadUrl == previewUrl;
    return Scaffold(
      appBar: AppBar(title: const Text('已保存')),
      body: ListView(
        padding: const EdgeInsets.all(ArtEduSpace.s16),
        children: [
          Text('$studentName · $label', style: ArtEduTypography.title),
          const SizedBox(height: ArtEduSpace.s8),
          if (same && showDebugApiHints)
            const Text(
              '硬约束失败：downloadUrl 不得等于 previewUrl',
              style: TextStyle(color: ArtEduColors.danger),
            )
          else if (same)
            const Text('生成失败，请返回重试', style: TextStyle(color: ArtEduColors.danger))
          else if (showDebugApiHints)
            Text(
              '本页只展示正式成片 downloadUrl，与预览 URL 不同。',
              style: ArtEduTypography.caption.copyWith(color: ArtEduColors.inkSecondary),
            ),
          const SizedBox(height: ArtEduSpace.s12),
          Image.network(downloadUrl),
          if (showDebugApiHints) ...[
            const SizedBox(height: ArtEduSpace.s12),
            Text('downloadUrl\n$downloadUrl', style: ArtEduTypography.caption),
            const SizedBox(height: ArtEduSpace.s8),
            Text(
              'previewUrl（对照，未用作下载）\n$previewUrl',
              style: ArtEduTypography.caption.copyWith(color: ArtEduColors.inkTertiary),
            ),
          ],
          const SizedBox(height: ArtEduSpace.s24),
          FilledButton(
            onPressed: () => _share(context),
            child: const Text('分享'),
          ),
          const SizedBox(height: ArtEduSpace.s8),
          OutlinedButton(
            onPressed: () => _again(context),
            child: const Text('再下一张'),
          ),
          TextButton(
            onPressed: () => _backToArtwork(context),
            child: const Text('返回作品'),
          ),
        ],
      ),
    );
  }

  Future<void> _share(BuildContext context) async {
    await Clipboard.setData(ClipboardData(text: downloadUrl));
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('已复制分享链接')),
    );
  }

  void _again(BuildContext context) {
    if (Navigator.of(context).canPop()) {
      Navigator.of(context).pop();
    }
  }

  void _backToArtwork(BuildContext context) {
    final nav = Navigator.of(context);
    if (nav.canPop()) nav.pop();
    if (nav.canPop()) nav.pop();
  }
}
