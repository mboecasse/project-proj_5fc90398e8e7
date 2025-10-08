// File: tests/post.test.js
// Generated: 2025-10-08 14:30:21 UTC
// Project ID: proj_5fc90398e8e7
// Task ID: task_vr8d71ynjqzh


const Post = require('../src/models/Post');


const app = require('../src/app');


const mongoose = require('mongoose');


const request = require('supertest');

describe('Post API Integration Tests', () => {
  let testPostId;

  beforeAll(async () => {
    // Connect to test database
    const testDbUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/blog-test';

    // Check if already connected
    if (mongoose.connection.readyState === 0) {
      try {
        await mongoose.connect(testDbUri, {
          useNewUrlParser: true,
          useUnifiedTopology: true
        });
      } catch (error) {
        console.error('Database connection error:', error);
        throw error;
      }
    }
  });

  afterAll(async () => {
    // Close database connection
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear posts collection before each test
    await Post.deleteMany({});
    testPostId = null;
  });

  describe('POST /api/posts', () => {
    it('should create a new post with valid data', async () => {
      const postData = {
        title: 'Test Post Title',
        content: 'This is test post content',
        author: 'Test Author',
        status: 'draft'
      };

      const response = await request(app)
        .post('/api/posts')
        .send(postData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.title).toBe(postData.title);
      expect(response.body.data.content).toBe(postData.content);
      expect(response.body.data.author).toBe(postData.author);
      expect(response.body.data.status).toBe(postData.status);

      testPostId = response.body.data._id;
    });

    it('should return 400 when title is missing', async () => {
      const postData = {
        content: 'This is test post content',
        author: 'Test Author'
      };

      const response = await request(app)
        .post('/api/posts')
        .send(postData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when content is missing', async () => {
      const postData = {
        title: 'Test Post Title',
        author: 'Test Author'
      };

      const response = await request(app)
        .post('/api/posts')
        .send(postData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when author is missing', async () => {
      const postData = {
        title: 'Test Post Title',
        content: 'This is test post content'
      };

      const response = await request(app)
        .post('/api/posts')
        .send(postData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should set default status to draft when not provided', async () => {
      const postData = {
        title: 'Test Post Title',
        content: 'This is test post content',
        author: 'Test Author'
      };

      const response = await request(app)
        .post('/api/posts')
        .send(postData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('draft');
    });

    it('should return 400 when title is too short', async () => {
      const postData = {
        title: 'ab',
        content: 'This is test post content',
        author: 'Test Author'
      };

      const response = await request(app)
        .post('/api/posts')
        .send(postData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when status is invalid', async () => {
      const postData = {
        title: 'Test Post Title',
        content: 'This is test post content',
        author: 'Test Author',
        status: 'invalid_status'
      };

      const response = await request(app)
        .post('/api/posts')
        .send(postData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/posts', () => {
    beforeEach(async () => {
      // Create test posts
      await Post.create([
        {
          title: 'First Post',
          content: 'First post content',
          author: 'Author 1',
          status: 'published'
        },
        {
          title: 'Second Post',
          content: 'Second post content',
          author: 'Author 2',
          status: 'draft'
        },
        {
          title: 'Third Post',
          content: 'Third post content',
          author: 'Author 1',
          status: 'published'
        }
      ]);
    });

    it('should return all posts', async () => {
      const response = await request(app)
        .get('/api/posts')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.count).toBe(3);
    });

    it('should support pagination with limit', async () => {
      const response = await request(app)
        .get('/api/posts?limit=2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should support pagination with page and limit', async () => {
      const response = await request(app)
        .get('/api/posts?page=2&limit=2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    it('should filter posts by status', async () => {
      const response = await request(app)
        .get('/api/posts?status=published')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every(post => post.status === 'published')).toBe(true);
    });

    it('should filter posts by author', async () => {
      const response = await request(app)
        .get('/api/posts?author=Author 1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every(post => post.author === 'Author 1')).toBe(true);
    });

    it('should return empty array when no posts exist', async () => {
      await Post.deleteMany({});

      const response = await request(app)
        .get('/api/posts')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.count).toBe(0);
    });

    it('should sort posts by createdAt descending by default', async () => {
      const response = await request(app)
        .get('/api/posts')
        .expect(200);

      expect(response.body.success).toBe(true);
      const dates = response.body.data.map(post => new Date(post.createdAt));
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i] >= dates[i + 1]).toBe(true);
      }
    });
  });

  describe('GET /api/posts/:id', () => {
    beforeEach(async () => {
      const post = await Post.create({
        title: 'Test Post',
        content: 'Test content',
        author: 'Test Author',
        status: 'published'
      });
      testPostId = post._id.toString();
    });

    it('should return a post by valid ID', async () => {
      const response = await request(app)
        .get(`/api/posts/${testPostId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testPostId);
      expect(response.body.data.title).toBe('Test Post');
    });

    it('should return 404 for non-existent ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/posts/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/posts/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should not return soft-deleted posts', async () => {
      await Post.findByIdAndUpdate(testPostId, { deletedAt: new Date() });

      const response = await request(app)
        .get(`/api/posts/${testPostId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/posts/:id', () => {
    beforeEach(async () => {
      const post = await Post.create({
        title: 'Original Title',
        content: 'Original content',
        author: 'Original Author',
        status: 'draft'
      });
      testPostId = post._id.toString();
    });

    it('should update a post with valid data', async () => {
      const updateData = {
        title: 'Updated Title',
        content: 'Updated content',
        status: 'published'
      };

      const response = await request(app)
        .put(`/api/posts/${testPostId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.content).toBe(updateData.content);
      expect(response.body.data.status).toBe(updateData.status);
      expect(response.body.data.author).toBe('Original Author');
    });

    it('should return 404 for non-existent ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const updateData = {
        title: 'Updated Title'
      };

      const response = await request(app)
        .put(`/api/posts/${fakeId}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid ID format', async () => {
      const updateData = {
        title: 'Updated Title'
      };

      const response = await request(app)
        .put('/api/posts/invalid-id')
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 when updating with invalid status', async () => {
      const updateData = {
        status: 'invalid_status'
      };

      const response = await request(app)
        .put(`/api/posts/${testPostId}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should allow partial updates', async () => {
      const updateData = {
        title: 'Only Title Updated'
      };

      const response = await request(app)
        .put(`/api/posts/${testPostId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.content).toBe('Original content');
    });

    it('should increment version on update', async () => {
      const originalPost = await Post.findById(testPostId);
      const originalVersion = originalPost.__v;

      const updateData = {
        title: 'Updated Title'
      };

      const response = await request(app)
        .put(`/api/posts/${testPostId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.__v).toBe(originalVersion + 1);
    });
  });

  describe('DELETE /api/posts/:id', () => {
    beforeEach(async () => {
      const post = await Post.create({
        title: 'Post to Delete',
        content: 'Content to delete',
        author: 'Test Author',
        status: 'draft'
      });
      testPostId = post._id.toString();
    });

    it('should soft delete a post by ID', async () => {
      const response = await request(app)
        .delete(`/api/posts/${testPostId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBeDefined();

      const deletedPost = await Post.findById(testPostId);
      expect(deletedPost.deletedAt).toBeDefined();
      expect(deletedPost.deletedAt).toBeInstanceOf(Date);
    });

    it('should return 404 for non-existent ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/posts/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .delete('/api/posts/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should not return soft-deleted post in GET requests', async () => {
      await request(app)
        .delete(`/api/posts/${testPostId}`)
        .expect(200);

      const response = await request(app)
        .get(`/api/posts/${testPostId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should exclude soft-deleted posts from list', async () => {
      await Post.create({
        title: 'Another Post',
        content: 'Another content',
        author: 'Test Author',
        status: 'published'
      });

      await request(app)
        .delete(`/api/posts/${testPostId}`)
        .expect(200);

      const response = await request(app)
        .get('/api/posts')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Another Post');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty request body for POST', async () => {
      const response = await request(app)
        .post('/api/posts')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle empty request body for PUT', async () => {
      const post = await Post.create({
        title: 'Test Post',
        content: 'Test content',
        author: 'Test Author'
      });

      const response = await request(app)
        .put(`/api/posts/${post._id}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle very long title', async () => {
      const longTitle = 'a'.repeat(300);
      const postData = {
        title: longTitle,
        content: 'Test content',
        author: 'Test Author'
      };

      const response = await request(app)
        .post('/api/posts')
        .send(postData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle special characters in content', async () => {
      const postData = {
        title: 'Test Post',
        content: 'Content with special chars: <script>alert("xss")</script>',
        author: 'Test Author'
      };

      const response = await request(app)
        .post('/api/posts')
        .send(postData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toContain('script');
    });

    it('should handle concurrent updates correctly', async () => {
      const post = await Post.create({
        title: 'Concurrent Test',
        content: 'Test content',
        author: 'Test Author'
      });

      const update1 = request(app)
        .put(`/api/posts/${post._id}`)
        .send({ title: 'Update 1' });

      const update2 = request(app)
        .put(`/api/posts/${post._id}`)
        .send({ title: 'Update 2' });

      const [response1, response2] = await Promise.all([update1, update2]);

      expect(response1.status === 200 || response2.status === 200).toBe(true);
    });

    it('should handle database connection errors gracefully', async () => {
      await mongoose.connection.close();

      const response = await request(app)
        .get('/api/posts')
        .expect(500);

      expect(response.body.success).toBe(false);

      const testDbUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/blog-test';
      await mongoose.connect(testDbUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    });
  });

  describe('Validation Tests', () => {
    it('should validate title minimum length', async () => {
      const postData = {
        title: 'ab',
        content: 'Valid content here',
        author: 'Test Author'
      };

      const response = await request(app)
        .post('/api/posts')
        .send(postData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate content minimum length', async () => {
      const postData = {
        title: 'Valid Title',
        content: 'short',
        author: 'Test Author'
      };

      const response = await request(app)
        .post('/api/posts')
        .send(postData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate author minimum length', async () => {
      const postData = {
        title: 'Valid Title',
        content: 'Valid content here',
        author: 'ab'
      };

      const response = await request(app)
        .post('/api/posts')
        .send(postData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should accept valid status values', async () => {
      const statuses = ['draft', 'published', 'archived'];

      for (const status of statuses) {
        const postData = {
          title: `Post with ${status} status`,
          content: 'Test content',
          author: 'Test Author',
          status
        };

        const response = await request(app)
          .post('/api/posts')
          .send(postData)
          .expect(201);

        expect(response.body.data.status).toBe(status);
      }
    });

    it('should trim whitespace from string fields', async () => {
      const postData = {
        title: '  Title with spaces  ',
        content: '  Content with spaces  ',
        author: '  Author with spaces  '
      };

      const response = await request(app)
        .post('/api/posts')
        .send(postData)
        .expect(201);

      expect(response.body.data.title).toBe('Title with spaces');
      expect(response.body.data.content).toBe('Content with spaces');
      expect(response.body.data.author).toBe('Author with spaces');
    });
  });

  describe('Pagination Tests', () => {
    beforeEach(async () => {
      const posts = [];
      for (let i = 1; i <= 15; i++) {
        posts.push({
          title: `Post ${i}`,
          content: `Content for post ${i}`,
          author: 'Test Author',
          status: 'published'
        });
      }
      await Post.create(posts);
    });

    it('should return correct number of posts with limit', async () => {
      const response = await request(app)
        .get('/api/posts?limit=5')
        .expect(200);

      expect(response.body.data).toHaveLength(5);
    });

    it('should return correct page of results', async () => {
      const response = await request(app)
        .get('/api/posts?page=2&limit=5')
        .expect(200);

      expect(response.body.data).toHaveLength(5);
    });

    it('should handle page beyond available data', async () => {
      const response = await request(app)
        .get('/api/posts?page=100&limit=10')
        .expect(200);

      expect(response.body.data).toHaveLength(0);
    });

    it('should handle invalid page number', async () => {
      const response = await request(app)
        .get('/api/posts?page=-1&limit=10')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle invalid limit', async () => {
      const response = await request(app)
        .get('/api/posts?limit=0')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should default to reasonable limit when not specified', async () => {
      const response = await request(app)
        .get('/api/posts')
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(100);
    });
  });
});
