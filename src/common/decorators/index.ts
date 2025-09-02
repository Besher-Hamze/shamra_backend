// Decorator to Get User ID from Request
import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload } from '../interfaces';

export const GetUserId = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest<Request>();
        if (!request.user) {
            throw new UnauthorizedException('User not found');
        }
        const user = request.user as JwtPayload;
        return user.sub;
    },
);

// Decorator to Get User Role from Request