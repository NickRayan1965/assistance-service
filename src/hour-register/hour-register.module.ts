import { Module, forwardRef } from '@nestjs/common';
import { HourRegisterService } from './hour-register.service';
import { HourRegisterController } from './hour-register.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
    HourRegister,
    HourRegisterSchema,
} from './entities/hour-register.entity';
import { AuthModule } from 'src/auth/auth.module';
import { HourRegisterRepository } from './hour-register.repository';

@Module({
    controllers: [HourRegisterController],
    providers: [HourRegisterService, HourRegisterRepository],
    imports: [
        MongooseModule.forFeature([
            { name: HourRegister.name, schema: HourRegisterSchema },
        ]),
        forwardRef(() => AuthModule),
    ],
})
export class HourRegisterModule {}
