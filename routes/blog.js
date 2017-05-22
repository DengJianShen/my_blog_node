var express = require('express');
var router = express.Router();
var Q = require("q");
var Tag = require('../models/blog/tag').Tag;
var Message = require('../models/blog/message').Message;
var Notice = require('../models/blog/notice').Notice;
var Article = require('../models/blog/article').Article;
var Comment = require('../models/blog/comment').Comment;
var People = require('../models/blog/people').People;

/* ————————————这里是标签噢———————————— */
/* 新增标签 */
router.post('/blog/tag/add', function (req, res, next) {
    var tagObj = req.body;
    var tag = new Tag({
        title: tagObj.title,
        info: tagObj.info,
        link: tagObj.link
    });
    tag.save(function (err, tag) {
        if (err) {
            console.log(err);
            res.send({
                "errcode": 400,
                "errmsg": "error"
            });
        }
        res.send({
            "errcode": 0,
            "errmsg": "ok",
            "tag": tag
        });
    });
});

/* 获取标签列表 */
router.get('/blog/tag/list', function (req, res, next) {
    var tagObj = req.query;
    var limit = parseInt(tagObj.limit) || 10;
    Tag.count({}, function (err, count) {
            if (err) {
                console.log(err);
                res.send({
                    "errcode": 400,
                    "errmsg": "error"
                });
            }
        })
        .then(function (count) {
            Tag.find({})
                .skip((tagObj.page - 1) * limit)
                .limit(limit)
                .exec(function (err, tag) {
                    if (err) {
                        console.log(err);
                        res.send({
                            "errcode": 400,
                            "errmsg": "error"
                        });
                    }
                    res.send({
                        "count": count,
                        "tag": tag,
                        "errcode": 0,
                        "errmsg": "ok"
                    });
                })
        })
});

/* 删除标签 */
router.post('/blog/tag/del', function (req, res, next) {
    var tagObj = req.body;
    if (Array.isArray(tagObj._id)) {
        tagObj._id.forEach((_item, _index) => {
            /* 找到操作的数组中所有标签对象 */
            Tag.findById(_item, function (err, tag) {
                    if (err) {
                        console.log(err);
                        res.send({
                            "errcode": 400,
                            "errmsg": "error"
                        });
                    }
                })
                .then(function (tag) {
                    /* 找到该次循环的操作标签对象下所有的文章 */
                    if (tag.articles.length > 0) {
                        tag.articles.forEach((__item, __index) => {
                            /* 删除文章表中关联该标签的_id的信息 */
                            Article.findById(__item, function (err, article) {
                                    if (err) {
                                        console.log(err);
                                        res.send({
                                            "errcode": 400,
                                            "errmsg": "error"
                                        });
                                    }
                                    article.tag.remove(_item);
                                    article.save(function (err, article) {
                                        if (err) {
                                            console.log(err);
                                            res.send({
                                                "errcode": 400,
                                                "errmsg": "error"
                                            });
                                        }
                                    })
                                })
                                /* 删除完成后正式删除该次循环的操作标签对象 */
                                .then(function () {
                                    if (__index == tag.articles.length - 1) {
                                        Tag.remove({
                                            _id: _item
                                        }, function (err) {
                                            if (err) {
                                                console.log(err);
                                                res.send({
                                                    "errcode": 400,
                                                    "errmsg": "error"
                                                });
                                            }
                                        });
                                    }
                                })
                        })
                    } else {
                        /* 标签没有文章直接删除 */
                        Tag.remove({
                            _id: _item
                        }, function (err) {
                            if (err) {
                                console.log(err);
                                res.send({
                                    "errcode": 400,
                                    "errmsg": "error"
                                });
                            }
                        });
                    }
                })
                .then(function () {
                    /* 所操作的标签都被移除后给客户端返回信息 */
                    if (_index == tagObj._id.length - 1) {
                        res.send({
                            "errcode": 0,
                            "errmsg": "ok"
                        });
                    }
                })
        })
    } else {
        Tag.findById(tagObj._id, function (err, tag) {
                if (err) {
                    console.log(err);
                    res.send({
                        "errcode": 400,
                        "errmsg": "error"
                    });
                }
            })
            .then(function (tag) {
                /* 该标签中存在关联的文章 */
                if (tag.articles.length > 0) {
                    tag.articles.forEach((_item, _index) => {
                        Article.findById(_item, function (err, article) {
                                if (err) {
                                    console.log(err);
                                    res.send({
                                        "errcode": 400,
                                        "errmsg": "error"
                                    });
                                }
                                article.tag.remove(tagObj._id);
                                article.save(function (err, art) {
                                    if (err) {
                                        console.log(err);
                                        res.send({
                                            "errcode": 400,
                                            "errmsg": "error"
                                        });
                                    }
                                })
                            })
                            .then(function () {
                                if (_index == tag.articles.length - 1) {
                                    Tag.remove({
                                        _id: tagObj._id
                                    }, function (err) {
                                        if (err) {
                                            console.log(err);
                                            res.send({
                                                "errcode": 400,
                                                "errmsg": "error"
                                            });
                                        }
                                        res.send({
                                            "errcode": 0,
                                            "errmsg": "ok"
                                        });
                                    })
                                }
                            })
                    })
                } else {
                    Tag.remove({
                        _id: tagObj._id
                    }, function (err) {
                        if (err) {
                            console.log(err);
                            res.send({
                                "errcode": 400,
                                "errmsg": "error"
                            });
                        }
                        res.send({
                            "errcode": 0,
                            "errmsg": "ok"
                        });
                    })
                }
            })
    }
});

