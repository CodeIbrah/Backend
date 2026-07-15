import { PrismaClient } from '@prisma/client';

export class PrismaService {
  private static instance: PrismaService;
  public client: PrismaClient;

  private constructor() {
    this.client = new PrismaClient();
  }

  static getInstance(): PrismaService {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaService();
    }
    return PrismaService.instance;
  }

  async onModuleInit(): Promise<void> {
    await this.client.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }
}
