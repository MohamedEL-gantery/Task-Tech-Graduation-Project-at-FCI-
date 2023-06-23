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
      unique: true,
      required: [true, 'Category must have a  photo'],
    },
    type: {
      type: String,
      enum: ['popular', 'trending'],
      required: [true, 'Type must be one of  popular or trending '],
    },
    nSkills: {
      type: Number,
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

const setImageURL = (doc) => {
  if (doc.photo) {
    const photoUrl = `${process.env.BASE_URL}/photo/${doc.photo}`;
    doc.photo = photoUrl;
  }
};

// findOne, findAll and update
categorySchema.post('init', (doc) => {
  setImageURL(doc);
});

// create
categorySchema.post('save', (doc) => {
  setImageURL(doc);
});

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
