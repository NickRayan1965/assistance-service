import { NestApplication } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { AppModule } from '@app/app.module';
import { DatabaseSevice } from '@app/database/database.service';
import { validationPipe } from '@app/main';
import { Connection } from 'mongoose';
import { UsersAndJwts } from '../interfaces/users-and-jwts.interface';
import { saveInDbAndGetUsersAndJwts } from '../utilities/save-in-db-and-get-users-and-jwts.util';
import * as request from 'supertest';
import { CreateUserDto, LoginUserDto } from '@app/auth/dto';
import { getCreateUserDtoStub } from '@app/../test/stubs/auth/create-user-dto.stub';
import { HttpStatus } from '@nestjs/common';
import { JwtPayload } from '@app/auth/interfaces';
import { Encrypter } from '@app/common/utilities/encrypter';
import { DEFAULT_USER_ROLES } from '@app/auth/entities/user.entity';
import { toJSON } from '../utilities/toJson.util';

describe('/auth AuthController (e2e)', () => {
    let app: NestApplication;
    let httpServer: any;
    let dbConnection: Connection;
    let jwtService: JwtService;
    let usersInDbAndJwts: UsersAndJwts;
    const pathController = '/auth';
    const checkUserInDbByEmail = async (email: string): Promise<boolean> => {
        return Boolean(
            await dbConnection.collection('users').findOne({ email }),
        );
    };
    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        app = moduleRef.createNestApplication();
        app.useGlobalPipes(validationPipe);
        await app.init();

        dbConnection = moduleRef
            .get<DatabaseSevice>(DatabaseSevice)
            .getDbHandle();
        jwtService = moduleRef.get<JwtService>(JwtService);
        httpServer = app.getHttpServer();
        usersInDbAndJwts = await saveInDbAndGetUsersAndJwts(
            dbConnection,
            jwtService,
        );
    });
    afterAll(async () => {
        await dbConnection.collection('users').deleteMany({});
        await app.close();
    });
    describe('/Post register', () => {
        const responseCreateUser = (
            jwt: string,
            user_to_create: Partial<CreateUserDto>,
        ): request.Test => {
            return request(httpServer)
                .post(`${pathController}/register`)
                .set('Authorization', `Bearer ${jwt}`)
                .send(user_to_create);
        };
        describe('Todo correcto, todos los campos y jwt validos', () => {
            it('deberia devolver un status 201, un json son el usuario y un nuevo jwt valido', async () => {
                const validUserToCreate = getCreateUserDtoStub(
                    usersInDbAndJwts.work_position,
                );
                const { email } = validUserToCreate;
                const exists_before = await checkUserInDbByEmail(email);
                const response = await responseCreateUser(
                    usersInDbAndJwts.admin.jwt,
                    validUserToCreate,
                );
                const { body, status } = response;
                const { user, jwt } = body;
                const exists_after = await checkUserInDbByEmail(email);
                const pwd_encrypted: string = user.password;
                user.password = validUserToCreate.password;
                const isPasswordCorrect = Encrypter.checkPassword(
                    validUserToCreate.password,
                    pwd_encrypted,
                );
                const payload_id = (jwtService.decode(jwt) as JwtPayload).id;

                expect(exists_before).toBeFalsy();
                expect(exists_after).toBeTruthy();
                expect(status).toBe(HttpStatus.CREATED);
                expect(user).toMatchObject(
                    JSON.parse(JSON.stringify(validUserToCreate)),
                );
                expect(isPasswordCorrect).toBeTruthy();

                await jwtService.verify(jwt);
                expect(payload_id).toBe(user._id);
            });
        });
        describe('Todo correcto, todos los campos y con jwt valido pero el id del payload es de un usuario sin roles validos', () => {
            it('Sin roles, deberia devolver un status 401', async () => {
                const validUserToCreate = getCreateUserDtoStub(
                    usersInDbAndJwts.work_position._id,
                );
                const { email } = validUserToCreate;
                const exists_before = await checkUserInDbByEmail(email);
                const response = await responseCreateUser(
                    usersInDbAndJwts.noRoles.jwt,
                    validUserToCreate,
                );
                const exists_after = await checkUserInDbByEmail(email);
                expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
                expect(response.body.user).toBeUndefined();
                expect(response.body.jwt).toBeUndefined();
                expect(exists_before).toBeFalsy();
                expect(exists_after).toBeFalsy();
            });
            it('Sin roles requeridos (ej: solo empleado, esperado: admin), deberia devolver un status 403', async () => {
                const validUserToCreate = getCreateUserDtoStub(
                    usersInDbAndJwts.work_position._id,
                );
                const { email } = validUserToCreate;
                const exists_before = await checkUserInDbByEmail(email);
                const response = await responseCreateUser(
                    usersInDbAndJwts.employed.jwt,
                    validUserToCreate,
                );
                const exists_after = await checkUserInDbByEmail(email);
                expect(response.status).toBe(HttpStatus.FORBIDDEN);
                expect(response.body.user).toBeUndefined();
                expect(response.body.jwt).toBeUndefined();
                expect(exists_before).toBeFalsy();
                expect(exists_after).toBeFalsy();
            });
        });
        describe('Datos incorrectos (sin campos extras invalidos) y con jwt valido', () => {
            it('deberia devolver un status 400', async () => {
                const invalidUserToCreate = getCreateUserDtoStub(
                    usersInDbAndJwts.work_position._id,
                ) as any;
                invalidUserToCreate.dni = 12313431; //tipo numero
                invalidUserToCreate.email = 'correo_invalido';
                invalidUserToCreate.sex = 'SExo INvalido';
                invalidUserToCreate.work_position = 'id_workposition invalido';
                const { email } = invalidUserToCreate;
                const exists_before = await checkUserInDbByEmail(email);
                const response = await responseCreateUser(
                    usersInDbAndJwts.admin.jwt,
                    invalidUserToCreate,
                );
                const exists_after = await checkUserInDbByEmail(email);
                expect(response.status).toBe(HttpStatus.BAD_REQUEST);
                expect(response.body.user).toBeUndefined();
                expect(response.body.jwt).toBeUndefined();
                expect(exists_before).toBeFalsy();
                expect(exists_after).toBeFalsy();
            });
        });
        describe('Todo correcto pero con campos que no deberian enviarse', () => {
            it('deberia devolver un status 400', async () => {
                const validUserToCreateWihtExtraFields = getCreateUserDtoStub(
                    usersInDbAndJwts.work_position._id,
                ) as any;
                const { email } = validUserToCreateWihtExtraFields;
                validUserToCreateWihtExtraFields.campoExtra = 12;
                validUserToCreateWihtExtraFields.deporte = 'natacion';
                const exists_before = await checkUserInDbByEmail(email);
                const response = await responseCreateUser(
                    usersInDbAndJwts.admin.jwt,
                    validUserToCreateWihtExtraFields,
                );
                const exists_after = await checkUserInDbByEmail(email);
                expect(response.status).toBe(HttpStatus.BAD_REQUEST);
                expect(response.body.user).toBeUndefined();
                expect(response.body.jwt).toBeUndefined();
                expect(exists_before).toBeFalsy();
                expect(exists_after).toBeFalsy();
            });
        });
        describe('Todo correcto pero con un email (campo unico) ya registrado', () => {
            it('deberia devolver un status 400', async () => {
                const existing_valid_user = getCreateUserDtoStub(
                    usersInDbAndJwts.work_position._id,
                ) as any;
                existing_valid_user.email =
                    usersInDbAndJwts.employed.userInDb.credential.email;
                const { email } = existing_valid_user;
                const exists_before = await checkUserInDbByEmail(email);
                const response = await responseCreateUser(
                    usersInDbAndJwts.admin.jwt,
                    existing_valid_user,
                );
                const usersInDbByEmail = await dbConnection
                    .collection('users')
                    .find({ email })
                    .toArray();
                expect(response.status).toBe(HttpStatus.BAD_REQUEST);
                expect(response.body.user).toBeUndefined();
                expect(response.body.jwt).toBeUndefined();
                expect(exists_before).toBeTruthy();
                expect(usersInDbByEmail.length).toBe(1);
            });
        });
        describe('Todo correcto, todos los campos pero sin jwt', () => {
            it('deberia devolver un status 401', async () => {
                const validUserToCreate = getCreateUserDtoStub(
                    usersInDbAndJwts.work_position._id,
                );
                const { email } = validUserToCreate;
                const exists_before = await checkUserInDbByEmail(email);
                const response = await responseCreateUser(
                    undefined,
                    validUserToCreate,
                );
                const exists_after = await checkUserInDbByEmail(email);
                expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
                expect(response.body.user).toBeUndefined();
                expect(response.body.jwt).toBeUndefined();
                expect(exists_before).toBeFalsy();
                expect(exists_after).toBeFalsy();
            });
        });
        describe('Todo correcto, pero sin enviar campos opcionales (campo roles)', () => {
            it(`deberia devolver un status 201 y el campo 'roles' deberia ser por defecto ${JSON.stringify(
                DEFAULT_USER_ROLES,
            )}`, async () => {
                const validUserToCreateWithoutOptionalFields =
                    getCreateUserDtoStub(usersInDbAndJwts.work_position._id);
                validUserToCreateWithoutOptionalFields.roles = undefined;
                const { email } = validUserToCreateWithoutOptionalFields;
                const exists_before = await checkUserInDbByEmail(email);
                const response = await responseCreateUser(
                    usersInDbAndJwts.admin.jwt,
                    validUserToCreateWithoutOptionalFields,
                );
                const { status, body } = response;
                const { user, jwt } = body;
                const pwd_encrypted: string = user.password;
                user.password = validUserToCreateWithoutOptionalFields.password;
                const isPasswordCorrect = Encrypter.checkPassword(
                    validUserToCreateWithoutOptionalFields.password,
                    pwd_encrypted,
                );
                const payload_id = (jwtService.decode(jwt) as JwtPayload).id;
                const exists_after = await checkUserInDbByEmail(email);
                expect(exists_before).toBeFalsy();
                expect(exists_after).toBeTruthy();
                expect(status).toBe(HttpStatus.CREATED);
                expect(user).toMatchObject(
                    JSON.parse(
                        JSON.stringify(validUserToCreateWithoutOptionalFields),
                    ),
                );
                expect(user.roles).toStrictEqual(DEFAULT_USER_ROLES);
                expect(isPasswordCorrect).toBeTruthy();
                await jwtService.verify(jwt);
                expect(payload_id).toBe(user._id);
            });
        });
    });
    describe('/POST login', () => {
        const requestLogin = (userCredentials: LoginUserDto): request.Test => {
            return request(httpServer)
                .post(`${pathController}/login`)
                .send(userCredentials);
        };
        describe('Todo correcto, con credenciales existentes', () => {
            it('deberia devolver un status 200, el registro del usuario y su jwt', async () => {
                const userToTest = usersInDbAndJwts.admin.userInDb;
                const exists_before = await checkUserInDbByEmail(
                    userToTest.credential.email,
                );
                const { body, status } = await requestLogin(
                    userToTest.credential,
                );
                const { user, jwt } = body;
                const payload_id = (jwtService.decode(jwt) as JwtPayload).id;
                expect(exists_before).toBeTruthy();
                expect(status).toBe(HttpStatus.OK);
                expect(user).toMatchObject(toJSON(userToTest.user));
                await jwtService.verify(jwt);
                expect(payload_id).toBe(user._id);
            });
        });
        describe('Todo correcto pero con credenciales inexistentes', () => {
            it('deberia devolver un status 401', async () => {
                const inexistingUserCredentials: LoginUserDto = {
                    email: 'emailInventado@gmail.com',
                    password: 'password inventada',
                };
                const exists_before = await checkUserInDbByEmail(
                    inexistingUserCredentials.email,
                );
                const { body, status } = await requestLogin(
                    inexistingUserCredentials,
                );
                const { user, jwt } = body;
                expect(exists_before).toBeFalsy();
                expect(status).toBe(HttpStatus.UNAUTHORIZED);
                expect(user).toBeUndefined();
                expect(jwt).toBeUndefined();
            });
        });
        describe('Sin enviar password (campo requerido) y con un email que si existe', () => {
            it('deberia devolver un status 400', async () => {
                const userCredentialToTest = {
                    ...usersInDbAndJwts.admin.userInDb.credential,
                };
                userCredentialToTest.password = undefined;
                const exists_before = await checkUserInDbByEmail(
                    userCredentialToTest.email,
                );
                const { body, status } = await requestLogin(
                    userCredentialToTest,
                );
                const { user, jwt } = body;
                expect(exists_before).toBeTruthy();
                expect(status).toBe(HttpStatus.BAD_REQUEST);
                expect(user).toBeUndefined();
                expect(jwt).toBeUndefined();
            });
        });
        describe('Enviando email existente pero con una contraseña incorrecta', () => {
            it('deberia devolver un status 401', async () => {
                const userToTest = usersInDbAndJwts.admin.userInDb;
                const exists_before = await checkUserInDbByEmail(
                    userToTest.credential.email,
                );
                const userCredentials = { ...userToTest.credential };
                userCredentials.password = 'contraseña incorrecta';
                const areDifferentPwds = !Encrypter.checkPassword(
                    userCredentials.password,
                    userToTest.user.password,
                );
                const { body, status } = await requestLogin(userCredentials);
                const { user, jwt } = body;
                expect(exists_before).toBeTruthy();
                expect(areDifferentPwds).toBeTruthy();
                expect(status).toBe(HttpStatus.UNAUTHORIZED);
                expect(user).toBeUndefined();
                expect(jwt).toBeUndefined();
            });
        });
        describe('Todo correcto, credenciales de usuario existentes, pero con campos extras que no deberian enviarse', () => {
            it('deberia devolver un status 400', async () => {
                const userCredentials = {
                    ...usersInDbAndJwts.admin.userInDb.credential,
                } as any;
                userCredentials.campoextra = 'hola';
                const exists_before = await checkUserInDbByEmail(
                    userCredentials.email,
                );
                const { body, status } = await requestLogin(userCredentials);
                const { user, jwt } = body;

                expect(exists_before).toBeTruthy();
                expect(status).toBe(HttpStatus.BAD_REQUEST);
                expect(user).toBeUndefined();
                expect(jwt).toBeUndefined();
            });
        });
    });
});
