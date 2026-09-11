import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators';
import {
  CreateAccountDto,
  CreateBindingDto,
  CreateStudentDto,
  PageQueryDto,
  UpdateAccountDto,
  UpdateAccountStatusDto,
  UpdateStudentDto,
} from '../common/dto';
import { UsersService } from './users.service';

@Controller('admin')
@Roles(Role.admin)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('accounts')
  listAccounts(
    @Query('role') role?: Role,
    @Query() page?: PageQueryDto,
  ) {
    return this.users.listAccounts({ role, cursor: page?.cursor, limit: page?.limit });
  }

  @Post('accounts')
  createAccount(@Body() dto: CreateAccountDto) {
    return this.users.createAccount(dto);
  }

  @Get('accounts/:id')
  getAccount(@Param('id') id: string) {
    return this.users.getAccount(id);
  }

  @Patch('accounts/:id')
  updateAccount(@Param('id') id: string, @Body() dto: UpdateAccountDto) {
    return this.users.updateAccount(id, dto);
  }

  @Patch('accounts/:id/status')
  updateAccountStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAccountStatusDto,
  ) {
    return this.users.updateAccountStatus(id, dto);
  }

  @Get('students')
  listStudents(@Query() page: PageQueryDto) {
    return this.users.listStudents(page);
  }

  @Post('students')
  createStudent(@Body() dto: CreateStudentDto) {
    return this.users.createStudent(dto);
  }

  @Get('students/:id')
  getStudent(@Param('id') id: string) {
    return this.users.getStudent(id);
  }

  @Patch('students/:id')
  updateStudent(@Param('id') id: string, @Body() dto: UpdateStudentDto) {
    return this.users.updateStudent(id, dto);
  }

  @Delete('students/:id')
  @HttpCode(200)
  deleteStudent(@Param('id') id: string) {
    return this.users.deleteStudent(id);
  }

  @Get('bindings')
  listBindings(@Query() page: PageQueryDto) {
    return this.users.listBindings(page);
  }

  @Post('bindings')
  createBinding(@Body() dto: CreateBindingDto) {
    return this.users.createBinding(dto);
  }

  @Delete('bindings/:id')
  @HttpCode(200)
  deleteBinding(@Param('id') id: string) {
    return this.users.deleteBinding(id);
  }
}
