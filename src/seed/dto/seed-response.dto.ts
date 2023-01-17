import { ApiProperty } from '@nestjs/swagger';
import { UserCredentialsDto } from './user-credentials-response.dto';

export class SeedResponse {
    @ApiProperty()
    inserted_work_positions: number;
    @ApiProperty()
    inserted_users: number;
    @ApiProperty()
    inserted_hour_registers: number;
    @ApiProperty({ type: UserCredentialsDto })
    users_credentials: UserCredentialsDto[];
}
