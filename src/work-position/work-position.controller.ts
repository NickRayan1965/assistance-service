import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
} from '@nestjs/common';
import { WorkPositionService } from './work-position.service';
import { CreateWorkPositionDto } from './dto/create-work-position.dto';
import { UpdateWorkPositionDto } from './dto/update-work-position.dto';
import { BasicsQueryParamsDto } from 'src/common/dto/basics-query-params.dto';
import { ParseMongoIdPipe } from 'src/common/pipe/parse-mongo-id.pipe';

@Controller('work-position')
export class WorkPositionController {
    constructor(private readonly workPositionService: WorkPositionService) {}

    @Post()
    create(@Body() createWorkPositionDto: CreateWorkPositionDto) {
        return this.workPositionService.create(createWorkPositionDto);
    }

    @Get()
    findAll(@Query() basics_query_paramsDto: BasicsQueryParamsDto) {
        return this.workPositionService.findAll(basics_query_paramsDto);
    }

    @Get(':id')
    findOne(@Param('id', ParseMongoIdPipe) id: string) {
        return this.workPositionService.findById(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseMongoIdPipe) id: string,
        @Body() updateWorkPositionDto: UpdateWorkPositionDto,
    ) {
        return this.workPositionService.update(id, updateWorkPositionDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseMongoIdPipe) id: string) {
        return this.workPositionService.remove(id);
    }
}
