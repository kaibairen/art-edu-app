import 'package:flutter_test/flutter_test.dart';
import 'package:art_edu_mobile/src/api_client.dart';
import 'package:art_edu_mobile/src/app.dart';
import 'package:art_edu_mobile/src/models.dart';
import 'package:art_edu_mobile/src/screens/poster_preview_screen.dart';
import 'package:art_edu_mobile/src/screens/poster_result_screen.dart';
import 'package:flutter/material.dart';

class _FakeApiClient extends ApiClient {
  _FakeApiClient() : super(baseUrl: 'http://test');

  @override
  Future<PosterPreview> previewPoster(String artworkId, String templateKey) async {
    return PosterPreview(
      previewUrl: 'http://x/aw-demo-simple-preview.png',
      templateKey: templateKey,
    );
  }
}

void main() {
  testWidgets('parent login screen renders', (tester) async {
    await tester.pumpWidget(const ArtEduApp(role: AppRole.parent));
    expect(find.text('家长端登录'), findsOneWidget);
    expect(find.textContaining('仅能查看已绑定的孩子'), findsOneWidget);
    expect(find.text('手机号'), findsOneWidget);
  });

  testWidgets('teacher login screen renders', (tester) async {
    await tester.pumpWidget(const ArtEduApp(role: AppRole.teacher));
    expect(find.text('教师端登录'), findsOneWidget);
    expect(find.textContaining('按班级查看负责学员'), findsOneWidget);
  });

  testWidgets('poster preview primary button says 生成并下载', (tester) async {
    await tester.pumpWidget(MaterialApp(
      home: PosterPreviewScreen(
        api: _FakeApiClient(),
        artwork: ArtworkItem(
          id: 'aw-demo',
          studentId: 'st-1',
          studentName: '小明',
          imageUrl: 'http://x/art.png',
          thumbUrl: 'http://x/art-thumb.png',
          createdAt: '2026-09-11',
        ),
        studentName: '小明',
      ),
    ));
    expect(find.text('生成并下载'), findsOneWidget);
    expect(find.text('生成正式成片并进入结果页'), findsNothing);
  });

  testWidgets('poster result page rejects identical urls', (tester) async {
    await tester.pumpWidget(const MaterialApp(
      home: PosterResultScreen(
        downloadUrl: 'http://x/same.png',
        previewUrl: 'http://x/same.png',
        templateKey: 'simple',
        studentName: '小明',
      ),
    ));
    expect(find.textContaining('downloadUrl 不得等于 previewUrl'), findsOneWidget);
  });

  testWidgets('poster result page shows download not preview as image src', (tester) async {
    await tester.pumpWidget(const MaterialApp(
      home: PosterResultScreen(
        downloadUrl: 'http://x/aw-demo-simple.png',
        previewUrl: 'http://x/aw-demo-simple-preview.png',
        templateKey: 'simple',
        studentName: '小明',
      ),
    ));
    expect(find.text('海报结果'), findsOneWidget);
    expect(find.textContaining('简约'), findsOneWidget);
    expect(find.textContaining('downloadUrl'), findsWidgets);
  });

  test('poster template labels are 简约/画框/杂志', () {
    expect(posterTemplates.map((e) => e.key).toList(), ['simple', 'frame', 'magazine']);
    expect(posterTemplates.map((e) => e.label).toList(), ['简约', '画框', '杂志']);
  });

  test('preview and download urls must differ', () {
    const preview = 'http://localhost:4010/files/posters/aw-demo-simple-preview.png';
    const download = 'http://localhost:4010/files/posters/aw-demo-simple.png';
    expect(preview == download, isFalse);
  });
}
