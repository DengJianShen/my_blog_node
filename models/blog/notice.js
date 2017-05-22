require('../connect');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Notice_Schema = new Schema({
    title:String,
    meta: {
        createAt: {
            type: Date,
            default: Date.now()
        },
        updateAt: {
            type: Date,
            default: Date.now()
        }
    }
}, {
    versionKey: false
});

Notice_Schema.pre('save', function (next) {
    if (this.isNew) {
        this.meta.createAt = this.meta.updateAt = Date.now()
    }
    else {
        this.meta.updateAt = Date.now()
    }
    next();
});

var Notice = mongoose.model("Notice", Notice_Schema);

exports.Notice = Notice;