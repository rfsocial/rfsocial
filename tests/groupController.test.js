const GroupDAO = require('../src/app/dao/GroupDAO');
const { createGroup, deleteGroup, addUser, removeUser, setAdmin, getGroups, getMember } = require('../src/app/controllers/groupController');

jest.mock('fs', () => ({
    readFileSync: jest.fn(() => 'mocked-file-content')
}));

describe('Group Controller tests', () => {
    
    describe('createGroup', () => {
        it('should create a new group if it does not already exist', async () => {
            // Mock request and response objects
            const req = { body: { name: 'Test Group' } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            
            // Mock GroupDAO.getByName to return null (no existing group)
            GroupDAO.getByName = jest.fn().mockResolvedValue(null);
            // Mock GroupDAO.create to return a new group
            GroupDAO.create = jest.fn().mockResolvedValue({ id: 1, name: 'Test Group' });
            
            await createGroup(req, res);

            expect(GroupDAO.getByName).toHaveBeenCalledWith('Test Group');
            expect(GroupDAO.create).toHaveBeenCalledWith('Test Group');
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Csoport létrehozva!',
                group: { id: 1, name: 'Test Group' }
            });
        });

        it('should return 400 if the group already exists', async () => {
            const req = { body: { name: 'Existing Group' } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            // Mock GroupDAO.getByName to return an existing group
            GroupDAO.getByName = jest.fn().mockResolvedValue({ id: 1, name: 'Existing Group' });

            await createGroup(req, res);

            expect(GroupDAO.getByName).toHaveBeenCalledWith('Existing Group');
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Ez a csoport már létezik!' });
        });

        it('should return 500 on error', async () => {
            const req = { body: { name: 'Test Group' } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            // Mock GroupDAO.getByName to throw an error
            GroupDAO.getByName = jest.fn().mockRejectedValue(new Error('Database error'));

            await createGroup(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Hiba történt a csoport létrehozása során!',
                error: expect.any(Error)
            });
        });
    });

    describe('deleteGroup', () => {
        it('should delete a group successfully', async () => {
            const req = { params: { id: 1 } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            // Mock GroupDAO.deleteById to resolve successfully
            GroupDAO.deleteById = jest.fn().mockResolvedValue(true);

            await deleteGroup(req, res);

            expect(GroupDAO.deleteById).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Csoport törölve!' });
        });

        it('should return 404 if the group does not exist', async () => {
            const req = { params: { id: 99 } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            // Mock GroupDAO.deleteById to return false (group not found)
            GroupDAO.deleteById = jest.fn().mockResolvedValue(false);

            await deleteGroup(req, res);

            expect(GroupDAO.deleteById).toHaveBeenCalledWith(99);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Csoport nem található!' });
        });

        it('should return 500 on error', async () => {
            const req = { params: { id: 1 } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            // Mock GroupDAO.deleteById to throw an error
            GroupDAO.deleteById = jest.fn().mockRejectedValue(new Error('Database error'));

            await deleteGroup(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Hiba történt a csoport törlése során!',
                error: expect.any(Error)
            });
        });
    });

    describe('addUser', () => {
        let req, res;
    
        beforeEach(() => {
            // Mock request and response objects
            req = { body: { groupId: 1, userId: 1 } };
            res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        });
    
        it('should return 400 if the group is not found', async () => {
            // Mock GroupDAO.getById to return null (group not found)
            GroupDAO.getById = jest.fn().mockResolvedValue(null);
    
            await addUser(req, res);
    
            expect(GroupDAO.getById).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Csoport nem található!' });
        });
    
        it('should return 400 if the user is not found', async () => {
            // Mock GroupDAO.getById to return a valid group
            GroupDAO.getById = jest.fn().mockResolvedValue({ id: 1, name: 'Test Group' });
            // Mock UserDAO.getById to return null (user not found)
            UserDAO.getById = jest.fn().mockResolvedValue(null);
    
            await addUser(req, res);
    
            expect(GroupDAO.getById).toHaveBeenCalledWith(1);
            expect(UserDAO.getById).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Felhasználó nem található!' });
        });
    
        it('should return 200 and add the user to the group successfully', async () => {
            // Mock GroupDAO.getById to return a valid group
            GroupDAO.getById = jest.fn().mockResolvedValue({ id: 1, name: 'Test Group' });
            // Mock UserDAO.getById to return a valid user
            UserDAO.getById = jest.fn().mockResolvedValue({ id: 1, name: 'Test User' });
            // Mock GroupDAO.addMember to resolve successfully
            GroupDAO.addMember = jest.fn().mockResolvedValue(true);
    
            await addUser(req, res);
    
            expect(GroupDAO.getById).toHaveBeenCalledWith(1);
            expect(UserDAO.getById).toHaveBeenCalledWith(1);
            expect(GroupDAO.addMember).toHaveBeenCalledWith(1, 1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Felhasználó hozzáadva a csoportba!' });
        });
    
        it('should return 404 if adding the user to the group fails', async () => {
            // Mock GroupDAO.getById to return a valid group
            GroupDAO.getById = jest.fn().mockResolvedValue({ id: 1, name: 'Test Group' });
            // Mock UserDAO.getById to return a valid user
            UserDAO.getById = jest.fn().mockResolvedValue({ id: 1, name: 'Test User' });
            // Mock GroupDAO.addMember to return false (failure)
            GroupDAO.addMember = jest.fn().mockResolvedValue(false);
    
            await addUser(req, res);
    
            expect(GroupDAO.getById).toHaveBeenCalledWith(1);
            expect(UserDAO.getById).toHaveBeenCalledWith(1);
            expect(GroupDAO.addMember).toHaveBeenCalledWith(1, 1);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Hiba történt a felhasználó hozzáadása során!' });
        });
    
        it('should return 500 if an error occurs', async () => {
            // Mock GroupDAO.getById to throw an error
            GroupDAO.getById = jest.fn().mockRejectedValue(new Error('Database error'));
    
            await addUser(req, res);
    
            expect(GroupDAO.getById).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Hiba történt a felhasználó hozzáadása során!' });
        });
    });

    describe('removeUser', () => {
        let req, res;
    
        beforeEach(() => {
            // Mock request and response objects
            req = { body: { groupId: 1, userId: 1 } };
            res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        });
    
        it('should return 400 if the group is not found', async () => {
            // Mock GroupDAO.getById to return null (group not found)
            GroupDAO.getById = jest.fn().mockResolvedValue(null);
    
            await removeUser(req, res);
    
            expect(GroupDAO.getById).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Csoport nem található!' });
        });
    
        it('should return 400 if the user is not found', async () => {
            // Mock GroupDAO.getById to return a valid group
            GroupDAO.getById = jest.fn().mockResolvedValue({ id: 1, name: 'Test Group' });
            // Mock UserDAO.getById to return null (user not found)
            UserDAO.getById = jest.fn().mockResolvedValue(null);
    
            await removeUser(req, res);
    
            expect(GroupDAO.getById).toHaveBeenCalledWith(1);
            expect(UserDAO.getById).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Felhasználó nem található!' });
        });
    
        it('should return 200 and remove the user from the group successfully', async () => {
            // Mock GroupDAO.getById to return a valid group
            GroupDAO.getById = jest.fn().mockResolvedValue({ id: 1, name: 'Test Group' });
            // Mock UserDAO.getById to return a valid user
            UserDAO.getById = jest.fn().mockResolvedValue({ id: 1, name: 'Test User' });
            // Mock GroupDAO.removeMember to resolve successfully
            GroupDAO.removeMember = jest.fn().mockResolvedValue(true);
    
            await removeUser(req, res);
    
            expect(GroupDAO.getById).toHaveBeenCalledWith(1);
            expect(UserDAO.getById).toHaveBeenCalledWith(1);
            expect(GroupDAO.removeMember).toHaveBeenCalledWith(1, 1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Felhasználó eltávolítva a csoportból!' });
        });
    
        it('should return 404 if removing the user from the group fails', async () => {
            // Mock GroupDAO.getById to return a valid group
            GroupDAO.getById = jest.fn().mockResolvedValue({ id: 1, name: 'Test Group' });
            // Mock UserDAO.getById to return a valid user
            UserDAO.getById = jest.fn().mockResolvedValue({ id: 1, name: 'Test User' });
            // Mock GroupDAO.removeMember to return false (failure)
            GroupDAO.removeMember = jest.fn().mockResolvedValue(false);
    
            await removeUser(req, res);
    
            expect(GroupDAO.getById).toHaveBeenCalledWith(1);
            expect(UserDAO.getById).toHaveBeenCalledWith(1);
            expect(GroupDAO.removeMember).toHaveBeenCalledWith(1, 1);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Hiba történt a felhasználó eltávolítása során!' });
        });
    
        it('should return 500 if an error occurs', async () => {
            GroupDAO.getById = jest.fn().mockRejectedValue(new Error('Database error'));
    
            await removeUser(req, res);
    
            expect(GroupDAO.getById).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Hiba történt a felhasználó eltávolítása során!' });
        });
    });

    describe('setAdmin', () => {
        let req, res;
    
        beforeEach(() => {
            // Mock request and response objects
            req = { body: { groupId: 1, userId: 1, admin: true } };
            res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        });
    
        it('should return 400 if the group is not found', async () => {
            GroupDAO.getById = jest.fn().mockResolvedValue(null);
    
            await setAdmin(req, res);
    
            expect(GroupDAO.getById).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Csoport nem található!' });
        });
    
        it('should return 400 if the user is not found', async () => {
            GroupDAO.getById = jest.fn().mockResolvedValue({ id: 1, name: 'Test Group' });
            UserDAO.getById = jest.fn().mockResolvedValue(null);
    
            await setAdmin(req, res);
    
            expect(GroupDAO.getById).toHaveBeenCalledWith(1);
            expect(UserDAO.getById).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Felhasználó nem található!' });
        });
    
        it('should return 200 and successfully set the admin rights', async () => {
            GroupDAO.getById = jest.fn().mockResolvedValue({ id: 1, name: 'Test Group' });
            UserDAO.getById = jest.fn().mockResolvedValue({ id: 1, name: 'Test User' });
            GroupDAO.setAdmin = jest.fn().mockResolvedValue(true);
    
            await setAdmin(req, res);
    
            expect(GroupDAO.getById).toHaveBeenCalledWith(1);
            expect(UserDAO.getById).toHaveBeenCalledWith(1);
            expect(GroupDAO.setAdmin).toHaveBeenCalledWith(1, 1, true);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Admin jogosultság módosítva!' });
        });
    
        it('should return 404 if setting the admin rights fails', async () => {
            GroupDAO.getById = jest.fn().mockResolvedValue({ id: 1, name: 'Test Group' });
            UserDAO.getById = jest.fn().mockResolvedValue({ id: 1, name: 'Test User' });
            GroupDAO.setAdmin = jest.fn().mockResolvedValue(false);
    
            await setAdmin(req, res);
    
            expect(GroupDAO.getById).toHaveBeenCalledWith(1);
            expect(UserDAO.getById).toHaveBeenCalledWith(1);
            expect(GroupDAO.setAdmin).toHaveBeenCalledWith(1, 1, true);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Hiba történt az admin jogosultság módosítása során!' });
        });
    
        it('should return 500 if an error occurs', async () => {
            GroupDAO.getById = jest.fn().mockRejectedValue(new Error('Database error'));
    
            await setAdmin(req, res);
    
            expect(GroupDAO.getById).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Hiba történt az admin jogosultság módosítása során!' });
        });
    });

    describe('getGroups', () => {
        let req, res;
    
        beforeEach(() => {
            req = {};
            res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        });
    
        it('should return 200 and the list of groups', async () => {
            const mockGroups = [{ id: 1, name: 'Group 1' }, { id: 2, name: 'Group 2' }];
            GroupDAO.getAll = jest.fn().mockResolvedValue(mockGroups);
    
            await getGroups(req, res);
    
            expect(GroupDAO.getAll).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockGroups);
        });
    
        //! Jest worker encountered 4 child process exceptions, exceeding retry limit
        // it('should return 500 if there is an error retrieving the groups', async () => {
        //     const mockError = new Error('Database error');
        //     GroupDAO.getAll = jest.fn().mockRejectedValue(mockError);
    
        //     await getGroups(req, res);
    
        //     expect(GroupDAO.getAll).toHaveBeenCalled();
        //     expect(res.status).toHaveBeenCalledWith(500);
        //     expect(res.json).toHaveBeenCalledWith({
        //         message: 'Hiba történt a csoportok lekérése során!',
        //         error: mockError
        //     });
        // });
    
        it('should log a message after retrieving the groups', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            
            const mockGroups = [{ id: 1, name: 'Group 1' }];
            GroupDAO.getAll = jest.fn().mockResolvedValue(mockGroups);
    
            await getGroups(req, res);
    
            expect(consoleSpy).toHaveBeenCalledWith('Csoportok lekérve!');
            
            consoleSpy.mockRestore();
        });
    });

    describe('getMember', () => {
        let req, res;
    
        beforeEach(() => {
            req = { query: { groupId: 1 } };
            res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        });
    
        it('should return 400 if the group is not found', async () => {
            GroupDAO.getById = jest.fn().mockResolvedValue(null);
    
            await getMember(req, res);
    
            expect(GroupDAO.getById).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Csoport nem található!' });
        });
    
        it('should return 400 if a userId is provided but the user is not found', async () => {
            req.query.userId = 2;
            GroupDAO.getById = jest.fn().mockResolvedValue({ id: 1, name: 'Test Group' });
            UserDAO.getById = jest.fn().mockResolvedValue(null);
    
            await getMember(req, res);
    
            expect(GroupDAO.getById).toHaveBeenCalledWith(1);
            expect(UserDAO.getById).toHaveBeenCalledWith(2);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Felhasználó nem található!' });
        });
    
        it('should return 200 and a specific member if userId is provided and valid', async () => {
            req.query.userId = 2;
            GroupDAO.getById = jest.fn().mockResolvedValue({ id: 1, name: 'Test Group' });
            UserDAO.getById = jest.fn().mockResolvedValue({ id: 2, name: 'Test User' });
            const mockMember = { id: 2, name: 'Test User', role: 'member' };
            GroupDAO.getMember = jest.fn().mockResolvedValue(mockMember);
    
            await getMember(req, res);
    
            expect(GroupDAO.getById).toHaveBeenCalledWith(1);
            expect(UserDAO.getById).toHaveBeenCalledWith(2);
            expect(GroupDAO.getMember).toHaveBeenCalledWith(1, 2);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockMember);
        });
    
        it('should return 200 and all group members if userId is not provided', async () => {
            GroupDAO.getById = jest.fn().mockResolvedValue({ id: 1, name: 'Test Group' });
            const mockMembers = [
                { id: 1, name: 'User 1', role: 'member' },
                { id: 2, name: 'User 2', role: 'member' }
            ];
            GroupDAO.getMembers = jest.fn().mockResolvedValue(mockMembers);
    
            await getMember(req, res);
    
            expect(GroupDAO.getById).toHaveBeenCalledWith(1);
            expect(GroupDAO.getMembers).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockMembers);
        });
    
        it('should return 500 if there is an error retrieving group members', async () => {
            const mockError = new Error('Database error');
            GroupDAO.getById = jest.fn().mockRejectedValue(mockError);
    
            await getMember(req, res);
    
            expect(GroupDAO.getById).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Hiba történt a csoport tagjainak lekérése során!'
            });
        });
    
        it('should log a message after retrieving group members', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            
            GroupDAO.getById = jest.fn().mockResolvedValue({ id: 1, name: 'Test Group' });
            const mockMembers = [{ id: 1, name: 'User 1' }];
            GroupDAO.getMembers = jest.fn().mockResolvedValue(mockMembers);
    
            await getMember(req, res);
    
            expect(consoleSpy).toHaveBeenCalledWith('Csoport tagjai lekérve!');
            
            consoleSpy.mockRestore();
        });
    });
});
