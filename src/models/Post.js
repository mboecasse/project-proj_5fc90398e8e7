// File: src/models/Post.js
// Generated: 2025-10-08 14:25:55 UTC
// Project ID: proj_5fc90398e8e7
// Task ID: task_6kvmlqsgudm8


const mongoose = require('mongoose');


const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
      index: true
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
      index: true
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true
    },
    version: {
      type: Number,
      default: 1
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound indexes for common queries
postSchema.index({ author: 1, status: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ deletedAt: 1, status: 1 });

// Virtual for checking if post is deleted
postSchema.virtual('isDeleted').get(function () {
  return this.deletedAt !== null;
});

// Query middleware to exclude soft-deleted posts by default
postSchema.pre('find', function (next) {
  if (this.getOptions().includeDeleted !== true) {
    this.where({ deletedAt: null });
  }
  next();
});

postSchema.pre('findOne', function (next) {
  if (this.getOptions().includeDeleted !== true) {
    this.where({ deletedAt: null });
  }
  next();
});

postSchema.pre('findOneAndUpdate', function (next) {
  if (this.getOptions().includeDeleted !== true) {
    this.where({ deletedAt: null });
  }
  next();
});

postSchema.pre('findOneAndDelete', function (next) {
  if (this.getOptions().includeDeleted !== true) {
    this.where({ deletedAt: null });
  }
  next();
});

postSchema.pre('findOneAndReplace', function (next) {
  if (this.getOptions().includeDeleted !== true) {
    this.where({ deletedAt: null });
  }
  next();
});

postSchema.pre('count', function (next) {
  if (this.getOptions().includeDeleted !== true) {
    this.where({ deletedAt: null });
  }
  next();
});

postSchema.pre('countDocuments', function (next) {
  if (this.getOptions().includeDeleted !== true) {
    this.where({ deletedAt: null });
  }
  next();
});

postSchema.pre('estimatedDocumentCount', function (next) {
  if (this.getOptions().includeDeleted !== true) {
    this.where({ deletedAt: null });
  }
  next();
});

// Instance method for soft delete with atomic operation
postSchema.methods.softDelete = async function () {
  const result = await this.constructor.findByIdAndUpdate(
    this._id,
    {
      $set: { deletedAt: new Date() },
      $inc: { version: 1 }
    },
    { new: true, runValidators: true }
  ).setOptions({ includeDeleted: true });

  if (result) {
    this.deletedAt = result.deletedAt;
    this.version = result.version;
  }

  return result;
};

// Instance method for restore with atomic operation
postSchema.methods.restore = async function () {
  const result = await this.constructor.findByIdAndUpdate(
    this._id,
    {
      $set: { deletedAt: null },
      $inc: { version: 1 }
    },
    { new: true, runValidators: true }
  ).setOptions({ includeDeleted: true });

  if (result) {
    this.deletedAt = result.deletedAt;
    this.version = result.version;
  }

  return result;
};

// Pre-save middleware to increment version
postSchema.pre('save', function (next) {
  if (!this.isNew && this.isModified() && !this.isModified('version')) {
    this.version += 1;
  }
  next();
});

// Static method to find including deleted
postSchema.statics.findWithDeleted = function (conditions) {
  return this.find(conditions).setOptions({ includeDeleted: true });
};

// Static method to find only deleted
postSchema.statics.findDeleted = function (conditions = {}) {
  return this.find({ ...conditions, deletedAt: { $ne: null } }).setOptions({ includeDeleted: true });
};


const Post = mongoose.model('Post', postSchema);

module.exports = Post;
