import { Body, Controller, Post } from '@nestjs/common';
import { UserSeed } from './dto/user-seed-execute.dto';
import { SeedService } from './seed.service';

@Controller('seed')
export class SeedController {
    constructor(private readonly seedService: SeedService) {}
    @Post('populate')
    populate(@Body() seedCredentials: UserSeed) {
        return this.seedService.populateDB(seedCredentials);
    }
}
