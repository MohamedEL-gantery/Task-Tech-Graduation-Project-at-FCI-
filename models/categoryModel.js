const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: [true, 'Category must have a unique name'],
    },
    slug: String,
    photo: {
      type: String,
      required: [true, 'Category must have a photo'],
    },
    type: {
      type: String,
      enum: ['popular', 'trending'],
      required: [true, 'Type must be one of popular or trending '],
    },
    nSkills: {
      type: Number,
      required: [true, 'Category must have a nSkills'],
    },
  },
  {
    timestamps: true,
  }
);

// Document Middleware: runs before .save() and .create()
categorySchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
