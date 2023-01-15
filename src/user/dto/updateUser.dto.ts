import {IsOptional} from "class-validator";

export class UpdateUserDto {
    @IsOptional()
    readonly email: string;

    @IsOptional()
    readonly bio: string;

    @IsOptional()
    readonly image: string;
}