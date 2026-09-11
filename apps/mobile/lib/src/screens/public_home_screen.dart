import 'package:flutter/material.dart';

import '../api_client.dart';
import '../models.dart';
import '../tokens.dart';

/// 访客公开首页。渲染序：轮播 → 课程 → 优秀作品。
/// 硬约束：公开卡无点评；课程无长文。
class PublicHomeScreen extends StatefulWidget {
  const PublicHomeScreen({super.key, required this.api});

  final ApiClient api;

  @override
  State<PublicHomeScreen> createState() => _PublicHomeScreenState();
}

class _PublicHomeScreenState extends State<PublicHomeScreen> {
  PublicHome? data;
  String? error;
  bool loading = true;

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    setState(() {
      loading = true;
      error = null;
    });
    try {
      final next = await widget.api.getPublicHome();
      if (!mounted) return;
      setState(() {
        data = next;
        loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        error = e is ApiException ? e.message : '加载公开首页失败';
        loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('机构首页')),
      body: ListView(
        padding: const EdgeInsets.all(ArtEduSpace.s16),
        children: [
          Text(
            data?.brand.orgName ?? '机构公开首页',
            style: ArtEduTypography.display,
          ),
          const SizedBox(height: ArtEduSpace.s8),
          Text(
            '未登录也可浏览。公开卡无点评；课程无长文。',
            style: ArtEduTypography.caption.copyWith(color: ArtEduColors.inkTertiary),
          ),
          const SizedBox(height: ArtEduSpace.s24),
          _section(
            title: '轮播',
            emptyText: '现在没有轮播。',
            itemCount: data?.banners.length ?? 0,
            builder: () => Column(
              children: [
                for (final item in data!.banners)
                  _card(
                    imageUrl: item.imageUrl,
                    title: item.title ?? '未填写标题',
                    subtitle: item.subtitle,
                  ),
              ],
            ),
          ),
          _section(
            title: '课程介绍',
            emptyText: '现在没有课程介绍。',
            itemCount: data?.courses.length ?? 0,
            builder: () => Column(
              children: [
                for (final item in data!.courses)
                  _card(
                    imageUrl: item.coverUrl,
                    title: item.title,
                    subtitle: item.summary,
                  ),
              ],
            ),
          ),
          _section(
            title: '优秀作品',
            emptyText: '现在没有公开作品。',
            itemCount: data?.featuredArtworks.length ?? 0,
            builder: () => Column(
              children: [
                for (final item in data!.featuredArtworks)
                  _card(
                    imageUrl: item.imageUrl,
                    title: item.title,
                    subtitle: item.studentDisplayName,
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _section({
    required String title,
    required String emptyText,
    required int itemCount,
    required Widget Function() builder,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: ArtEduSpace.s24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: ArtEduTypography.title),
          const SizedBox(height: ArtEduSpace.s12),
          if (loading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: ArtEduSpace.s16),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (error != null)
            _retryBox('这一区没打开。')
          else if (itemCount == 0)
            _retryBox(emptyText)
          else
            builder(),
        ],
      ),
    );
  }

  Widget _retryBox(String text) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(text, style: ArtEduTypography.body.copyWith(color: ArtEduColors.inkSecondary)),
        const SizedBox(height: ArtEduSpace.s8),
        TextButton(onPressed: load, child: const Text('重试')),
      ],
    );
  }

  Widget _card({
    required String? imageUrl,
    required String title,
    String? subtitle,
  }) {
    return Card(
      margin: const EdgeInsets.only(bottom: ArtEduSpace.s12),
      child: Padding(
        padding: const EdgeInsets.all(ArtEduSpace.s12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (imageUrl != null && imageUrl.isNotEmpty)
              ClipRRect(
                borderRadius: BorderRadius.circular(ArtEduRadius.tag),
                child: Image.network(
                  imageUrl,
                  height: 140,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => const SizedBox(height: 8),
                ),
              ),
            const SizedBox(height: ArtEduSpace.s8),
            Text(title, style: ArtEduTypography.bodyEmphasis),
            if (subtitle != null && subtitle.isNotEmpty)
              Text(subtitle, style: ArtEduTypography.caption.copyWith(color: ArtEduColors.inkSecondary)),
          ],
        ),
      ),
    );
  }
}
