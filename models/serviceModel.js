const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'Service Must Have A Name'],
    },
    description: {
      type: String,
      trim: true,
      required: [true, 'Service Must Have Description'],
    },
    delieveryDate: {
      type: Number,
      required: [true, 'Service Must Have Delievery Date'],
    },
    attachFile: {
      type: String,
      required: true,
    },
    salary: {
      type: Number,
      required: [true, 'Service Must Have Salary'],
    },
    softwareTool: {
      type: [String],
      required: [true, 'Service Must Have Tools'],
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
  {
    timestamps: true,
  }
);

serviceSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo ratingsAverage isOnline ratingsQuantity',
  });
  next();
});

const Service = mongoose.model('Service', serviceSchema);
module.exports = Service;