/* 修改标签 */
router.post('/blog/tag/edit', function (req, res, next) {
    var tagObj = req.body;
    /* 只允许修改单个标签 */
    Tag.update({
        _id: tagObj._id
    }, {
        title: tagObj.title,
        info: tagObj.info,
        link: tagObj.link
    }, function (err) {
        if (err) {
            console.log(err);
            res.send({
                "errcode": 400,
                "errmsg": "error"
            });
        }
        res.send({
            "errcode": 0,
            "errmsg": "ok"
        });
    });
});

/* ————————————这里是公告噢———————————— */
/* 新增公告 */
router.post('/blog/notice/add', function (req, res, next) {
    var noticeObj = req.body;
    var notice = new Notice({
        title: noticeObj.title
    });
    notice.save(function (err, notice) {
        if (err) {
            console.log(err);
            res.send({
                "errcode": 400,
                "errmsg": "error"
            });
        }
        res.send({
            "errcode": 0,
            "errmsg": "ok",
            "notice": notice
        });
    });
});

/* 获取公告列表 */
router.get('/blog/notice/list', function (req, res, next) {
    var noticeObj = req.query;
    var limit = parseInt(noticeObj.limit) || 10;
    Notice.count({}, function (err, count) {
            if (err) {
                console.log(err);
                res.send({
                    "errcode": 400,
                    "errmsg": "error"
                });
            }
        })
        .then(function (count) {
            Notice.find({})
                .sort({
                    '_id': -1
                })
                .skip((noticeObj.page - 1) * limit)
                .limit(limit)
                .exec(function (err, notice) {
                    if (err) {
                        console.log(err);
                        res.send({
                            "errcode": 400,
                            "errmsg": "error"
                        });
                    }
                    res.send({
                        "count": count,
                        "notice": notice,
                        "errcode": 0,
                        "errmsg": "ok"
                    });
                })
        })
});

/* 删除公告 */
router.post('/blog/notice/del', function (req, res, next) {
    var noticeObj = req.body;
    if (Array.isArray(noticeObj._id)) {
        Notice.remove({
            _id: {
                $in: noticeObj._id
            }
        }, function (err) {
            if (err) {
                console.log(err);
                res.send({
                    "errcode": 400,
                    "errmsg": "error"
                });
            }
            res.send({
                "errcode": 0,
                "errmsg": "ok"
            });
        });
    } else {
        Notice.remove({
            _id: noticeObj._id
        }, function (err) {
            if (err) {
                console.log(err);
                res.send({
                    "errcode": 400,
                    "errmsg": "error"
                });
            }
            res.send({
                "errcode": 0,
                "errmsg": "ok"
            });
        });
    }
});

/* 修改公告 */
router.post('/blog/notice/edit', function (req, res, next) {
    var noticeObj = req.body;
    Notice.update({
        _id: noticeObj._id
    }, {
        title: noticeObj.title
    }, function (err) {
        if (err) {
            console.log(err);
            res.send({
                "errcode": 400,
                "errmsg": "error"
            });
        }
        res.send({
            "errcode": 0,
            "errmsg": "ok"
        });
    });
});

