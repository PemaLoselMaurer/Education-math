import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Get,
  Query,
  BadRequestException,
  Res,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from './email.service';
// import { AuthGuard } from '@nestjs/passport';
import type { Response, Request } from 'express';
import { AuthGuard } from '@nestjs/passport';

@Controller('user')
export class UserController {
  @Post('preferences')
  async savePreferences(
    @Body('firstName') firstName: string,
    @Body('lastName') lastName: string,
    @Body('age') age: number,
    @Body('favouriteSubjects') favouriteSubjects: string[],
    @Body('hobbies') hobbies: string[],
  ) {
    // For demo, get user by username from token or session (implement auth in production)
    // Here, just update the first user for simplicity
    const user = await this.userService.findByUsername('testuser');
    if (!user) return { error: 'User not found' };
    user.firstName = firstName;
    user.lastName = lastName;
    user.age = age;
    user.favouriteSubjects = favouriteSubjects;
    user.hobbies = hobbies;
    await this.userService.save(user);
    return { message: 'Preferences saved successfully' };
  }
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  @Post('register')
  async register(
    @Body('username') username: string,
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('age') age: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    // TODO: Add real email existence check (e.g., via external API)
    try {
      const user = await this.userService.register(username, email, password);
      if (typeof age === 'number') user.age = age;
      // Save user directly, skip email validation
      const savedUser = await this.userService.save(user);
      const payload = { sub: savedUser.id, username: savedUser.username };
      const token = await this.jwtService.signAsync(payload);
      const isProd = process.env.NODE_ENV === 'production';
      res.cookie('access_token', token, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        maxAge: 1000 * 60 * 60 * 24, // 1 day
      });
      return {
        id: savedUser.id,
        username: savedUser.username,
        email: savedUser.email,
        message: 'Registration successful',
      };
    } catch (err: unknown) {
      // Log error for debugging
      console.error('Registration error:', err);
      const e = err as { message?: string; response?: { message?: string } };
      if (e?.message === 'Username already exists') {
        throw new BadRequestException(
          'Username is already taken. Please choose another.',
        );
      }
      if (e?.response?.message) {
        throw new BadRequestException(
          `Registration failed: ${e.response.message}`,
        );
      }
      throw new BadRequestException('Registration failed.');
    }
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    const user = await this.userService.findByVerificationToken(token);
    if (!user) {
      throw new BadRequestException('Invalid or expired token');
    }
    user.emailVerified = true;
    user.verificationToken = null;
    await this.userService.save(user);
    return { message: 'Email verified successfully' };
  }

  @Post('login')
  async login(
    @Body('username') username: string,
    @Body('password') password: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.userService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { sub: user.id, username: user.username };
    const token = await this.jwtService.signAsync(payload);
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    });
    return { ok: true };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('access_token', '', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 0,
    });
    return { ok: true };
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  me(@Req() req: Request) {
    const typed = req as Request & {
      user?: { userId: number; username: string };
    };
    return typed.user ?? null;
  }
  /*
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req: any) {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: any, @Res() res: any) {
    // req.user is set by GoogleStrategy
    try {
      const user = await this.userService.findByEmail(req.user.email);
      let dbUser = user;
      if (!user) {
        dbUser = await this.userService.registerGoogleUser(req.user);
      }
      const payload = { sub: dbUser!.id, username: dbUser!.username };
      const token = await this.jwtService.signAsync(payload);
      // Redirect or respond with JWT
      res.json({ access_token: token });
    } catch (err) {
      console.error('Google OAuth error:', err);
      res.status(500).json({ message: 'Internal server error', error: err.message });
    }
  }
  */
}
