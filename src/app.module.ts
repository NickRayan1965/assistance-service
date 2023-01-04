import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { EnvConfiguration } from './config/app.config';
import { UserModule } from './user/user.module';
import { WorkPositionModule } from './work-position/work-position.module';
import { HourRegisterModule } from './hour-register/hour-register.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [EnvConfiguration] }),
        DatabaseModule,
        AuthModule,
        UserModule,
        WorkPositionModule,
        HourRegisterModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
