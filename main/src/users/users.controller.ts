import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiCreatedResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/user.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user (ADMIN only)' })
  @ApiCreatedResponse({ description: 'User created successfully' })
  async create(@Body() createUserDto: CreateUserDto): Promise<unknown> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List all users (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(@Query('page') page?: number, @Query('limit') limit?: number): Promise<unknown> {
    // Validate + clamp pagination to prevent DoS
    const safePage = Math.max(1, Math.floor(Number(page)) || 1);
    const safeLimit = Math.min(100, Math.max(1, Math.floor(Number(limit)) || 10));
    return this.usersService.findAll(safePage, safeLimit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (self or ADMIN)' })
  @ApiParam({ name: 'id', type: String })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string },
  ): Promise<unknown> {
    if (id !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenException('You can only view your own profile');
    }
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'id', type: String })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<unknown> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete user' })
  @ApiParam({ name: 'id', type: String })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.usersService.remove(id);
  }

  @Patch(':id/active')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Toggle user active status' })
  @ApiParam({ name: 'id', type: String })
  async toggleActive(@Param('id') id: string): Promise<unknown> {
    return this.usersService.toggleActive(id);
  }
}
