import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('App (e2e)', () => {
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

  describe('Health', () => {
    it('/api/v1/health (GET) should return health status', () => {
      return request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeDefined();
        });
    });

    it('/api/v1 (GET) should return Swagger UI or redirect', () => {
      return request(app.getHttpServer())
        .get('/api/v1')
        .expect((res) => {
          // Swagger redirects to /api
          expect([200, 301, 302]).toContain(res.status);
        });
    });
  });

  describe('Auth', () => {
    const testUser = {
      email: 'e2e-test@example.com',
      password: 'TestPass123!',
      name: 'E2E Test User',
    };

    it('POST /api/v1/auth/register should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body.user).toBeDefined();
          expect(res.body.user.email).toBe(testUser.email);
          expect(res.body.tokens).toBeDefined();
          expect(res.body.tokens.accessToken).toBeDefined();
        });
    });

    it('POST /api/v1/auth/register should reject duplicate email', () => {
      return request(app.getHttpServer()).post('/api/v1/auth/register').send(testUser).expect(409);
    });

    let accessToken: string;
    let refreshToken: string;

    it('POST /api/v1/auth/login should authenticate user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200)
        .expect((res) => {
          expect(res.body.tokens).toBeDefined();
          accessToken = res.body.tokens.accessToken;
          refreshToken = res.body.tokens.refreshToken;
        });
    });

    it('POST /api/v1/auth/login should reject wrong password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: 'wrong-password' })
        .expect(401);
    });

    it('GET /api/v1/auth/profile should return user profile with valid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe(testUser.email);
        });
    });

    it('GET /api/v1/auth/profile should reject without token', () => {
      return request(app.getHttpServer()).get('/api/v1/auth/profile').expect(401);
    });

    it('POST /api/v1/auth/refresh should return new tokens', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200)
        .expect((res) => {
          expect(res.body.tokens).toBeDefined();
        });
    });

    it('POST /api/v1/auth/logout should logout successfully', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });
  });

  describe('Ops (protected)', () => {
    it('GET /api/v1/ops should reject without token', () => {
      return request(app.getHttpServer()).get('/api/v1/ops').expect(401);
    });
  });
});
