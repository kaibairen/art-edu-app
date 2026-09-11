import { AccessService } from './access.service';

describe('AccessService.teacherCoversClass', () => {
  const access = new AccessService({} as never);

  it('matches classNames to student.className', () => {
    expect(access.teacherCoversClass(['创意水彩班', '素描班'], '创意水彩班')).toBe(
      true,
    );
    expect(access.teacherCoversClass(['创意水彩班'], '书法班')).toBe(false);
    expect(access.teacherCoversClass(['创意水彩班'], null)).toBe(false);
  });
});
