import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AuthModule } from '@app/auth/auth.module';
import { WorkPositionModule } from '@app/work-position/work-position.module';

@Module({
    controllers: [UserController],
    providers: [UserService],
    imports: [AuthModule, WorkPositionModule],
})
export class UserModule {}
