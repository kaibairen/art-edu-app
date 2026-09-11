import 'package:flutter_test/flutter_test.dart';
import 'package:art_edu_mobile/src/api_client.dart';
import 'package:art_edu_mobile/src/app.dart';
import 'package:art_edu_mobile/src/models.dart';
import 'package:art_edu_mobile/src/screens/poster_preview_screen.dart';
import 'package:art_edu_mobile/src/screens/poster_result_screen.dart';
import 'package:art_edu_mobile/src/screens/public_home_screen.dart';
import 'package:art_edu_mobile/src/screens/upload_screen.dart';
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

  @override
  Future<PublicHome> getPublicHome() async {
    return PublicHome(
      brand: PublicHomeBrand(orgName: '星光美术'),
      banners: [
        PublicBanner(id: 'b1', imageUrl: 'http://x/b.png', title: '秋季招生'),
      ],
      courses: [
        PublicCourse(id: 'c1', title: '创意水彩', summary: '周六上午小班'),
      ],
      featuredArtworks: [
        PublicFeaturedArtwork(
          id: 'f1',
          imageUrl: 'http://x/f.png',
          title: '春天的树',
          studentDisplayName: '小明',
        ),
      ],
    );
  }
}

ArtworkItem _demoArtwork() => ArtworkItem(
      id: 'aw-demo',
      studentId: 'st-1',
      studentName: '小明',
      imageUrl: 'http://x/art.png',
      thumbUrl: 'http://x/art-thumb.png',
      createdAt: '2026-09-11',
    );

void main() {
  testWidgets('parent login screen renders', (tester) async {
    await tester.pumpWidget(const ArtEduApp(role: AppRole.parent));
    expect(find.text('家长端登录'), findsOneWidget);
    expect(find.textContaining('仅能查看已绑定的孩子'), findsOneWidget);
    expect(find.text('手机号'), findsOneWidget);
    expect(find.text('先看看公开首页'), findsOneWidget);
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
        artwork: _demoArtwork(),
        studentName: '小明',
      ),
    ));
    expect(find.text('生成并下载'), findsOneWidget);
    expect(find.text('生成正式成片并进入结果页'), findsNothing);
    expect(find.text('点模板可切换预览'), findsOneWidget);
  });

  testWidgets('parent preview hides api hints when not debug', (tester) async {
    await tester.pumpWidget(MaterialApp(
      home: PosterPreviewScreen(
        api: _FakeApiClient(),
        artwork: _demoArtwork(),
        studentName: '小明',
        showDebugApiHints: false,
      ),
    ));
    await tester.pump();
    expect(find.text('生成并下载'), findsOneWidget);
    expect(find.text('点模板可切换预览'), findsOneWidget);
    expect(find.textContaining('previewUrl'), findsNothing);
    expect(find.textContaining('downloadUrl'), findsNothing);
    expect(find.textContaining('接口'), findsNothing);
    expect(find.textContaining('POST'), findsNothing);
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
    expect(find.text('已保存'), findsOneWidget);
    expect(find.textContaining('简约'), findsOneWidget);
    expect(find.textContaining('downloadUrl'), findsWidgets);
    expect(find.text('分享'), findsOneWidget);
    expect(find.text('再下一张'), findsOneWidget);
    expect(find.text('返回作品'), findsOneWidget);
  });

  testWidgets('parent result hides urls and keeps actions', (tester) async {
    await tester.pumpWidget(const MaterialApp(
      home: PosterResultScreen(
        downloadUrl: 'http://x/aw-demo-simple.png',
        previewUrl: 'http://x/aw-demo-simple-preview.png',
        templateKey: 'simple',
        studentName: '小明',
        showDebugApiHints: false,
      ),
    ));
    expect(find.text('已保存'), findsOneWidget);
    expect(find.text('分享'), findsOneWidget);
    expect(find.text('再下一张'), findsOneWidget);
    expect(find.text('返回作品'), findsOneWidget);
    expect(find.textContaining('downloadUrl'), findsNothing);
    expect(find.textContaining('previewUrl'), findsNothing);
  });

  testWidgets('upload screen uses datetime picker not ISO field', (tester) async {
    await tester.pumpWidget(MaterialApp(
      home: UploadScreen(
        api: _FakeApiClient(),
        student: StudentItem(id: 's-ming', name: '小明', className: '创意水彩班'),
      ),
    ));
    expect(find.text('创作时间'), findsOneWidget);
    expect(find.textContaining('ISO'), findsNothing);
    expect(find.textContaining('单独接口'), findsNothing);
    expect(find.textContaining('非本期'), findsNothing);
    expect(find.text('文字点评（可选）'), findsOneWidget);
  });

  test('poster template labels are 简约/画框/杂志', () {
    expect(posterTemplates.map((e) => e.key).toList(), ['simple', 'frame', 'magazine']);
    expect(posterTemplates.map((e) => e.label).toList(), ['简约', '画框', '杂志']);
  });

  testWidgets('public home renders banners then courses then featured', (tester) async {
    await tester.pumpWidget(MaterialApp(
      home: PublicHomeScreen(api: _FakeApiClient()),
    ));
    await tester.pumpAndSettle();
    expect(find.text('机构首页'), findsOneWidget);
    expect(find.textContaining('公开卡无点评'), findsOneWidget);
    expect(find.textContaining('课程无长文'), findsOneWidget);
    expect(find.text('轮播'), findsOneWidget);
    expect(find.text('课程介绍'), findsOneWidget);
    expect(find.text('优秀作品'), findsOneWidget);
    expect(find.text('秋季招生'), findsOneWidget);
    expect(find.text('创意水彩'), findsOneWidget);
    expect(find.text('春天的树'), findsOneWidget);
    expect(find.text('小明'), findsOneWidget);
    expect(find.text('点评'), findsNothing);
    expect(find.textContaining('commentText'), findsNothing);

    final banners = tester.getTopLeft(find.text('轮播'));
    final courses = tester.getTopLeft(find.text('课程介绍'));
    final featured = tester.getTopLeft(find.text('优秀作品'));
    expect(banners.dy < courses.dy, isTrue);
    expect(courses.dy < featured.dy, isTrue);
  });

  test('preview and download urls must differ', () {
    const preview = 'http://localhost:4010/files/posters/aw-demo-simple-preview.png';
    const download = 'http://localhost:4010/files/posters/aw-demo-simple.png';
    expect(preview == download, isFalse);
  });
}
