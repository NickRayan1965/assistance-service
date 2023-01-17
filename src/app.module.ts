import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { EnvConfiguration } from './config/app.config';
import { UserModule } from './user/user.module';
import { WorkPositionModule } from './work-position/work-position.module';
import { HourRegisterModule } from './hour-register/hour-register.module';
import { SeedModule } from './seed/seed.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [EnvConfiguration] }),
        DatabaseModule,
        AuthModule,
        UserModule,
        WorkPositionModule,
        HourRegisterModule,
        SeedModule,
        EventEmitterModule.forRoot(),
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
