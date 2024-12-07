const PostDAO = require('../src/app/dao/PostDAO');
const { createPost, getAllPosts, addComment, addReaction, getComments, getReactions, addLike, addDislike } = require('../src/app/controllers/PostController');

jest.mock('fs', () => ({
    readFileSync: jest.fn(() => 'mocked-file-content')
}));

describe('PostController tests', () => {
    let req, res;

    beforeEach(() => {
        req = { body: {}, params: {}, user: { id: 1 } };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    });

    describe('createPost', () => {
        it('should create a new post successfully', async () => {
            PostDAO.createPost = jest.fn().mockResolvedValue({ id: 1, content: 'Test Post' });
            req.body.content = 'Test Post';

            await createPost(req, res);

            expect(PostDAO.createPost).toHaveBeenCalledWith(1, 'Test Post');
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ message: 'Bejegyzés létrehozva', post: { id: 1, content: 'Test Post' } });
        });

        it('should handle errors when creating a post', async () => {
            PostDAO.createPost = jest.fn().mockRejectedValue(new Error('Database Error'));

            await createPost(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Hiba történt a bejegyzés létrehozása során!', error: expect.any(Error) });
        });
    });

    describe('getAllPosts', () => {
        it('should return all posts', async () => {
            const mockPosts = [{ id: 1, content: 'Test Post' }];
            PostDAO.getAllPosts = jest.fn().mockResolvedValue(mockPosts);

            await getAllPosts(req, res);

            expect(PostDAO.getAllPosts).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockPosts);
        });

        it('should handle errors when fetching posts', async () => {
            PostDAO.getAllPosts = jest.fn().mockRejectedValue(new Error('Database Error'));

            await getAllPosts(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Hiba történt a bejegyzések lekérése során!', error: expect.any(Error) });
        });
    });

    describe('addComment', () => {
        it('should add a comment to a post', async () => {
            req.params.postId = 1;
            req.body.content = 'Test Comment';
            PostDAO.addComment = jest.fn().mockResolvedValue({ id: 1, content: 'Test Comment' });

            await addComment(req, res);

            expect(PostDAO.addComment).toHaveBeenCalledWith(1, 1, 'Test Comment');
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ message: 'Hozzászólás hozzáadva', comment: { id: 1, content: 'Test Comment' } });
        });

        it('should handle errors when adding a comment', async () => {
            PostDAO.addComment = jest.fn().mockRejectedValue(new Error('Database Error'));

            await addComment(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Hiba történt a hozzászólás hozzáadása során!', error: expect.any(Error) });
        });
    });

    describe('addReaction', () => {
        it('should add a reaction to a post', async () => {
            req.params.postId = 1;
            req.body.reactionType = 'like';
            PostDAO.addReaction = jest.fn().mockResolvedValue({ id: 1, type: 'like' });

            await addReaction(req, res);

            expect(PostDAO.addReaction).toHaveBeenCalledWith(1, 1, 'like');
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ message: 'Reakció hozzáadva', reaction: { id: 1, type: 'like' } });
        });

        it('should handle errors when adding a reaction', async () => {
            PostDAO.addReaction = jest.fn().mockRejectedValue(new Error('Database Error'));

            await addReaction(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Hiba történt a reakció hozzáadása során!', error: expect.any(Error) });
        });
    });

    describe('getComments', () => {
        it('should return comments for a specific post', async () => {
            req.params.postId = 1;
            const mockComments = [{ id: 1, content: 'Test Comment' }];
            PostDAO.getComments = jest.fn().mockResolvedValue(mockComments);

            await getComments(req, res);

            expect(PostDAO.getComments).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ comments: mockComments });
        });

        it('should handle errors when fetching comments', async () => {
            PostDAO.getComments = jest.fn().mockRejectedValue(new Error('Database Error'));

            await getComments(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Hiba történt a kommentek lekérése során!', error: expect.any(Error) });
        });
    });

    describe('getReactions', () => {
        it('should return reactions for a specific post', async () => {
            req.params.postId = 1;
            const mockReactions = [{ id: 1, type: 'like' }];
            PostDAO.getReactions = jest.fn().mockResolvedValue(mockReactions);

            await getReactions(req, res);

            expect(PostDAO.getReactions).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockReactions);
        });

        it('should handle errors when fetching reactions', async () => {
            PostDAO.getReactions = jest.fn().mockRejectedValue(new Error('Database Error'));

            await getReactions(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Hiba történt a reakciók lekérése során!', error: expect.any(Error) });
        });
    });

    describe('addLike', () => {
        it('should add a like to a post', async () => {
            req.params.postId = 1;
            PostDAO.addReaction = jest.fn().mockResolvedValue({ id: 1, type: 'like' });

            await addLike(req, res);

            expect(PostDAO.addReaction).toHaveBeenCalledWith(1, 1, 'like');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Like hozzáadva', reaction: { id: 1, type: 'like' } });
        });

        it('should handle errors when adding a like', async () => {
            PostDAO.addReaction = jest.fn().mockRejectedValue(new Error('Database Error'));

            await addLike(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Hiba történt a like hozzáadása során!', error: expect.any(Error) });
        });
    });

    describe('addDislike', () => {
        it('should add a dislike to a post', async () => {
            req.params.postId = 1;
            PostDAO.addReaction = jest.fn().mockResolvedValue({ id: 1, type: 'dislike' });

            await addDislike(req, res);

            expect(PostDAO.addReaction).toHaveBeenCalledWith(1, 1, 'dislike');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Dislike hozzáadva', reaction: { id: 1, type: 'dislike' } });
        });

        it('should handle errors when adding a dislike', async () => {
            PostDAO.addReaction = jest.fn().mockRejectedValue(new Error('Database Error'));

            await addDislike(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Hiba történt a dislike hozzáadása során!', error: expect.any(Error) });
        });
    });
});
