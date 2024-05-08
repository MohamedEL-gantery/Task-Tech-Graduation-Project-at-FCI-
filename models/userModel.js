const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const findOrCreate = require('mongoose-findorcreate');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User Must Hava A Name'],
    },
    email: {
      type: String,
      required: [true, ' User Must Have A Email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please Provide A Valid Email'],
    },
    password: {
      type: String,
      required: [true, ' Please Provide A Valid Password'],
      minLength: 8,
      select: false,
    },
    confirmPassword: {
      type: String,
      required: [true, 'Please Provide A Valid Confirm Password'],
      // This only works on create and SAVE !!!
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: 'Password Are Not The Same',
      },
    },
    gender: {
      type: String,
      enum: {
        values: ['male', 'female'],
        message: 'Gender must be Male or Female',
      },
    },
    age: Number,
    birthDate: {
      type: Date,
      validate: [validator.isDate, 'Please Provide A Valid BirthDate'],
    },
    location: String,
    phoneNumber: {
      type: String,
      validate: [validator.isMobilePhone, 'Please Provide A Valid Phone'],
    },
    skills: [String],
    photo: {
      type: String,
      default: 'default.jpg',
    },
    images: [String],
    about: {
      type: String,
      minLength: 100,
      trim: true,
    },
    minimum: Number,
    maximum: Number,
    currency: {
      type: String,
      enum: {
        values: ['EUR', 'USD', 'SAR', 'CHF', 'EGP', 'GBP'],
        message: 'Currency is either: EUR ,USD ,SAR ,CHF ,EGP , GBP',
      },
    },
    frequency: {
      type: String,
      enum: {
        values: ['per hour', 'per day', 'per week', 'per month', 'per task'],
        message:
          'Frequency is either: per hour, per day, per week, per month, per task',
      },
    },
    education: {
      type: String,
      enum: {
        values: [
          'Ain Shams University',
          'Al Alamein International University',
          'Al-Azhar University',
          'Alexandria University',
          'Arish University',
          'Assiut University',
          'Aswan University',
          'Badr University in Cairo',
          'Benha University',
          'Beni-Suef University',
          'Cairo University',
          'Damanhour University',
          'Damietta University',
          'Delta University for Science and Technology',
          'Egyptian Chinese University',
          'Egypt-Japan University of Science and Technology',
          'Fayoum University',
          'Future University in Egypt',
          'Galala University',
          'Helwan University',
          'Kafrelsheikh University',
          'Luxor University',
          'Mansoura University',
          'Matrouh University',
          'Menoufia University',
          'Minia University',
          'Misr International University',
          'New Valley University',
          'Pharos University in Alexandria',
          'Port Said University',
          'Sinai University',
          'Sohag university',
          'South Valley University',
          'Suez Canal University',
          'Suez University',
          'Tanta University',
          'The American University in Cairo',
          'The Arab Academy for Management',
          'Banking and Financial Sciences',
          'The British University in Egypt',
          'The German University in Cairo',
          "Université Française d'Égypte",
          'University of Sadat City',
          'University of Science and Technology at Zewail City',
          'Zagazig University',
          'Massachusetts Institute of Technology (MIT)',
          'Harvard University',
          'University of Oxford',
          'University of Cambridge',
          'ETH Zurich (Swiss Federal Institute of Technology)',
          'University of Tokyo',
          'Universite PSL',
        ],
        message: 'Please Select A Valid Education Option',
      },
    },
    cv: String,
    catogery: {
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
          'Category must be one of: Web Design, Marketing, Business, Software Engineering, Web Developer, App Developer, Product Manager, Accountant, Ui/Ux Design, Graphics Designer',
      },
    },
    job: {
      type: String,
      default: 'freelancer',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    ratingsAverage: {
      type: Number,
      min: [1, 'Rating Must Be Above 1.0'],
      max: [5, 'Rating Must Be Below 5.0'],
      set: (val) => Math.round(val * 10) / 10,
      default: 1,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    followers: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
    followings: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
    facebookId: String,
    googleId: String,
    isOnline: {
      type: Boolean,
      default: true,
    },
    passwordChangedAt: Date,
    passwordResetExpires: Date,
    passwordResetCode: String,
    passwordResetVerified: Boolean,
    ResetExpires: Date,
    ResetCode: String,
    ResetVerified: Boolean,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();
  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  // Delete  passwordConfirm field
  this.confirmPassword = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPassword = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const ChangedTimestapm = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < ChangedTimestapm;
  }
  return false;
};

userSchema.methods.createPasswordResetCode = function () {
  const restCode = Math.floor(1000 + Math.random() * 9000).toString();
  this.passwordResetCode = crypto
    .createHash('sha256')
    .update(restCode)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  this.passwordResetVerified = false;

  return restCode;
};

userSchema.methods.generateVerificationCode = function () {
  const restCode = Math.floor(1000 + Math.random() * 9000).toString();
  this.ResetCode = crypto.createHash('sha256').update(restCode).digest('hex');

  this.ResetExpires = Date.now() + 10 * 60 * 1000;
  this.ResetVerified = false;

  return restCode;
};

//virtual populate
userSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'reviewee',
  localField: '_id',
});

userSchema.plugin(findOrCreate);

const User = mongoose.model('User', userSchema);

module.exports = User;
