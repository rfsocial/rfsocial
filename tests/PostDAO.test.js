const PostDAO = require('../src/app/dao/PostDAO');
const database = require('../src/app/config/db');

jest.mock('../src/app/config/db'); // mock adatbázis modul
jest.mock('fs', () => ({
    readFileSync: jest.fn(() => 'mocked-file-content')
}));

describe('PostDAO test', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('createPost()', () => {
		it('should create a post and return it', async () => {
			const mockPost = {
				id: 1,
				user_id: 123,
				content: 'This is a test post',
				created_at: new Date()
			};

			database.query.mockResolvedValueOnce({
				rows: [mockPost]
			});

			const result = await PostDAO.createPost(mockPost.user_id, mockPost.content);

			expect(database.query).toHaveBeenCalledWith(
				expect.stringContaining('INSERT INTO Post'),
				[mockPost.user_id, mockPost.content]
			);
			expect(result).toEqual(expect.objectContaining({
				id: 1,
				user_id: 123,
				content: 'This is a test post',
				created_at: expect.any(Date)
			}));
		});

		it('should throw an error if the database query fails', async () => {
			database.query.mockRejectedValueOnce(new Error('Database error'));

			await expect(PostDAO.createPost(123, 'Test post')).rejects.toThrow('Database error');
		});
	});

	describe('getAllPosts()', () => {

		it('should fetch all posts and return them with usernames', async () => {
			// Mockolt adatbázis-válasz
			const mockResult = {
				rows: [
					{
						id: 1,
						title: 'Post 1',
						content: 'This is the first post.',
						user_id: 1,
						created_at: '2024-11-13T12:00:00Z',
						username: 'Test User',
					},
					{
						id: 2,
						title: 'Post 2',
						content: 'This is the second post.',
						user_id: 2,
						created_at: '2024-11-14T14:00:00Z',
						username: 'Another User',
					},
				],
			};
	
			// Mockolja a `database.query` metódust
			database.query.mockResolvedValue(mockResult);
	
			// Meghívja a tesztelendő metódust
			const posts = await PostDAO.getAllPosts();
	
			const query = `
            SELECT p.*, u.nev AS username
            FROM Post p
            JOIN Felhasznalo u ON p.user_id = u.id
            ORDER BY p.created_at DESC;
        `;
			// Ellenőrzi, hogy a helyes SQL-lekérdezést hívta meg
			expect(database.query).toHaveBeenCalledWith(expect.stringContaining(query));
	
			// Ellenőrzi, hogy a visszatérési érték megfelel a mockolt adatoknak
			expect(posts).toEqual(mockResult.rows);
		});

		it('should return an empty array if no posts are found', async () => {
			database.query.mockResolvedValueOnce({
				rows: []
			});

			const result = await PostDAO.getAllPosts();

			expect(result).toEqual([]);
		});

		it('should throw an error if the database query fails', async () => {
			database.query.mockRejectedValueOnce(new Error('Database error'));

			await expect(PostDAO.getAllPosts()).rejects.toThrow('Database error');
		});
	});

	describe('addComment()', () => {
		it('should add a comment to a post and return it', async () => {
			const mockComment = {
				id: 1,
				post_id: 1,
				user_id: 123,
				content: 'This is a comment',
				created_at: new Date()
			};

			database.query.mockResolvedValueOnce({
				rows: [mockComment]
			});

			const result = await PostDAO.addComment(mockComment.post_id, mockComment.user_id, mockComment.content);

			expect(database.query).toHaveBeenCalledWith(
				expect.stringContaining('INSERT INTO Comment'),
				[mockComment.post_id, mockComment.user_id, mockComment.content]
			);
			expect(result).toEqual(expect.objectContaining({
				id: 1,
				post_id: 1,
				user_id: 123,
				content: 'This is a comment',
				created_at: expect.any(Date)
			}));
		});

		it('should throw an error if the database query fails', async () => {
			database.query.mockRejectedValueOnce(new Error('Database error'));

			await expect(PostDAO.addComment(1, 123, 'Test comment')).rejects.toThrow('Database error');
		});
	});

	describe('addReaction()', () => {
		it('should add a reaction to a post and return it', async () => {
			const mockReaction = {
				id: 1,
				post_id: 1,
				user_id: 123,
				type: 'like',
				created_at: new Date()
			};

			database.query.mockResolvedValueOnce({
				rows: [mockReaction]
			});

			const result = await PostDAO.addReaction(mockReaction.post_id, mockReaction.user_id, mockReaction.type);

			expect(database.query).toHaveBeenCalledWith(
				expect.stringContaining('INSERT INTO Reaction'),
				[mockReaction.post_id, mockReaction.user_id, mockReaction.type]
			);
			expect(result).toEqual(expect.objectContaining({
				id: 1,
				post_id: 1,
				user_id: 123,
				type: 'like',
				created_at: expect.any(Date)
			}));
		});

		it('should update the reaction if a user has already reacted to the post', async () => {
			const mockReaction = {
				id: 1,
				post_id: 1,
				user_id: 123,
				type: 'love',
				created_at: new Date()
			};

			database.query.mockResolvedValueOnce({
				rows: [mockReaction]
			});

			const result = await PostDAO.addReaction(mockReaction.post_id, mockReaction.user_id, mockReaction.type);

			expect(database.query).toHaveBeenCalledWith(
				expect.stringContaining('ON CONFLICT'),
				[mockReaction.post_id, mockReaction.user_id, mockReaction.type]
			);
			expect(result).toEqual(expect.objectContaining({
				id: 1,
				post_id: 1,
				user_id: 123,
				type: 'love',
				created_at: expect.any(Date)
			}));
		});

		it('should throw an error if the database query fails', async () => {
			database.query.mockRejectedValueOnce(new Error('Database error'));

			await expect(PostDAO.addReaction(1, 123, 'like')).rejects.toThrow('Database error');
		});
	});

	describe('getComments()', () => {
		it('should return comments for a post', async () => {
			const mockComments = [{
				id: 1,
				post_id: 1,
				user_id: 123,
				content: 'First comment',
				created_at: new Date(),
				username: 'user1'
			}, {
				id: 2,
				post_id: 1,
				user_id: 124,
				content: 'Second comment',
				created_at: new Date(),
				username: 'user2'
			}];

			database.query.mockResolvedValueOnce({
				rows: mockComments
			});

			const result = await PostDAO.getComments(1);

			expect(database.query).toHaveBeenCalledWith(
				expect.stringContaining('SELECT c.*, u.nev AS username'),
				[1]
			);
			expect(result).toHaveLength(2);
			expect(result[0]).toEqual(expect.objectContaining({
				id: 1,
				content: 'First comment',
				username: 'user1'
			}));
		});

		it('should return an empty array if no comments are found', async () => {
			database.query.mockResolvedValueOnce({
				rows: []
			});

			const result = await PostDAO.getComments(1);

			expect(result).toEqual([]);
		});

		it('should throw an error if the database query fails', async () => {
			database.query.mockRejectedValueOnce(new Error('Database error'));

			await expect(PostDAO.getComments(1)).rejects.toThrow('Database error');
		});
	});

	describe('getReactions()', () => {
		it('should return reactions for a post', async () => {
			const mockReactions = [{
				id: 1,
				post_id: 1,
				user_id: 123,
				type: 'like',
				created_at: new Date(),
				username: 'user1'
			}, {
				id: 2,
				post_id: 1,
				user_id: 124,
				type: 'love',
				created_at: new Date(),
				username: 'user2'
			}];

			database.query.mockResolvedValueOnce({
				rows: mockReactions
			});

			const result = await PostDAO.getReactions(1);

			expect(database.query).toHaveBeenCalledWith(
				expect.stringContaining('SELECT r.*, u.nev AS username'),
				[1]
			);
			expect(result).toHaveLength(2);
			expect(result[0]).toEqual(expect.objectContaining({
				id: 1,
				type: 'like',
				username: 'user1'
			}));
		});

		it('should return an empty array if no reactions are found', async () => {
			database.query.mockResolvedValueOnce({
				rows: []
			});

			const result = await PostDAO.getReactions(1);

			expect(result).toEqual([]);
		});

		it('should throw an error if the database query fails', async () => {
			database.query.mockRejectedValueOnce(new Error('Database error'));

			await expect(PostDAO.getReactions(1)).rejects.toThrow('Database error');
		});
	});
});
