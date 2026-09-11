import { Artwork, ParentStudent, Student, User } from '@prisma/client';
import { ArtworkDto, BindingDto, StudentDto } from '@art-edu/shared';

export function toIso(value: Date): string {
  return value.toISOString();
}

export function toAccountDto(user: User) {
  return {
    id: user.id,
    phone: user.phone,
    role: user.role,
    displayName: user.displayName,
    status: user.status,
    classNames: user.classNames ?? [],
    createdAt: toIso(user.createdAt),
  };
}

export function toAuthMe(user: Pick<User, 'id' | 'phone' | 'role' | 'displayName' | 'status'>) {
  return {
    id: user.id,
    phone: user.phone,
    role: user.role,
    displayName: user.displayName,
    status: user.status,
  };
}

export function toStudentDto(
  student: Student & { _count?: { parentBindings: number } },
): StudentDto {
  return {
    id: student.id,
    name: student.name,
    className: student.className,
    note: student.note,
    status: student.status,
    ...(student._count
      ? { boundParentCount: student._count.parentBindings }
      : {}),
  };
}

export function toBindingDto(row: ParentStudent): BindingDto {
  return {
    id: row.id,
    parentId: row.parentId,
    studentId: row.studentId,
    createdAt: toIso(row.createdAt),
  };
}

export function toArtworkDto(
  artwork: Artwork & { student?: Pick<Student, 'name'> },
  studentName?: string,
): ArtworkDto {
  return {
    id: artwork.id,
    studentId: artwork.studentId,
    studentName: studentName ?? artwork.student?.name ?? '',
    title: artwork.title,
    createdAt: toIso(artwork.createdAt),
    imageUrl: artwork.imageUrl,
    thumbUrl: artwork.thumbUrl,
    commentText: artwork.commentText,
    courseTheme: artwork.courseTheme,
  };
}
