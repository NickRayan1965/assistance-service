import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { WorkPositionService } from './work-position.service';
import { CreateWorkPositionDto } from './dto/create-work-position.dto';
import { UpdateWorkPositionDto } from './dto/update-work-position.dto';
import { BasicsQueryParamsDto } from '@app/common/dto/basics-query-params.dto';
import { ParseMongoIdPipe } from '@app/common/pipe/parse-mongo-id.pipe';
import { Auth } from '@app/auth/decorators';
import { ValidRoles } from '@app/auth/interfaces';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WorkPosition } from './entities/work-position.entity';
@ApiTags('WorkPosition')
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
    description: 'Token sin autorización',
})
@Controller('work-position')
export class WorkPositionController {
    constructor(private readonly workPositionService: WorkPositionService) {}

    @ApiResponse({
        status: HttpStatus.CREATED,
        type: WorkPosition,
        description: 'WorkPosition creado correctamente',
    })
    @Auth(ValidRoles.admin)
    @Post()
    create(@Body() createWorkPositionDto: CreateWorkPositionDto) {
        return this.workPositionService.create(createWorkPositionDto);
    }

    @ApiResponse({
        status: HttpStatus.OK,
        type: [WorkPosition],
    })
    @Auth(ValidRoles.admin)
    @Get()
    findAll(@Query() basics_query_paramsDto: BasicsQueryParamsDto) {
        return this.workPositionService.findAll(basics_query_paramsDto);
    }

    @ApiResponse({
        status: HttpStatus.OK,
        type: WorkPosition,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Id enviado inexistente',
    })
    @Auth(ValidRoles.admin)
    @Get(':id')
    findById(@Param('id', ParseMongoIdPipe) id: string) {
        return this.workPositionService.findById(id);
    }

    @ApiResponse({
        status: HttpStatus.OK,
        type: WorkPosition,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Id enviado inexistente',
    })
    @Auth(ValidRoles.admin)
    @Patch(':id')
    update(
        @Param('id', ParseMongoIdPipe) id: string,
        @Body() updateWorkPositionDto: UpdateWorkPositionDto,
    ) {
        return this.workPositionService.update(id, updateWorkPositionDto);
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
    async remove(@Param('id', ParseMongoIdPipe) id: string) {
        return await this.workPositionService.remove(id);
    }
}
