require('../connect');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

var Tag_Schema = new Schema({
    title:String,
    info:String,
    link:String,
    articles: [{
        type: ObjectId,
        ref: 'Article'
    }],
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

Tag_Schema.pre('save', function (next) {
    if (this.isNew) {
        this.meta.createAt = this.meta.updateAt = Date.now()
    }
    else {
        this.meta.updateAt = Date.now()
    }
    next();
});

var Tag = mongoose.model("Tag", Tag_Schema);

exports.Tag = Tag;