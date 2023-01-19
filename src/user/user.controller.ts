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
import { User } from '@app/auth/entities/user.entity';
import { UserQueryParamsDto } from './dto/user-query-params.dto';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
@ApiTags('Users')
@ApiBearerAuth()
@ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos enviados incorrectos',
})
@ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token inválido',
})
@ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
        'Token sin autorización o sin permisos para acceder al recurso',
})
@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @ApiResponse({
        status: HttpStatus.OK,
        type: [User],
    })
    @Auth(ValidRoles.admin)
    @Get()
    getUsers(@Query() user_query_params: UserQueryParamsDto) {
        return this.userService.getAllUsers(user_query_params);
    }

    @ApiResponse({
        status: HttpStatus.OK,
        type: User,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Id enviado inexistente',
    })
    @Auth(ValidRoles.admin, ValidRoles.employed)
    @Get(':id')
    getUser(
        @Param('id', ParseMongoIdPipe) id: string,
        @GetUser() requestingUSer: User,
    ) {
        return this.userService.getUserById(id, requestingUSer);
    }

    @ApiResponse({
        status: HttpStatus.OK,
        type: User,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Id enviado inexistente',
    })
    @Auth(ValidRoles.admin)
    @Patch(':id')
    async updateUser(
        @Param('id', ParseMongoIdPipe) id: string,
        @Body() updateUserDto: UpdateUserDto,
    ): Promise<User> {
        return await this.userService.updateOneUser(id, updateUserDto);
    }

    @ApiResponse({
        status: HttpStatus.NO_CONTENT,
        description: 'Eliminado correctamente (estado puesto en inactivo)',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Id enviado inexistente',
    })
    @Auth(ValidRoles.admin)
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteUser(@Param('id', ParseMongoIdPipe) id: string): Promise<void> {
        await this.userService.deleteOneUser(id);
    }
}
