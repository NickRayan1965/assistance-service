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
import { ParseMongoIdPipe } from 'src/common/pipe/parse-mongo-id.pipe';
import { ParseDateIso8601Pipe } from 'src/common/pipe/parse-date-iso8601.pipe';
import { ParseHoursMinutes24FPipe } from 'src/common/pipe/parse-hours-minutes24-f.pipe';

@Controller('hour-register')
export class HourRegisterController {
    constructor(private readonly hourRegisterService: HourRegisterService) {}

    @Get('getOrCreate/:userId/:date')
    getOneOrCreate(
        @Param('userId', ParseMongoIdPipe) userId: string,
        @Param('date', ParseDateIso8601Pipe) date: string | Date,
    ) {
        return this.hourRegisterService.getOrCreateByUserIdAndDate(
            userId,
            typeof date == 'string' ? new Date(date) : date,
        );
    }
    @Get('update/:userId/:date/:hour_minutes')
    setTimestampAndGetOne(
        @Query('name_time') name_time: string,
        @Param('userId', ParseMongoIdPipe) userId: string,
        @Param('hour_minutes', ParseHoursMinutes24FPipe) hour_minutes: string,
        @Param('date', ParseDateIso8601Pipe) date: string | Date,
    ) {
        return this.hourRegisterService.setTimestampAndGet(
            userId,
            typeof date == 'string' ? new Date(date) : date,
            hour_minutes,
            name_time,
        );
    }
    @Patch('activate/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async activateHourRegister(@Param('id', ParseMongoIdPipe) id: string) {
        await this.hourRegisterService.activate(id);
    }
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteOne(@Param('id', ParseMongoIdPipe) id: string) {
        await this.hourRegisterService.deleteOne(id);
    }
}
