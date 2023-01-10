/* import { Test } from '@nestjs/testing';
import { AppModule } from 'app/app.module';
import { NestApplication } from '@nestjs/core';
import { Connection } from 'mongoose';
import { DatabaseSevice } from 'app/database/database.service';
import * as request from 'supertest';
import { userStub } from '../../stubs/auth/CreateUserDto.stub';
import { HttpStatus, ValidationPipe } from '@nestjs/common';
import {
    DEFAULT_USER_ROLES,
    User,
    UserDocument,
} from 'app/auth/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { userAdminStub } from '../../test/stubs/userAdmin.stub';
import * as bcrypt from 'bcrypt';
import { userWithoutRolesStub } from '../../test/stubs/userWithoutRoles.stub';
import { JwtPayload } from '../../src/auth/interfaces';
import { CreateUserDto } from '../../src/auth/dto';
import { userWithOnlyEmployedRoleStub } from '../../test/stubs/userWithEmployedRoleOnly.stub';
import { userAdminWithIncorrectDataStub } from '../../test/stubs/userAdminWithIncorrectData.stub';
import { userAdminWithExtraFieldsStub } from '../../test/stubs/userAdminWithExtraFields.stub';
import { userWithoutOptionalFieldsStub } from '../../test/stubs/userWithoutOptionalFields.stub copy';
import {
    UserAndUserCredentials,
    UserCredential,
} from '../../test/interfaces/user-userCredentials.interface';
import { userCredentialsThatIsNotRegisteredStub } from '../../test/stubs/userCredentialsThatIsNotRegisteres.stub';

describe('AuhtController (e2e)', () => {
    let app: NestApplication;
    let dbConnection: Connection;
    let httpServer: any;
    let jwtService: JwtService;
    const pathController = '/auth';
    //
    let userInDbWithAdminRole: UserAndUserCredentials;
    let userInDbWithoutRoles: UserAndUserCredentials;
    let userInDbWithOnlyEmployedRole: UserAndUserCredentials;
    let jwtWithRoles: string;
    let jwtWithoutRoles: string;
    let jwtWithOnlyEmployedRole: string;
    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        app = moduleRef.createNestApplication();
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
                transformOptions: {
                    enableImplicitConversion: true,
                },
            }),
        );
        await app.init();
        dbConnection = moduleRef
            .get<DatabaseSevice>(DatabaseSevice)
            .getDbHandle();
        httpServer = app.getHttpServer();
        jwtService = moduleRef.get<JwtService>(JwtService);
        //
        const userAdminForTheTest = userAdminStub();
        const credentialUserAdmin: UserCredential = {
            email: userAdminForTheTest.email,
            password: userAdminForTheTest.password,
        };
        userAdminForTheTest.password = bcrypt.hashSync(
            userAdminForTheTest.password,
            10,
        );
        const user_id_inserted = (
            await dbConnection
                .collection('users')
                .insertOne(userAdminForTheTest)
        ).insertedId;
        userInDbWithAdminRole = {
            credential: credentialUserAdmin,
            user: await dbConnection
                .collection('users')
                .findOne<UserDocument>({ _id: user_id_inserted }),
        };
        jwtWithRoles = jwtService.sign({
            id: userInDbWithAdminRole.user._id.toString(),
        });

        //User Without roles
        const userNoRolesForTheTest = userWithoutRolesStub();
        const credentialUserNoRoles: UserCredential = {
            email: userNoRolesForTheTest.email,
            password: userNoRolesForTheTest.password,
        };
        userNoRolesForTheTest.password = bcrypt.hashSync(
            userNoRolesForTheTest.password,
            10,
        );
        const user_no_roles_id = (
            await dbConnection
                .collection('users')
                .insertOne(userNoRolesForTheTest)
        ).insertedId;
        userInDbWithoutRoles = {
            credential: credentialUserNoRoles,
            user: await dbConnection
                .collection('users')
                .findOne<User>({ _id: user_no_roles_id }),
        };

        jwtWithoutRoles = jwtService.sign({
            id: userInDbWithoutRoles.user._id.toString(),
        });
        //User with only employed role
        const userWithOnlyEmployedRole = userWithOnlyEmployedRoleStub();
        const credentialUserWithOnlyEmployedRole: UserCredential = {
            email: userWithOnlyEmployedRole.email,
            password: userWithOnlyEmployedRole.password,
        };
        userWithOnlyEmployedRole.password = bcrypt.hashSync(
            userWithOnlyEmployedRole.password,
            10,
        );
        const userWithOnlyEmployedRole_id = (
            await dbConnection
                .collection('users')
                .insertOne(userWithOnlyEmployedRole)
        ).insertedId;
        userInDbWithOnlyEmployedRole = {
            credential: credentialUserWithOnlyEmployedRole,
            user: await dbConnection
                .collection('users')
                .findOne<User>({ _id: userWithOnlyEmployedRole_id }),
        };

        jwtWithOnlyEmployedRole = jwtService.sign({
            id: userInDbWithOnlyEmployedRole.user._id.toString(),
        });
    });
    afterAll(async () => {
        await dbConnection.collection('users').deleteMany({});
        await app.close();
    });
    describe('/POST register', () => {
        const validUserToCreate = userStub();
        const responseCreateUser = (
            jwt: string,
            user_to_create: Partial<CreateUserDto>,
        ): request.Test => {
            return request(httpServer)
                .post(`${pathController}/register`)
                .set('Authorization', `Bearer ${jwt}`)
                .send(user_to_create);
        };

        beforeEach(async () => {
            await dbConnection
                .collection('users')
                .findOneAndDelete({ email: validUserToCreate.email });
        });
        describe('Datos correctos y con todos los campos opcionales (sin campos invalidos) con jwt valido (incluido los roles)', () => {
            it('deberia devolver un status code 201, y un json con el usuario y un nuevo jwt valido', async () => {
                const exits_before = Boolean(
                    await dbConnection
                        .collection('users')
                        .findOne({ email: validUserToCreate.email }),
                );
                const response = await responseCreateUser(
                    jwtWithRoles,
                    validUserToCreate,
                );
                const exits_after = Boolean(
                    await dbConnection
                        .collection('users')
                        .findOne({ email: validUserToCreate.email }),
                );
                const userResponse: User = response.body.user;
                const jwtResponse: string = response.body.jwt;
                expect(response.status).toBe(HttpStatus.CREATED);
                expect(exits_before).toBeFalsy();
                expect(exits_after).toBeTruthy();
                const pwd_encrypted: string = userResponse.password;
                expect(
                    bcrypt.compareSync(
                        validUserToCreate.password,
                        pwd_encrypted,
                    ),
                ).toBeTruthy();
                userResponse.password = validUserToCreate.password;
                expect(userResponse).toMatchObject(validUserToCreate);
                await jwtService.verify(jwtResponse);
                expect((jwtService.decode(jwtResponse) as JwtPayload).id).toBe(
                    userResponse._id.toString(),
                );
            });
        });
        describe('Datos correctos y con todos los campos opcionales (sin campos invalidos) con jwt valido (pero el id del payload es de un usuario sin roles validos)', () => {
            it('Sin roles, debería devolver un status code 401', async () => {
                const exits_before = Boolean(
                    await dbConnection
                        .collection('users')
                        .findOne({ email: validUserToCreate.email }),
                );
                const response = await responseCreateUser(
                    jwtWithoutRoles,
                    validUserToCreate,
                );
                const exits_after = Boolean(
                    await dbConnection
                        .collection('users')
                        .findOne({ email: validUserToCreate.email }),
                );
                expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
                expect(exits_before).toBeFalsy();
                expect(exits_after).toBeFalsy();
            });
            it('Sin roles requeridos (ej: solo empleado, esperado: admin), debería devolver un status code 403', async () => {
                const exits_before = Boolean(
                    await dbConnection
                        .collection('users')
                        .findOne({ email: validUserToCreate.email }),
                );
                const response = await responseCreateUser(
                    jwtWithOnlyEmployedRole,
                    validUserToCreate,
                );
                const exits_after = Boolean(
                    await dbConnection
                        .collection('users')
                        .findOne({ email: validUserToCreate.email }),
                );
                expect(response.status).toBe(HttpStatus.FORBIDDEN);
                expect(exits_before).toBeFalsy();
                expect(exits_after).toBeFalsy();
            });
        });
        describe('Datos incorrectos en todos los campos (sin campos extras invalidos) y con el jwt adecuado(role admin)', () => {
            it('deberia devolver un status code 400', async () => {
                const userAdminWithIncorrectData =
                    userAdminWithIncorrectDataStub();
                const exits_before = Boolean(
                    await dbConnection
                        .collection('users')
                        .findOne({ email: userAdminWithIncorrectData.email }),
                );
                const response = await responseCreateUser(
                    jwtWithRoles,
                    userAdminWithIncorrectData,
                );
                const exits_after = Boolean(
                    await dbConnection
                        .collection('users')
                        .findOne({ email: userAdminWithIncorrectData.email }),
                );
                expect(exits_before).toBeFalsy();
                expect(exits_after).toBeFalsy();
                expect(response.status).toBe(HttpStatus.BAD_REQUEST);
            });
        });
        describe('Datos correctos en todos los campos pero, con campos que no deberia ser enviados', () => {
            it('deberia devolver un status code 400', async () => {
                const userAdminWithExtraFields = userAdminWithExtraFieldsStub();
                const exits_before = Boolean(
                    await dbConnection
                        .collection('users')
                        .findOne({ email: userAdminWithExtraFields.email }),
                );
                const response = await responseCreateUser(
                    jwtWithRoles,
                    userAdminWithExtraFields,
                );
                const exits_after = Boolean(
                    await dbConnection
                        .collection('users')
                        .findOne({ email: userAdminWithExtraFields.email }),
                );
                expect(response.status).toBe(HttpStatus.BAD_REQUEST);
                expect(exits_before).toBeFalsy();
                expect(exits_after).toBeFalsy();
            });
        });
        describe('Datos correctos,jwt valido y de un usuario admin pero con un email que ya esta registrado', () => {
            it('deberia devolver un status code 400', async () => {
                await dbConnection
                    .collection('users')
                    .insertOne(validUserToCreate);
                const exits_before = Boolean(
                    await dbConnection
                        .collection('users')
                        .findOne({ email: validUserToCreate.email }),
                );
                const response = await responseCreateUser(
                    jwtWithRoles,
                    validUserToCreate,
                );
                const exits_after = Boolean(
                    await dbConnection
                        .collection('users')
                        .findOne({ email: validUserToCreate.email }),
                );
                expect(response.status).toBe(HttpStatus.BAD_REQUEST);
                expect(exits_before).toBeTruthy();
                expect(exits_after).toBeTruthy();
            });
        });
        describe('Datos correctos, todos los campos opcionales, pero sin enviar un jwt', () => {
            it('deberia devolver un status code 401', async () => {
                const exits_before = Boolean(
                    await dbConnection
                        .collection('users')
                        .findOne({ email: validUserToCreate.email }),
                );
                const response = await request(httpServer)
                    .post(`${pathController}/register`)
                    .send(validUserToCreate);
                const exits_after = Boolean(
                    await dbConnection
                        .collection('users')
                        .findOne({ email: validUserToCreate.email }),
                );
                expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
                expect(exits_before).toBeFalsy();
                expect(exits_after).toBeFalsy();
            });
        });
        describe('Datos correctos, jwt valido, pero sin campos opcionales (campo roles)', () => {
            it(`deberia devolver un status code 201 y el campo 'roles' debería ser este por defecto => ${JSON.stringify(
                DEFAULT_USER_ROLES,
            )}`, async () => {
                const userWithoutOptionalFields =
                    userWithoutOptionalFieldsStub();
                const exits_before = Boolean(
                    await dbConnection
                        .collection('users')
                        .findOne({ email: userWithoutOptionalFields.email }),
                );
                const response = await responseCreateUser(
                    jwtWithRoles,
                    userWithoutOptionalFields,
                );
                const exits_after = Boolean(
                    await dbConnection
                        .collection('users')
                        .findOne({ email: userWithoutOptionalFields.email }),
                );

                expect(response.status).toBe(HttpStatus.CREATED);
                expect(response.body.user.roles).toStrictEqual(
                    DEFAULT_USER_ROLES,
                );
                expect(exits_before).toBeFalsy();
                expect(exits_after).toBeTruthy();
            });
        });
    });
    describe('/POST login', () => {
        const requestLogin = (
            userCredentials: Partial<UserCredential>,
        ): request.Test => {
            return request(httpServer)
                .post(`${pathController}/login`)
                .send(userCredentials);
        };
        describe('Todos los campos enviados, sin campos extra invalidos y con credenciales de un usuario existente', () => {
            it('deberia devolver un status code 200, el registro del usuario y su jwt', async () => {
                const response = await requestLogin(
                    userInDbWithAdminRole.credential,
                );
                const userResponse = response.body.user as User;
                const jwtResponse = response.body.jwt as string;
                expect(response.status).toBe(HttpStatus.OK);
                expect(userResponse).toMatchObject(userInDbWithAdminRole.user);
                expect(jwtResponse).toBeDefined();
                await jwtService.verify(jwtResponse);
                const payload_id_response = (
                    jwtService.decode(jwtResponse) as JwtPayload
                ).id;
                expect(payload_id_response).toBe(
                    userInDbWithAdminRole.user._id.toString(),
                );
            });
        });
        describe('Todos los campos enviados, sin campos extra invalidos y con credenciales de un usuario que no existe', () => {
            it('deberia devolver un status code 401', async () => {
                const userCredentialsThatIsNotRegistered =
                    userCredentialsThatIsNotRegisteredStub();
                const exists = Boolean(
                    await dbConnection.collection('users').findOne({
                        email: userCredentialsThatIsNotRegistered.email,
                    }),
                );
                const response = await requestLogin(
                    userCredentialsThatIsNotRegistered,
                );
                expect(exists).toBeFalsy();
                expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
            });
        });
        describe('Sin enviar campos requeridos (password), sin campos extras invalidos y con un email que si exista', () => {
            it('deberia devolver un status code 400', async () => {
                const userCredentialIncomplete: UserCredential = {
                    email: userInDbWithAdminRole.credential.email,
                };
                const exists = Boolean(
                    await dbConnection
                        .collection('users')
                        .findOne({ email: userCredentialIncomplete.email }),
                );
                const response = await requestLogin(userCredentialIncomplete);
                expect(exists).toBeTruthy();
                expect(response.status).toBe(HttpStatus.BAD_REQUEST);
            });
        });
        describe('Enviando un email de usuario existente pero con una contraseña incorrecta', () => {
            it('deberia devolver un status code 401', async () => {
                const userCredentialWithIncorrectPwd = {
                    ...userInDbWithAdminRole.credential,
                };
                userCredentialWithIncorrectPwd.password = 'IncorrectPassword';
                const exists = Boolean(
                    await dbConnection.collection('users').findOne({
                        email: userCredentialWithIncorrectPwd.email,
                    }),
                );
                const response = await requestLogin(
                    userCredentialWithIncorrectPwd,
                );
                expect(exists).toBeTruthy();
                expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
            });
        });
        describe('Datos correctos con credenciales de un usuario existente pero enviando campos extra que no deberian estar', () => {
            it('deberia devolver un status code 400', async () => {
                const userCredentialWithExtraFields: UserCredential = {
                    ...userInDbWithAdminRole.credential,
                    extraField: 'dato que no deberia estar',
                };
                const exists = Boolean(
                    await dbConnection.collection('users').findOne({
                        email: userCredentialWithExtraFields.email,
                    }),
                );
                const response = await requestLogin(
                    userCredentialWithExtraFields,
                );
                expect(exists).toBeTruthy();
                expect(response.status).toBe(HttpStatus.BAD_REQUEST);
            });
        });
    });
});
 */
