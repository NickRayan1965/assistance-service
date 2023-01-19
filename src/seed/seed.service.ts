import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from '@app/auth/users.repository';
import { HourRegisterRepository } from '@app/hour-register/hour-register.repository';
import { WorkPositionRepository } from '@app/work-position/work-position.repository';
import { UserSeed } from './dto/user-seed-execute.dto';
import { ConfigService } from '@nestjs/config';
import { WorkPosition } from '@app/work-position/entities/work-position.entity';
import { DEFAULT_MIN_SALARY, User } from '@app/auth/entities/user.entity';
import {
    CalculatedTimeFields,
    HourRegister,
} from '@app/hour-register/entities/hour-register.entity';
import { UserCredentialsDto } from './dto/user-credentials-response.dto';
import { faker } from '@faker-js/faker';
import { Types } from 'mongoose';
import { ValidTimes } from './interfaces/valid-times';
import { ValidRoles } from '@app/auth/interfaces';
import { Encrypter } from '@app/common/utilities/encrypter';
import { HourRegisterUtilities } from '@app/hour-register/utilities/hour-register.util';
import { SeedResponse } from './dto/seed-response.dto';
import { getRandomInt } from '@app/common/utilities/random-int.util';
import { hourRandomGenerator } from '@app/common/utilities/hour-random-generator.util';
@Injectable()
export class SeedService {
    private readonly logger = new Logger(SeedService.name);
    constructor(
        private readonly userRepository: UserRepository,
        private readonly workPositionRepository: WorkPositionRepository,
        private readonly hourRegisterRepository: HourRegisterRepository,
        private readonly configService: ConfigService,
    ) {}

