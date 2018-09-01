'use strict';
var views = require('co-views');
var parse = require('co-body');
var monk = require('monk');
var wrap = require('co-monk');
var db = monk('localhost/library');
var co = require('co');
var WXBizDataCrypt = require('../utils/WXBizDataCrypt');
var request = require('request');

var books = wrap(db.get('books'));
var lists = wrap(db.get('lists'));

// From lifeofjs
co(function * () {
  var books = yield books.find({});
});

var render = views(__dirname + '/../views', {
  map: {
    html: 'swig'
  }
});

module.exports.home = function * home(next) {
  if ('GET' != this.method) return yield next;
  this.body = yield render('layout');
};

module.exports.list = function * list(next) {
  if ('GET' != this.method) return yield next;
  this.body = yield render('list', {
    'books': yield books.find({})
  });
};

// This must be avoided, use ajax in the view.
module.exports.all = function * all(next) {
  if ('GET' != this.method) return yield next;
  this.body = yield books.find({});
};

module.exports.fetch = function * fetch(id,next) {
  if ('GET' != this.method) return yield next;
  // Quick hack.
  if(id === ""+parseInt(id, 10)){
    var book = yield books.find({}, {
      'skip': id - 1,
      'limit': 1
    });
    if (book.length === 0) {
      this.throw(404, 'book with id = ' + id + ' was not found');
    }
    this.body = yield book;
  }

};

module.exports.fetchByListId = function * fetch(listid,next) {
  if ('GET' != this.method) return yield next;
  // Quick hack.
  var book = yield books.find({
    'list_id': listid
  });
  if (book.length === 0) {
    this.throw(404, 'book with id = ' + listid + ' was not found');
  }
  this.body = yield book;

};

module.exports.add = function * add(data,next) {
  if ('POST' != this.method) return yield next;
  var book = yield parse(this, {
    limit: '1kb'
  });
  var inserted = yield books.insert(book);
  if (!inserted) {
    this.throw(405, "The book couldn't be added.");
  }
  this.body = 'Done!';
};

module.exports.fetchUserInfo = function * fetchUserInfo(data,next) {
  if ('POST' != this.method) return yield next;
  var userInfo = yield parse(this, {
    limit: '100kb'
  });
  var appid = 'wx75d496e157ceaa7e';
  var appsecret = '5fd699a02c81cc628f93889dab22e98e';
  var wxurl = 'https://api.weixin.qq.com/sns/jscode2session?appid=' + appid + '&secret=' + appsecret + '&js_code=' + userInfo.code + '&grant_type=authorization_code';
  var req = '';
  var getOpenid = () => new Promise((resolve, reject) => {
    req = request(wxurl, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        resolve(body);
      }else{
        reject(error);
      }
    });
  })

  getOpenid().then((res) => {req.end();return res }).catch(err => {req.end();console.log(err)});

  var info =yield getOpenid();

  // var pc = new WXBizDataCrypt(appid, userInfo.code);
  // var dedata = pc.decryptData(userInfo.detail.encryptedData , userInfo.detail.iv);

  // console.log('解密后 data: ', dedata);
  console.log(info);

  var list = yield lists.find({
    'creater': JSON.parse(info).openid
  });
  if (list.length === 0) {
    this.throw(404, 'list was not found');
  }

  this.body = {info, list};
};

module.exports.fetchByOpenId = function * fetchByOpenId(openid,next) {
  if ('GET' != this.method) return yield next;
  var list = yield lists.find({
    'creater': openid
  });
  if (list.length === 0) {
    this.throw(404, 'list was not found');
  }

  this.body = yield list;
};

module.exports.modify = function * modify(id,next) {
  if ('PUT' != this.method) return yield next;

  var data = yield parse(this, {
    limit: '1kb'
  });

  var book = yield books.find({}, {
    'skip': id - 1,
    'limit': 1
  });

  if (book.length === 0) {
    this.throw(404, 'book with id = ' + id + ' was not found');
  }

  var updated = books.update(book[0], {
    $set: data
  });

  if (!updated) {
    this.throw(405, "Unable to update.");
  } else {
    this.body = "Done";
  }
};

module.exports.remove = function * remove(id,next) {
  if ('DELETE' != this.method) return yield next;

  var book = yield books.find({}, {
    'skip': id - 1,
    'limit': 1
  });

  if (book.length === 0) {
    this.throw(404, 'book with id = ' + id + ' was not found');
  }

  var removed = books.remove(book[0]);

  if (!removed) {
    this.throw(405, "Unable to delete.");
  } else {
    this.body = "Done";
  }

};

module.exports.head = function *(){
  return;
};

module.exports.options = function *() {
  this.body = "Allow: HEAD,GET,PUT,DELETE,OPTIONS";
};

module.exports.trace = function *() {
  this.body = "Smart! But you can't trace.";
};
