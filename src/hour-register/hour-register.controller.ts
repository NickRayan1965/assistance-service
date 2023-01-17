import {
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Query,
} from '@nestjs/common';
import { HourRegisterService } from './hour-register.service';
import { ParseMongoIdPipe } from '@app/common/pipe/parse-mongo-id.pipe';
import { ParseDateIso8601Pipe } from '@app/common/pipe/parse-date-iso8601.pipe';
import { ParseHoursMinutes24FPipe } from '@app/common/pipe/parse-hours-minutes24-f.pipe';
import { Auth, GetUser } from '@app/auth/decorators';
import { ValidRoles } from '@app/auth/interfaces';
import { HourRegisterQueryParamDto } from './dto/hour-register-query-params.dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { HourRegister } from './entities/hour-register.entity';
import { User } from '@app/auth/entities/user.entity';
@ApiTags('HourRegister')
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
        'Token sin autorización o sin permisos para acceder al/los recurso(s)',
})
@Controller('hour-register')
export class HourRegisterController {
    constructor(private readonly hourRegisterService: HourRegisterService) {}

    @ApiResponse({
        status: HttpStatus.OK,
        type: [HourRegister],
    })
    @Get()
    @Auth(ValidRoles.admin)
    getAll(
        @Query() hour_register_query_params: HourRegisterQueryParamDto,
        @GetUser() requestingUser: User,
    ) {
        return this.hourRegisterService.findAll(
            hour_register_query_params,
            requestingUser,
        );
    }

    @ApiResponse({
        status: HttpStatus.OK,
        type: HourRegister,
        description: 'Devuelve el `hour register`; si no existe, lo crea',
    })
    @Get('getOrCreate/:userId/:date')
    getOneOrCreate(
        @Param('userId', ParseMongoIdPipe) userId: string,
        @Param('date', ParseDateIso8601Pipe) date: string | Date,
        @GetUser() requestingUser: User,
    ) {
        return this.hourRegisterService.getOrCreateByUserIdAndDate(
            userId,
            typeof date == 'string' ? new Date(date) : date,
            requestingUser,
        );
    }

    @ApiResponse({
        status: HttpStatus.OK,
        type: HourRegister,
        description:
            'Actualiza la marca de tiempo indicada, calcula los campos indicativos y retorna el registro',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: '`HourRegister` con el userId y fecha enviado inexistente',
    })
    @Get('update/:userId/:date/:hour_minutes')
    setTimestampAndGetOne(
        @Query('name_time') name_time: string,
        @Param('userId', ParseMongoIdPipe) userId: string,
        @Param('hour_minutes', ParseHoursMinutes24FPipe) hour_minutes: string,
        @Param('date', ParseDateIso8601Pipe) date: string | Date,
        @GetUser() requestingUser: User,
    ) {
        return this.hourRegisterService.setTimestampAndGet(
            userId,
            typeof date == 'string' ? new Date(date) : date,
            hour_minutes,
            name_time,
            requestingUser,
        );
    }

    @ApiResponse({
        status: HttpStatus.NO_CONTENT,
        description: 'Cambia el estado del recurso a activo (true)',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Id enviado inexistente',
    })
    @Auth(ValidRoles.admin)
    @Patch('activate/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async activateHourRegister(@Param('id', ParseMongoIdPipe) id: string) {
        await this.hourRegisterService.activate(id);
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
    async deleteOne(@Param('id', ParseMongoIdPipe) id: string) {
        await this.hourRegisterService.deleteOne(id);
    }
}
