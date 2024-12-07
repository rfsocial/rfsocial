const UserDAO = require('../src/app/dao/UserDAO');
const database = require('../src/app/config/db');

jest.mock('../src/app/config/db');
jest.mock('fs', () => ({
    readFileSync: jest.fn(() => 'mocked-file-content')
}));

describe('UserDAO tests', () => {
    afterEach(() => {
        jest.clearAllMocks(); // Mock hívások tisztítása minden teszt után
    });

    describe('create', () => {
        test('should insert a new user and return it', async () => {
            const mockResult = {
                rows: [{ id: 1, nev: 'Test User', email: 'test@test.com', jelszo: 'hashedPassword', profilkep: '../../pfp-placeholder.png' }],
            };
            database.query.mockResolvedValue(mockResult);

            const user = await UserDAO.create('Test User', 'test@test.com', 'hashedPassword');

            expect(database.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO Felhasznalo'),
                expect.arrayContaining(['Test User', 'test@test.com', 'hashedPassword', '../../pfp-placeholder.png'])
            );
            expect(user).toMatchObject({ id: 1, nev: 'Test User', email: 'test@test.com' });
        });

        test('should handle database errors', async () => {
            database.query.mockRejectedValue(new Error('DB error'));

            await expect(UserDAO.create('Test User', 'test@test.com', 'hashedPassword')).rejects.toThrow('DB error');
        });
    });

    describe('getUserById', () => {
        test('should return user by ID', async () => {
            const mockResult = {
                rows: [{ id: 1, nev: 'Test User', email: 'test@test.com', jelszo: 'hashedPassword' }],
            };
            database.query.mockResolvedValue(mockResult);

            const user = await UserDAO.getUserById(1);

            expect(database.query).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM Felhasznalo WHERE id = $1'), [1]);
            expect(user).toMatchObject({ id: 1, nev: 'Test User' });
        });

        test('should return null if user not found', async () => {
            database.query.mockResolvedValue({ rows: [] });

            const user = await UserDAO.getUserById(99);

            expect(database.query).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM Felhasznalo WHERE id = $1'), [99]);
            expect(user).toBeNull();
        });
    });

    describe('getUserByName', () => {
        test('should return user by name', async () => {
            const mockResult = {
				rows: [{ id: 1, nev: 'Test User', email: 'test@test.com', jelszo: 'hashedPassword' }],
				rowCount: 1, // Szükséges az implementációban lévő ellenőrzéshez (így nem null értéket kapok vissza)
			};
			database.query.mockResolvedValue(mockResult);
		
			const user = await UserDAO.getUserByName('Test User');
		
			expect(database.query).toHaveBeenCalledWith(
				expect.stringContaining('SELECT * FROM Felhasznalo WHERE nev = $1'),
				['Test User']
			);
			expect(user).toMatchObject({ nev: 'Test User' });
        });

        test('should return null if user not found', async () => {
            database.query.mockResolvedValue({ rows: [] });

            const user = await UserDAO.getUserByName('Unknown User');

            expect(user).toBeNull();
        });
    });

    describe('getUserProfilePicture', () => {
        test('should return the profile picture URL of a user', async () => {
            const mockResult = { 
				rows: [{ profilkep: '../../pfp-placeholder.png' }],
				rowCount: 1, // Szükséges az implementációban lévő ellenőrzéshez (így nem null értéket kapok vissza)
			};
            database.query.mockResolvedValue(mockResult);

            const profilePic = await UserDAO.getUserProfilePicture(1);

            expect(database.query).toHaveBeenCalledWith(expect.stringContaining('SELECT profilkep FROM Felhasznalo WHERE id = $1'), [1]);
            expect(profilePic).toBe('../../pfp-placeholder.png');
        });

        test('should return null if user not found', async () => {
            database.query.mockResolvedValue({ rows: [] });

            const profilePic = await UserDAO.getUserProfilePicture(99);

            expect(profilePic).toBeNull();
        });
    });

    describe('deleteUserById', () => {
        test('should delete a user by ID', async () => {
            const mockResult = { rowCount: 1 };
            database.query.mockResolvedValue(mockResult);

            const result = await UserDAO.deleteUserById(1);

            expect(database.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM Felhasznalo WHERE id = $1'), [1]);
            expect(result).toBe(true);
        });

        test('should return false if no user is deleted', async () => {
            database.query.mockResolvedValue({ rowCount: 0 });

            const result = await UserDAO.deleteUserById(99);

            expect(result).toBe(false);
        });
    });

    describe('deleteUserByName', () => {
        test('should delete a user by name', async () => {
            const mockResult = { rowCount: 1 };
            database.query.mockResolvedValue(mockResult);

            const result = await UserDAO.deleteUserByName('Test User');

            expect(database.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM Felhasznalo WHERE nev = $1'), ['Test User']);
            expect(result).toBe(true);
        });
    });

    describe('updateUserById', () => {
        test('should update a user\'s details', async () => {
            const mockResult = {
                rows: [{ id: 1, nev: 'Updated User', profilkep: '../../updated.png', bemutatkozas: 'Hello World' }],
				rowCount: 1, // Szükséges az implementációban lévő ellenőrzéshez (így nem null értéket kapok vissza)
            };
            database.query.mockResolvedValue(mockResult);

            const updatedUser = await UserDAO.updateUserById(
                1,
                '../../updated.png',
                'Updated User',
                'Hello World',
                '2000-01-01',
                'newHashedPassword',
                true
            );

            expect(updatedUser).toMatchObject({ id: 1, nev: 'Updated User', profilkep: '../../updated.png' });
        });
    });

    describe('addFriend', () => {
        test('should add a friend relationship', async () => {
            const mockResult = { rowCount: 1 };
            database.query.mockResolvedValue(mockResult);

            const result = await UserDAO.addFriend(1, 2);

            expect(database.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO Ismerosok'), [1, 2]);
            expect(result).toBe(true);
        });
    });

    describe('removeFriend', () => {
        test('should remove a friend relationship', async () => {
            const mockResult = { rowCount: 1 };
            database.query.mockResolvedValue(mockResult);

            const result = await UserDAO.removeFriend(1, 2);

            expect(database.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM Ismerosok'), [1, 2]);
            expect(result).toBe(true);
        });
    });

    describe('setModerator', () => {
        it('should set a user as moderator', async () => {
			database.query
				.mockResolvedValueOnce({ rowCount: 0 }) // isModerator: nincs moderátor
				.mockResolvedValueOnce({ rowCount: 1 }); // INSERT INTO sikeres
	
			await UserDAO.setModerator(1);
	
			expect(database.query).toHaveBeenCalledWith(
				expect.stringContaining('SELECT * FROM Moderator WHERE felhasznalo_id = $1'),
				[1]
			);
	
			expect(database.query).toHaveBeenCalledWith(
				expect.stringContaining('INSERT INTO Moderator (felhasznalo_id) VALUES ($1) ON CONFLICT (felhasznalo_id) DO NOTHING'),
				[1]
			);
		});
	
		it('should not insert if the user is already a moderator', async () => {
			database.query.mockResolvedValueOnce({ rowCount: 1 }); // isModerator: moderátor
	
			await UserDAO.setModerator(1);
	
			expect(database.query).toHaveBeenCalledWith(
				expect.stringContaining('SELECT * FROM Moderator WHERE felhasznalo_id = $1'),
				[1]
			);
	
			// Ellenőrizzük, hogy NEM hívtuk az INSERT lekérdezést
			expect(database.query).not.toHaveBeenCalledWith(
				expect.stringContaining('INSERT INTO Moderator (felhasznalo_id) VALUES ($1) ON CONFLICT (felhasznalo_id) DO NOTHING'),
				expect.any(Array)
			);
		});
    });

    describe('isModerator', () => {
        test('should return true if user is moderator', async () => {
            database.query.mockResolvedValue({ rowCount: 1 });

            const result = await UserDAO.isModerator(1);

            expect(result).toBe(true);
        });
    });
});