/* ————————————这里是留言噢———————————— */

/* 新增留言 */
router.post('/blog/message/add', function (req, res, next) {
    var messageObj = req.body;
    var message = new Message({
        title: messageObj.title,
        content: messageObj.content
    });
    message.save(function (err, message) {
        if (err) {
            console.log(err);
            res.send({
                "errcode": 400,
                "errmsg": "error"
            });
        }
        res.send({
            "errcode": 0,
            "errmsg": "ok"
        });
    });
});

/* 获取留言列表 */
router.get('/blog/message/list', function (req, res, next) {
    var messageObj = req.query;
    var limit = parseInt(messageObj.limit) || 10;
    Message.count({}, function (err, count) {
            if (err) {
                console.log(err);
                res.send({
                    "errcode": 400,
                    "errmsg": "error"
                });
            }
        })
        .then(function (count) {
            Message.find({})
                .sort({
                    '_id': -1
                })
                .skip((messageObj.page - 1) * limit)
                .limit(limit)
                .exec(function (err, message) {
                    if (err) {
                        console.log(err);
                        res.send({
                            "errcode": 400,
                            "errmsg": "error"
                        });
                    }
                    res.send({
                        "count": count,
                        "msg": message,
                        "errcode": 0,
                        "errmsg": "ok"
                    });
                })
        })
});

/* 删除留言 */
router.post('/blog/message/del', function (req, res, next) {
    var messageObj = req.body;
    if (Array.isArray(messageObj._id)) {
        Message.remove({
            _id: {
                $in: messageObj._id
            }
        }, function (err) {
            if (err) {
                console.log(err);
                res.send({
                    "errcode": 400,
                    "errmsg": "error"
                });
            }
            res.send({
                "errcode": 0,
                "errmsg": "ok"
            });
        });
    } else {
        Message.remove({
            _id: messageObj._id
        }, function (err) {
            if (err) {
                console.log(err);
                res.send({
                    "errcode": 400,
                    "errmsg": "error"
                });
            }
            res.send({
                "errcode": 0,
                "errmsg": "ok"
            });
        });
    }
});

/* 标记为已读留言 */
router.post('/blog/message/read', function (req, res, next) {
    var messageObj = req.body;
    if (Array.isArray(messageObj._id)) {
        messageObj._id.forEach(function (_item, _index) {
            Message.update({
                    _id: _item
                }, {
                    read: 1
                }, function (err) {
                    if (err) {
                        console.log(err);
                        res.send({
                            "errcode": 400,
                            "errmsg": "error"
                        });
                    }
                })
                .then(function () {
                    if (_index == messageObj._id.length - 1) {
                        res.send({
                            "errcode": 0,
                            "errmsg": "ok"
                        });
                    }
                })
        });
    } else {
        Message.update({
            _id: messageObj._id
        }, {
            read: 1
        }, function (err) {
            if (err) {
                console.log(err);
                res.send({
                    "errcode": 400,
                    "errmsg": "error"
                });
            }
            res.send({
                "errcode": 0,
                "errmsg": "ok"
            });
        })
    }
});

/* ————————————这里是文章噢———————————— */

/* 文章列表 */
router.get('/blog/article/list', function (req, res, next) {
    var articleObj = req.query;
    var limit = parseInt(articleObj.limit) || 10;
    Article.count({}, function (err, count) {
            if (err) {
                console.log(err);
                res.send({
                    "errcode": 400,
                    "errmsg": "error"
                });
            }
        })
        .then(function (count) {
            Article.find({})
                .populate({
                    path: 'tag',
                    select: '_id title',
                    model: 'Tag',
                })
                .sort({
                    '_id': -1
                })
                .skip((articleObj.page - 1) * limit)
                .limit(limit)
                .exec(function (err, article) {
                    if (err) {
                        console.log(err);
                        res.send({
                            "errcode": 400,
                            "errmsg": "error"
                        });
                    }
                    res.send({
                        "count": count,
                        "article": article,
                        "errcode": 0,
                        "errmsg": "ok"
                    });
                })
        })
});

