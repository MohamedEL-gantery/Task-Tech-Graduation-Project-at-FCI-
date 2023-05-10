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
    },
    password: {
      type: String,
      required: [true, ' Please Enter A Vaild Password'],
      minLenght: 8,
      select: false,
    },
    confirmPassword: {
      type: String,
      required: [true, 'Please Enter A Vaild Confirm Password'],
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
        message: 'Gender is Male , Female',
      },
    },
    age: {
      type: Number,
    },
    birthDate: {
      type: Date,
    },
    location: {
      type: String,
    },
    phoneNumber: {
      type: String,
      maxlength: 11,
      validate: [validator.isMobilePhone, 'Please Enter A Vaild Phone'],
    },
    skills: {
      type: [String],
    },
    photo: {
      type: String,
      default: 'default.jpg',
    },
    images: {
      type: [String],
    },
    about: {
      type: String,
      minLenght: 100,
      trim: true,
    },
    minimum: {
      type: Number,
    },
    maximum: {
      type: Number,
    },
    currency: {
      type: String,
      enum: {
        values: ['EUR', 'USD', 'SAR', 'CHF', 'EGP', 'GBP'],
        message: 'Currency is either:EUR ,USD ,SAR ,CHF ,EGP , GBP',
      },
    },
    ferquency: {
      type: String,
      enum: {
        values: ['per hour', 'per day', 'per weak', 'per month'],
        message: 'Ferquency is Per hour , per day , per weak , per month',
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
        message: 'Please Enter Your Education ',
      },
    },
    cv: {
      type: String,
    },
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
          'catogery is either: Web Design, Marketing, Business ,Software Engineering , Web Developer, App Developer ,Product Manager , Accountant,Ui/Ux Design , Graphics Designer',
      },
    },
    job: {
      type: String,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    ratingsAverage: {
      type: Number,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10, // 4.666666, 46.6666, 47, 4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    passwordChangedAt: Date,
    passwordResetExpires: Date,
    passwordResetCode: String,
    passwordResetVerified: Boolean,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    followers: {
      type: Array,
      default: [],
    },
    followings: {
      type: Array,
      default: [],
    },
    facebookId: String,
    googleId: String,
    isOnline: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
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

//virtual populate
userSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'reviewee',
  localField: '_id',
});

const setImageURL = (doc) => {
  if (doc.cv) {
    const cvUrl = `${req.protocol}://${req.get('host')}/cv/${doc.cv}`;
    doc.cv = cvUrl;
  }

  if (doc.images) {
    const imagesList = [];
    doc.images.forEach((image) => {
      const imageUrl = `${req.protocol}://${req.get(
        'host'
      )}/portfolio/${image}`;
      imagesList.push(imageUrl);
    });
    doc.images = imagesList;
  }
};
// findOne, findAll and update
userSchema.post('init', (doc) => {
  setImageURL(doc);
});

// create
userSchema.post('save', (doc) => {
  setImageURL(doc);
});

userSchema.plugin(findOrCreate);

const User = mongoose.model('User', userSchema);
module.exports = User;
