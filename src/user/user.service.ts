import {Injectable} from "@nestjs/common";
import {CreateUserDto} from "@app/user/dto/createUser.dto";
import {UserEntity} from "@app/user/user.entity";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>
    ) {
    }
   async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
       const newUser = new UserEntity(); //creates empty object
       Object.assign(newUser, createUserDto);
       console.log('newUser', newUser);
       return await this.userRepository.save(newUser);
   }
}