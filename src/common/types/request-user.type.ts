import { UserRole } from '../enums/user-role.enum';

export type RequestUser = {
  id: number;
  role: UserRole;
  username: string;
};
