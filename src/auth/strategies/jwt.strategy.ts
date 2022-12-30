import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserDocument } from '../entities/user.entity';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { UserRepository } from '../users.repository';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly userRespository: UserRepository,
        configService: ConfigService,
    ) {
        super({
            secretOrKey: configService.get('SECRET_KEY'),
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        });
    }
    async validate(payload: JwtPayload): Promise<UserDocument> {
        const { id } = payload;
        const user = await this.userRespository.findById(id, false);
        if (!user) throw new UnauthorizedException('Token no válido');
        if (!user.isActive)
            throw new UnauthorizedException(
                'El usuario esta inactivo, hable con un administrador',
            );
        if (user.roles.length == 0)
            throw new UnauthorizedException(
                'El usuario no tiene ningún rol, hable con un administrador',
            );
        return user;
    }
}
