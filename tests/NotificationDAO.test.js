const NotificationDAO = require('../src/app/dao/NotificationDAO');
const database = require('../src/app/config/db');
const NotificationInteraction = require('../src/app/constants/NotificationInteraction');

jest.mock('../src/app/config/db');
jest.mock('fs', () => ({
    readFileSync: jest.fn(() => 'mocked-file-content')
}));

describe('NotificationDAO tests', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create()', () => {
        it('should create a notification and return it', async () => {
            const mockNotification = {
                id: 1,
                cim: 'Test Notification',
                szoveg: 'Test message',
                olvasott: false,
                felhasznalo_id: 123,
                interakcio_tipus: 'friend-request',
                hivatkozas_id: 456,
                letrehozva: new Date(),
                kepUrl: 'http://example.com/img.jpg'
            };

            database.query.mockResolvedValueOnce({
                rows: [mockNotification]
            });

            const result = await NotificationDAO.create(
                mockNotification.cim,
                mockNotification.szoveg,
                mockNotification.felhasznalo_id,
                NotificationInteraction.FRIEND_REQUEST,
                mockNotification.hivatkozas_id,
                mockNotification.kepUrl
            );

            expect(database.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO Ertesites'),
                [mockNotification.cim, mockNotification.szoveg, mockNotification.felhasznalo_id, 'friend-request', mockNotification.hivatkozas_id, mockNotification.kepUrl]
            );
            expect(result).toEqual(expect.objectContaining({
                id: 1,
                cim: 'Test Notification',
                szoveg: 'Test message',
                olvasott: false,
                felhasznalo_id: 123,
                interakcio_tipus: NotificationInteraction.FRIEND_REQUEST,
                hivatkozas_id: 456,
                kepUrl: 'http://example.com/img.jpg'
            }));
        });

        it('should throw an error if the database query fails', async () => {
            database.query.mockRejectedValueOnce(new Error('Database error'));

            await expect(NotificationDAO.create(
                'Test Notification',
                'Test message',
                123,
                NotificationInteraction.FRIEND_REQUEST,
                456,
                'http://example.com/img.jpg'
            )).rejects.toThrow('Database error');
        });
    });

    describe('getNotificationsByUserId()', () => {
        it('should return notifications for a user', async () => {
            const mockNotifications = [{
                id: 1,
                cim: 'Notification 1',
                szoveg: 'Message 1',
                olvasott: false,
                felhasznalo_id: 123,
                interakcio_tipus: 'view',
                hivatkozas_id: 456,
                letrehozva: new Date(),
                kepUrl: 'http://example.com/img1.jpg'
            }, {
                id: 2,
                cim: 'Notification 2',
                szoveg: 'Message 2',
                olvasott: true,
                felhasznalo_id: 123,
                interakcio_tipus: 'friend-request',
                hivatkozas_id: 789,
                letrehozva: new Date(),
                kepUrl: 'http://example.com/img2.jpg'
            }];

            database.query.mockResolvedValueOnce({
                rows: mockNotifications
            });

            const result = await NotificationDAO.getNotificationsByUserId(123);

            expect(database.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM Ertesites'),
                [123]
            );
            expect(result).toHaveLength(2);
            expect(result[0]).toEqual(expect.objectContaining({
                id: 1,
                cim: 'Notification 1',
                szoveg: 'Message 1',
                olvasott: false,
                felhasznalo_id: 123,
                interakcio_tipus: NotificationInteraction.VIEW
            }));
        });

        it('should return an empty array if no notifications found', async () => {
            database.query.mockResolvedValueOnce({
                rows: []
            });

            const result = await NotificationDAO.getNotificationsByUserId(123);

            expect(result).toEqual([]);
        });

        it('should throw an error if the database query fails', async () => {
            database.query.mockRejectedValueOnce(new Error('Database error'));

            await expect(NotificationDAO.getNotificationsByUserId(123)).rejects.toThrow('Database error');
        });
    });

    describe('setNotificationReadById()', () => {
        it('should update and return the modified notification', async () => {
            const mockNotification = {
                id: 1,
                cim: 'Test Notification',
                szoveg: 'Test message',
                olvasott: true,
                felhasznalo_id: 123,
                interakcio_tipus: 'view',
                hivatkozas_id: 456,
                letrehozva: new Date(),
                kepUrl: 'http://example.com/img.jpg'
            };

            database.query.mockResolvedValueOnce({
                rows: [mockNotification],
				rowCount: 1 // Szükséges az implementációban lévő ellenőrzéshez (így nem null értéket kapok vissza)
            });

            const result = await NotificationDAO.setNotificationReadById(1, true);

            expect(database.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE Ertesites SET olvasott'),
                [true, 1]
            );
            expect(result).toEqual(expect.objectContaining({
                id: 1,
                cim: 'Test Notification',
                szoveg: 'Test message',
                olvasott: true,
                felhasznalo_id: 123,
                interakcio_tipus: NotificationInteraction.VIEW,
                hivatkozas_id: 456,
                kepUrl: 'http://example.com/img.jpg'
            }));
        });

        it('should return null if no notification found', async () => {
            database.query.mockResolvedValueOnce({ rowCount: 0 });

            const result = await NotificationDAO.setNotificationReadById(999, true);

            expect(result).toBeNull();
        });

        it('should throw an error if the database query fails', async () => {
            database.query.mockRejectedValueOnce(new Error('Database error'));

            await expect(NotificationDAO.setNotificationReadById(1, true)).rejects.toThrow('Database error');
        });
    });

    describe('deleteNotificationById()', () => {
        it('should delete the notification and return true', async () => {
            database.query.mockResolvedValueOnce({ rowCount: 1 });

            const result = await NotificationDAO.deleteNotificationById(1);

            expect(database.query).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM Ertesites'),
                [1]
            );
            expect(result).toBe(true);
        });

        it('should return false if no notification found', async () => {
            database.query.mockResolvedValueOnce({ rowCount: 0 });

            const result = await NotificationDAO.deleteNotificationById(999);

            expect(result).toBe(false);
        });

        it('should throw an error if the database query fails', async () => {
            database.query.mockRejectedValueOnce(new Error('Database error'));

            await expect(NotificationDAO.deleteNotificationById(1)).rejects.toThrow('Database error');
        });
    });
});
