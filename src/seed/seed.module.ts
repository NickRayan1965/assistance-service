import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { WorkPositionModule } from '@app/work-position/work-position.module';
import { AuthModule } from '@app/auth/auth.module';
import { HourRegisterModule } from '@app/hour-register/hour-register.module';

@Module({
    controllers: [SeedController],
    providers: [SeedService],
    imports: [AuthModule, WorkPositionModule, HourRegisterModule],
})
export class SeedModule {}
