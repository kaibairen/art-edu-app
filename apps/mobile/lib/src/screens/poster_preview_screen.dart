import 'package:flutter/material.dart';

import '../api_client.dart';
import '../models.dart';
import '../tokens.dart';
import 'poster_result_screen.dart';

/// 家长海报预览页：只打 preview 接口，切换模板只刷新 previewUrl。
class PosterPreviewScreen extends StatefulWidget {
  const PosterPreviewScreen({
    super.key,
    required this.api,
    required this.artwork,
    required this.studentName,
  });

  final ApiClient api;
  final ArtworkItem artwork;
  final String studentName;

  @override
  State<PosterPreviewScreen> createState() => _PosterPreviewScreenState();
}

class _PosterPreviewScreenState extends State<PosterPreviewScreen> {
  String templateKey = 'simple';
  String? previewUrl;
  String? error;
  bool loading = false;
  bool downloading = false;

  @override
  void initState() {
    super.initState();
    _preview();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('海报预览')),
      body: ListView(
        padding: const EdgeInsets.all(ArtEduSpace.s16),
        children: [
          Text('选择模板（切换只请求预览接口）', style: ArtEduTypography.title),
          const SizedBox(height: ArtEduSpace.s8),
          Wrap(
            spacing: ArtEduSpace.s8,
            children: [
              for (final t in posterTemplates)
                ChoiceChip(
                  label: Text(t.label),
                  selected: templateKey == t.key,
                  onSelected: loading
                      ? null
                      : (_) {
                          setState(() => templateKey = t.key);
                          _preview();
                        },
                ),
            ],
          ),
          const SizedBox(height: ArtEduSpace.s16),
          if (loading && previewUrl == null) const Center(child: CircularProgressIndicator()),
          if (previewUrl != null) ...[
            Image.network(previewUrl!),
            const SizedBox(height: ArtEduSpace.s8),
            Text(
              'previewUrl（仅屏幕预览，不可当下载）\n$previewUrl',
              style: ArtEduTypography.caption.copyWith(color: ArtEduColors.inkTertiary),
            ),
          ],
          if (error != null)
            Padding(
              padding: const EdgeInsets.only(top: ArtEduSpace.s8),
              child: Text(error!, style: const TextStyle(color: ArtEduColors.danger)),
            ),
          const SizedBox(height: ArtEduSpace.s16),
          FilledButton(
            onPressed: previewUrl == null || downloading ? null : _download,
            child: Text(downloading ? '生成成片中…' : '生成正式成片并进入结果页'),
          ),
          const SizedBox(height: ArtEduSpace.s8),
          Text(
            '主按钮不会使用 previewUrl。下载走 POST …/posters，结果页展示 downloadUrl。',
            style: ArtEduTypography.caption.copyWith(color: ArtEduColors.inkTertiary),
          ),
        ],
      ),
    );
  }

  Future<void> _preview() async {
    setState(() {
      loading = true;
      error = null;
    });
    try {
      final data = await widget.api.previewPoster(widget.artwork.id, templateKey);
      setState(() => previewUrl = data.previewUrl);
    } catch (e) {
      setState(() => error = _msg(e));
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> _download() async {
    setState(() {
      downloading = true;
      error = null;
    });
    try {
      final data = await widget.api.downloadPoster(widget.artwork.id, templateKey);
      if (previewUrl != null && data.downloadUrl == previewUrl) {
        throw ApiException(500, 'previewUrl 与 downloadUrl 相同，违反硬约束');
      }
      if (!mounted) return;
      await Navigator.of(context).push(MaterialPageRoute(
        builder: (_) => PosterResultScreen(
          downloadUrl: data.downloadUrl,
          previewUrl: previewUrl!,
          templateKey: data.templateKey,
          studentName: widget.studentName,
        ),
      ));
    } catch (e) {
      setState(() => error = _msg(e));
    } finally {
      if (mounted) setState(() => downloading = false);
    }
  }

  String _msg(Object e) {
    if (e is ApiException) {
      if (e.code == 'LOGO_NOT_CONFIGURED') return e.message;
      if (e.cannotView) return '无法查看';
      return e.message;
    }
    return e.toString();
  }
}
