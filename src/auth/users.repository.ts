import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './entities/user.entity';
import { FilterQuery, Model, PipelineStage } from 'mongoose';
export interface IUserRepository {
    create(userToCreate: Partial<User>): Promise<User>;
    find(
        userFilterQuery: FilterQuery<User>,
        limit: number,
        offset: number,
    ): Promise<User[]>;
    findById(id: string, isRequest: boolean): Promise<User>;
    findOne(userFilterQuery: FilterQuery<User>): Promise<User>;
    findByIdAndUpdate(
        id: string,
        userUpdates: Partial<User>,
        isRequest: boolean,
    ): Promise<UserDocument>;
    insertMany(users: User[]): Promise<any>;
    deleteMany(filterQuery: FilterQuery<UserDocument>): Promise<any>;
    aggregate<T>(pipeLinesStages: PipelineStage[]): Promise<T[]>;
}
@Injectable()
export class UserRepository implements IUserRepository {
    constructor(
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    ) {}
    async insertMany(users: User[]) {
        return this.userModel.insertMany(users);
    }

    async create(userToCreate: Partial<User>): Promise<User> {
        return this.userModel.create(userToCreate);
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
    async findById(id: string, isRequest = false): Promise<User> {
        const user = await this.userModel.findById(id);
        if (!user && isRequest)
            throw new NotFoundException(
                `No existe el usuario con el id: ${id}`,
            );
        return user;
    }
    async findOne(userFilterQuery: FilterQuery<User>): Promise<User> {
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
    async deleteMany(filterQuery?: FilterQuery<UserDocument>) {
        return this.userModel.deleteMany(filterQuery).exec();
    }
    async aggregate<T>(pipeLinesStages: PipelineStage[]): Promise<T[]> {
        return this.userModel.aggregate<T>(pipeLinesStages).exec();
    }
}
