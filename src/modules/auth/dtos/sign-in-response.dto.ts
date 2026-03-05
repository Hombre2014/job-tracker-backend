import { UserDto } from '../../users/dtos/user.dto';

export class SignInResponseDto extends UserDto {
  passwordStrength: 'strong' | 'weak';

  constructor(userDto: UserDto, passwordStrength: 'strong' | 'weak') {
    super();
    Object.assign(this, userDto);
    this.passwordStrength = passwordStrength;
  }
}
