const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      unique: true,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    photo: {
      type: String,
      unique: true,
      required: true,
    },
    slug: String,
    type: {
      type: String,
      enum: ['popular', 'trending'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Define a pre-save hook to set id equal to name
categorySchema.pre('save', function (next) {
  this._id = this.name;
  next();
});

/*// Document Middleware: runs before .save() and .create()
categorySchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});*/

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
