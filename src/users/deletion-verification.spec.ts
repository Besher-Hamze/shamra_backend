import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { User } from './scheme/user.scheme';
import { NotFoundException } from '@nestjs/common';

describe('UsersService Deletion Verification', () => {
  let service: UsersService;
  let modelMock: any;

  beforeEach(async () => {
    modelMock = {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: modelMock,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should update user with isDeleted: true and suffix identifiers', async () => {
    const mockUser = {
      _id: 'user123',
      phoneNumber: '+963900000000',
      email: 'test@example.com',
      isDeleted: false,
    };

    modelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockUser),
    });

    const updateMock = {
      exec: jest.fn().mockResolvedValue(true),
    };
    modelMock.findByIdAndUpdate.mockReturnValue(updateMock);

    await service.remove('user123');

    expect(modelMock.findByIdAndUpdate).toHaveBeenCalledWith(
      'user123',
      expect.objectContaining({
        isDeleted: true,
        isActive: false,
        fcmToken: null,
        phoneNumber: expect.stringContaining('_deleted_'),
        email: expect.stringContaining('_deleted_'),
      }),
    );
  });

  it('should throw NotFoundException if user is already deleted', async () => {
    modelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ isDeleted: true }),
    });

    await expect(service.remove('user123')).rejects.toThrow(NotFoundException);
  });
});
