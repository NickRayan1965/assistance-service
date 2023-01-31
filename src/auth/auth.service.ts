import {
    Injectable,
    OnModuleInit,
    UnauthorizedException,
} from '@nestjs/common';
import { LoginUserDto, CreateUserDto } from './dto';
import { UserRepository } from './users.repository';
import { CreateOrLoginResponseDto } from './dto/create-or-login-response.dto';
import { JwtPayload } from './interfaces';
import { JwtService } from '@nestjs/jwt';
import { User } from './entities/user.entity';
import { handleExceptions } from '../common/errors/handleExceptions';
import { replaceDoubleSpacesAndTrim } from '@app/common/func/replaceDoubleSpacesAndTrim.func';
import { WorkPositionRepository } from '@app/work-position/work-position.repository';
import { Types } from 'mongoose';
import { Encrypter } from '@app/common/utilities/encrypter';
import { getUserAdminStub } from '@app/common/utilities/userAdmin.stub';
import { ConfigService } from '@nestjs/config';
import { hourRandomGenerator } from '@app/common/utilities/hour-random-generator.util';
import { ValidTimes } from '@app/seed/interfaces/valid-times';
@Injectable()
export class AuthService implements OnModuleInit {
    private readonly nameEntity = User.name;
    constructor(
        private readonly userRepository: UserRepository,
        private readonly jwtService: JwtService,
        private readonly workPositionRepository: WorkPositionRepository,
        private readonly configService: ConfigService,
    ) {}
    async onModuleInit() {
        const email_for_swagger_env =
            this.configService.getOrThrow<string>('EMAIL_FOR_SWAGGER');
        const password_for_swagger_env = this.configService.getOrThrow<string>(
            'PASSWORD_FOR_SWAGGER',
        );
        const work_position_for_swagger = this.configService.getOrThrow<string>(
            'WORK_POSITION_FOR_SWAGGER',
        );
        let user = (await this.userRepository.findOne({
            email: email_for_swagger_env,
        })) as User;
        if (!user) {
            let work_position = await this.workPositionRepository.findOne({
                name: work_position_for_swagger,
            });
            if (!work_position) {
                work_position = await this.workPositionRepository.create({
                    description: 'Posición de trabajo para Swagger',
                    name: work_position_for_swagger,
                    work_end_time: hourRandomGenerator(ValidTimes.END_TIME),
                    work_start_time: hourRandomGenerator(ValidTimes.START_TIME),
                });
            }
            const userData = getUserAdminStub({
                work_position: new Types.ObjectId(work_position._id),
                encrypt: false,
            });
            userData.email = email_for_swagger_env;
            userData.password = Encrypter.encrypt(password_for_swagger_env);
            user = await this.userRepository.create(userData);
        }
    }
    async registerUser(
        createUserDto: CreateUserDto,
    ): Promise<CreateOrLoginResponseDto> {
        await this.workPositionRepository.findById(
            createUserDto.work_position.toString(),
        );
        createUserDto.work_position = new Types.ObjectId(
            createUserDto.work_position,
        );
        createUserDto.password = Encrypter.encrypt(createUserDto.password);
        const createdAt = new Date();
        const updatedAt = createdAt;
        createUserDto.phone_number = replaceDoubleSpacesAndTrim(
            createUserDto.phone_number,
        );

        try {
            const user = await this.userRepository.create({
                ...createUserDto,
                updatedAt,
                createdAt,
            } as User);
            const createUserResponse: CreateOrLoginResponseDto = {
                user,
                jwt: this.getJwt({ id: user._id.toString() }),
            };
            console.log({ horaLlamadaDeEvento: new Date() });
            return createUserResponse;
        } catch (error) {
            handleExceptions(error, this.nameEntity);
        }
    }
    async loginUser(
        loginUserDto: LoginUserDto,
    ): Promise<CreateOrLoginResponseDto> {
        const { email, password } = loginUserDto;
        const user = await this.userRepository.findOne({ email });
        if (!user)
            throw new UnauthorizedException('Las credenciales no son válidas');
        if (!Encrypter.checkPassword(password, user.password))
            throw new UnauthorizedException('Las credenciales no son válidas');
        if (!user.isActive)
            throw new UnauthorizedException(
                'El usuario se encuentra inactivo, hable con un administrador',
            );
        const loginUserResponse: CreateOrLoginResponseDto = {
            user,
            jwt: this.getJwt({ id: user._id.toString() }),
        };
        return loginUserResponse;
    }
    private getJwt(payload: JwtPayload) {
        return this.jwtService.sign(payload);
    }
}
