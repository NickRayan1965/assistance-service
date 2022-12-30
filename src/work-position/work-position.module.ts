import { Module } from '@nestjs/common';
import { WorkPositionService } from './work-position.service';
import { WorkPositionController } from './work-position.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
    WorkPosition,
    WorkPositionSchema,
} from './entities/work-position.entity';
import { WorkPositionRepository } from './work-position.repository';

@Module({
    controllers: [WorkPositionController],
    providers: [WorkPositionService],
    imports: [
        MongooseModule.forFeature([
            { name: WorkPosition.name, schema: WorkPositionSchema },
        ]),
    ],
    exports: [WorkPositionRepository],
})
export class WorkPositionModule {}
