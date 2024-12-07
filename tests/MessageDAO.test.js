const MessageDAO = require('../src/app/dao/MessageDAO');
const database = require('../src/app/config/db');
const Message = require('../src/app/models/Message');

jest.mock('../src/app/config/db');
jest.mock('fs', () => ({
    readFileSync: jest.fn(() => 'mocked-file-content')
}));

describe('MEssageDAO', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	describe("create", () => {
		test('should create a new message and return it', async () => {
			const text = 'Hello, World!';
			const attachment = 'file.pdf';
			const sender = 1;
			const receiver = 2;
			const group = null;
			const date = new Date();

			const mockRow = {
				id: 1,
				text,
				attachment,
				sender_id: sender,
				receiver_id: receiver,
				group_id: group,
				date
			};
			const mockResult = { rows: [mockRow] };

			database.query.mockResolvedValue(mockResult);

			const result = await MessageDAO.create(text, attachment, sender, receiver, group, date);

			const query = `
            INSERT INTO Uzenet(szoveg, csatolmany, felado_id, cimzett_id, csoport_id, datum)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
            `;
			expect(database.query).toHaveBeenCalledWith(query, [text, attachment, sender, receiver, group, date]);
			expect(result).toBeInstanceOf(Message);
			expect(result.id).toBe(mockRow.id);
			expect(result.text).toBe(mockRow.text);
			expect(result.attachment).toBe(mockRow.attachment);
			expect(result.sender_id).toBe(mockRow.sender_id);
			expect(result.receiver_id).toBe(mockRow.receiver_id);
			expect(result.group_id).toBe(mockRow.group_id);
			expect(result.date).toBe(mockRow.date);
		});
	});

	describe("getById", () => {
		test('should get a message by ID', async () => {
			const messageId = 1;
			const mockRow = {
				id: messageId,
				text: 'Hello!',
				attachment: null,
				sender_id: 1,
				receiver_id: 2,
				group_id: null,
				date: new Date()
			};
			const mockResult = { rows: [mockRow] };

			database.query.mockResolvedValue(mockResult);

			const result = await MessageDAO.getById(messageId);

			const query = `SELECT * FROM Uzenet WHERE id = $1`;
			expect(database.query).toHaveBeenCalledWith(query, [messageId]);
			expect(result).toBeInstanceOf(Message);
			expect(result.id).toBe(mockRow.id);
			expect(result.text).toBe(mockRow.text);
			expect(result.sender_id).toBe(mockRow.sender_id);
		});
	});

	describe("getByGroup", () => {
		test('should get messages by group', async () => {
			const groupId = 1;
			const mockRow = {
				id: 1,
				text: 'Group message',
				attachment: null,
				sender_id: 1,
				receiver_id: null,
				group_id: groupId,
				date: new Date()
			};
			const mockResult = { rows: [mockRow] };

			database.query.mockResolvedValue(mockResult);

			const result = await MessageDAO.getByGroup(groupId);

			const query = `SELECT * FROM Uzenet WHERE csoport_id = $1`;
			expect(database.query).toHaveBeenCalledWith(query, [groupId]);
			expect(result).toHaveLength(1);
			expect(result[0]).toBeInstanceOf(Message);
			expect(result[0].group_id).toBe(groupId);
		});
	});

	describe("getBySenderReceiver", () => {
		test('should get messages by sender and receiver', async () => {
			const senderId = 1;
			const receiverId = 2;
			const mockRow = {
				id: 1,
				text: 'Private message',
				attachment: null,
				sender_id: senderId,
				receiver_id: receiverId,
				group_id: null,
				date: new Date()
			};
			const mockResult = { rows: [mockRow] };

			database.query.mockResolvedValue(mockResult);

			const result = await MessageDAO.getBySenderReceiver(senderId, receiverId);

			const query = `SELECT * FROM Uzenet WHERE felado_id = $1 AND cimzett_id = $2`;
			expect(database.query).toHaveBeenCalledWith(query, [senderId, receiverId]);
			expect(result).toHaveLength(1);
			expect(result[0]).toBeInstanceOf(Message);
			expect(result[0].sender_id).toBe(senderId);
			expect(result[0].receiver_id).toBe(receiverId);
		});
	});

	describe("getAll", () => {
		test('should get all messages', async () => {
			const mockRow = {
				id: 1,
				text: 'General message',
				attachment: null,
				sender_id: 1,
				receiver_id: 2,
				group_id: null,
				date: new Date()
			};
			const mockResult = { rows: [mockRow] };

			database.query.mockResolvedValue(mockResult);

			const result = await MessageDAO.getAll();

			const query = `SELECT * FROM Uzenet`;
			expect(database.query).toHaveBeenCalledWith(query);
			expect(result).toHaveLength(1);
			expect(result[0]).toBeInstanceOf(Message);
		});
	});

	describe("delete", () => {
		test('should delete a message by ID', async () => {
			const messageId = 1;
			const mockResult = { rowCount: 1 };

			database.query.mockResolvedValue(mockResult);

			const result = await MessageDAO.delete(messageId);

			const query = `DELETE FROM Uzenet WHERE id = $1`;
			expect(database.query).toHaveBeenCalledWith(query, [messageId]);
			expect(result).toBe(true);
		});
		test('should return false if message deletion fails', async () => {
			const messageId = 1;
			const mockResult = { rowCount: 0 };

			database.query.mockResolvedValue(mockResult);

			const result = await MessageDAO.delete(messageId);

			expect(result).toBe(false);
		});
	});
});
