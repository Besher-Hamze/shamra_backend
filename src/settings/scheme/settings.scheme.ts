import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';

export type SettingsDocument = Settings & Document;

@Schema({ timestamps: true })
export class Settings {
    @Prop({ required: true, unique: true })
    key: string;

    @Prop({ required: true, type: mongoose.Schema.Types.Mixed })
    value: any;

    @Prop({ trim: true })
    description: string;

    @Prop({ trim: true })
    descriptionAr: string;

    @Prop({ default: 'string' })
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';

    @Prop({ default: 'general' })
    category: 'general' | 'business' | 'email' | 'payment' | 'notification' | 'system';

    @Prop({ default: false })
    isPublic: boolean; // Can be accessed without authentication

    @Prop({ default: false })
    isEditable: boolean; // Can be modified by users

    @Prop({ default: false })
    isDeleted: boolean;

    @Prop({ type: Types.ObjectId, ref: 'User', required: false })
    createdBy: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: false })
    updatedBy: Types.ObjectId;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);

// Indexes
// key index is already created by @Prop({ unique: true })
SettingsSchema.index({ category: 1 });
SettingsSchema.index({ isPublic: 1 });
SettingsSchema.index({ isDeleted: 1 });

// Text index for search
SettingsSchema.index({
    key: 'text',
    description: 'text',
    descriptionAr: 'text',
});

// Pre-save middleware
SettingsSchema.pre('save', function (next) {
    // Ensure key is lowercase and contains only alphanumeric characters and underscores
    if (this.isModified('key')) {
        this.key = this.key.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    }

    next();
});

// Ensure virtual fields are serialised
SettingsSchema.set('toJSON', { virtuals: true });
