const mongoose = require('mongoose');
const User = require('./userModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cant not be embty'],
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    reviewee: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to reviewee'],
    },
    reviewer: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to reviewer'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
  { timestamps: true }
);

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'reviewer',
    select: 'name photo',
  });
  next();
});

reviewSchema.statics.calcAverageRatings = async function (revieweeId) {
  const stats = await this.aggregate([
    {
      $match: { reviewee: revieweeId },
    },
    {
      $group: {
        _id: '$reviewee',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await User.findByIdAndUpdate(revieweeId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await User.findByIdAndUpdate(revieweeId, {
      ratingsQuantity: 0,
      ratingsAverage: 0,
    });
  }
};

reviewSchema.post('save', function () {
  //this points to current review
  //this.constructor => model
  this.constructor.calcAverageRatings(this.reviewee);
});

// findByIdAndUpdate
// findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  next();
});

reviewSchema.post(/^^findOneAnd/, async function () {
  // await this.findOne(); does NOT work here, query has already executed
  await this.r.constructor.calcAverageRatings(this.r.reviewee);
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
