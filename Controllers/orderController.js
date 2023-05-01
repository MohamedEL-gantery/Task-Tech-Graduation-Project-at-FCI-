const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/orderModel');
const Service = require('../models/serviceModel');
const catchAsync = require('../utils/catchAync');
const AppError = require('../utils/appError');

exports.CheckoutSession = catchAsync(async (req, res, next) => {
  // get service depend on serviceId
  const service = await Service.findById(req.params.serviceId);

  if (!service) {
    return next(new AppError(`no service found for ${req.params.serviceId}`));
  }

  // app settings
  const servicePrice = service.salary;
  const taxSalary = servicePrice * 0.1;

  const totalServicePrice = servicePrice + taxSalary;

  // create stripe checkout session
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: totalServicePrice * 100,
          product_data: {
            name: `${service.name} `,
            description: service.description,
          },
        },
      },
    ],
    mode: 'payment',
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/orders`,
    cancel_url: `${req.protocol}://${req.get('host')}/service`,
    customer_email: req.user.email,
    client_reference_id: req.params.serviceId,
  });

  // send session response
  res.status(200).json({
    status: 'success',
    session,
  });
});
