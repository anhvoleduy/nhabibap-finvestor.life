import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import { UsersService } from './users.service';
import { User } from '../auth/entities/user.entity';
import { EmailService } from '../email/email.service';

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  passwordHash: 'hashed',
  createdAt: new Date(),
} as User;

describe('UsersService', () => {
  let service: UsersService;
  let repo: {
    findOneBy: jest.Mock;
    createQueryBuilder: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let emailService: { sendVerificationEmail: jest.Mock };

  beforeEach(async () => {
    const qb = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    } as unknown as SelectQueryBuilder<User>;

    repo = {
      findOneBy: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      create: jest.fn(),
      save: jest.fn(),
    };
    emailService = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repo },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  describe('findById', () => {
    it('calls findOneBy with id', async () => {
      repo.findOneBy.mockResolvedValue(mockUser);
      const result = await service.findById('user-1');
      expect(repo.findOneBy).toHaveBeenCalledWith({ id: 'user-1' });
      expect(result).toBe(mockUser);
    });

    it('returns null when not found', async () => {
      repo.findOneBy.mockResolvedValue(null);
      expect(await service.findById('no-such')).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('calls findOneBy with email', async () => {
      repo.findOneBy.mockResolvedValue(mockUser);
      const result = await service.findByEmail('test@example.com');
      expect(repo.findOneBy).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
      expect(result).toBe(mockUser);
    });
  });

  describe('searchByEmail', () => {
    it('returns query builder results', async () => {
      const qb = repo.createQueryBuilder();
      (qb.getMany as jest.Mock).mockResolvedValue([mockUser]);

      const result = await service.searchByEmail('test');

      expect(repo.createQueryBuilder).toHaveBeenCalledWith('u');
      expect(result).toEqual([mockUser]);
    });
  });

  describe('create', () => {
    it('saves and returns new unverified user with token', async () => {
      repo.findOneBy.mockResolvedValue(null);
      repo.create.mockReturnValue(mockUser);
      repo.save.mockResolvedValue(mockUser);
      const expiresAt = new Date(Date.now() + 1000);

      const result = await service.create(
        'new@example.com',
        'hash',
        'New',
        'tok',
        expiresAt,
      );

      expect(repo.create).toHaveBeenCalledWith({
        email: 'new@example.com',
        passwordHash: 'hash',
        name: 'New',
        emailVerified: false,
        emailVerificationToken: 'tok',
        emailVerificationTokenExpiresAt: expiresAt,
      });
      expect(result).toBe(mockUser);
    });

    it('throws ConflictException when email exists', async () => {
      repo.findOneBy.mockResolvedValue(mockUser);

      await expect(
        service.create('test@example.com', 'hash', 'Dup', 'tok', new Date()),
      ).rejects.toThrow(ConflictException);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('findByVerificationToken', () => {
    it('calls findOneBy with token', async () => {
      repo.findOneBy.mockResolvedValue(mockUser);
      const result = await service.findByVerificationToken('tok');
      expect(repo.findOneBy).toHaveBeenCalledWith({
        emailVerificationToken: 'tok',
      });
      expect(result).toBe(mockUser);
    });
  });

  describe('setVerificationToken', () => {
    it('updates token + expiry and saves', async () => {
      const user = { ...mockUser } as User;
      repo.save.mockImplementation((u) => Promise.resolve(u));
      const expiresAt = new Date(Date.now() + 1000);

      const result = await service.setVerificationToken(user, 'new', expiresAt);

      expect(result.emailVerificationToken).toBe('new');
      expect(result.emailVerificationTokenExpiresAt).toBe(expiresAt);
      expect(repo.save).toHaveBeenCalledWith(user);
    });
  });

  describe('markEmailVerified', () => {
    it('sets verified, clears token, and saves', async () => {
      const user = {
        ...mockUser,
        emailVerified: false,
        emailVerificationToken: 'tok',
        emailVerificationTokenExpiresAt: new Date(),
      } as User;
      repo.save.mockImplementation((u) => Promise.resolve(u));

      const result = await service.markEmailVerified(user);

      expect(result.emailVerified).toBe(true);
      expect(result.emailVerificationToken).toBeNull();
      expect(result.emailVerificationTokenExpiresAt).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('throws NotFoundException when user missing', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(
        service.updateProfile('no-such', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates name without touching verification state', async () => {
      const user = {
        ...mockUser,
        emailVerified: true,
        emailVerificationToken: null,
      } as User;
      repo.findOneBy.mockResolvedValue(user);
      repo.save.mockImplementation((u) => Promise.resolve(u));

      const result = await service.updateProfile('user-1', {
        name: 'New Name',
      });

      expect(result.name).toBe('New Name');
      expect(result.email).toBe(mockUser.email);
      expect(result.emailVerified).toBe(true);
      expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('throws ConflictException when new email already in use', async () => {
      const user = { ...mockUser, emailVerified: true } as User;
      repo.findOneBy
        .mockResolvedValueOnce(user) // findById
        .mockResolvedValueOnce({ ...mockUser, id: 'other' }); // findByEmail conflict

      await expect(
        service.updateProfile('user-1', { email: 'taken@example.com' }),
      ).rejects.toThrow(ConflictException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('resets emailVerified and sends a new verification email when email changes', async () => {
      const user = {
        ...mockUser,
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpiresAt: null,
      } as User;
      repo.findOneBy
        .mockResolvedValueOnce(user) // findById
        .mockResolvedValueOnce(null); // findByEmail: no conflict
      repo.save.mockImplementation((u) => Promise.resolve(u));

      const result = await service.updateProfile('user-1', {
        email: 'new@example.com',
      });

      expect(result.email).toBe('new@example.com');
      expect(result.emailVerified).toBe(false);
      expect(result.emailVerificationToken).toEqual(expect.any(String));
      expect(result.emailVerificationTokenExpiresAt).toBeInstanceOf(Date);
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        'new@example.com',
        mockUser.name,
        result.emailVerificationToken,
      );
    });

    it('does not reset verification when email is unchanged', async () => {
      const user = { ...mockUser, emailVerified: true } as User;
      repo.findOneBy.mockResolvedValue(user);
      repo.save.mockImplementation((u) => Promise.resolve(u));

      const result = await service.updateProfile('user-1', {
        email: mockUser.email,
      });

      expect(result.emailVerified).toBe(true);
      expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
    });
  });
});
