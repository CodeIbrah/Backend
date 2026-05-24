import { validateSendSms, validatePagination } from '../src/validators/sms.validator';

describe('SMS Validators', () => {
  it('should validate send sms input', () => {
    const result = validateSendSms({
      to: '+34600000000',
      message: 'Your invoice is ready',
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty phone', () => {
    const result = validateSendSms({
      to: '',
      message: 'Hello',
    });
    expect(result.success).toBe(false);
  });

  it('should reject message exceeding limit', () => {
    const result = validateSendSms({
      to: '+34600000000',
      message: 'x'.repeat(1601),
    });
    expect(result.success).toBe(false);
  });

  it('should validate pagination', () => {
    const result = validatePagination({ page: '1', limit: '10' });
    expect(result.success).toBe(true);
  });
});
