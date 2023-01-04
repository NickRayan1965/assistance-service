import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AuthModule } from 'src/auth/auth.module';
import { WorkPositionModule } from 'src/work-position/work-position.module';

@Module({
    controllers: [UserController],
    providers: [UserService],
    imports: [AuthModule, WorkPositionModule],
})
export class UserModule {}
