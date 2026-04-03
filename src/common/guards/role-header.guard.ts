import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../enums/user-role.enum';

type RequestUser = {
  id: number;
  role: UserRole;
};

type RequestWithHeadersUser = {
  headers: Record<string, string | string[] | undefined>;
  user?: RequestUser;
};

@Injectable()
export class RoleHeaderGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithHeadersUser>();
    const rawRole = request.headers['x-user-role'];
    const rawUserId = request.headers['x-user-id'];

    const role = Array.isArray(rawRole) ? rawRole[0] : rawRole;
    const userIdText = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;
    const userId = userIdText ? Number(userIdText) : Number.NaN;

    if (!role || Number.isNaN(userId)) {
      throw new UnauthorizedException(
        'Missing auth headers. Replace this temporary guard with JWT access tokens.',
      );
    }

    if (!requiredRoles.includes(role as UserRole)) {
      throw new ForbiddenException('You do not have permission to perform this action.');
    }

    request.user = {
      id: userId,
      role: role as UserRole,
    };

    return true;
  }
}
