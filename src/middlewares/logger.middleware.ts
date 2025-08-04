import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import chalk = require('chalk');

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction) {
    const startTime = Date.now();
    const { ip, method, originalUrl, body, query, params } = request;
    const userAgent = request.get('user-agent') || '';

    response.on('finish', () => {
      const { statusCode } = response;
      const duration = Date.now() - startTime;
      const methodColor = this.getMethodColor(method);
      const statusColor = this.getStatusColor(statusCode);

      this.logger.log(
        `${methodColor(method)} ${originalUrl} ${statusColor(statusCode)} ${chalk.yellow(duration + 'ms')} - ${userAgent} ${ip}`
      );
      
      this.logDetails(params, query, body);
    });

    next();
  }

  private logDetails(params: any, query: any, body: any) {
    // --- จุดที่แก้ไข ---
    // ระบุประเภทของ details ให้เป็น string[]
    const details: string[] = [];

    // เพิ่มการตรวจสอบว่า params, query, body ไม่ใช่ null/undefined ก่อนเรียกใช้ Object.keys
    if (params && Object.keys(params).length > 0) {
      details.push(`Params: ${JSON.stringify(params)}`);
    }
    if (query && Object.keys(query).length > 0) {
      details.push(`Query: ${JSON.stringify(query)}`);
    }
    // สำหรับ body ควรตรวจสอบให้แน่ใจว่าไม่ใช่ object ว่างๆ
    if (body && Object.keys(body).length > 0) {
      details.push(`Body: ${JSON.stringify(body)}`);
    }

    if (details.length > 0) {
      this.logger.log(chalk.gray(`  ↳ ${details.join(', ')}`));
    }
  }

  private getMethodColor(method: string) {
    switch (method) {
      case 'GET':
        return chalk.green;
      case 'POST':
        return chalk.cyan;
      case 'PUT':
        return chalk.yellow;
      case 'PATCH':
        return chalk.magenta;
      case 'DELETE':
        return chalk.red;
      default:
        return chalk.white;
    }
  }

  private getStatusColor(statusCode: number) {
    if (statusCode >= 500) return chalk.red;
    if (statusCode >= 400) return chalk.red;
    if (statusCode >= 300) return chalk.cyan;
    if (statusCode >= 200) return chalk.green;
    return chalk.white;
  }
}