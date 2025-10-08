.
├── src/
│   ├── app.js                      # Express app configuration and middleware setup
│   ├── server.js                   # HTTP server startup with graceful shutdown
│   │
│   ├── config/
│   │   ├── database.js             # MongoDB connection and configuration
│   │   └── env.js                  # Environment variable validation and export
│   │
│   ├── controllers/
│   │   ├── healthController.js     # Health check endpoint logic
│   │   └── postController.js       # Post CRUD operations controller
│   │
│   ├── middleware/
│   │   ├── auth.js                 # JWT authentication middleware
│   │   ├── errorHandler.js         # Global error handling middleware
│   │   ├── rateLimiter.js          # Rate limiting configuration
│   │   └── security.js             # Security headers and XSS protection
│   │
│   ├── models/
│   │   └── Post.js                 # Mongoose schema for blog posts
│   │
│   ├── routes/
│   │   ├── index.js                # Route aggregator combining all routes
│   │   ├── healthRoutes.js         # Health check routes
│   │   └── postRoutes.js           # Post API routes with validation
│   │
│   ├── services/
│   │   └── postService.js          # Business logic for post operations
│   │
│   ├── utils/
│   │   ├── apiResponse.js          # Standardized API response formatter
│   │   ├── logger.js               # Winston logger configuration
│   │   └── postValidator.js        # Express-validator rules for posts
│   │
├── tests/
│   ├── setup.js                    # Jest test configuration and setup
│   └── post.test.js                # Integration tests for post endpoints
│
├── .env.example                    # Example environment variables
├── .gitignore                      # Git ignore patterns
├── jest.config.js                  # Jest testing configuration
├── package.json                    # Project dependencies and scripts
├── Dockerfile                      # Docker container configuration
├── docker-compose.yml              # Docker Compose orchestration
└── README.md                       # Project documentation
