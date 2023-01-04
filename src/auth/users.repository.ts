import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './entities/user.entity';
import { FilterQuery, Model, PipelineStage } from 'mongoose';
import { CreateUserDto } from './dto';
export interface IUserRepository {
    create(createUserDto: CreateUserDto): Promise<UserDocument>;
    find(
        userFilterQuery: FilterQuery<User>,
        limit: number,
        offset: number,
    ): Promise<UserDocument[]>;
    findById(id: string, isRequest: boolean): Promise<UserDocument>;
    findOne(userFilterQuery: FilterQuery<User>): Promise<UserDocument>;
    findByIdAndUpdate(
        id: string,
        userUpdates: Partial<User>,
        isRequest: boolean,
    ): Promise<UserDocument>;
    aggregate<T>(pipeLinesStages: PipelineStage[]): Promise<T[]>;
}
@Injectable()
export class UserRepository implements IUserRepository {
    constructor(
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    ) {}
    async create(user: CreateUserDto): Promise<UserDocument> {
        return this.userModel.create(user);
    }
    async find(
        userFilterQuery?: FilterQuery<User>,
        limit?: number,
        offset = 0,
    ): Promise<UserDocument[]> {
        const query = this.userModel.find(userFilterQuery);
        if (offset) query.skip(offset * limit);
        if (limit) query.limit(limit);
        return query.exec();
    }
    async findById(id: string, isRequest = false): Promise<UserDocument> {
        const user = await this.userModel.findById(id);
        if (!user && isRequest)
            throw new NotFoundException(
                `No existe el usuario con el id: ${id}`,
            );
        return user;
    }
    async findOne(userFilterQuery: FilterQuery<User>): Promise<UserDocument> {
        return this.userModel.findOne(userFilterQuery).exec();
    }
    async findByIdAndUpdate(
        id: string,
        userUpdates: Partial<User>,
        isRequest = false,
    ): Promise<UserDocument> {
        const userUpdated = await this.userModel.findByIdAndUpdate(
            id,
            userUpdates,
            {
                new: true,
            },
        );
        if (!userUpdated && isRequest)
            throw new NotFoundException(
                `No existe el usuario con el id: ${id}`,
            );
        return userUpdated;
    }
    async aggregate<T>(pipeLinesStages: PipelineStage[]): Promise<T[]> {
        return this.userModel.aggregate<T>(pipeLinesStages).exec();
    }
}
