const authMiddleware = require('../src/app/middleware/authMiddleware');
const UserDAO = require('../src/app/dao/UserDAO');
const jwt = require('jsonwebtoken');

jest.mock('jsonwebtoken');
jest.mock('../src/app/dao/UserDAO');
jest.mock('fs', () => ({
    readFileSync: jest.fn(() => 'mocked-file-content')
}));

describe('authMiddleware tests', () => {
    let req, res, next;

    beforeEach(() => {
        req = { cookies: {} };
        res = {
            redirect: jest.fn(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
    });

    it('should redirect to /login if token is missing', async () => {
        const middleware = authMiddleware();

        await middleware(req, res, next);

        expect(res.redirect).toHaveBeenCalledWith('/login');
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if token is invalid', async () => {
        req.cookies.jwt = 'invalid-token';
        jwt.verify.mockImplementation(() => { throw new Error('Invalid token'); });

        const middleware = authMiddleware();

        await middleware(req, res, next);

        expect(jwt.verify).toHaveBeenCalledWith('invalid-token', process.env.JWT_SECRET);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'Érvénytelen token!' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token is expired', async () => {
        req.cookies.jwt = 'expired-token';
        jwt.verify.mockImplementation(() => { throw { name: 'TokenExpiredError' }; });

        const middleware = authMiddleware();

        await middleware(req, res, next);

        expect(jwt.verify).toHaveBeenCalledWith('expired-token', process.env.JWT_SECRET);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'token lejárt!' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if req.user is missing', async () => {
        req.cookies.jwt = 'valid-token';
        jwt.verify.mockReturnValue(null);

        const middleware = authMiddleware();

        await middleware(req, res, next);

        expect(jwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Nincs hitelesítve' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user lacks moderator rights', async () => {
        req.cookies.jwt = 'valid-token';
        jwt.verify.mockReturnValue({ felhasznalo: { id: '123' } });
        UserDAO.isModerator.mockResolvedValue(false);

        const middleware = authMiddleware('moderator');

        await middleware(req, res, next);

        expect(UserDAO.isModerator).toHaveBeenCalledWith('123');
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'Nincs jogosultságod a kért művelethez!' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should call next if user is authenticated and authorized', async () => {
        req.cookies.jwt = 'valid-token';
        jwt.verify.mockReturnValue({ felhasznalo: { id: '123' } });
        UserDAO.isModerator.mockResolvedValue(true);

        const middleware = authMiddleware('moderator');

        await middleware(req, res, next);

        expect(UserDAO.isModerator).toHaveBeenCalledWith('123');
        expect(next).toHaveBeenCalled();
    });
});
