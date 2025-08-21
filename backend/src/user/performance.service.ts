import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Performance } from './performance.entity';
import { User } from './user.entity';

@Injectable()
export class PerformanceService {
  constructor(
    @InjectRepository(Performance)
    private readonly perfRepo: Repository<Performance>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async addEntry(userId: number, label: string, accuracy: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    const entry = this.perfRepo.create({ user, label, accuracy });
    return this.perfRepo.save(entry);
  }

  async listForUser(userId: number) {
    return this.perfRepo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'ASC' },
      relations: ['user'],
    });
  }

  computeTotals(entries: Performance[]) {
    const quizzesTaken = entries.length;
    const sum = entries.reduce(
      (acc, e) => acc + (Number.isFinite(e.accuracy) ? e.accuracy : 0),
      0,
    );
    const correctRate = quizzesTaken
      ? Math.round((sum / quizzesTaken) * 100 + Number.EPSILON) / 100
      : 0;
    // Simple streak: consecutive sessions from end with accuracy >= 70
    let streak = 0;
    for (let i = entries.length - 1; i >= 0; i--) {
      if ((entries[i].accuracy || 0) >= 70) streak++;
      else break;
    }
    return { quizzesTaken, correctRate, streak };
  }
}
