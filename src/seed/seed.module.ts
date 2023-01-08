import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { WorkPositionModule } from 'src/work-position/work-position.module';
import { AuthModule } from 'src/auth/auth.module';
import { HourRegisterModule } from 'src/hour-register/hour-register.module';

@Module({
    controllers: [SeedController],
    providers: [SeedService],
    imports: [AuthModule, WorkPositionModule, HourRegisterModule],
})
export class SeedModule {}
