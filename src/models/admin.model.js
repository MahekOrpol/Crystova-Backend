const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');

const adminSchema = mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    lastName: {
        type: String,
    },
    phone: {
        type: String,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Invalid Email')
            }
        },
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 8,
        validate(value) {
            if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
                throw new Error('Password must contain 8 least one letter and one numner')
            }
        },
        private: true,
    },
    confirmPassword: {
        type: String,
        // required: true,
        minlength: 8,
        trim: true,
        validate(value) {
            if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
                throw new Error('Password must contain at least one letter and one number');
            }
        },
        private: true, // used by the toJSON plugin
    }, 
    token: {
      type: String,
    //   required: true,
      index: true,
    },
    generateOTP: {
        type: String,
        required: false,
    },
    role: {
        type: String,
        enum: ["Teacher", 'User', 'Admin'],
        default: 'User',
    },
    profileImage: {
        type:String,
    },
    gender: {
        type: String,
    },
    birthday:{
        type:String,
    },
    spId:{
        type:String,
    },
    year:{
        type:String,
    },
    semester:{
        type:String,
    },
    division:{
        type:String,
    },
    otherDivision:{
        type:String,
    },
},
    {
        timestamps: true,
    }
)

adminSchema.plugin(toJSON);
adminSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
adminSchema.statics.isEmailTaken = async function (email, excludeUserId) {
    const admin = await this.findOne({ email, _id: { $ne: excludeUserId } });
    return !!admin;
};

/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
adminSchema.methods.isPasswordMatch = async function (password) {
    const admin = this;
    return bcrypt.compare(password, admin.password);
};

adminSchema.pre('save', async function (next) {
    const admin = this;
    if (admin.isModified('password')) {
        admin.password = await bcrypt.hash(admin.password, 8);
        // admin.confirmPassword = await bcrypt.hash(admin.confirmPassword, 8);
    }
    next();
});




/**
 * @typeOf Admin
 */
const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;