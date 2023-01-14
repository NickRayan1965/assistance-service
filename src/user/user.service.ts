import { Injectable, NotFoundException } from '@nestjs/common';
import { User, UserDocument } from '@app/auth/entities/user.entity';
import { UserRepository } from '@app/auth/users.repository';
import { UpdateUserDto } from './dto/update-user.dto';
import { handleExceptions } from '@app/common/errors/handleExceptions';
import * as bcrypt from 'bcrypt';
import { replaceDoubleSpacesAndTrim } from '@app/common/func/replaceDoubleSpacesAndTrim.func';
import { ValidateResourceOwner } from '@app/auth/guards';
import { WorkPositionRepository } from '@app/work-position/work-position.repository';
import { Types } from 'mongoose';
import { UserQueryParamsDto } from './dto/user-query-params.dto';
import { pipelineStagesByUserQueryParams } from './utilities/pipelinesStages-by-user-query-params.util';
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
        const pipelinesStages =
            pipelineStagesByUserQueryParams(user_query_paramsDto);
        return this.userRepository.aggregate<User>(pipelinesStages);
    }

    async getUserById(id: string, userPayload: UserDocument): Promise<User> {
        const user = await (
            await this.userRepository.findById(id, true)
        ).populate('work_position');
        ValidateResourceOwner(userPayload, user, '_id');
        return user;
    }

    async updateOneUser(
        id: string,
        updateUserDto: UpdateUserDto,
    ): Promise<User> {
        if (updateUserDto.work_position) {
            await this.workPositionRepository.findById(
                updateUserDto.work_position.toString(),
                true,
            );
            updateUserDto.work_position = new Types.ObjectId(
                updateUserDto.work_position,
            );
        }
        const { password } = updateUserDto;
        if (password) updateUserDto.password = bcrypt.hashSync(password, 10);
        if (updateUserDto.phone_number)
            updateUserDto.phone_number = replaceDoubleSpacesAndTrim(
                updateUserDto.phone_number,
            );
        let userUpdated: UserDocument;
        try {
            userUpdated = await this.userRepository.findByIdAndUpdate(id, {
                ...updateUserDto,
                updatedAt: new Date(),
            } as User);
        } catch (error) {
            handleExceptions(error, this.nameEntity);
        }
        if (!userUpdated)
            throw new NotFoundException(
                `No existe el usuario con el id: ${id}`,
            );
        return await userUpdated.populate('work_position');
    }
    async deleteOneUser(id: string) {
        await this.userRepository.findByIdAndUpdate(
            id,
            { isActive: false },
            true,
        );
    }
}
