import * as bcrypt from 'bcrypt';
export class Encrypter {
    static encrypt(pwd_to_encrypt: string): string {
        return bcrypt.hashSync(pwd_to_encrypt, 10);
    }
    static checkPassword(pwd_to_check: string, pwd_encrypted): boolean {
        return bcrypt.compareSync(pwd_to_check, pwd_encrypted);
    }
}
