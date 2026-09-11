class AuthSession {
  AuthSession({required this.token, required this.name, required this.role, required this.phone});
  final String token;
  final String name;
  final String role;
  final String phone;
}

class StudentItem {
  StudentItem({required this.id, required this.name, this.note});
  final String id;
  final String name;
  final String? note;
}

class ArtworkItem {
  ArtworkItem({
    required this.id,
    required this.imageUrl,
    required this.theme,
    required this.createdOn,
    this.textComment,
  });
  final String id;
  final String imageUrl;
  final String theme;
  final String createdOn;
  final String? textComment;
}
