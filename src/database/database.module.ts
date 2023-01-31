import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseSevice } from './database.service';

@Module({
    imports: [
        MongooseModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const NODE_ENV = configService.get<string>('NODE_ENV');
                const isTestEnv = NODE_ENV === 'test';
                const uri = isTestEnv
                    ? configService.get<string>('MONGO_TEST_CONNECTION_URI')
                    : configService.get<string>('MONGO_CONNECTION_URI');
                const user = isTestEnv
                    ? configService.get<string>('MONGO_USER_TEST')
                    : configService.get<string>('MONGO_USER_DEVELOPMENT');
                const pass = isTestEnv
                    ? configService.get<string>('MONGO_PASSWORD_TEST')
                    : configService.get<string>('MONGO_PASSWORD_DEVELOPMENT');
                const authSource = isTestEnv
                    ? configService.get<string>('AUTH_SOURCE_TEST')
                    : configService.get<string>('AUTH_SOURCE_DEVELOPMENT');

                const options = {
                    uri,
                    user,
                    pass,
                    authSource,
                    family: 4,
                };
                return options;
            },
        }),
    ],
    providers: [DatabaseSevice],
    exports: [DatabaseSevice],
})
export class DatabaseModule {}
