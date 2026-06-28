import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AuthController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should reject missing email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ password: 'password123' })
        .expect(400);
    });

    it('should reject short password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'test@example.com', password: 'short' })
        .expect(400);
    });

    it('should reject invalid email format', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'not-an-email', password: 'password123' })
        .expect(400);
    });

    it('should reject non-whitelisted fields', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          unknownField: 'should-not-be-allowed',
        })
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should reject missing credentials', () => {
      return request(app.getHttpServer()).post('/api/v1/auth/login').send({}).expect(400);
    });

    it('should reject wrong password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'wrong-pass' })
        .expect(401);
    });
  });

  describe('GET /api/v1/health', () => {
    it('should return health status', () => {
      return request(app.getHttpServer()).get('/api/v1/health').expect(200);
    });
  });
});