/* 获取单篇文章 */
router.get('/blog/article/fetchOne', function (req, res, next) {
    var articleObj = req.query;
    Article.findById(articleObj._id)
        .populate({
            path: 'tag',
            select: '_id title',
            model: 'Tag',
        })
        .exec(function (err, article) {
            if (err) {
                console.log(err);
                res.send({
                    "errcode": 400,
                    "errmsg": "error"
                });
            }
            res.send({
                "errcode": 0,
                "errmsg": "ok",
                "article": article
            });
        })
})

/* 获取指定分类的文章列表 */
router.get('/blog/article/fetchTag', function (req, res, next) {
    var articleObj = req.query;
    var limit = parseInt(articleObj.limit) || 10;
    var count = 0;
    var _data = [];
    Tag.findById(articleObj.tag, function (err, tag) {
            if (err) {
                console.log(err);
                res.send({
                    "errcode": 400,
                    "errmsg": "error"
                });
            }
        })
        .then(function (tag) {
            count = tag.articles.length;
            if (tag.articles.length > 0) {
                tag.articles.forEach((item, index) => {
                    Article.findById(item)
                        .populate({
                            path: 'tag',
                            select: '_id title',
                            model: 'Tag'
                        })
                        .exec(function (err, article) {
                            if (err) {
                                console.log(err);
                                res.send({
                                    "errcode": 400,
                                    "errmsg": "error"
                                });
                            }
                            _data.push(article);
                        })
                        .then(function () {
                            if (_data.length == count) {
                                res.send({
                                    "article": _data,
                                    "count": count,
                                    "errcode": 0,
                                    "errmsg": "ok"
                                })
                            }
                        })
                })
            } else {
                res.send({
                    "article": [],
                    "count": 0,
                    "errcode": 0,
                    "errmsg": "ok"
                })
            }
        })
})

/* 编辑文章 */
router.post('/blog/article/edit', function (req, res, next) {
    var articleObj = req.body;
    Article.findById(articleObj._id, function (err, article) {
        if (err) {
            console.log(err);
            res.send({
                "errcode": 400,
                "errmsg": "error"
            });
        }
        if (article.tag.length > 0) {
            article.tag.forEach((_item, _index) => {
                /* 移除该篇文章在标签表中的所有信息 */
                Tag.findById(_item, function (err, tag) {
                        if (err) {
                            console.log(err);
                            res.send({
                                "errcode": 400,
                                "errmsg": "error"
                            });
                        }
                        tag.articles.remove(articleObj._id);
                        tag.save(function (err, tag) {
                            if (err) {
                                console.log(err);
                                res.send({
                                    "errcode": 400,
                                    "errmsg": "error"
                                });
                            }
                        })
                    })
                    .then(function () {
                        /* 移除该篇文章在标签表中的所有信息完成后 */
                        if (_index == article.tag.length - 1) {
                            articleObj.tag.forEach((__item, __index) => {
                                /* 标签表中添加该文章 */
                                Tag.findById(__item, function (err, tag) {
                                        if (err) {
                                            console.log(err);
                                            res.send({
                                                "errcode": 400,
                                                "errmsg": "error"
                                            });
                                        }
                                        tag.articles.push(articleObj._id);
                                        tag.save(function (err, tag) {
                                            if (err) {
                                                console.log(err);
                                                res.send({
                                                    "errcode": 400,
                                                    "errmsg": "error"
                                                });
                                            }
                                        })
                                    })
                                    .then(function () {
                                        /* 关联该文章的所有标签添加完成后更新文章表 */
                                        if (__index == articleObj.tag.length - 1) {
                                            Article.update({
                                                    _id: articleObj._id
                                                }, {
                                                    title: articleObj.title,
                                                    content: articleObj.content,
                                                    tag: articleObj.tag
                                                })
                                                .exec(function (err, article) {
                                                    if (err) {
                                                        console.log(err);
                                                        res.send({
                                                            "errcode": 400,
                                                            "errmsg": "error"
                                                        });
                                                    }
                                                    res.send({
                                                        "errcode": 0,
                                                        "errmsg": "ok"
                                                    });
                                                })
                                        }
                                    })
                            })
                        }
                    })
            })
        } else {
            Article.update({
                    _id: articleObj._id
                }, {
                    title: articleObj.title,
                    content: articleObj.content,
                    tag: articleObj.tag
                })
                .exec(function (err, article) {
                    if (err) {
                        console.log(err);
                        res.send({
                            "errcode": 400,
                            "errmsg": "error"
                        });
                    }
                    res.send({
                        "errcode": 0,
                        "errmsg": "ok"
                    });
                })
        }
    })
})

