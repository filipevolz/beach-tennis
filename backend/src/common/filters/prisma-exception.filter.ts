import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception.code === 'P2002') {
      const target = Array.isArray(exception.meta?.target)
        ? (exception.meta.target as string[]).join(',')
        : 'field';

      const body = {
        statusCode: HttpStatus.CONFLICT,
        code: target.includes('email') ? 'EMAIL_ALREADY_EXISTS' : 'UNIQUE_CONSTRAINT',
        message: 'A record with this value already exists',
      };

      response.status(HttpStatus.CONFLICT).json(body);
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'DATABASE_ERROR',
      message: 'An unexpected database error occurred',
    });
  }
}
