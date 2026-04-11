import { UserRole } from '../../../common/enums/user-role.enum';

export type TokenPayload = {
  sub: string;
  username: string;
  role: UserRole;
  type: 'access' | 'refresh';
};
