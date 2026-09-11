import {
  PUBLIC_FEATURED_ARTWORK_FIELDS,
  PUBLIC_HOME_FIELDS,
} from '@art-edu/shared';
import {
  toPublicCourse,
  toPublicFeaturedArtwork,
  toPublicHome,
} from './home.mappers';

const featuredRow = {
  id: 'feat-1',
  imageUrl: '/files/a.jpg',
  title: '春天的树',
  studentDisplayName: '小明',
  sortOrder: 0,
  published: true,
  createdAt: new Date('2026-09-01T00:00:00.000Z'),
  updatedAt: new Date('2026-09-01T00:00:00.000Z'),
};

describe('home public mappers', () => {
  it('projects featured artwork to the public allowlist only', () => {
    const card = toPublicFeaturedArtwork({
      ...featuredRow,
      // 即使行上被误挂点评字段，公开投影也不得带出
      commentText: '教师私评，禁止出现在公开卡',
      studentId: 'stu-secret',
    } as typeof featuredRow);
    expect(Object.keys(card).sort()).toEqual(
      [...PUBLIC_FEATURED_ARTWORK_FIELDS].sort(),
    );
    expect(card).toEqual({
      id: 'feat-1',
      imageUrl: '/files/a.jpg',
      title: '春天的树',
      studentDisplayName: '小明',
    });
    expect(JSON.stringify(card)).not.toMatch(
      /commentText|teacherComment|点评|studentId|note/,
    );
  });

  it('projects courses without a long-form body', () => {
    const course = toPublicCourse({
      id: 'c1',
      title: '水彩',
      summary: '小班制',
      coverUrl: null,
      sortOrder: 0,
      published: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      body: '长文正文不得出现在公开课程',
    } as Parameters<typeof toPublicCourse>[0] & { body: string });
    expect(course).toEqual({
      id: 'c1',
      title: '水彩',
      summary: '小班制',
      coverUrl: null,
    });
    expect('body' in course).toBe(false);
  });

  it('keeps public home available when logo is missing', () => {
    const home = toPublicHome({
      orgName: '星光美术教室',
      logoUrl: null,
      banners: [],
      courses: [],
      featuredArtworks: [featuredRow],
    });
    expect(home.brand.logoUrl).toBeNull();
    expect(home.featuredArtworks).toHaveLength(1);
  });

  it('emits public home keys in signed order', () => {
    const home = toPublicHome({
      orgName: '星光美术教室',
      logoUrl: null,
      banners: [],
      courses: [],
      featuredArtworks: [],
    });
    expect(Object.keys(home)).toEqual([...PUBLIC_HOME_FIELDS]);
    expect(Object.keys(JSON.parse(JSON.stringify(home)))).toEqual([
      'brand',
      'banners',
      'courses',
      'featuredArtworks',
    ]);
  });
});