/* 新增文章 */
router.post('/blog/article/add', function (req, res, next) {
    var articleObj = req.body;
    var article = new Article({
        title: articleObj.title,
        content: articleObj.content,
        tag: articleObj.tag
    });
    /* 文章表执行存储 */
    article.save(function (err, article) {
        if (err) {
            console.log(err);
            res.send({
                "errcode": 400,
                "errmsg": "error"
            });
        }
    });
    /* 新增文章必选标签 */
    articleObj.tag.forEach((_item, _index) => {
        /* 标签中添加该文章_id */
        Tag.findById(_item, function (err, tag) {
                if (err) {
                    console.log(err);
                    res.send({
                        "errcode": 400,
                        "errmsg": "error"
                    });
                }
                tag.articles.push(article._id);
                tag.save(function (err, tag) {
                    if (err) {
                        console.log(err);
                        res.send({
                            "errcode": 400,
                            "errmsg": "error"
                        });
                    }
                })
            })
            .then(function () {
                /* 给客户端返回结果 */
                if (_index == articleObj.tag.length - 1) {
                    var _tag = [];
                    article.tag.forEach((__item, __index) => {
                        Tag.findById(__item, function (err, tag) {
                                _tag.push(tag);
                            })
                            .then(function () {
                                if (__index == article.tag.length - 1) {
                                    article.tag = _tag;
                                    res.send({
                                        "errcode": 0,
                                        "errmsg": "ok",
                                        "article": article
                                    });
                                }
                            })
                    })
                }
            })
    })
});


/* 删除文章 */
router.post('/blog/article/del', function (req, res, next) {
    var articleObj = req.body;
    if (Array.isArray(articleObj._id)) {
        articleObj._id.forEach((_item, _index) => {
            /* 删除文章相关评论 */
            Comment.remove({
                article: _item
            }, function (err) {
                if (err) {
                    console.log(err);
                    res.send({
                        "errcode": 400,
                        "errmsg": "error"
                    });
                }
            })
            Article.findById(_item, function (err, article) {
                if (err) {
                    console.log(err);
                    res.send({
                        "errcode": 400,
                        "errmsg": "error"
                    });
                }
                if (article.tag.length > 0) {
                    article.tag.forEach((__item, __index) => {
                        /* 移除标签表中相关的文章信息 */
                        Tag.findById(__item, function (err, tag) {
                                if (err) {
                                    console.log(err);
                                    res.send({
                                        "errcode": 400,
                                        "errmsg": "error"
                                    });
                                }
                                tag.articles.remove(_item);
                                tag.save(function (err, tagitem) {
                                    if (err) {
                                        console.log(err);
                                        res.send({
                                            "errcode": 400,
                                            "errmsg": "error"
                                        });
                                    }

                                })
                            })
                            .then(function () {
                                /* 移除标签表中相关的文章信息完成后进行删除文章 */
                                if (__index == article.tag.length - 1) {
                                    articleObj._id.forEach((item, index) => {
                                        Article.remove({
                                                _id: item
                                            }, function (err) {
                                                if (err) {
                                                    console.log(err);
                                                    res.send({
                                                        "errcode": 400,
                                                        "errmsg": "error"
                                                    });
                                                }
                                            })
                                            .then(function () {
                                                if (index == articleObj._id.length - 1) {
                                                    res.send({
                                                        "errcode": 0,
                                                        "errmsg": "ok"
                                                    });
                                                }
                                            })
                                    })
                                }
                            })
                    })
                } else {
                    Article.remove({
                            _id: _item
                        }, function (err) {
                            if (err) {
                                console.log(err);
                                res.send({
                                    "errcode": 400,
                                    "errmsg": "error"
                                });
                            }
                        })
                        .then(function () {
                            if (_index == articleObj._id.length - 1) {
                                res.send({
                                    "errcode": 0,
                                    "errmsg": "ok"
                                });
                            }
                        })
                }
            })
        })
    } else {
        Comment.remove({
            article: articleObj._id
        }, function (err) {
            if (err) {
                console.log(err);
                res.send({
                    "errcode": 400,
                    "errmsg": "error"
                });
            }
        })
        Article.findById(articleObj._id, function (err, article) {
            if (err) {
                console.log(err);
                res.send({
                    "errcode": 400,
                    "errmsg": "error"
                });
            }
            if (article.tag.length > 0) {
                article.tag.forEach((item, index) => {
                    Tag.findById(item, function (err, tag) {
                            if (err) {
                                console.log(err);
                                res.send({
                                    "errcode": 400,
                                    "errmsg": "error"
                                });
                            }
                            tag.articles.remove(articleObj._id)
                            tag.save(function (err, tagitem) {
                                if (err) {
                                    console.log(err);
                                    res.send({
                                        "errcode": 400,
                                        "errmsg": "error"
                                    });
                                }
                            })
                        })
                        .then(function () {
                            if (index == article.tag.length - 1) {
                                Article.remove({
                                    _id: articleObj._id
                                }, function (err) {
                                    if (err) {
                                        console.log(err);
                                        res.send({
                                            "errcode": 400,
                                            "errmsg": "error"
                                        });
                                    }
                                    res.send({
                                        "errcode": 0,
                                        "errmsg": "ok"
                                    });
                                })
                            }
                        })
                })
            } else {
                Article.remove({
                    _id: articleObj._id
                }, function (err) {
                    if (err) {
                        console.log(err);
                        res.send({
                            "errcode": 400,
                            "errmsg": "error"
                        });
                    }
                    res.send({
                        "errcode": 0,
                        "errmsg": "ok"
                    });
                })
            }
        })
    }
});


