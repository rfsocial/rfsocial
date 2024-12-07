const { checkGroup, checkUser, checkAdmin } = require('../src/app/middleware/groupMiddleware');
const GroupDAO = require('../src/app/dao/groupDAO');

jest.mock('../src/app/dao/GroupDAO');
jest.mock('fs', () => ({
    readFileSync: jest.fn(() => 'mocked-file-content')
}));

describe('groupMiddleware tests', () => {
    let req, res, next;

    beforeEach(() => {
        req = { params: {}, body: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
    });

    describe('checkGroup', () => {
        it('should call next if group exists', async () => {
            req.params.groupId = '123';
            GroupDAO.getById.mockResolvedValue({ id: '123' });

            await checkGroup(req, res, next);

            expect(GroupDAO.getById).toHaveBeenCalledWith('123');
            expect(next).toHaveBeenCalled();
        });

        it('should return 400 if group does not exist', async () => {
            req.params.groupId = '123';
            GroupDAO.getById.mockResolvedValue(null);

            await checkGroup(req, res, next);

            expect(GroupDAO.getById).toHaveBeenCalledWith('123');
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Csoport nem található!' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 500 on database error', async () => {
            req.params.groupId = '123';
            GroupDAO.getById.mockRejectedValue(new Error('Database error'));

            await checkGroup(req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Hiba történt a csoport ellenőrzése során!' });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('checkUser', () => {
        it('should call next if user is a group member', async () => {
            req.body = { groupId: '123', userId: '456' };
            getById.mockResolvedValueOnce({ id: '123' }).mockResolvedValueOnce({ id: '456' });
            getMember.mockResolvedValue({});

            await checkUser(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('should return 400 if group does not exist', async () => {
            req.body = { groupId: '123', userId: '456' };
            getById.mockResolvedValueOnce(null);

            await checkUser(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Csoport nem található!' });
        });

        it('should return 400 if user does not exist', async () => {
            req.body = { groupId: '123', userId: '456' };
            getById.mockResolvedValueOnce({ id: '123' }).mockResolvedValueOnce(null);

            await checkUser(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Felhasználó nem található!' });
        });

        it('should return 403 if user is not a group member', async () => {
            req.body = { groupId: '123', userId: '456' };
            getById.mockResolvedValueOnce({ id: '123' }).mockResolvedValueOnce({ id: '456' });
            getMember.mockResolvedValue(null);

            await checkUser(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: 'Nem vagy tagja a csoportnak!' });
        });

        it('should return 500 on database error', async () => {
            req.body = { groupId: '123', userId: '456' };
            getById.mockRejectedValue(new Error('Database error'));

            await checkUser(req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Hiba történt az ellenőrzéskor' });
        });
    });

    describe('checkAdmin', () => {
        it('should set req.isAdmin to true if user is admin', async () => {
            req.body = { groupId: '123', userId: '456' };
            getAdmin.mockResolvedValue(true);

            await checkAdmin(req, res, next);

            expect(req.isAdmin).toBe(true);
            expect(next).toHaveBeenCalled();
        });

        it('should set req.isAdmin to false if user is not admin', async () => {
            req.body = { groupId: '123', userId: '456' };
            getAdmin.mockResolvedValue(false);

            await checkAdmin(req, res, next);

            expect(req.isAdmin).toBe(false);
            expect(next).toHaveBeenCalled();
        });

        it('should return 500 on database error', async () => {
            req.body = { groupId: '123', userId: '456' };
            getAdmin.mockRejectedValue(new Error('Database error'));

            await checkAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Hiba történt az admin jogosultság ellenőrzése során!' });
        });
    });
});
