import {HttpException, HttpStatus, Injectable} from "@nestjs/common";
import {CreateUserDto} from "@app/user/dto/createUser.dto";
import {UserEntity} from "@app/user/user.entity";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {sign} from "jsonwebtoken";
import {JWT_SECRET} from "@app/config";
import { UserResponseInterface} from "@app/user/types/userResponse.interface";
import {LoginUserDto} from "@app/user/dto/loginUser.dto";
import {UpdateUserDto} from "@app/user/dto/updateUser.dto";
const bcrypt = require('bcrypt');

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>
    ) {
    }
   async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
        const userByEmail = await this.userRepository.findOne({
            where: {
                email: createUserDto.email
            }
        });

       if(userByEmail) {
           throw new HttpException('Email already used', HttpStatus.UNPROCESSABLE_ENTITY);
       }

       const newUser = new UserEntity(); //creates empty object
       Object.assign(newUser, createUserDto);
       console.log('newUser', newUser);
       return await this.userRepository.save(newUser);
   }

   async loginUser(loginUserDto: LoginUserDto): Promise<UserEntity> {
       const userByEmail = await this.userRepository.findOne({
           where: {
               email: loginUserDto.email
           },
           select: ['id', 'username', 'email', 'bio', 'image', 'password']
       });

       if (!userByEmail) {
           throw new HttpException("The email doesnt exist", HttpStatus.UNPROCESSABLE_ENTITY)
       }
       const isPasswordOk = await bcrypt.compare(loginUserDto.password, userByEmail.password);
       if (isPasswordOk === false) {
           throw new HttpException('Password is wrong', HttpStatus.UNAUTHORIZED);
       }

       delete userByEmail.password;

       return userByEmail;
   }

   async updateUser(userId: number, updateUserDto: UpdateUserDto): Promise<UserEntity> {
        const userToUpdate = await this.findById(userId);
        Object.assign(userToUpdate, updateUserDto);
        return await this.userRepository.save(userToUpdate);
   }

    findById(id: number): Promise<UserEntity> {
        return this.userRepository.findOne({
            where: {id}
        });
   }

    generateJwt(user: UserEntity):string {
        return sign({
            id: user.id,
            username: user.username,
            email: user.email
        }, JWT_SECRET)
    }

   buildUserResponse(user: UserEntity): UserResponseInterface {
        return {
            user: {
                ...user,
                token: this.generateJwt(user)
            }
        }
   }
}