/* ————————————这里是评论噢———————————— */

/* 提交评论 */
router.post('/blog/comment/add', function (req, res, next) {
    var commentObj = req.body;
    var articleId = commentObj.article;
    if (commentObj.cid) {
        Comment.findById(commentObj.cid, function (err, comment) {
            var reply = {
                from: commentObj.from,
                to: commentObj.tid,
                content: commentObj.content
            };
            if (comment.reply.length > 0) {
                comment.reply.push(reply);
            } else {
                comment.reply = reply;
            }
            comment.save(function (err, comment) {
                if (err) {
                    console.log(err);
                    res.send({
                        "errcode": 400,
                        "errmsg": "error"
                    });
                }
                Article.findById(articleId, function (err, article) {
                    if (err) {
                        console.log(err);
                        res.send({
                            "errcode": 400,
                            "errmsg": "error"
                        });
                    }
                    article.comment_count = parseInt(article.comment_count) + 1;
                    article.save(function (err, c_article) {
                        if (err) {
                            console.log(err);
                            res.send({
                                "errcode": 400,
                                "errmsg": "error"
                            });
                        }
                    })
                })
                Comment.findById(comment._id)
                    .populate([{
                        path: 'from',
                        select: '_id ip',
                        model: 'People',
                    }, {
                        path: 'reply.from',
                        select: '_id ip',
                        model: 'People',
                    }, {
                        path: 'reply.to',
                        select: '_id ip',
                        model: 'People',
                    }])
                    .exec(function (err, comment) {
                        res.send({
                            "errcode": 0,
                            "errmsg": "ok",
                            "comment": comment,
                            "type": "reply"
                        })
                    })
            });
        })
    } else {
        var _comment = new Comment({
            article: commentObj.article,
            content: commentObj.content,
            from: commentObj.from,
        });
        _comment.save(function (err, comment) {
            if (err) {
                console.log(err);
                res.send({
                    "errcode": 400,
                    "errmsg": "error"
                });
            }
            Article.findById(articleId, function (err, article) {
                if (err) {
                    console.log(err);
                    res.send({
                        "errcode": 400,
                        "errmsg": "error"
                    });
                }
                article.comment_count = parseInt(article.comment_count) + 1;
                article.save(function (err, c_article) {
                    if (err) {
                        console.log(err);
                        res.send({
                            "errcode": 400,
                            "errmsg": "error"
                        });
                    }
                })
            })
            Comment.findById(comment._id)
                .populate({
                    path: 'from',
                    select: '_id ip',
                    model: 'People'
                })
                .exec(function (err, comment) {
                    res.send({
                        "errcode": 0,
                        "errmsg": "ok",
                        "comment": comment,
                        "type": "comment"
                    })
                })
        });
    }
})

