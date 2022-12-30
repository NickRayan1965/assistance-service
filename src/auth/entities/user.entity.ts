import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ValidRoles, Sex } from '../interfaces';
import { ApiProperty } from '@nestjs/swagger';
import { WorkPosition } from 'src/work-position/entities/work-position.entity';
export const DEFAULT_USER_ROLES = [ValidRoles.employed];
export const DEFAULT_MIN_SALARY = 1025;
export type UserDocument = User & Document;
@Schema({ versionKey: false })
export class User {
    @ApiProperty({
        type: String,
        uniqueItems: true,
        example: '6392342f99fa9d34bdc8b2c4',
        nullable: false,
    })
    _id: any;

    @ApiProperty({
        description: "Email para el usuario, solo email's válidos",
        uniqueItems: true,
        nullable: false,
    })
    @Prop({
        unique: true,
        required: true,
        index: 1,
        minlength: 5,
        maxlength: 150,
    })
    email: string;

    @ApiProperty({
        description: 'Contraseña para el usuario',
        minLength: 6,
        nullable: false,
    })
    @Prop({ required: true, minlength: 6 })
    password: string;

    @ApiProperty({ nullable: false, minLength: 1 })
    @Prop({ required: true, minlength: 1 })
    firtnames: string;

    @ApiProperty({ nullable: false, minLength: 1 })
    @Prop({ required: true, minlength: 1 })
    lastnames: string;

    @ApiProperty({
        nullable: false,
        maxLength: 8,
        minLength: 8,
        uniqueItems: true,
    })
    @Prop({ required: true, length: 8, unique: true })
    dni: string;

    @ApiProperty({ nullable: false, enum: Sex })
    @Prop({ required: true, length: 1 })
    sex: string;

    @ApiProperty({ nullable: false, format: 'Iso8601' })
    @Prop({ required: true })
    birth_date: Date;

    @ApiProperty({ nullable: false, maxLength: 17, format: '+51 999 999 999' })
    @Prop({ maxlength: 17, required: true })
    phone_number: string;

    @ApiProperty({ nullable: false, minimum: DEFAULT_MIN_SALARY })
    @Prop({ required: true, min: DEFAULT_MIN_SALARY })
    salary: number;

    @ApiProperty({
        description: 'Lista de roles del usuario',
        enum: [ValidRoles],
        nullable: false,
        default: DEFAULT_USER_ROLES,
    })
    @Prop({
        type: [String],
        enum: ValidRoles,
        required: true,
        default: DEFAULT_USER_ROLES,
    })
    roles: ValidRoles[];

    @ApiProperty({ nullable: false, format: 'Iso8601' })
    @Prop({ required: true, index: true })
    createdAt: Date;

    @ApiProperty({ nullable: false, format: 'Iso8601' })
    @Prop({ required: true, index: true })
    updatedAt: Date;

    @ApiProperty({ nullable: false, type: WorkPosition })
    @Prop({
        type: Types.ObjectId,
        ref: WorkPosition.name,
        required: true,
        index: true,
    })
    work_position: WorkPosition | Types.ObjectId | string;

    @ApiProperty({ description: 'Estado del registro', nullable: false })
    @Prop({ required: true, default: true })
    isActive: boolean;
}
export const UserSchema = SchemaFactory.createForClass(User);
