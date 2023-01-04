import { Module, forwardRef } from '@nestjs/common';
import { WorkPositionService } from './work-position.service';
import { WorkPositionController } from './work-position.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
    WorkPosition,
    WorkPositionSchema,
} from './entities/work-position.entity';
import { WorkPositionRepository } from './work-position.repository';
import { AuthModule } from 'src/auth/auth.module';

@Module({
    controllers: [WorkPositionController],
    providers: [WorkPositionService, WorkPositionRepository],
    imports: [
        MongooseModule.forFeature([
            { name: WorkPosition.name, schema: WorkPositionSchema },
        ]),
        forwardRef(() => AuthModule),
    ],
    exports: [WorkPositionRepository],
})
export class WorkPositionModule {}
