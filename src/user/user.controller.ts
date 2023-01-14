import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { Auth, GetUser } from '@app/auth/decorators';
import { ValidRoles } from '@app/auth/interfaces';
import { ParseMongoIdPipe } from '@app/common/pipe/parse-mongo-id.pipe';
import { User, UserDocument } from '@app/auth/entities/user.entity';
import { UserQueryParamsDto } from './dto/user-query-params.dto';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}
    @Auth(ValidRoles.admin)
    @Get()
    getUsers(@Query() user_query_params: UserQueryParamsDto) {
        return this.userService.getAllUsers(user_query_params);
    }
    @Auth(ValidRoles.admin, ValidRoles.employed)
    @Get(':id')
    getUser(
        @Param('id', ParseMongoIdPipe) id: string,
        @GetUser() userPayload: UserDocument,
    ) {
        return this.userService.getUserById(id, userPayload);
    }
    @Auth(ValidRoles.admin)
    @Patch(':id')
    updateUser(
        @Param('id', ParseMongoIdPipe) id: string,
        @Body() updateUserDto: UpdateUserDto,
    ): Promise<User> {
        return this.userService.updateOneUser(id, updateUserDto);
    }
    @Auth(ValidRoles.admin)
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteUser(@Param('id', ParseMongoIdPipe) id: string): Promise<void> {
        await this.userService.deleteOneUser(id);
    }
}