    async populateDB(userSeed: UserSeed) {
        console.time('Completado');

        const pwd_seed = this.configService.getOrThrow<string>('PWD_SEED');
        const user_seed = this.configService.getOrThrow<string>('USER_SEED');

        if (userSeed.user_seed != user_seed || userSeed.pwd_seed != pwd_seed)
            throw new UnauthorizedException(
                'Credenciales incorrectas para ejecutar el Seed',
            );
        console.time('Eliminacion');
        await Promise.all([
            this.userRepository.deleteMany(),
            this.workPositionRepository.deleteMany(),
            this.hourRegisterRepository.deleteMany(),
        ]);
        console.timeEnd('Eliminacion');

        const n_work_position = 10;
        const n_users = 300;
        const minDateForHourRegisters = new Date(2020, 0, 1);
        const maxDateForHourRegisters = new Date(2020, 5, 1);
        // un registro para cada usuario por dia

        const workPositionListToCreate: WorkPosition[] = [];
        const userListToCreate: Partial<User>[] = [];
        const hourRegisterListToCreate: HourRegister[] = [];

        //credenciales para testeo
        const userCredentials: UserCredentialsDto[] = [];
        //

        //WorkPositions
        console.time('Work Position Creation');
        const work_position_names = new Set<string>();
        while (work_position_names.size < n_work_position)
            work_position_names.add(faker.name.jobTitle());
        for (const work_position_name of work_position_names) {
            const work_position: WorkPosition = {
                _id: new Types.ObjectId(),
                name: work_position_name,
                description: faker.lorem.paragraph(10),
                work_start_time: hourRandomGenerator(ValidTimes.START_TIME),
                work_end_time: hourRandomGenerator(ValidTimes.END_TIME),
                isActive: getRandomInt(0, 2) == 0 ? false : true,
            };
            workPositionListToCreate.push(work_position);
        }
        console.timeEnd('Work Position Creation');

        //Users
        console.time('Users Creation');
        const emailList = new Set<string>();
        const dniSet = new Set<string>();
        while (dniSet.size < n_users)
            dniSet.add(faker.random.numeric(8, { allowLeadingZeros: true }));
        while (emailList.size < n_users) {
            const sex = getRandomInt(0, 2) == 0 ? 'female' : 'male';
            const user_first_name = faker.name.firstName(sex);
            const user_last_name = faker.name.lastName();
            const email = faker.internet
                .email(user_first_name, user_last_name)
                .toLowerCase();
            if (emailList.has(email)) continue;
            emailList.add(email);
            const user: Partial<User> = {
                _id: new Types.ObjectId(),
                firstnames: user_first_name,
                lastnames: user_last_name,
                email,
                sex: sex == 'female' ? 'F' : 'M',
            };
            userListToCreate.push(user);
        }
        const dniArray = [...dniSet];
        for (let i = 0; i < n_users; i++) {
            const roles = new Set([
                getRandomInt(0, 2) == 0 ? undefined : ValidRoles.admin,
                ValidRoles.employed,
            ]);
            roles.delete(undefined);

            const user = userListToCreate[i];
            user.birth_date = faker.date.birthdate({
                min: 18,
                max: 65,
                mode: 'age',
            });
            user.createdAt = new Date();
            user.updatedAt = new Date();
            user.dni = dniArray[i];
            user.phone_number = faker.phone.number('+51 9## ### ###');
            user.password =
                faker.random.word() +
                faker.random.numeric(4, { allowLeadingZeros: true });
            user.roles = [...roles];
            user.salary = getRandomInt(DEFAULT_MIN_SALARY, 10000);
            user.work_position =
                workPositionListToCreate[
                    getRandomInt(0, workPositionListToCreate.length)
                ]._id;
            user.isActive = getRandomInt(0, 4) >= 1 ? true : false;
            userCredentials.push({
                email: user.email,
                password: user.password,
                roles: user.roles,
            });
            user.password = Encrypter.encrypt(user.password);
        }
        console.timeEnd('Users Creation');

        //HourRegister
        console.time('HourRegister Creation');
        while (minDateForHourRegisters < maxDateForHourRegisters) {
            minDateForHourRegisters.setDate(
                minDateForHourRegisters.getDate() + 1,
            );
            for (let i = 0; i < userListToCreate.length; i++) {
                const userRelated: User = { ...userListToCreate[i] } as User;
                userRelated.work_position = workPositionListToCreate.find(
                    (work_position: WorkPosition) => {
                        return work_position._id == userRelated.work_position;
                    },
                );
                let hourRegister: Partial<HourRegister> = {
                    _id: new Types.ObjectId(),
                    date: minDateForHourRegisters,
                    user: userListToCreate[i]._id,
                    start_time: hourRandomGenerator(ValidTimes.START_TIME),
                    lunch_start_time: hourRandomGenerator(
                        ValidTimes.LUNCH_START,
                    ),
                    lunch_end_time: hourRandomGenerator(ValidTimes.LUNCH_END),
                    end_time: hourRandomGenerator(ValidTimes.END_TIME),
                    isActive: getRandomInt(0, 4) >= 1 ? true : false,
                };
                const calculatedTimeFields: CalculatedTimeFields =
                    HourRegisterUtilities.getCalculatedTimeFields(
                        hourRegister,
                        userRelated.work_position,
                    );
                hourRegister = { ...hourRegister, ...calculatedTimeFields };
                hourRegisterListToCreate.push(hourRegister as HourRegister);
            }
        }
        console.timeEnd('HourRegister Creation');
        console.time('Save in DB');
        await Promise.all([
            this.userRepository.insertMany(userListToCreate as User[]),
            this.workPositionRepository.insertMany(workPositionListToCreate),
            this.hourRegisterRepository.insertMany(hourRegisterListToCreate),
        ]);
        console.timeEnd('Save in DB');
        const seedResponse: SeedResponse = {
            inserted_work_positions: workPositionListToCreate.length,
            inserted_users: userListToCreate.length,
            inserted_hour_registers: hourRegisterListToCreate.length,
            users_credentials: userCredentials,
        };
        console.timeEnd('Completado');
        this.logger.log(
            `Seed Execute. ${workPositionListToCreate.length} inserted workPositions . ${userListToCreate.length} inserted users. ${hourRegisterListToCreate.length} inserted HourRegisters`,
        );
        return seedResponse;
    }
}
