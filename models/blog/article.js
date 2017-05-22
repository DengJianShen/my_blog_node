require('../connect');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

var Article_Schema = new Schema({
    title:String,
    content:String,
    view_count:{
        type:Number,
        default:0
    },
    comment_count:{
        type:Number,
        default:0
    },
    tag: [{
        type: ObjectId,
        ref: 'Tag'
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

Article_Schema.pre('save', function (next) {
    if (this.isNew) {
        this.meta.createAt = this.meta.updateAt = Date.now()
    }
    else {
        this.meta.updateAt = Date.now()
    }
    next();
});

var Article = mongoose.model("Article", Article_Schema);

exports.Article = Article;