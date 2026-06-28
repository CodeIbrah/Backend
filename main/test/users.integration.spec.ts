import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('UsersController (integration)', () => {
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

  describe('GET /api/v1/users', () => {
    it('should reject without auth token', () => {
      return request(app.getHttpServer()).get('/api/v1/users').expect(401);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should reject without auth token', () => {
      return request(app.getHttpServer()).get('/api/v1/users/some-id').expect(401);
    });
  });
});
