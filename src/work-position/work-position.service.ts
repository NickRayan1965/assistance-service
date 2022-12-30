import { Injectable } from '@nestjs/common';
import { CreateWorkPositionDto } from './dto/create-work-position.dto';
import { UpdateWorkPositionDto } from './dto/update-work-position.dto';
import { WorkPositionRepository } from './work-position.repository';
import {
    WorkPosition,
    WorkPositionDocument,
} from './entities/work-position.entity';
import { handleExceptions } from 'src/common/errors/handleExceptions';
import { BasicsQueryParamsDto } from 'src/common/dto/basics-query-params.dto';

@Injectable()
export class WorkPositionService {
    private readonly nameEntity = WorkPosition.name;
    constructor(
        private readonly workPositionRepository: WorkPositionRepository,
    ) {}
    create(
        createWorkPositionDto: CreateWorkPositionDto,
    ): Promise<WorkPositionDocument> {
        try {
            const work_position = this.workPositionRepository.create(
                createWorkPositionDto,
            );
            return work_position;
        } catch (error) {
            handleExceptions(error, this.nameEntity);
        }
    }

    findAll(
        basics_query_paramsDto: BasicsQueryParamsDto,
    ): Promise<WorkPositionDocument[]> {
        const work_position_filter: Partial<WorkPosition> = {};
        const { all, inactive, limit, offset } = basics_query_paramsDto;
        if (!all) work_position_filter.isActive = true;
        if (inactive) work_position_filter.isActive = false;
        return this.workPositionRepository.find(
            work_position_filter,
            limit,
            offset,
        );
    }

    findById(id: string): Promise<WorkPositionDocument> {
        return this.workPositionRepository.findById(id);
    }

    async update(
        id: string,
        updateWorkPositionDto: UpdateWorkPositionDto,
    ): Promise<WorkPositionDocument> {
        try {
            const work_position_updated =
                await this.workPositionRepository.findByIdAndUpdate(
                    id,
                    updateWorkPositionDto,
                );
            return work_position_updated;
        } catch (error) {
            handleExceptions(error, this.nameEntity);
        }
    }

    async remove(id: string): Promise<void> {
        await this.workPositionRepository.findByIdAndUpdate(id, {
            isActive: false,
        });
    }
}
