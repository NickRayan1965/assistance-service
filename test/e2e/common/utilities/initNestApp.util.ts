import { AppModule } from '@app/app.module';
import { DatabaseSevice } from '@app/database/database.service';
import { validationPipe } from '@app/config/validationPipeToTheApp';
import { NestApplication } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';

export const initNestApp = async () => {
    const moduleRef = await Test.createTestingModule({
        imports: [AppModule],
    }).compile();
    const app: NestApplication = moduleRef.createNestApplication();
    app.useGlobalPipes(validationPipe);
    await app.init();
    const dbConnection = moduleRef
        .get<DatabaseSevice>(DatabaseSevice)
        .getDbHandle();
    const jwtService = moduleRef.get<JwtService>(JwtService);
    return {
        app,
        dbConnection,
        jwtService,
        moduleRef,
    };
};
