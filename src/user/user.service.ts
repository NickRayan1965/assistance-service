import { Injectable } from '@nestjs/common';
import { User, UserDocument } from 'src/auth/entities/user.entity';
import { UserRepository } from 'src/auth/users.repository';
import { UpdateUserDto } from './dto/update-user.dto';
import { handleExceptions } from 'src/common/errors/handleExceptions';
import * as bcrypt from 'bcrypt';
import { replaceDoubleSpacesAndTrim } from 'src/common/func/replaceDoubleSpacesAndTrim.func';
import { ValidateResourceOwner } from 'src/auth/guards';
import { WorkPositionRepository } from 'src/work-position/work-position.repository';
import { PipelineStage, Types } from 'mongoose';
import { UserQueryParamsDto } from './dto/user-query-params.dto';
import {
    pipeLinesStageToFilterNamesComplexly,
    pipeLinesStageToFilterSimpleNames,
    pipelineStageToConnectToNestedObject,
} from 'src/common/pipeLineStages';
@Injectable()
export class UserService {
    private readonly nameEntity = User.name;
    constructor(
        private readonly userRepository: UserRepository,
        private readonly workPositionRepository: WorkPositionRepository,
    ) {}

    async getAllUsers(
        user_query_paramsDto: UserQueryParamsDto,
    ): Promise<User[]> {
        const pipelinesStages: PipelineStage[] = [{ $match: {} }];
        const {
            all,
            inactive,
            limit,
            offset,
            fullNameComplex,
            workPosition,
            fullNameSimple,
        } = user_query_paramsDto;
        if (!all) pipelinesStages[0]['$match'].isActive = true;
        if (inactive) pipelinesStages[0]['$match'].isActive = false;
        const workPositionPipelinesStages =
            pipelineStageToConnectToNestedObject({
                from: 'workpositions',
                localField: 'work_position',
                id_match: workPosition,
            });
        pipelinesStages.push(...workPositionPipelinesStages);

        if (fullNameComplex) {
            pipelinesStages.push(
                ...pipeLinesStageToFilterNamesComplexly(
                    fullNameComplex,
                    'firstnames',
                    'lastnames',
                ),
            );
        }
        if (fullNameSimple) {
            pipelinesStages.push(
                ...pipeLinesStageToFilterSimpleNames(
                    fullNameSimple,
                    'firstnames',
                    'lastnames',
                ),
            );
        }
        pipelinesStages.push({ $skip: limit * offset });
        pipelinesStages.push({ $limit: limit });
        return this.userRepository.aggregate<User>(pipelinesStages);
    }

    async getUserById(id: string, userPayload: UserDocument): Promise<User> {
        const user = await this.userRepository.findById(id, true);
        ValidateResourceOwner(userPayload, user, '_id');
        return user;
    }

    async updateOneUser(
        id: string,
        updateUserDto: UpdateUserDto,
    ): Promise<User> {
        try {
            if (updateUserDto.work_position) {
                await this.workPositionRepository.findById(
                    updateUserDto.work_position.toString(),
                );
                updateUserDto.work_position = new Types.ObjectId(
                    updateUserDto.work_position,
                );
            }

            const { password } = updateUserDto;
            if (password)
                updateUserDto.password = bcrypt.hashSync(password, 10);
            updateUserDto.phone_number = replaceDoubleSpacesAndTrim(
                updateUserDto.phone_number,
            );
            updateUserDto.updatedAt = new Date();

            const userUpdated = await this.userRepository.findByIdAndUpdate(
                id,
                updateUserDto,
            );
            return userUpdated;
        } catch (error) {
            handleExceptions(error, this.nameEntity);
        }
    }
    async deleteOneUser(id: string) {
        await this.userRepository.findByIdAndUpdate(id, { isActive: false });
    }
}
