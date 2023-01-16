import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateWorkPositionDto } from './dto/create-work-position.dto';
import { UpdateWorkPositionDto } from './dto/update-work-position.dto';
import { WorkPositionRepository } from './work-position.repository';
import {
    WorkPosition,
    WorkPositionDocument,
} from './entities/work-position.entity';
import { handleExceptions } from '@app/common/errors/handleExceptions';
import { BasicsQueryParamsDto } from '@app/common/dto/basics-query-params.dto';

@Injectable()
export class WorkPositionService {
    private readonly nameEntity = WorkPosition.name;
    constructor(
        private readonly workPositionRepository: WorkPositionRepository,
    ) {}
    async create(
        createWorkPositionDto: CreateWorkPositionDto,
    ): Promise<WorkPositionDocument> {
        if (
            createWorkPositionDto.work_start_time >=
            createWorkPositionDto.work_end_time
        )
            throw new BadRequestException(
                'La hora de inicio no puede ser igual o mayor a la hora final',
            );
        try {
            const work_position = await this.workPositionRepository.create(
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
        return this.workPositionRepository.findById(id, true);
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
                    true,
                );
            return work_position_updated;
        } catch (error) {
            if (error.status == HttpStatus.NOT_FOUND) throw error;
            handleExceptions(error, this.nameEntity);
        }
    }

    async remove(id: string): Promise<void> {
        await this.workPositionRepository.findByIdAndUpdate(
            id,
            {
                isActive: false,
            },
            true,
        );
    }
}
