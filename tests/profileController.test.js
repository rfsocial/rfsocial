
const { getProfile, deleteProfile, editProfile } = require('../src/app/controllers/profileController');
const UserDAO = require('../src/app/dao/UserDAO');

jest.mock('../src/app/dao/UserDAO');
jest.mock('fs', () => ({
    readFileSync: jest.fn(() => 'mocked-file-content')
}));

describe('profileController tests', () => {
    let req, res;

    beforeEach(() => {
        req = { user: { id: '123' } };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            render: jest.fn(),
            send: jest.fn()
        };
    });

    describe('getProfile', () => {
        it('should render profile template with user data', async () => {
            const mockProfile = { id: '123', name: 'Test User' };
            UserDAO.getUserById.mockResolvedValue(mockProfile);

            await getProfile(req, res);

            expect(UserDAO.getUserById).toHaveBeenCalledWith('123');
            expect(res.render).toHaveBeenCalledWith('../pages/profile-template', expect.objectContaining({
                profile: mockProfile,
                isOnline: true,
                friendAmount: 120,
                friends: [],
                postCount: 253,
                commentCount: 32,
                isAdmin: true
            }));
        });

        it('should return 500 if an error occurs', async () => {
            UserDAO.getUserById.mockRejectedValue(new Error('Database error'));

            await getProfile(req, res);

            expect(UserDAO.getUserById).toHaveBeenCalledWith('123');
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Hiba történt a felhasználó lekérése során!' });
        });
    });

    describe('deleteProfile', () => {
        it('should return 204 if user is successfully deleted', async () => {
            UserDAO.deleteUserById.mockResolvedValue(true);

            await deleteProfile(req, res);

            expect(UserDAO.deleteUserById).toHaveBeenCalledWith('123');
            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalled();
        });

        it('should return 404 if user is not found', async () => {
            UserDAO.deleteUserById.mockResolvedValue(false);

            await deleteProfile(req, res);

            expect(UserDAO.deleteUserById).toHaveBeenCalledWith('123');
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Felhasználó nem található!' });
        });

        it('should return 500 if an error occurs', async () => {
            UserDAO.deleteUserById.mockRejectedValue(new Error('Database error'));

            await deleteProfile(req, res);

            expect(UserDAO.deleteUserById).toHaveBeenCalledWith('123');
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Hiba történt a felhasználó törlése során!' });
        });
    });

    describe('editProfile', () => {
        let req, res;
    
        beforeEach(() => {
            req = {
                user: { id: '123' },
                body: {
                    profilkep: 'new-avatar.png',
                    nev: 'newusername',
                    bemutatkozas: 'Hello world!',
                    szul_datum: '1990-01-01',
                    jelszo: 'newpassword',
                    profil_lathatosag: 'public'
                }
            };
            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
        });
    
        it('should return 400 if the username is already taken by another user', async () => {
            UserDAO.getUserByName.mockResolvedValue({ id: '456' });
    
            await editProfile(req, res);
    
            expect(UserDAO.getUserByName).toHaveBeenCalledWith('newusername');
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Ez a felhasználónév már foglalt!' });
        });
    
        it('should return 200 with the updated user data on success', async () => {
            const hashedPassword = 'hashedpassword';
            const updatedUser = {
                id: '123',
                profilkep: 'new-avatar.png',
                nev: 'newusername',
                bemutatkozas: 'Hello world!',
                szul_datum: '1990-01-01',
                profil_lathatosag: 'public'
            };
    
            bcrypt.hash.mockResolvedValue(hashedPassword);
            UserDAO.getUserByName.mockResolvedValue(null);
            UserDAO.updateUserById.mockResolvedValue(updatedUser);
    
            await editProfile(req, res);
    
            expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 10);
            expect(UserDAO.updateUserById).toHaveBeenCalledWith(
                '123',
                'new-avatar.png',
                'newusername',
                'Hello world!',
                '1990-01-01',
                hashedPassword,
                'public'
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(updatedUser);
        });
    
        it('should return 404 if the user is not found', async () => {
            bcrypt.hash.mockResolvedValue('hashedpassword');
            UserDAO.getUserByName.mockResolvedValue(null);
            UserDAO.updateUserById.mockResolvedValue(null);
    
            await editProfile(req, res);
    
            expect(UserDAO.updateUserById).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Felhasználó nem található!' });
        });
    
        it('should return 500 if an error occurs', async () => {
            bcrypt.hash.mockRejectedValue(new Error('Hashing error'));
    
            await editProfile(req, res);
    
            expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 10);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Hiba történt a felhasználó adatainak frissítése során!' });
        });
    });
});
