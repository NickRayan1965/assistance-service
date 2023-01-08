import { UserCredentialsDto } from './user-credentials-response.dto';

export interface SeedResponse {
    inserted_work_positions: number;
    inserted_users: number;
    inserted_hour_registers: number;
    users_credentials: UserCredentialsDto[];
}
