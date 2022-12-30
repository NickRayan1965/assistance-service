import { Injectable } from '@nestjs/common';
import { User, UserDocument } from 'src/auth/entities/user.entity';
import { UserRepository } from 'src/auth/users.repository';
import { UpdateUserDto } from './dto/update-user.dto';
import { handleExceptions } from 'src/common/errors/handleExceptions';
import * as bcrypt from 'bcrypt';
import { replaceDoubleSpacesAndTrim } from 'src/common/func/replaceDoubleSpacesAndTrim.func';
import { ValidateResourceOwner } from 'src/auth/guards';
import { BasicsQueryParamsDto } from 'src/common/dto/basics-query-params.dto';
import { WorkPositionRepository } from 'src/work-position/work-position.repository';
@Injectable()
export class UserService {
    private readonly nameEntity = User.name;
    constructor(
        private readonly userRepository: UserRepository,
        private readonly workPositionRepository: WorkPositionRepository,
    ) {}

    async getAllUsers(
        basics_query_paramsDto: BasicsQueryParamsDto,
    ): Promise<User[]> {
        const userFilter: Partial<User> = {};
        const { all, inactive, limit, offset } = basics_query_paramsDto;
        if (!all) userFilter.isActive = true;
        if (inactive) userFilter.isActive = false;
        return this.userRepository.find(userFilter, limit, offset);
    }

    async getUserById(id: string, userPayload: UserDocument): Promise<User> {
        const user = await this.userRepository.findById(id);
        ValidateResourceOwner(userPayload, user, '_id');
        return user;
    }

    async updateOneUser(
        id: string,
        updateUserDto: UpdateUserDto,
    ): Promise<User> {
        try {
            if (updateUserDto.work_position)
                await this.workPositionRepository.findById(
                    updateUserDto.work_position,
                );

            const { password } = updateUserDto;
            if (password)
                updateUserDto.password = bcrypt.hashSync(password, 10);
            updateUserDto.phone_number = replaceDoubleSpacesAndTrim(
                updateUserDto.phone_number,
            );
            updateUserDto.updatedAt = new Date();

            updateUserDto.firstnames = updateUserDto.firstnames
                ? replaceDoubleSpacesAndTrim(
                      updateUserDto.firstnames.toUpperCase(),
                  )
                : updateUserDto.firstnames;
            updateUserDto.lastnames = updateUserDto.lastnames
                ? replaceDoubleSpacesAndTrim(
                      updateUserDto.lastnames.toUpperCase(),
                  )
                : updateUserDto.lastnames;

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
