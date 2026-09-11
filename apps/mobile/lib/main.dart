import 'src/app.dart';
import 'package:flutter/material.dart';

/// 默认入口：通过 --dart-define=APP_ROLE=parent|teacher 区分角色。
/// 也可用 main_parent.dart / main_teacher.dart 作为独立入口。
void main() {
  const role = String.fromEnvironment('APP_ROLE', defaultValue: 'parent');
  runApp(ArtEduApp(role: role == 'teacher' ? AppRole.teacher : AppRole.parent));
}
