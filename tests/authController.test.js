const { register, login } = require('../src/app/controllers/authController');
const UserDAO = require('../src/app/dao/UserDAO');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

jest.mock('../src/app/dao/UserDAO');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('fs', () => ({
    readFileSync: jest.fn(() => 'mocked-file-content')
}));

describe('Auth Controller', () => {
	let req, res;

	beforeEach(() => {
		req = {
			body: {}
		};
		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
			cookie: jest.fn(),
		};
	});

	describe('register', () => {
		test('should return 400 if user already exists', async () => {
			req.body = { username: 'existingUser', email: 'user@test.com', password: 'password123' };
			UserDAO.getUserByName.mockResolvedValue({ username: 'existingUser' });

			await register(req, res);

			expect(UserDAO.getUserByName).toHaveBeenCalledWith('existingUser');
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({ message: 'Ez a felhasználó már létezik! ' });
		});

		test('should create user if user does not exist', async () => {
			req.body = { username: 'newUser', email: 'newuser@test.com', password: 'password123' };
			UserDAO.getUserByName.mockResolvedValue(null);
			bcrypt.hash.mockResolvedValue('hashedPassword');

			await register(req, res);

			expect(UserDAO.getUserByName).toHaveBeenCalledWith('newUser');
			expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
			expect(UserDAO.create).toHaveBeenCalledWith('newUser', 'newuser@test.com', 'hashedPassword');
			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.json).toHaveBeenCalledWith({ message: 'Sikeres regisztráció!' });
		});

		test('should return 500 if an error occurs', async () => {
			req.body = { username: 'newUser', email: 'newuser@test.com', password: 'password123' };
			UserDAO.getUserByName.mockRejectedValue(new Error('DB Error'));

			await register(req, res);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith({ message: 'Hiba történt a regisztráció során!', error: expect.any(Error) });
		});
	});

	describe('login', () => {
		test('should return 400 if user does not exist', async () => {
			req.body = { username: 'nonexistentUser', password: 'password123' };
			UserDAO.getUserByName.mockResolvedValue(null);

			await login(req, res);

			expect(UserDAO.getUserByName).toHaveBeenCalledWith('nonexistentUser');
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({ message: 'Rossz felhasználónév vagy jelszó!' });
		});

		test('should return 400 if password does not match', async () => {
			req.body = { username: 'existingUser', password: 'wrongPassword' };
			UserDAO.getUserByName.mockResolvedValue({ username: 'existingUser', jelszo: 'hashedPassword' });
			bcrypt.compare.mockResolvedValue(false);

			await login(req, res);

			expect(bcrypt.compare).toHaveBeenCalledWith('wrongPassword', 'hashedPassword');
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({ message: 'Rossz felhasználónév vagy jelszó!' });
		});

		test('should return 200 and generate a token if login is successful', async () => {
			req.body = { username: 'validUser', password: 'correctPassword' };
			UserDAO.getUserByName.mockResolvedValue({ id: 1, nev: 'validUser', jelszo: 'hashedPassword' });
			bcrypt.compare.mockResolvedValue(true);
			jwt.sign.mockReturnValue('fakeToken');

			await login(req, res);

			expect(bcrypt.compare).toHaveBeenCalledWith('correctPassword', 'hashedPassword');
			expect(jwt.sign).toHaveBeenCalledWith({ id: 1, nev: 'validUser' }, process.env.JWT_SECRET, { expiresIn: '1h' });
			expect(res.cookie).toHaveBeenCalledWith('jwt', 'fakeToken', {
				httpOnly: true,
				secure: false,
				maxAge: 3600000,
				sameSite: 'Strict'
			});
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({ message: 'Sikeres bejelentkezés' });
		});

		test('should return 500 if an error occurs during login', async () => {
			req.body = { username: 'validUser', password: 'correctPassword' };
			UserDAO.getUserByName.mockRejectedValue(new Error('DB Error'));

			await login(req, res);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith({ message: 'Hiba történt a bejelentkezés során!', error: expect.any(Error) });
		});
	});
});
