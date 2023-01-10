import { FilterQuery, Model, PipelineStage, Types } from 'mongoose';
import {
    HourRegister,
    HourRegisterDocument,
} from './entities/hour-register.entity';
import { InjectModel } from '@nestjs/mongoose';
import { UserRepository } from '@app/auth/users.repository';
import { CreateHourRegisterDto } from './dto/create-hour-register.dto';
import { NotFoundException } from '@nestjs/common';

export interface IHourRegisterRepository {
    create(hourRegister: CreateHourRegisterDto): Promise<HourRegister>;
    getOrCreateByUserIdAndDate(
        userId: string | Types.ObjectId,
        date: Date,
    ): Promise<HourRegister>;
    find(
        hourRegisterFilterQuery: FilterQuery<HourRegisterDocument>,
        limit: number,
        offset: number,
    ): Promise<HourRegister[]>;
    findById(
        id: string | Types.ObjectId,
        isRequest: boolean,
    ): Promise<HourRegister>;

    findOne(
        hourRegisterFilterQuery: FilterQuery<HourRegister>,
    ): Promise<HourRegister>;
    findByIdAndUpdate(
        id: string | Types.ObjectId,
        hourRegisterUpdates: Partial<HourRegister>,
        isRequest: boolean,
    ): Promise<HourRegister>;
    insertMany(hourRegisters: HourRegister[]): Promise<any>;

    deleteMany(filterQuery: FilterQuery<HourRegisterDocument>): Promise<any>;
    aggregate<T>(pipeLinesStages: PipelineStage[]): Promise<T[]>;
}
export class HourRegisterRepository implements IHourRegisterRepository {
    constructor(
        @InjectModel(HourRegister.name)
        private readonly hourRegisterModel: Model<HourRegisterDocument>,
        private readonly userRepository: UserRepository,
    ) {}
    insertMany(hourRegisters: HourRegister[]): Promise<any> {
        return this.hourRegisterModel.insertMany(hourRegisters);
    }
    async create(hourRegister: CreateHourRegisterDto): Promise<HourRegister> {
        return this.hourRegisterModel.create(hourRegister);
    }

    async getByUserIdAndDate(
        userId: string | Types.ObjectId,
        date: Date,
        isRequest = false,
    ): Promise<HourRegister> {
        const user = new Types.ObjectId(userId);
        const hour_register =
            await this.hourRegisterModel.findOne<HourRegister>({
                user,
                date,
            });
        if (!hour_register && isRequest)
            throw new NotFoundException(
                `No existe el Registro de horas con el usuario de id '${userId}' y la fecha ${
                    date.toISOString().split('T')[0]
                }`,
            );
        return hour_register;
    }

    async getOrCreateByUserIdAndDate(
        userId: string | Types.ObjectId,
        date: Date,
    ): Promise<HourRegister> {
        0;
        let hourRegister = await this.getByUserIdAndDate(userId, date);
        if (!hourRegister) {
            await this.userRepository.findById(userId.toString(), true);
            hourRegister = await this.create({
                date,
                user: new Types.ObjectId(userId),
            });
        }
        return hourRegister;
    }

    async find(
        hourRegisterFilterQuery: FilterQuery<HourRegisterDocument>,
        limit?: number,
        offset = 0,
    ): Promise<HourRegisterDocument[]> {
        const query = this.hourRegisterModel.find(hourRegisterFilterQuery);
        if (offset) query.skip(offset * limit);
        if (limit) query.limit(limit);
        return query.exec();
    }
    async findById(
        id: string | Types.ObjectId,
        isRequest = false,
    ): Promise<HourRegisterDocument> {
        const hour_register = await this.hourRegisterModel.findById(id);
        if (!hour_register && isRequest)
            throw new NotFoundException(
                `No existe el Registro de horas con el id: ${id}`,
            );
        return hour_register;
    }
    async findOne(
        hourRegisterFilterQuery: FilterQuery<HourRegister>,
    ): Promise<HourRegisterDocument> {
        return this.hourRegisterModel.findOne(hourRegisterFilterQuery).exec();
    }
    async findByIdAndUpdate(
        id: string | Types.ObjectId,
        hourRegisterUpdates: Partial<HourRegister>,
        isRequest = false,
    ): Promise<HourRegisterDocument> {
        const hourRegisterUpdated =
            await this.hourRegisterModel.findByIdAndUpdate(
                id,
                hourRegisterUpdates,
                {
                    new: true,
                },
            );
        if (!hourRegisterUpdated && isRequest)
            throw new NotFoundException(
                `No existe el registro de horas con el id: ${id}`,
            );
        return hourRegisterUpdated;
    }
    async deleteMany(filterQuery?: FilterQuery<HourRegisterDocument>) {
        return this.hourRegisterModel.deleteMany(filterQuery).exec();
    }
    async aggregate<T>(pipeLinesStages: PipelineStage[]): Promise<T[]> {
        return this.hourRegisterModel.aggregate<T>(pipeLinesStages);
    }
}
