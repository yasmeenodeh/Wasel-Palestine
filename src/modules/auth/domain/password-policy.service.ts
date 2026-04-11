import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class PasswordPolicyService {
  validate(password: string) {
    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long.');
    }

    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      throw new BadRequestException(
        'Password must include at least one uppercase letter, one lowercase letter, and one number.',
      );
    }
  }
}
