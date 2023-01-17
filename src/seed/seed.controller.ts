import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserSeed } from './dto/user-seed-execute.dto';
import { SeedResponse } from './dto/seed-response.dto';
import { SeedService } from './seed.service';
@ApiTags('Seed')
@Controller('seed')
export class SeedController {
    constructor(private readonly seedService: SeedService) {}
    @ApiResponse({
        status: HttpStatus.OK,
        type: SeedResponse,
        description: 'DB repoblada correctamente (eliminacion y repoblacion)',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description:
            'Credenciales incorrectas para la repoblación (no son credenciales de un usuario normal)',
    })
    @Post('populate')
    populate(@Body() seedCredentials: UserSeed) {
        return this.seedService.populateDB(seedCredentials);
    }
}
