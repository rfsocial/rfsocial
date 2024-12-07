const { createMessage, getMessages, deleteMessage } = require('../src/app/controllers/messageController');
const UserDAO = require('../src/app/dao/UserDAO');
const GroupDAO = require('../src/app/dao/GroupDAO');
const MessageDAO = require('../src/app/dao/MessageDAO');

jest.mock('../src/app/dao/UserDAO');
jest.mock('../src/app/dao/GroupDAO');
jest.mock('../src/app/dao/MessageDAO');
jest.mock('fs', () => ({
    readFileSync: jest.fn(() => 'mocked-file-content')
}));

describe('messageController tests', () => {

	describe('createMessage', () => {
		it('should create a group message and return 201 status', async () => {
			const req = {
				body: {
					text: 'Hello Group!',
					sender: 1,
					group: 10,
					receiver: null,
					attachment: null,
				},
			};
			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};

			UserDAO.getUserById.mockResolvedValue({ id: 1, name: 'Sender User' });
			GroupDAO.getById.mockResolvedValue({ id: 10, name: 'Test Group' });
			MessageDAO.create.mockResolvedValue({ id: 100, text: 'Hello Group!', sender: 1, group: 10 });

			await createMessage(req, res);

			expect(UserDAO.getUserById).toHaveBeenCalledWith(1);
			expect(GroupDAO.getById).toHaveBeenCalledWith(10);
			expect(MessageDAO.create).toHaveBeenCalledWith('Hello Group!', null, 1, null, 10, expect.any(String));
			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.json).toHaveBeenCalledWith({ id: 100, text: 'Hello Group!', sender: 1, group: 10 });
		});

		it('should return 400 if the sender does not exist', async () => {
			const req = {
				body: { text: 'Hello', sender: 1, receiver: 2 },
			};
			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};

			UserDAO.getUserById.mockResolvedValue(null);

			await createMessage(req, res);

			expect(UserDAO.getUserById).toHaveBeenCalledWith(1);
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({ message: 'A felhasználó nem létezik!' });
		});

		it('should return 500 if an error occurs', async () => {
			const req = {
				body: { text: 'Error Test', sender: 1 },
			};
			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};

			UserDAO.getUserById.mockRejectedValue(new Error('Database error'));

			await createMessage(req, res);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith({ message: 'Hiba történt az üzenet létrehozása során!' });
		});
	});

	describe('getMessages', () => {
		it('should fetch messages between two users', async () => {
			const req = { query: { sender: 1, receiver: 2 } };
			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};

			const mockMessages = [
				{ id: 1, sender_id: 1, receiver_id: 2, text: 'Hello', date: '2024-01-01' },
			];

			MessageDAO.getBySenderReceiver.mockResolvedValue(mockMessages);

			await getMessages(req, res);

			expect(MessageDAO.getBySenderReceiver).toHaveBeenCalledWith(1, 2);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith([
				{ id: 1, sender: 1, receiver: 2, message: 'Hello', sentAt: '2024-01-01' },
			]);
		});

		it('should fetch group messages', async () => {
			const req = { query: { group: 10 } };
			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};

			const mockMessages = [
				{ id: 1, sender_id: 1, group_id: 10, text: 'Hello Group', date: '2024-01-01' },
			];

			MessageDAO.getByGroup.mockResolvedValue(mockMessages);

			await getMessages(req, res);

			expect(MessageDAO.getByGroup).toHaveBeenCalledWith(10);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith([
				{
					id: 1,
					sender: 1,
					receiver: null, // Explicit null, ha nincs címzett
					message: 'Hello Group',
					sentAt: '2024-01-01',
				},
			]);
		});

		it('should handle errors without any problem', async () => {
			const req = { query: {} };
			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};

			MessageDAO.getAll.mockRejectedValue(new Error('Database error'));

			await getMessages(req, res);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith({ message: 'Hiba történt az üzenetek lekérése során!' });
		});
	});

	describe('deleteMessage', () => {
		it('should delete a message and return 204 status', async () => {
			const req = { params: { id: 1 } };
			const res = {
				status: jest.fn().mockReturnThis(),
				send: jest.fn(),
			};

			MessageDAO.getById.mockResolvedValue({ id: 1, text: 'Hello' });
			MessageDAO.delete.mockResolvedValue(true);

			await deleteMessage(req, res);

			expect(MessageDAO.getById).toHaveBeenCalledWith(1);
			expect(MessageDAO.delete).toHaveBeenCalledWith(1);
			expect(res.status).toHaveBeenCalledWith(204);
			expect(res.send).toHaveBeenCalled();
		});

		it('should return 404 if the message does not exist', async () => {
			const req = { params: { id: 1 } };
			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};

			MessageDAO.getById.mockResolvedValue(null);

			await deleteMessage(req, res);

			expect(MessageDAO.getById).toHaveBeenCalledWith(1);
			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith({ message: 'Az üzenet nem található!' });
		});

		it('should handle errors gracefully', async () => {
			const req = { params: { id: 1 } };
			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};

			MessageDAO.getById.mockRejectedValue(new Error('Database error'));

			await deleteMessage(req, res);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith({ message: 'Hiba történt az üzenet törlése során!' });
		});
	});

});
