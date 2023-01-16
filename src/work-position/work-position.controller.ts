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

@Controller('work-position')
export class WorkPositionController {
    constructor(private readonly workPositionService: WorkPositionService) {}

    @Auth(ValidRoles.admin)
    @Post()
    create(@Body() createWorkPositionDto: CreateWorkPositionDto) {
        return this.workPositionService.create(createWorkPositionDto);
    }

    @Auth(ValidRoles.admin)
    @Get()
    findAll(@Query() basics_query_paramsDto: BasicsQueryParamsDto) {
        return this.workPositionService.findAll(basics_query_paramsDto);
    }

    @Auth(ValidRoles.admin)
    @Get(':id')
    findById(@Param('id', ParseMongoIdPipe) id: string) {
        return this.workPositionService.findById(id);
    }

    @Auth(ValidRoles.admin)
    @Patch(':id')
    update(
        @Param('id', ParseMongoIdPipe) id: string,
        @Body() updateWorkPositionDto: UpdateWorkPositionDto,
    ) {
        return this.workPositionService.update(id, updateWorkPositionDto);
    }

    @Auth(ValidRoles.admin)
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id', ParseMongoIdPipe) id: string) {
        return await this.workPositionService.remove(id);
    }
}
