import { PartialType } from '@nestjs/swagger';
import { HourRegister } from '../entities/hour-register.entity';
import { Types } from 'mongoose';

export class CreateHourRegisterDto extends PartialType(HourRegister) {
    date: Date;
    user: Types.ObjectId | string;
}
