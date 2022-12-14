import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { IAuth } from './auth.interfaces';
import { JwtService } from '@nestjs/jwt';
import * as argon from 'argon2';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  async findUsers(email: string) {
    return await this.prisma.user.findUnique({ where: { email } });
  }

  async signup(authData: IAuth) {
    const { email, password, name } = authData;

    const foundUser = await this.findUsers(email);

    if (foundUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashed_password = await this.hashPassword(password);

    const data = await this.prisma.user.create({
      data: {
        name,
        email,
        hashed_password,
      },
    });

    const message = email + ' signup succesfully';

    return {
      statusCode: HttpStatus.OK,
      data,
      message,
    };
  }

  async generateToken(email: string, password: string) {
    const foundUser = await this.findUsers(email);

    if (!foundUser) {
      throw new BadRequestException('No Email registered');
    }

    const isMatch = await this.comparePassword({
      password,
      hash: foundUser.hashed_password,
    });

    if (!isMatch) {
      throw new BadRequestException('Wrong Password');
    }

    const payload = {
      email: foundUser.email,
      id: foundUser.id,
    };

    // return token
    return await this.signToken(payload);
  }

  refreshToken() {
    //To-Do implement refresh token
    return 'refresh token';
  }

  async login(user: any) {
    return {
      status: HttpStatus.OK,
      ...user,
    };
  }

  async hashPassword(password: string) {
    return await argon.hash(password);
  }

  async comparePassword(args: { password: string; hash: string }) {
    const { password, hash } = args;
    return await argon.verify(hash, password);
  }

  async signToken(payload: { id: number; email: string }) {
    return await this.jwtService.sign(payload);
  }
}
