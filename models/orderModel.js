const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'order must belong to user'],
    },
    service: {
      type: mongoose.Schema.ObjectId,
      ref: 'Service',
      required: [true, 'order must belong to service '],
    },
    salary: {
      type: Number,
      require: [true, 'order must have a salary'],
    },
    taxSalary: Number,
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: Date,
  },
  { timestamps: true }
);

orderSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name email photo',
  }).populate({
    path: 'service',
    select: 'user name delieveryDate salary',
  });
  next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
