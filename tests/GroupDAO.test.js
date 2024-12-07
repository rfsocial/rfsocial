const GroupDAO = require('../src/app/dao/GroupDAO');
const database = require('../src/app/config/db');
const Group = require('../src/app/models/Group');
const GroupMember = require('../src/app/models/GroupMember');

jest.mock('../src/app/config/db');
jest.mock('fs', () => ({
    readFileSync: jest.fn(() => 'mocked-file-content')
}));

describe('GroupDAO tests', () => {
    describe('create', () => {
        it('should create a group and return the created group', async () => {
            const mockResult = {
                rows: [{ id: 1, nev: 'Test Group' }],
            };
            database.query.mockResolvedValue(mockResult);

            const group = await GroupDAO.create('Test Group');
			
			const query = `
            INSERT INTO Csoport(nev)
            VALUES ($1) RETURNING *
            `;
            expect(database.query).toHaveBeenCalledWith(
                expect.stringContaining(query),
                ['Test Group']
            );
            expect(group).toEqual(new Group(1, 'Test Group'));
        });

        it('should return null on database error', async () => {
            database.query.mockRejectedValue(new Error('Database error'));

            const group = await GroupDAO.create('Test Group');

            expect(database.query).toHaveBeenCalled();
            expect(group).toBeNull();
        });
    });

    describe('getById', () => {
        it('should return a group by ID', async () => {
            const mockResult = {
                rows: [{ id: 1, nev: 'Test Group' }],
            };
            database.query.mockResolvedValue(mockResult);

            const group = await GroupDAO.getById(1);

            expect(database.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM Csoport WHERE id = $1'),
                [1]
            );
            expect(group).toEqual(new Group(1, 'Test Group'));
        });

        it('should return null if group does not exist', async () => {
            database.query.mockResolvedValue({ rows: [] });

            const group = await GroupDAO.getById(999);

            expect(group).toBeNull();
        });
    });

    describe('getByName', () => {
        it('should return a group by name', async () => {
            const mockResult = {
                rows: [{ id: 1, nev: 'Test Group' }],
            };
            database.query.mockResolvedValue(mockResult);

            const group = await GroupDAO.getByName('Test Group');

            expect(database.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM Csoport WHERE nev = $1'),
                ['Test Group']
            );
            expect(group).toEqual(new Group(1, 'Test Group'));
        });

        it('should return null if no group is found', async () => {
            database.query.mockResolvedValue({ rows: [] });

            const group = await GroupDAO.getByName('Nonexistent Group');

            expect(group).toBeNull();
        });
    });

    describe('getAll', () => {
        it('should return all groups', async () => {
            const mockResult = {
                rows: [
                    { id: 1, nev: 'Group 1' },
                    { id: 2, nev: 'Group 2' },
                ],
            };
            database.query.mockResolvedValue(mockResult);

            const groups = await GroupDAO.getAll();

            expect(database.query).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM Csoport'));
            expect(groups).toEqual([
                new Group(1, 'Group 1'),
                new Group(2, 'Group 2'),
            ]);
        });

        it('should return an empty array if no groups are found', async () => {
            database.query.mockResolvedValue({ rows: [] });

            const groups = await GroupDAO.getAll();

            expect(groups).toEqual([]);
        });
    });

    describe('addMember', () => {
        it('should add a member to the group and return the member', async () => {
            const mockResult = {
                rows: [{ felhasznalo_id: 'user1', csoport_id: 1, admin: false }],
            };
            database.query.mockResolvedValue(mockResult);

            const member = await GroupDAO.addMember(1, 'user1');
			
			const query = `
            INSERT INTO CsoportTag(csoport_id, felhasznalo_id)
            VALUES ($1, $2) RETURNING *
            `;
            expect(database.query).toHaveBeenCalledWith(
                expect.stringContaining(query),
                [1, 'user1']
            );
            expect(member).toEqual(new GroupMember('user1', 1, false));
        });

        it('should return null if there is an error', async () => {
            database.query.mockRejectedValue(new Error('Database error'));

            const member = await GroupDAO.addMember(1, 'user1');

            expect(member).toBeNull();
        });
    });

    describe('removeMember', () => {
        it('should remove a member from the group and return true', async () => {
            database.query.mockResolvedValue({});

            const result = await GroupDAO.removeMember(1, 'user1');

            expect(database.query).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM CsoportTag WHERE csoport_id = $1 AND felhasznalo_id = $2'),
                [1, 'user1']
            );
            expect(result).toBe(true);
        });

        it('should return false if there is an error', async () => {
            database.query.mockRejectedValue(new Error('Database error'));

            const result = await GroupDAO.removeMember(1, 'user1');

            expect(result).toBe(false);
        });
    });

    describe('setAdmin', () => {
        it('should set a user as admin', async () => {
            database.query.mockResolvedValue({});

            const result = await GroupDAO.setAdmin(1, 'user1', true);

            expect(database.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE CsoportTag SET admin = $3 WHERE csoport_id = $1 AND felhasznalo_id = $2'),
                [1, 'user1', true]
            );
            expect(result).toBe(true);
        });

        it('should return false if there is an error', async () => {
            database.query.mockRejectedValue(new Error('Database error'));

            const result = await GroupDAO.setAdmin(1, 'user1', true);

            expect(result).toBe(false);
        });
    });

    describe('delete', () => {
        it('should delete a group by ID and return true', async () => {
            database.query.mockResolvedValue({});

            const result = await GroupDAO.delete(1);

            expect(database.query).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM Csoport WHERE id = $1'),
                [1]
            );
            expect(result).toBe(true);
        });

        it('should return false if there is an error', async () => {
            database.query.mockRejectedValue(new Error('Database error'));

            const result = await GroupDAO.delete(1);

            expect(result).toBe(false);
        });
    });
});
