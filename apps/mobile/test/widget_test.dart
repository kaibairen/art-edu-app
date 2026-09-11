import 'package:flutter_test/flutter_test.dart';
import 'package:art_edu_mobile/src/app.dart';

void main() {
  testWidgets('parent login screen renders', (tester) async {
    await tester.pumpWidget(const ArtEduApp(role: AppRole.parent));
    expect(find.text('家长端登录'), findsOneWidget);
    expect(find.textContaining('仅能查看已绑定孩子'), findsOneWidget);
  });
}
