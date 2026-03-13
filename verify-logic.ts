
import { UsersService } from './src/users/users.service';

async function test() {
  console.log('Starting verification test...');
  
  const mockUser = {
    _id: 'user123',
    phoneNumber: '+963900000000',
    email: 'test@example.com',
    isDeleted: false,
  };

  const mockModel: any = {
    findById: (id: string) => ({
      exec: async () => mockUser
    }),
    findByIdAndUpdate: (id: string, data: any) => ({
      exec: async () => {
        console.log('Update called with:', JSON.stringify(data, null, 2));
        return true;
      }
    })
  };

  const service = new UsersService(mockModel);

  try {
    await service.remove('user123');
    console.log('Test PASSED: remove() executed successfully');
  } catch (err) {
    console.error('Test FAILED:', err);
    process.exit(1);
  }
}

test();
