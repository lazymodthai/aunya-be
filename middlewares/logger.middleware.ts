
import { Injectable, NestMiddleware } from '@nestjs/common'
import { FastifyRequest, FastifyReply } from 'fastify'

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  async use(_req: FastifyRequest, _res: FastifyReply, next) {
    try {
      next()
    } catch (error) {
      console.log(error)
      return _res.status(404)
    }
  }
}