import { FilterQuery, Model, PipelineStage } from 'mongoose';
import { CreateWorkPositionDto } from './dto/create-work-position.dto';
import {
    WorkPosition,
    WorkPositionDocument,
} from './entities/work-position.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

export interface IWorkPositionRepository {
    create(
        createWorkPositionDto: CreateWorkPositionDto,
    ): Promise<WorkPositionDocument>;
    find(
        workPositionFilterQuery: FilterQuery<WorkPositionDocument>,
        limit: number,
        offset: number,
    ): Promise<WorkPositionDocument[]>;
    findById(id: string, isRequest: boolean): Promise<WorkPositionDocument>;
    findOne(
        workPositionFilterQuery: FilterQuery<WorkPosition>,
    ): Promise<WorkPositionDocument>;
    findByIdAndUpdate(
        id: string,
        workPositionUpdates: Partial<WorkPosition>,
        isRequest: boolean,
    ): Promise<WorkPositionDocument>;
    insertMany(workPositions: WorkPosition[]): Promise<any>;

    deleteMany(filterQuery: FilterQuery<WorkPositionDocument>): Promise<any>;
    aggregate<T>(pipeLinesStages: PipelineStage[]): Promise<T[]>;
}
@Injectable()
export class WorkPositionRepository implements IWorkPositionRepository {
    constructor(
        @InjectModel(WorkPosition.name)
        private readonly workPositionModel: Model<WorkPositionDocument>,
    ) {}
    async insertMany(workPositions: WorkPosition[]): Promise<any> {
        return this.workPositionModel.insertMany(workPositions);
    }
    async create(
        createWorkPositionDto: CreateWorkPositionDto,
    ): Promise<WorkPositionDocument> {
        return this.workPositionModel.create(createWorkPositionDto);
    }
    async find(
        workPositionFilterQuery?: FilterQuery<WorkPosition>,
        limit?: number,
        offset = 0,
    ): Promise<WorkPositionDocument[]> {
        const query = this.workPositionModel.find(workPositionFilterQuery);
        if (offset) query.skip(offset * limit);
        if (limit) query.limit(limit);
        return query.exec();
    }
    async findById(
        id: string,
        isRequest = false,
    ): Promise<WorkPositionDocument> {
        const work_position = await this.workPositionModel.findById(id);
        if (!work_position && isRequest)
            throw new NotFoundException(
                `No existe la posici??n de trabajo con el id: ${id}`,
            );
        return work_position;
    }
    async findOne(
        workPositionFilterQuery: FilterQuery<WorkPositionDocument>,
    ): Promise<WorkPositionDocument> {
        return this.workPositionModel.findOne(workPositionFilterQuery).exec();
    }
    async findByIdAndUpdate(
        id: string,
        work_position_updates: Partial<WorkPosition>,
        isRequest = false,
    ): Promise<WorkPositionDocument> {
        const work_position_update =
            await this.workPositionModel.findByIdAndUpdate(
                id,
                work_position_updates,
                {
                    new: true,
                },
            );
        if (!work_position_update && isRequest)
            throw new NotFoundException(
                `No existe la posici??n de trabajo con el id: ${id}`,
            );
        return work_position_update;
    }
    async deleteMany(filterQuery?: FilterQuery<WorkPosition>) {
        return this.workPositionModel.deleteMany(filterQuery).exec();
    }
    async aggregate<T>(pipeLinesStages: PipelineStage[]): Promise<T[]> {
        return this.workPositionModel.aggregate<T>(pipeLinesStages).exec();
    }
}
