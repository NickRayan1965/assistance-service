import { NestApplication } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Connection, Types } from 'mongoose';
import { UsersAndJwts } from './common/interfaces/users-and-jwts.interface';
import { saveInDbAndGetUsersAndJwts } from './common/utilities/save-in-db-and-get-users-and-jwts.util';
import * as request from 'supertest';
import { CreateUserDto, LoginUserDto } from '@app/auth/dto';
import { getCreateUserDtoStub } from '@app/../test/e2e/stubs/auth/create-user-dto.stub';
import { HttpStatus } from '@nestjs/common';
import { JwtPayload, ValidRoles } from '@app/auth/interfaces';
import { Encrypter } from '@app/common/utilities/encrypter';
import { DEFAULT_USER_ROLES, User } from '@app/auth/entities/user.entity';
import { toJSON } from './common/utilities/toJson.util';
import { initNestApp } from './common/utilities/initNestApp.util';
import { cleanDb } from './common/utilities/cleanDb.util';
import { TestingModule } from '@nestjs/testing';
import { populateUsersInDbAndGetRelated } from './common/utilities/populateUsersInDB.util';
import { UserQueryParamsDto } from '@app/user/dto/user-query-params.dto';
import { pipelineStagesByUserQueryParams } from '@app/user/utilities/pipelinesStages-by-user-query-params.util';
import { getUserAdminStub } from '@app/common/utilities/userAdmin.stub';
import { UpdateUserDto } from '@app/user/dto/update-user.dto';
import { WorkPosition } from '@app/work-position/entities/work-position.entity';
import { populateWorkPositionInDb } from './common/utilities/populateWorkPositionsInDb.util';
import { BasicsQueryParamsDto } from '@app/common/dto/basics-query-params.dto';
import { getQueryParamsFromObject } from './common/utilities/getQueryParamsFromObject.util';
import { pipelineStagesByQueryParams } from '@app/common/utilities/pipelineStagesBasicsQueryParams.util';
import { UpdateWorkPositionDto } from '@app/work-position/dto/update-work-position.dto';
import { stubWorkPosition } from '@app/../test/e2e/stubs/work-position/random-work-position.stub';
import { hourRandomGenerator } from '@app/common/utilities/hour-random-generator.util';
import { ValidTimes } from '@app/seed/interfaces/valid-times';
/* import { populateHourRegistersInDbAndGetRelated } from './common/utilities/populateHourRegisters.util';
import { HourRegisterQueryParamDto } from '@app/hour-register/dto/hour-register-query-params.dto';
import { pipelineStagesByHourRegisterQ_Params } from '@app/hour-register/utilities/pipelinesStages-by-hour-register-query-params.util'; */
describe('App (e2e)', () => {
    let app: NestApplication;
    let dbConnection: Connection;
    let jwtService: JwtService;
    let usersInDbAndJwts: UsersAndJwts;
    let moduleRef: TestingModule;
    let allUsersInDb: User[];
    let allWorkPositionInDb: WorkPosition[];
    const checkUserInDbByEmail = async (email: string): Promise<boolean> => {
        return Boolean(
            await dbConnection.collection('users').findOne({ email }),
        );
    };
    beforeAll(async () => {
        const {
            app: appInit,
            dbConnection: dbConnectionInit,
            jwtService: jwts,
            moduleRef: modRef,
        } = await initNestApp();
        app = appInit;
        dbConnection = dbConnectionInit;
        jwtService = jwts;
        moduleRef = modRef;
    });

    afterAll(async () => {
        await cleanDb(dbConnection);
        await moduleRef.close();
        await app.close();
    });
    describe('Auth Controller (e2e)', () => {
        const pathController = '/auth';
        describe('/Post register', () => {
            const responseCreateUser = async (
                jwt: string,
                user_to_create: Partial<CreateUserDto>,
            ) => {
                return await request(app.getHttpServer())
                    .post(`${pathController}/register`)
                    .set('Authorization', `Bearer ${jwt}`)
                    .send(user_to_create);
            };
            beforeAll(async () => {
                await cleanDb(dbConnection);
                usersInDbAndJwts = await saveInDbAndGetUsersAndJwts(
                    dbConnection,
                    jwtService,
                );
            });
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
                    expect(exists_before).toBeFalsy();
                    expect(status).toBe(HttpStatus.CREATED);
                    expect(exists_after).toBeTruthy();

                    const pwd_encrypted: string = user.password;
                    user.password = validUserToCreate.password;
                    const isPasswordCorrect = Encrypter.checkPassword(
                        validUserToCreate.password,
                        pwd_encrypted,
                    );
                    const payload_id = (jwtService.decode(jwt) as JwtPayload)
                        .id;

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
                    expect(exists_before).toBeFalsy();
                    expect(exists_after).toBeFalsy();
                    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
                    expect(response.body.user).toBeUndefined();
                    expect(response.body.jwt).toBeUndefined();
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
                    expect(exists_before).toBeFalsy();
                    expect(exists_after).toBeFalsy();
                    expect(response.status).toBe(HttpStatus.FORBIDDEN);
                    expect(response.body.user).toBeUndefined();
                    expect(response.body.jwt).toBeUndefined();
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
                    invalidUserToCreate.work_position =
                        'id_workposition invalido';
                    const { email } = invalidUserToCreate;
                    const exists_before = await checkUserInDbByEmail(email);
                    const response = await responseCreateUser(
                        usersInDbAndJwts.admin.jwt,
                        invalidUserToCreate,
                    );
                    const exists_after = await checkUserInDbByEmail(email);
                    expect(exists_before).toBeFalsy();
                    expect(exists_after).toBeFalsy();
                    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
                    expect(response.body.user).toBeUndefined();
                    expect(response.body.jwt).toBeUndefined();
                });
            });
            describe('Todo correcto pero con campos que no deberian enviarse', () => {
                it('deberia devolver un status 400', async () => {
                    const validUserToCreateWihtExtraFields =
                        getCreateUserDtoStub(
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
                    expect(exists_before).toBeFalsy();
                    expect(exists_after).toBeFalsy();
                    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
                    expect(response.body.user).toBeUndefined();
                    expect(response.body.jwt).toBeUndefined();
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

                    expect(exists_before).toBeTruthy();
                    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
                    expect(response.body.user).toBeUndefined();
                    expect(response.body.jwt).toBeUndefined();
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
                    expect(exists_before).toBeFalsy();
                    expect(exists_after).toBeFalsy();
                    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
                    expect(response.body.user).toBeUndefined();
                    expect(response.body.jwt).toBeUndefined();
                });
            });
            describe('Todo correcto, pero sin enviar campos opcionales (campo roles)', () => {
                it(`deberia devolver un status 201 y el campo 'roles' deberia ser por defecto ${JSON.stringify(
                    DEFAULT_USER_ROLES,
                )}`, async () => {
                    const validUserToCreateWithoutOptionalFields =
                        getCreateUserDtoStub(
                            usersInDbAndJwts.work_position._id,
                        );
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
                    user.password =
                        validUserToCreateWithoutOptionalFields.password;
                    const isPasswordCorrect = Encrypter.checkPassword(
                        validUserToCreateWithoutOptionalFields.password,
                        pwd_encrypted,
                    );
                    const payload_id = (jwtService.decode(jwt) as JwtPayload)
                        .id;
                    const exists_after = await checkUserInDbByEmail(email);
                    expect(exists_before).toBeFalsy();
                    expect(exists_after).toBeTruthy();
                    expect(status).toBe(HttpStatus.CREATED);
                    expect(user).toMatchObject(
                        JSON.parse(
                            JSON.stringify(
                                validUserToCreateWithoutOptionalFields,
                            ),
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
            const requestLogin = (
                userCredentials: LoginUserDto,
            ): request.Test => {
                return request(app.getHttpServer())
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
                    expect(exists_before).toBeTruthy();

                    expect(status).toBe(HttpStatus.OK);
                    const payload_id = (jwtService.decode(jwt) as JwtPayload)
                        .id;
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
                    const { body, status } = await requestLogin(
                        userCredentials,
                    );
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
                    const { body, status } = await requestLogin(
                        userCredentials,
                    );
                    const { user, jwt } = body;
                    expect(exists_before).toBeTruthy();
                    expect(status).toBe(HttpStatus.BAD_REQUEST);
                    expect(user).toBeUndefined();
                    expect(jwt).toBeUndefined();
                });
            });
        });
    });
    describe('User Controller (e2e)', () => {
        const pathController = '/user';
        beforeAll(async () => {
            await cleanDb(dbConnection);
            usersInDbAndJwts = await saveInDbAndGetUsersAndJwts(
                dbConnection,
                jwtService,
            );
            allUsersInDb = await populateUsersInDbAndGetRelated({
                dbConnection,
                n_work_positions: 5,
                n_users: 10,
            });
        });
        describe('/GET (all users with optional query params)', () => {
            const requestGetAllUsers = async (
                jwt: string,
                users_query_params?: Partial<UserQueryParamsDto>,
            ) => {
                const query = getQueryParamsFromObject(users_query_params);
                return await request(app.getHttpServer())
                    .get(`${pathController}${query}`)
                    .set('Authorization', `Bearer ${jwt}`);
            };
            describe('Sin query params y con un jwt valido (admin)', () => {
                it('deberia devolver un status code 200 y una lista de usuarios con el estado activo', async () => {
                    const { status, body } = await requestGetAllUsers(
                        usersInDbAndJwts.admin.jwt,
                    );
                    expect(status).toBe(HttpStatus.OK);
                    const usersInDb = allUsersInDb.filter(
                        (user: User) => user.isActive,
                    );
                    expect(body).toStrictEqual(toJSON(usersInDb));
                });
            });
            describe('Sin query params y sin enviar un jwt', () => {
                it('deberia devolver un status 401', async () => {
                    const { body, status } = await requestGetAllUsers('');
                    expect(status).toBe(HttpStatus.UNAUTHORIZED);
                    expect(Array.isArray(body)).toBeFalsy();
                });
            });
            describe('Sin query params pero con un jwt sin un rol permitido (admin)', () => {
                it('deberia devolver un status 403', async () => {
                    const { body, status } = await requestGetAllUsers(
                        usersInDbAndJwts.employed.jwt,
                    );
                    expect(status).toBe(HttpStatus.FORBIDDEN);
                    expect(Array.isArray(body)).toBeFalsy();
                });
            });
            describe('Con query params validos (sin campos de query params extras y sin banderas ni valores que no se puedan enviar a la vez) y un jwt valido', () => {
                it('deberia devolver un status 200 y una lista de usuarios que cumpla con las indicaciones de los query params', async () => {
                    //
                    const users_query_params: UserQueryParamsDto =
                        new UserQueryParamsDto();
                    users_query_params.all = false;
                    users_query_params.inactive = true;
                    users_query_params.workPosition =
                        usersInDbAndJwts.work_position.toString();
                    const { body, status } = await requestGetAllUsers(
                        usersInDbAndJwts.admin.jwt,
                        users_query_params,
                    );
                    const usersInDBWithTheConditions = await dbConnection
                        .collection('users')
                        .aggregate<User>(
                            pipelineStagesByUserQueryParams(users_query_params),
                        )
                        .toArray();
                    expect(status).toBe(HttpStatus.OK);
                    expect(body).toStrictEqual(
                        toJSON(usersInDBWithTheConditions),
                    );
                });
            });
            describe('Con query params que no se deberian enviar a la vez y con jwt valido', () => {
                it('deberia devolver un status 400', async () => {
                    const users_query_params: UserQueryParamsDto =
                        new UserQueryParamsDto();
                    users_query_params.all = true; // no se pueden enviar a la vez como true
                    users_query_params.inactive = true; // no se pueden enviar a la vez como true
                    const { body, status } = await requestGetAllUsers(
                        usersInDbAndJwts.admin.jwt,
                        users_query_params,
                    );
                    expect(status).toBe(HttpStatus.BAD_REQUEST);
                    expect(Array.isArray(body)).toBeFalsy();
                });
            });
            describe('Sin enviar jwt y sin query params', () => {
                it('deberia devolver un status 401', async () => {
                    const { body, status } = await requestGetAllUsers('');
                    expect(status).toBe(HttpStatus.UNAUTHORIZED);
                    expect(Array.isArray(body)).toBeFalsy();
                });
            });
        });
        describe('/GET /{id}', () => {
            const requestGetUserById = async (id: string, jwt?: string) => {
                return await request(app.getHttpServer())
                    .get(`${pathController}/${id}`)
                    .set('Authorization', `Bearer ${jwt}`);
            };
            describe('Id existente y jwt de un admin', () => {
                it('deberia devolver un status 200 y un json del registro usuario', async () => {
                    const user = usersInDbAndJwts.employed.userInDb.user;
                    const { body, status } = await requestGetUserById(
                        user._id.toString(),
                        usersInDbAndJwts.admin.jwt,
                    );
                    expect(status).toBe(HttpStatus.OK);
                    const user_in_body = {
                        ...body,
                        work_position: body.work_position._id,
                    };
                    expect(user_in_body).toMatchObject(toJSON(user));
                });
            });
            describe('Id existente y un jwt del dueño del recurso', () => {
                it('deberia devolver un status 200 y un json del registro usuario', async () => {
                    const user = usersInDbAndJwts.employed.userInDb.user;
                    const { body, status } = await requestGetUserById(
                        user._id.toString(),
                        usersInDbAndJwts.employed.jwt,
                    );
                    const user_in_body = {
                        ...body,
                        work_position: body.work_position._id,
                    };
                    expect(status).toBe(HttpStatus.OK);
                    expect(user_in_body).toMatchObject(toJSON(user));
                });
            });
            describe('Id existente y un jwt con rol empleado pero no es del dueño del recurso', () => {
                it('deberia devolver un status 403', async () => {
                    const userEmployed = getUserAdminStub({
                        work_position: usersInDbAndJwts.work_position,
                        encrypt: true,
                    });
                    userEmployed.roles = [ValidRoles.employed];
                    const userIdInserted = (
                        await dbConnection
                            .collection('users')
                            .insertOne(userEmployed)
                    ).insertedId.toString();
                    const { body, status } = await requestGetUserById(
                        userIdInserted,
                        usersInDbAndJwts.employed.jwt,
                    );
                    expect(status).toBe(HttpStatus.FORBIDDEN);
                    expect(body._id).toBeUndefined();
                    await dbConnection
                        .collection('users')
                        .deleteOne({ _id: new Types.ObjectId(userIdInserted) });
                });
            });
            describe('Id existente, sin jwt', () => {
                it('deberia devolver un status 401', async () => {
                    const userId =
                        usersInDbAndJwts.employed.userInDb.user._id.toString();
                    const { body, status } = await requestGetUserById(
                        userId,
                        '',
                    );
                    expect(status).toBe(HttpStatus.UNAUTHORIZED);
                    expect(body._id).toBeUndefined();
                });
            });
            describe('Id que no existe y con jwt admin', () => {
                it('deberia devolver un status 404', async () => {
                    const userId = new Types.ObjectId().toString();
                    const { body, status } = await requestGetUserById(
                        userId,
                        usersInDbAndJwts.admin.jwt,
                    );
                    expect(status).toBe(HttpStatus.NOT_FOUND);
                    expect(body._id).toBeUndefined();
                });
            });
            describe('Id invalido (no es un mongoId valido) con jwt admin', () => {
                it('deberia devolver un status 400', async () => {
                    const id_invalido = 'cualquiercosa';
                    const { body, status } = await requestGetUserById(
                        id_invalido,
                        usersInDbAndJwts.admin.jwt,
                    );
                    expect(status).toBe(HttpStatus.BAD_REQUEST);
                    expect(body._id).toBeUndefined();
                });
            });
        });
        describe('/PATCH /{id}', () => {
            const requestPatchUserById = async (
                id: string,
                userUpdates: Partial<UpdateUserDto>,
                jwt?: string,
            ) => {
                return await request(app.getHttpServer())
                    .patch(`${pathController}/${id}`)
                    .set('Authorization', `Bearer ${jwt}`)
                    .send(toJSON(userUpdates));
            };
            describe('Id existente, datos correctos para actualizar y jwt admin', () => {
                it('deberia devolver un status 200 y un json con el usuario actualizado', async () => {
                    let userToTest = getUserAdminStub({
                        work_position: usersInDbAndJwts.work_position,
                        encrypt: true,
                        isActiveRandom: true,
                    });
                    await dbConnection
                        .collection('users')
                        .insertOne(userToTest);
                    //
                    userToTest.lastnames = 'NUEVO APELLIDO';
                    userToTest.phone_number = '+51 999 000 999';
                    const updates: Partial<UpdateUserDto> = {
                        lastnames: userToTest.lastnames,
                        phone_number: userToTest.phone_number,
                    };
                    //
                    const { body, status } = await requestPatchUserById(
                        userToTest._id.toString(),
                        updates,
                        usersInDbAndJwts.admin.jwt,
                    );
                    userToTest = { ...userToTest, updatedAt: undefined };
                    const user_in_body = {
                        ...body,
                        work_position: body.work_position._id,
                    };
                    expect(status).toBe(HttpStatus.OK);
                    expect(user_in_body).toMatchObject(toJSON(userToTest));
                });
            });
            describe('Id existente, datos correctos y un jwt no valido (employed)', () => {
                it('deberia devolver un status 403', async () => {
                    const userToTest = getUserAdminStub({
                        work_position: usersInDbAndJwts.work_position,
                        encrypt: true,
                        isActiveRandom: true,
                    });
                    await dbConnection
                        .collection('users')
                        .insertOne(userToTest);
                    userToTest.lastnames = 'NUEVO APELLIDO';
                    userToTest.phone_number = '+51 999 000 999';
                    const updates: Partial<UpdateUserDto> = {
                        lastnames: userToTest.lastnames,
                        phone_number: userToTest.phone_number,
                    };
                    const { body, status } = await requestPatchUserById(
                        userToTest._id.toString(),
                        updates,
                        usersInDbAndJwts.employed.jwt,
                    );
                    expect(status).toBe(HttpStatus.FORBIDDEN);
                    expect(body._id).toBeUndefined();
                });
            });
            describe('Id existente, datos correctos y jwt valido pero con un work_position que no existe', () => {
                it('deberia devolver un status 404 (work_position enviado no encontrado)', async () => {
                    const userToTest = getUserAdminStub({
                        work_position: usersInDbAndJwts.work_position,
                        encrypt: true,
                        isActiveRandom: true,
                    });
                    await dbConnection
                        .collection('users')
                        .insertOne(userToTest);
                    //
                    userToTest.lastnames = 'NUEVO APELLIDO';
                    userToTest.work_position = new Types.ObjectId();
                    const updates: Partial<UpdateUserDto> = {
                        lastnames: userToTest.lastnames,
                        phone_number: userToTest.phone_number,
                        work_position: userToTest.work_position,
                    };
                    //
                    const { body, status } = await requestPatchUserById(
                        userToTest._id.toString(),
                        updates,
                        usersInDbAndJwts.admin.jwt,
                    );
                    expect(status).toBe(HttpStatus.NOT_FOUND);
                    expect(body._id).toBeUndefined();
                });
            });
            describe('Id existente, datos incorrectos y un jwt valido', () => {
                it('deberia devolver un status 400', async () => {
                    const userToTest = getUserAdminStub({
                        work_position: usersInDbAndJwts.work_position,
                        encrypt: true,
                        isActiveRandom: true,
                    }) as any;
                    await dbConnection
                        .collection('users')
                        .insertOne(userToTest);
                    userToTest.lastnames = 123;
                    userToTest.phone_number = new Date();
                    const updates = {
                        lastnames: userToTest.lastnames,
                        phone_number: userToTest.phone_number,
                    };
                    const { body, status } = await requestPatchUserById(
                        userToTest._id.toString(),
                        updates,
                        usersInDbAndJwts.admin.jwt,
                    );
                    expect(status).toBe(HttpStatus.BAD_REQUEST);
                    expect(body._id).toBeUndefined();
                });
            });
            describe('Id que no esta en db, datos correctos para actualizar y jwt admin', () => {
                it('deberia devolver un status 404', async () => {
                    //
                    const { body, status } = await requestPatchUserById(
                        new Types.ObjectId().toString(),
                        {},
                        usersInDbAndJwts.admin.jwt,
                    );
                    expect(status).toBe(HttpStatus.NOT_FOUND);
                    expect(body._id).toBeUndefined();
                });
            });
        });
        describe('/DELETE /{id} (chance the value of the property `isActive` to false))', () => {
            const requestDeleteUserById = async (id: string, jwt: string) => {
                return await request(app.getHttpServer())
                    .delete(`${pathController}/${id}`)
                    .set('Authorization', `Bearer ${jwt}`);
            };
            describe('Id existente, jwt valido (admin)', () => {
                it('deberia devolver un status 204', async () => {
                    const userToDelete =
                        usersInDbAndJwts.employed.userInDb.user;
                    const { body, status } = await requestDeleteUserById(
                        userToDelete._id.toString(),
                        usersInDbAndJwts.admin.jwt,
                    );
                    const isActive = (
                        await dbConnection
                            .collection('users')
                            .findOne({ _id: userToDelete._id })
                    ).isActive;
                    expect(status).toBe(HttpStatus.NO_CONTENT);
                    expect(isActive).toBeFalsy();
                    expect(Object.keys(body).length).toBe(0);
                    await dbConnection
                        .collection('users')
                        .updateOne(
                            { _id: userToDelete._id },
                            { $set: { isActive: true } },
                        );
                });
            });
            describe('Id existente, jwt de un usuario sin roles requeridos (employed)', () => {
                it('deberia devolver un status 403', async () => {
                    const userToDelete =
                        usersInDbAndJwts.employed.userInDb.user;
                    const { status } = await requestDeleteUserById(
                        userToDelete._id.toString(),
                        usersInDbAndJwts.employed.jwt,
                    );
                    const isActive = (
                        await dbConnection
                            .collection('users')
                            .findOne({ _id: userToDelete._id })
                    ).isActive;
                    expect(status).toBe(HttpStatus.FORBIDDEN);
                    expect(isActive).toBeTruthy();
                });
            });
            describe('Id existente, jwt de un usuario sin roles', () => {
                it('deberia devolver un status 401', async () => {
                    const userToDelete =
                        usersInDbAndJwts.employed.userInDb.user;
                    const { status } = await requestDeleteUserById(
                        userToDelete._id.toString(),
                        usersInDbAndJwts.noRoles.jwt,
                    );
                    const isActive = (
                        await dbConnection
                            .collection('users')
                            .findOne({ _id: userToDelete._id })
                    ).isActive;
                    expect(status).toBe(HttpStatus.UNAUTHORIZED);
                    expect(isActive).toBeTruthy();
                });
            });
            describe('Id que no esta en db y jwt valido (admin)', () => {
                it('deberia devolver un status 404', async () => {
                    const id = new Types.ObjectId();
                    const { status } = await requestDeleteUserById(
                        id.toString(),
                        usersInDbAndJwts.admin.jwt,
                    );
                    expect(status).toBe(HttpStatus.NOT_FOUND);
                });
            });
            describe('Id invalido (no es un mongoId) y jwt valido (admin)', () => {
                it('deberia devolver un status 400', async () => {
                    const id = 'mongoIdInvalido';
                    const { status } = await requestDeleteUserById(
                        id,
                        usersInDbAndJwts.admin.jwt,
                    );
                    expect(status).toBe(HttpStatus.BAD_REQUEST);
                });
            });
        });
    });
    describe('WorkPosition Controller (e2e)', () => {
        const pathController = '/work-position';
        beforeAll(async () => {
            await cleanDb(dbConnection);
            usersInDbAndJwts = await saveInDbAndGetUsersAndJwts(
                dbConnection,
                jwtService,
            );
            const n_work_positions = 20;
            allWorkPositionInDb = await populateWorkPositionInDb(
                n_work_positions,
                dbConnection,
            );
        });
        describe('/GET (all work positions with optional query params)', () => {
            const requesGetAllWorkPositions = async (
                jwt: string,
                basic_query_params?: Partial<BasicsQueryParamsDto>,
            ) => {
                const query = getQueryParamsFromObject(basic_query_params);
                return await request(app.getHttpServer())
                    .get(`${pathController}${query}`)
                    .set('Authorization', `Bearer ${jwt}`);
            };
            describe('Sin query params y con un jwt valido (admin)', () => {
                it('deberia devolver un status 200 y una lista con `work positions` con el estado activo', async () => {
                    const { body, status } = await requesGetAllWorkPositions(
                        usersInDbAndJwts.admin.jwt,
                    );
                    const work_position_actives = allWorkPositionInDb.filter(
                        (work_position: WorkPosition) => work_position.isActive,
                    );
                    expect(status).toBe(HttpStatus.OK);
                    expect(body.length).toBe(work_position_actives.length);
                    expect(body).toStrictEqual(toJSON(work_position_actives));
                });
            });
            describe('Sin query params y con un jwt con un rol sin permisos (employed)', () => {
                it('deberia devolver un status 403', async () => {
                    const { body, status } = await requesGetAllWorkPositions(
                        usersInDbAndJwts.employed.jwt,
                    );
                    expect(status).toBe(HttpStatus.FORBIDDEN);
                    expect(Array.isArray(body)).toBeFalsy();
                });
            });
            describe('Sin query params y con un jwt sin roles', () => {
                it('deberia devover un status 401', async () => {
                    const { body, status } = await requesGetAllWorkPositions(
                        usersInDbAndJwts.noRoles.jwt,
                    );
                    expect(status).toBe(HttpStatus.UNAUTHORIZED);
                    expect(Array.isArray(body)).toBeFalsy();
                });
            });
            describe('Con query params validos (sin banderas que no se deben repetir ni valor extras) y con un jwt valido (admin)', () => {
                it('deberia devolver un status 200 y una lista de `work positions` que cumpla con las caracteristicas indicadas en los Query Params', async () => {
                    const basic_query_params = new BasicsQueryParamsDto();
                    basic_query_params.inactive = true;
                    basic_query_params.limit = allWorkPositionInDb.length - 1;
                    const { body, status } = await requesGetAllWorkPositions(
                        usersInDbAndJwts.admin.jwt,
                        basic_query_params,
                    );
                    const workPositionsExpected = await dbConnection
                        .collection('workpositions')
                        .aggregate(
                            pipelineStagesByQueryParams(basic_query_params),
                        )
                        .toArray();
                    expect(status).toBe(HttpStatus.OK);
                    expect(body).toStrictEqual(toJSON(workPositionsExpected));
                });
            });
            describe('Con query params invalidos y campos extras (que no deberian estar) con un jwt valido (admin)', () => {
                it('deberia devolver un status 400', async () => {
                    const invalid_basic_query_params =
                        new BasicsQueryParamsDto();
                    invalid_basic_query_params.all = true;
                    invalid_basic_query_params.inactive = true;
                    invalid_basic_query_params.limit = -1200;
                    const { body, status } = await requesGetAllWorkPositions(
                        usersInDbAndJwts.admin.jwt,
                        { ...invalid_basic_query_params, campoextra: 1 } as any,
                    );
                    expect(status).toBe(HttpStatus.BAD_REQUEST);
                    expect(Array.isArray(body)).toBeFalsy();
                });
            });
        });
        describe('/GET /{id}', () => {
            const requestGetWorkPositionById = async (
                id: string,
                jwt: string,
            ) => {
                return await request(app.getHttpServer())
                    .get(`${pathController}/${id}`)
                    .set('Authorization', `Bearer ${jwt}`);
            };
            describe('Id existente y un jwt valido (admin)', () => {
                it('deberia devolver un status 200 y un json con el registro', async () => {
                    const { body, status } = await requestGetWorkPositionById(
                        usersInDbAndJwts.work_position.toString(),
                        usersInDbAndJwts.admin.jwt,
                    );
                    const work_position = allWorkPositionInDb.find(
                        (w) =>
                            w._id.toString() ===
                            usersInDbAndJwts.work_position.toString(),
                    );
                    expect(status).toBe(HttpStatus.OK);
                    expect(body).toStrictEqual(toJSON(work_position));
                });
            });
            describe('Id existente y un jwt con rol no admitido (employed)', () => {
                it('deberia devolver un status 403', async () => {
                    const { body, status } = await requestGetWorkPositionById(
                        usersInDbAndJwts.work_position.toString(),
                        usersInDbAndJwts.employed.jwt,
                    );
                    expect(status).toBe(HttpStatus.FORBIDDEN);
                    expect(body._id).toBeUndefined();
                });
            });
            describe('Id existente y un jwt sin roles', () => {
                it('deberia devolver un status 401', async () => {
                    const { body, status } = await requestGetWorkPositionById(
                        usersInDbAndJwts.work_position.toString(),
                        usersInDbAndJwts.noRoles.jwt,
                    );
                    expect(status).toBe(HttpStatus.UNAUTHORIZED);
                    expect(body._id).toBeUndefined();
                });
            });
            describe('Id inexistente y un jwt valido', () => {
                it('deberia devolver un status 404', async () => {
                    const inexisting_id = new Types.ObjectId().toString();
                    const { body, status } = await requestGetWorkPositionById(
                        inexisting_id,
                        usersInDbAndJwts.admin.jwt,
                    );
                    expect(status).toBe(HttpStatus.NOT_FOUND);
                    expect(body._id).toBeUndefined();
                });
            });
            describe('Id invalido (no es un mongoId) y un jwt valido', () => {
                it('deberia devolver un status 400', async () => {
                    const invalid_id = 'id_invalido';
                    const { body, status } = await requestGetWorkPositionById(
                        invalid_id,
                        usersInDbAndJwts.admin.jwt,
                    );
                    expect(status).toBe(HttpStatus.BAD_REQUEST);
                    expect(body._id).toBeUndefined();
                });
            });
        });
        describe('/PATCH /{id}', () => {
            const requestPatchWorkPositionById = async (
                id: string,
                workPositionUpdates: Partial<UpdateWorkPositionDto>,
                jwt?: string,
            ) => {
                return await request(app.getHttpServer())
                    .patch(`${pathController}/${id}`)
                    .set('Authorization', `Bearer ${jwt}`)
                    .send(toJSON(workPositionUpdates));
            };
            describe('Id existente, datos correctos para actualizar  y jwt admin', () => {
                it('deberia devolver un status 200 y un json con el `work position` actualizado', async () => {
                    const workPositionToTest = stubWorkPosition(true);
                    await dbConnection
                        .collection('workpositions')
                        .insertOne(workPositionToTest);
                    //
                    workPositionToTest.description = 'Nueva descripcion';
                    workPositionToTest.work_start_time = hourRandomGenerator(
                        ValidTimes.START_TIME,
                    );
                    const updates: Partial<UpdateWorkPositionDto> = {
                        description: workPositionToTest.description,
                        work_start_time: workPositionToTest.work_start_time,
                    };
                    //
                    const { body, status } = await requestPatchWorkPositionById(
                        workPositionToTest._id.toString(),
                        updates,
                        usersInDbAndJwts.admin.jwt,
                    );
                    expect(status).toBe(HttpStatus.OK);
                    expect(body).toMatchObject(toJSON(workPositionToTest));
                });
            });
            describe('Id existente, datos correctos y un jwt no valido (employed)', () => {
                it('deberia devolver un status 403', async () => {
                    const workPositionToTest = stubWorkPosition(true);
                    await dbConnection
                        .collection('workpositions')
                        .insertOne(workPositionToTest);
                    workPositionToTest.description = 'NUEVO APELLIDO';
                    workPositionToTest.work_end_time = hourRandomGenerator(
                        ValidTimes.END_TIME,
                    );
                    const updates: Partial<UpdateWorkPositionDto> = {
                        description: workPositionToTest.description,
                        work_end_time: workPositionToTest.work_end_time,
                    };
                    const { body, status } = await requestPatchWorkPositionById(
                        workPositionToTest._id.toString(),
                        updates,
                        usersInDbAndJwts.employed.jwt,
                    );
                    expect(status).toBe(HttpStatus.FORBIDDEN);
                    expect(body._id).toBeUndefined();
                });
            });
            describe('Id existente, datos correctos y jwt valido pero con un `NAME` que ya existe', () => {
                it('deberia devolver un status 404', async () => {
                    const workPositionToTest = stubWorkPosition(true);
                    await dbConnection
                        .collection('workpositions')
                        .insertOne(workPositionToTest);
                    //
                    workPositionToTest.description = 'NUEVO APELLIDO';
                    workPositionToTest.work_end_time = hourRandomGenerator(
                        ValidTimes.END_TIME,
                    );
                    const usedEmail: string = (
                        await dbConnection
                            .collection('workpositions')
                            .findOne({ _id: usersInDbAndJwts.work_position })
                    ).name;
                    workPositionToTest.name = usedEmail;
                    const updates: Partial<UpdateWorkPositionDto> = {
                        description: workPositionToTest.description,
                        work_end_time: workPositionToTest.work_end_time,
                        name: workPositionToTest.name,
                    };
                    //
                    const { body, status } = await requestPatchWorkPositionById(
                        workPositionToTest._id.toString(),
                        updates,
                        usersInDbAndJwts.admin.jwt,
                    );
                    expect(status).toBe(HttpStatus.BAD_REQUEST);
                    expect(body._id).toBeUndefined();
                });
            });
            describe('Id existente, datos incorrectos y un jwt valido', () => {
                it('deberia devolver un status 400', async () => {
                    const workPositionToTest = stubWorkPosition(true) as any;
                    await dbConnection
                        .collection('workpostions')
                        .insertOne(workPositionToTest);
                    const updates = {
                        name: 132,
                        description: 123,
                        work_end_time: new Date(),
                    } as any;
                    const { body, status } = await requestPatchWorkPositionById(
                        workPositionToTest._id.toString(),
                        updates,
                        usersInDbAndJwts.admin.jwt,
                    );
                    expect(status).toBe(HttpStatus.BAD_REQUEST);
                    expect(body._id).toBeUndefined();
                });
            });

            describe('Id que no esta en db, datos correctos para actualizar y jwt admin', () => {
                it('deberia devolver un status 404', async () => {
                    //
                    const { body, status } = await requestPatchWorkPositionById(
                        new Types.ObjectId().toString(),
                        { description: 'Descripcion' },
                        usersInDbAndJwts.admin.jwt,
                    );
                    expect(status).toBe(HttpStatus.NOT_FOUND);
                    expect(body._id).toBeUndefined();
                });
            });
        });
        describe('/DELETE /{id} (chance the value of the property `isActive` to false))', () => {
            const requestDeleteWorkPositionById = async (
                id: string,
                jwt: string,
            ) => {
                return await request(app.getHttpServer())
                    .delete(`${pathController}/${id}`)
                    .set('Authorization', `Bearer ${jwt}`);
            };
            describe('Id existente, jwt valido (admin)', () => {
                it('deberia devolver un status 204', async () => {
                    const idWorkPositionToDelete =
                        usersInDbAndJwts.work_position;
                    const { body, status } =
                        await requestDeleteWorkPositionById(
                            idWorkPositionToDelete.toString(),
                            usersInDbAndJwts.admin.jwt,
                        );
                    const isActive = (
                        await dbConnection
                            .collection('workpositions')
                            .findOne({ _id: idWorkPositionToDelete })
                    ).isActive;
                    expect(status).toBe(HttpStatus.NO_CONTENT);
                    expect(isActive).toBeFalsy();
                    expect(Object.keys(body).length).toBe(0);
                    await dbConnection
                        .collection('workpositions')
                        .updateOne(
                            { _id: idWorkPositionToDelete },
                            { $set: { isActive: true } },
                        );
                });
            });
            describe('Id existente, jwt de un usuario sin roles requeridos (employed)', () => {
                it('deberia devolver un status 403', async () => {
                    const idWorkPositionToDelete =
                        usersInDbAndJwts.work_position;
                    const { status } = await requestDeleteWorkPositionById(
                        idWorkPositionToDelete.toString(),
                        usersInDbAndJwts.employed.jwt,
                    );
                    const isActive = (
                        await dbConnection
                            .collection('workpositions')
                            .findOne({ _id: idWorkPositionToDelete })
                    ).isActive;
                    expect(status).toBe(HttpStatus.FORBIDDEN);
                    expect(isActive).toBeTruthy();
                });
            });
            describe('Id existente, jwt de un usuario sin roles', () => {
                it('deberia devolver un status 401', async () => {
                    const idWorkPositionToDelete =
                        usersInDbAndJwts.work_position;
                    const { status } = await requestDeleteWorkPositionById(
                        idWorkPositionToDelete._id.toString(),
                        usersInDbAndJwts.noRoles.jwt,
                    );
                    const isActive = (
                        await dbConnection
                            .collection('workpositions')
                            .findOne({ _id: idWorkPositionToDelete })
                    ).isActive;
                    expect(status).toBe(HttpStatus.UNAUTHORIZED);
                    expect(isActive).toBeTruthy();
                });
            });
            describe('Id que no esta en db y jwt valido (admin)', () => {
                it('deberia devolver un status 404', async () => {
                    const id = new Types.ObjectId();
                    const { status } = await requestDeleteWorkPositionById(
                        id.toString(),
                        usersInDbAndJwts.admin.jwt,
                    );
                    expect(status).toBe(HttpStatus.NOT_FOUND);
                });
            });
            describe('Id invalido (no es un mongoId) y jwt valido (admin)', () => {
                it('deberia devolver un status 400', async () => {
                    const id = 'mongoIdInvalido';
                    const { status } = await requestDeleteWorkPositionById(
                        id,
                        usersInDbAndJwts.admin.jwt,
                    );
                    expect(status).toBe(HttpStatus.BAD_REQUEST);
                });
            });
        });
    });
    /* describe('HourRegister noController (e2e)', () => {
        const pathController = '/hour-register';
        const requesGetAllHourRegisters = async (
            jwt: string,
            hourRegisterQueryParamDto?: Partial<HourRegisterQueryParamDto>,
        ) => {
            const query = getQueryParamsFromObject(hourRegisterQueryParamDto);
            return await request(app.getHttpServer())
                .get(`${pathController}${query}`)
                .set('Authorization', `Bearer ${jwt}`);
        };
        beforeAll(async () => {
            await cleanDb(dbConnection);
            usersInDbAndJwts = await saveInDbAndGetUsersAndJwts(
                dbConnection,
                jwtService,
            );
            const n_work_positions = 5;
            const n_users = 10;
            const minDate = new Date();
            const days = 20;
            const maxDate = new Date();
            maxDate.setDate(minDate.getDate() + days);
            allHourRegistersInDb = await populateHourRegistersInDbAndGetRelated(
                {
                    n_users,
                    n_work_positions,
                    dbConnection,
                    maxDate,
                    minDate,
                },
            );
        });
        describe('Sin query params y con un jwt valido (admin)', () => {
            it('deberia devolver un status 200 y una lista con `hour registers` con el estado activo', async () => {
                const queryParamsByDefault = new HourRegisterQueryParamDto();
                const { body, status } = await requesGetAllHourRegisters(
                    usersInDbAndJwts.admin.jwt,
                    queryParamsByDefault,
                );
                const hour_registers_activess = await dbConnection
                    .collection('hourregisters')
                    .aggregate([
                        ...pipelineStagesByHourRegisterQ_Params(
                            queryParamsByDefault,
                        ),
                    ])
                    .toArray();

                expect(status).toBe(HttpStatus.OK);
                expect(body.length).toBe(hour_registers_activess.length);
                expect(body).toStrictEqual(toJSON(hour_registers_activess));
            });
        });
    }); */
});
