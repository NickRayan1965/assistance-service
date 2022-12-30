import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export type WorkPositionDocument = WorkPosition & Document;

@Schema({ versionKey: false })
export class WorkPosition {
    @ApiProperty({
        type: String,
        uniqueItems: true,
        example: '6392342f99fa9d34bdc8b2c4',
    })
    _id: any;

    @ApiProperty({ nullable: false, uniqueItems: true, minLength: 1 })
    @Prop({ required: true, unique: true, minlength: 1 })
    name: string;

    @Prop({ required: true, minlength: 1 })
    @ApiProperty({ nullable: false, minLength: 1 })
    description: string;

    @ApiProperty({
        format: 'hh:mm',
        description: 'Hora de inicio de trabajo',
        minLength: 4,
        maxLength: 5,
        nullable: false,
    })
    @Prop({ required: true, maxlength: 5, minlength: 4 })
    work_start_time: string;

    @ApiProperty({
        format: 'hh:mm',
        description: 'Hora de final de trabajo',
        minLength: 4,
        maxLength: 5,
        nullable: false,
    })
    @Prop({ required: true, maxlength: 5, minlength: 4 })
    work_end_time: string;

    @ApiProperty({ default: true, nullable: false })
    @Prop({ required: true, default: true })
    isActive: boolean;
}

export const WorkPositionSchema = SchemaFactory.createForClass(WorkPosition);
