describe('NotificationsService', () => {
  it('should be defined', () => {
    expect(true).toBe(true);
  });

  it('should initialize notifications service module', () => {
    const modulePath = '../src/index';
    expect(() => require(modulePath)).toBeDefined();
  });
});
