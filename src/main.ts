import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { validationPipe } from './config/validationPipeToTheApp';
export const title_app = `Servicio de Asistencias y marcado de refrigerio`;

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(validationPipe);
    const config = new DocumentBuilder()
        .addBearerAuth({
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            in: 'headers',
        })
        .setTitle(title_app)
        .setDescription(
            `Credenciales para probar el api <b> {"email": "${process.env.EMAIL_FOR_SWAGGER}", "password": "${process.env.PASSWORD_FOR_SWAGGER}"} </b> </br>Credenciales para probar la Seed <b>{"user_seed":"${process.env.USER_SEED}", "pwd_seed": "${process.env.PWD_SEED}"}</b><br>Si elimina el usuario para las pruebas, puede volver a generarlo en el endpoint de la seed.`,
        )
        .setVersion('1.0')
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
    await app.listen(process.env.PORT || 9090);
}
bootstrap();
