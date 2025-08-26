import { IsArray, IsObject, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SettingUpdateItem {
    @IsString()
    key: string;

    @IsObject()
    value: any;
}

export class BulkUpdateSettingsDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SettingUpdateItem)
    settings: SettingUpdateItem[];
}
