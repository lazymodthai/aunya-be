import { Catch, ExceptionFilter, HttpException, ArgumentsHost, Logger } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { IMessage, MSG_MASTER } from '../message/msg-master';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<FastifyReply>();
        const status = exception.getStatus();
        const exceptionResponse = exception.getResponse();
        const request = ctx.getRequest<FastifyRequest>();

        const origin = request.headers.origin;
        if (origin) {
            response.header('Access-Control-Allow-Origin', origin);
            response.header('Access-Control-Allow-Credentials', 'true');
            response.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, x-client-id, x-client-secret');
            response.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
        }

        let messageCode: number;
        let message: string;
        let error: string;

        // Check if the response is our standard IMessage object
        if (typeof exceptionResponse === 'object' && exceptionResponse !== null && 'code' in exceptionResponse && 'description' in exceptionResponse) {
            const msgObj = exceptionResponse as IMessage;
            messageCode = msgObj.code;
            message = msgObj.description; // Use the human-readable description
            error = msgObj.msg; // Use the machine-readable msg as error
        } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null && 'message' in exceptionResponse) {
            // Handle standard NestJS validation errors from class-validator
            const res = exceptionResponse as { message: string[] | string };
            message = Array.isArray(res.message) ? res.message.join(', ') : res.message;
            messageCode = MSG_MASTER.NOT_FOUND.code;
            error = MSG_MASTER.NOT_FOUND.msg;
        } else {
            // Fallback for other/unknown HttpExceptions
            message = (typeof exceptionResponse === 'string') ? exceptionResponse : exception.message;
            messageCode = MSG_MASTER.GENERIC_SERVER_ERROR.code;
            error = MSG_MASTER.GENERIC_SERVER_ERROR.msg;
        }

        const errorResponsePayload = {
            statusCode: status,
            messageCode,
            error,
            message,
        };

        this.logger.warn(`HTTP Exception: ${status} - ${JSON.stringify(errorResponsePayload)}`);
        response.status(status).send(errorResponsePayload);
    }
}
