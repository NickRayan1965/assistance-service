import { Controller, Post, Body, HttpStatus, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateOrLoginResponseDto } from './dto/create-or-login-response.dto';
import { ValidRoles } from './interfaces';
import { Auth } from './decorators';
@ApiTags('Auth')
@ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos enviados incorrectos',
})
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @ApiBearerAuth()
    @ApiResponse({
        status: HttpStatus.CREATED,
        type: CreateOrLoginResponseDto,
        description: 'Usuario creado correctamente',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Token inválido',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: 'Token sin autorización',
    })
    @Auth(ValidRoles.admin)
    @Post('register')
    register(@Body() createAuthDto: CreateUserDto) {
        return this.authService.registerUser(createAuthDto);
    }
    @ApiResponse({
        status: HttpStatus.OK,
        type: CreateOrLoginResponseDto,
        description: 'Inicio de sesión correcto',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Credenciales Incorrectas',
    })
    @HttpCode(HttpStatus.OK)
    @Post('login')
    login(@Body() loginUserDto: LoginUserDto) {
        return this.authService.loginUser(loginUserDto);
    }
}
