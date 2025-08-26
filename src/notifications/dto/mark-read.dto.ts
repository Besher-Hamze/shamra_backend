import { IsMongoId, IsOptional } from 'class-validator';

export class MarkReadDto {
    @IsMongoId()
    notificationId: string;

    @IsOptional()
    @IsMongoId()
    userId?: string;
}
