import { validateSendMail, validatePagination } from '../src/validators/mail.validator';

describe('Mail Validators', () => {
  it('should validate send mail input', () => {
    const result = validateSendMail({
      to: 'user@example.com',
      subject: 'Test Subject',
      body: '<p>Hello</p>',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = validateSendMail({
      to: 'not-an-email',
      subject: 'Test',
      body: 'Body',
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty subject', () => {
    const result = validateSendMail({
      to: 'user@example.com',
      subject: '',
      body: 'Body',
    });
    expect(result.success).toBe(false);
  });

  it('should reject body too long', () => {
    const result = validateSendMail({
      to: 'user@example.com',
      subject: 'Test',
      body: 'x'.repeat(100001),
    });
    expect(result.success).toBe(false);
  });

  it('should validate pagination', () => {
    const result = validatePagination({ page: '1', limit: '10' });
    expect(result.success).toBe(true);
  });
});
