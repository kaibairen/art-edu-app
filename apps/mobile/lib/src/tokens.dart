import 'package:flutter/material.dart';

/// 美术教培 APP design/01。与 packages/tokens 对齐。
class ArtEduColors {
  static const brand = Color(0xFF2F6FED);
  static const brandPressed = Color(0xFF2458C4);
  static const ink = Color(0xFF1A1A1A);
  static const inkSecondary = Color(0xFF5C5C5C);
  static const inkTertiary = Color(0xFF8A8A8A);
  static const bg = Color(0xFFFFFFFF);
  static const bgSubtle = Color(0xFFF5F6F8);
  static const border = Color(0x14000000);
  static const success = Color(0xFF1B8F5A);
  static const warning = Color(0xFFC47E00);
  static const danger = Color(0xFFD14343);
}

class ArtEduTypography {
  static const display = TextStyle(fontSize: 22, height: 30 / 22, fontWeight: FontWeight.w600);
  static const title = TextStyle(fontSize: 17, height: 24 / 17, fontWeight: FontWeight.w600);
  static const body = TextStyle(fontSize: 15, height: 22 / 15, fontWeight: FontWeight.w400);
  static const bodyEmphasis = TextStyle(fontSize: 15, height: 22 / 15, fontWeight: FontWeight.w500);
  static const caption = TextStyle(fontSize: 13, height: 18 / 13, fontWeight: FontWeight.w400);
  static const badge = TextStyle(fontSize: 12, height: 16 / 12, fontWeight: FontWeight.w500);
}

class ArtEduSpace {
  static const base = 4.0;
  static const s8 = 8.0;
  static const s12 = 12.0;
  static const s16 = 16.0;
  static const s24 = 24.0;
}

class ArtEduRadius {
  static const card = 12.0;
  static const control = 8.0;
  static const tag = 4.0;
}
