const mongoose = require('mongoose');
const slugify = require('slugify');

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'Service Must Have A Name'],
    },
    slug: String,
    description: {
      type: String,
      trim: true,
      required: [true, 'Service Must Have Description'],
    },
    delieveryDate: {
      type: String,
      required: [true, 'Service Must Have Delievery Date'],
    },
    attachFile: {
      type: String,
      required: [true, 'Service Must Have  Attach File'],
    },
    salary: {
      type: Number,
      required: [true, 'Service Must Have Salary'],
    },
    softwareTool: {
      type: [String],
      required: [true, 'Service Must Have  Software Tool'],
    },
    category: {
      type: String,
      enum: {
        values: [
          'Web Design',
          'Business',
          'Marketing',
          'Software Engineering',
          'Web Developer',
          'App Developer',
          'Product Manager',
          'Accountant',
          'Ui/Ux Design',
          'Graphics Designer',
        ],
        message:
          'catogery is either: Web Design, Marketing, Business ,Software Engineering , Web Developer, App Developer ,Product Manager , Accountant,Ui/Ux Design , Graphics Designer',
      },
      required: [true, 'Service Must Have category'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Service Must Belong To User'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

serviceSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo ratingsAverage isOnline ratingsQuantity',
  });
  next();
});

// Document Middleware: runs before .save() and .create()
serviceSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

const Service = mongoose.model('Service', serviceSchema);
module.exports = Service;