/* 文章id返回获取评论列表 */
router.get('/blog/comment/fetchOne', function (req, res, next) {
    var commentObj = req.query;
    Comment.find({
            article: commentObj.article
        })
        .populate([{
            path: 'from',
            select: '_id ip',
            model: 'People',
        }, {
            path: 'reply.from',
            select: '_id ip',
            model: 'People',
        }, {
            path: 'reply.to',
            select: '_id ip',
            model: 'People',
        }])
        .exec(function (err, comment) {
            if (err) {
                console.log(err);
                res.send({
                    "errcode": 400,
                    "errmsg": "error"
                });
            }
            res.send({
                "errcode": 0,
                "errmsg": "ok",
                "comment": comment
            });
        })
})

/* 评论列表 */
router.get('/blog/comment/list', function (req, res, next) {
    var commentObj = req.query;
    var limit = parseInt(commentObj.limit) || 10;
    Comment.count({}, function (err, count) {
        if (err) {
            console.log(err);
            res.send({
                "errcode": 400,
                "errmsg": "error"
            });
        }
    }).then(function (count) {
        Comment.find({})
            .populate([{
                path: 'article',
                select: '_id title',
                model: 'Article',
            }, {
                path: 'from',
                select: '_id ip',
                model: 'People',
            }])
            .sort({
                '_id': -1
            })
            .skip((commentObj.page - 1) * limit)
            .limit(limit)
            .exec(function (err, comment) {
                if (err) {
                    console.log(err);
                    res.send({
                        "errcode": 400,
                        "errmsg": "error"
                    });
                }
                res.send({
                    "count": count,
                    "comment": comment,
                    "errcode": 0,
                    "errmsg": "ok"
                });
            })
    })
});

/* 删除评论 */
router.post('/blog/comment/del', function (req, res, next) {
    var commentObj = req.body;
    if (Array.isArray(commentObj._id)) {
        Comment.remove({
            _id: {
                $in: commentObj._id
            }
        }, function (err) {
            if (err) {
                console.log(err);
                res.send({
                    "errcode": 400,
                    "errmsg": "error"
                });
            }
            res.send({
                "errcode": 0,
                "errmsg": "ok"
            });
        });
    } else {
        Comment.remove({
            _id: commentObj._id
        }, function (err) {
            if (err) {
                console.log(err);
                res.send({
                    "errcode": 400,
                    "errmsg": "error"
                });
            }
            res.send({
                "errcode": 0,
                "errmsg": "ok"
            });
        });
    }
})

/* ————————————这里是杂项噢———————————— */

/* 文章阅读量+1 */
router.post('/blog/article/readAdd', function (req, res, next) {
    var articleObj = req.body;
    Article.findById(articleObj._id, function (err, article) {
        if (err) {
            console.log(err);
            res.send({
                "errcode": 400,
                "errmsg": "error"
            });
        }
        article.view_count = parseInt(article.view_count) + 1;
        article.save(function (err, c_article) {
            if (err) {
                console.log(err);
                res.send({
                    "errcode": 400,
                    "errmsg": "error"
                });
            }
            res.send({
                "errcode": 0,
                "errmsg": "ok"
            });
        })
    })
})

/* 新用户添加 */
router.post('/blog/people/add', function (req, res, next) {
    var peopleObj = req.body;
    People.find({
        ip: peopleObj.ip
    }, function (err, people) {
        if (err) {
            console.log(err);
            res.send({
                "errcode": 400,
                "errmsg": "error"
            });
        }
        if (people.length != 0) {
            res.send({
                "errcode": 0,
                "errmsg": "ok",
                "people": people
            });
        } else {
            var people = new People({
                ip: peopleObj.ip,
            });
            people.save(function (err, people) {
                if (err) {
                    console.log(err);
                    res.send({
                        "errcode": 400,
                        "errmsg": "error"
                    });
                }
                res.send({
                    "errcode": 0,
                    "errmsg": "ok",
                    "people": people
                });
            });
        }
    })
})

module.exports = router;