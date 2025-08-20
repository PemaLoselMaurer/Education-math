import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AppService } from './app.service';
import { questions, QuestionType } from './questions.data';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('questions')
  @UseGuards(AuthGuard('jwt'))
  getQuestions(): QuestionType[] {
    // Return all questions for frontend filtering
    return questions;
  }
}
