import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './entities/user.entity';
import { FilterQuery, Model, PipelineStage } from 'mongoose';
import { CreateUserDto } from './dto';
export interface UserRepository {
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
    ): Promise<UserDocument>;
    aggregate<T>(pipeLinesStages: PipelineStage[]): Promise<T[]>;
}
@Injectable()
export class UserRepository implements UserRepository {
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
        return query;
    }
    async findById(id: string, isRequest = true): Promise<UserDocument> {
        const user = this.userModel.findById(id);
        if (!user && isRequest)
            throw new NotFoundException(
                `No existe el usuario con el id: ${id}`,
            );
        return user.exec();
    }
    async findOne(userFilterQuery: FilterQuery<User>): Promise<UserDocument> {
        return this.userModel.findOne(userFilterQuery).exec();
    }
    async findByIdAndUpdate(
        id: string,
        user: Partial<User>,
    ): Promise<UserDocument> {
        const userUpdated = this.userModel.findByIdAndUpdate(id, user, {
            new: true,
        });
        if (!userUpdated)
            throw new NotFoundException(
                `No existe el usuario con el id: ${id}`,
            );
        return userUpdated.exec();
    }
    async aggregate<T>(pipeLinesStages: PipelineStage[]): Promise<T[]> {
        return this.userModel.aggregate<T>(pipeLinesStages);
    }
}
