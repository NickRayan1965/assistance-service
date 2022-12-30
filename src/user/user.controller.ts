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
import { Auth, GetUser } from 'src/auth/decorators';
import { ValidRoles } from 'src/auth/interfaces';
import { ParseMongoIdPipe } from 'src/common/pipe/parse-mongo-id.pipe';
import { User, UserDocument } from 'src/auth/entities/user.entity';
import { BasicsQueryParamsDto } from 'src/common/dto/basics-query-params.dto';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}
    //@Auth(ValidRoles.admin)
    @Get()
    getUsers(@Query() basics_query_paramsDto: BasicsQueryParamsDto) {
        console.log(basics_query_paramsDto);
        return this.userService.getAllUsers(basics_query_paramsDto);
    }
    @Auth(ValidRoles.admin, ValidRoles.employed)
    @Get(':id')
    getUser(
        @Param('id', ParseMongoIdPipe) id: string,
        @GetUser() userPayload: UserDocument,
    ) {
        this.userService.getUserById(id, userPayload);
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
    deleteUser(@Param('id', ParseMongoIdPipe) id: string): void {
        this.userService.deleteOneUser(id);
    }
}
