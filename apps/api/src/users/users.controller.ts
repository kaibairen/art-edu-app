import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators';
import { BindDto, CreateStudentDto, CreateUserDto } from '../common/dto';
import { UsersService } from './users.service';

@Controller('admin')
@Roles(Role.admin)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('users')
  listUsers(@Query('role') role?: Role) {
    return this.users.listUsers(role);
  }

  @Post('users')
  createUser(@Body() dto: CreateUserDto) {
    return this.users.createUser(dto);
  }

  @Get('students')
  listStudents() {
    return this.users.listStudents();
  }

  @Post('students')
  createStudent(@Body() dto: CreateStudentDto) {
    return this.users.createStudent(dto);
  }

  @Post('bindings/parent-student')
  bindParent(@Body() dto: BindDto) {
    return this.users.bindParent(dto);
  }

  @Delete('bindings/parent-student')
  unbindParent(@Body() dto: BindDto) {
    return this.users.unbindParent(dto);
  }

  @Post('bindings/teacher-student')
  bindTeacher(@Body() dto: BindDto) {
    return this.users.bindTeacher(dto);
  }

  @Delete('bindings/teacher-student')
  unbindTeacher(@Body() dto: BindDto) {
    return this.users.unbindTeacher(dto);
  }
}
