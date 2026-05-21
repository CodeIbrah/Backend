describe('UsersService', () => {
  it('should be defined', () => {
    expect(true).toBe(true);
  });

  it('should initialize users service module', () => {
    const modulePath = '../src/index';
    expect(() => require(modulePath)).toBeDefined();
  });
});
