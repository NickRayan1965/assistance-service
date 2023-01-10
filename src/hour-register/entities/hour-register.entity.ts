import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';
import { User } from '@app/auth/entities/user.entity';
export type HourRegisterDocument = HourRegister & Document;
export const DEFAULT_EMPY_TIME = '--:--';
export const LUNCH_TIME_DEFAULT = 45; // 45 minutes
export class CalculatedTimeFields {
    @ApiProperty({
        description:
            'Campo calculado automaticamenta, indica si cumplio su tiempo según su Posición de Trabajo por cantidad de horas (no necesariamente en el horario establecido exactamente)',
        default: false,
    })
    @Prop({ required: true, default: false })
    time_fulfilled: boolean;

    @ApiProperty({
        description:
            'Campo calculado automaticamenta, indica la cantidad de minutos perdidos por tardanza, salir antes de horario o por demora en el tiempo de almuerzo, si exite.',
        default: 0,
    })
    @Prop({ required: true, default: 0 })
    missing_minutes: number;

    @ApiProperty({
        description:
            'Campo calculado automaticamenta, inica si las horas de trabajo las cumplio dentro de su horario de trabajo señalado en su Posición de trabajo (horario exacto)',
        default: false,
    })
    @Prop({ required: true, default: false })
    isWithinWorkingHour: boolean;
}
export class TimestampFields extends CalculatedTimeFields {
    @ApiProperty({
        format: 'hh:mm',
        description: 'Hora menor al resto',
        default: DEFAULT_EMPY_TIME,
        minLength: 4,
        maxLength: 5,
    })
    @Prop({
        required: true,
        minlength: 4,
        maxlength: 5,
        default: DEFAULT_EMPY_TIME,
    })
    start_time: string;

    @ApiProperty({
        format: 'hh:mm',
        description: 'Hora mayor al start_time y menor al resto',
        minLength: 4,
        maxLength: 5,
        default: DEFAULT_EMPY_TIME,
    })
    @Prop({
        required: true,
        minlength: 4,
        maxlength: 5,
        default: DEFAULT_EMPY_TIME,
    })
    lunch_start_time: string;

    @ApiProperty({
        format: 'hh:mm',
        description:
            'Hora mayor a start_time y lunch_start_time, y menor a lunch_end_time',
        default: DEFAULT_EMPY_TIME,
        minLength: 4,
        maxLength: 5,
    })
    @Prop({
        required: true,
        minlength: 4,
        maxlength: 5,
        default: DEFAULT_EMPY_TIME,
    })
    lunch_end_time: string;

    @ApiProperty({
        format: 'hh:mm',
        description: 'Hora mayor al resto',
        default: DEFAULT_EMPY_TIME,
        minLength: 4,
        maxLength: 5,
    })
    @Prop({
        required: true,
        minlength: 4,
        maxlength: 5,
        default: DEFAULT_EMPY_TIME,
    })
    end_time: string;
}

@Schema({ versionKey: false })
export class HourRegister extends TimestampFields {
    @ApiProperty({
        type: String,
        uniqueItems: true,
        example: '6392342f99fa9d34bdc8b2c4',
        nullable: false,
    })
    _id: any;

    @ApiProperty({
        format: 'Iso8601',
        examples: ['2020-09-20', '2022-12-30T23:17:41.471Z'],
    })
    @Prop({ required: true, index: true })
    date: Date;

    @ApiProperty({
        type: User,
    })
    @Prop({ required: true, type: Types.ObjectId, ref: User.name, index: true })
    user: User | Types.ObjectId;

    @ApiProperty({
        default: true,
    })
    @Prop({ required: true, default: true })
    isActive: boolean;
    getObject?() {
        const objt = { ...this };
        if (this.user._id) objt.user = objt.user._id;
        return objt;
    }
}
export const HourRegisterSchema = SchemaFactory.createForClass(HourRegister);
