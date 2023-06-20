const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      unique: true,
      required: true,
    },
    photo: {
      type: String,
      unique: true,
      required: true,
    },
    slug: String,
  },
  {
    timestamps: true,
  }
);

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

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
categorySchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
