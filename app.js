'use strict';
var books = require('./controllers/books');
var compress = require('koa-compress');
var logger = require('koa-logger');
var serve = require('koa-static');
var route = require('koa-route');
var koa = require('koa');
var path = require('path');
var app = module.exports =  new koa();

// Logger
app.use(logger());

app.use(route.get('/', books.home));
app.use(route.get('/books/', books.all));
app.use(route.get('/view/books/', books.list));
app.use(route.get('/books/:id', books.fetch));
app.use(route.get('/booklist/:id', books.fetchByListId));
app.use(route.get('/booklistid/:id', books.fetchByOpenId));
app.use(route.post('/books/', books.add));
app.use(route.put('/books/:id', books.modify));
app.use(route.delete('/books/:id', books.remove));
app.use(route.options('/', books.options));
app.use(route.trace('/', books.trace));
app.use(route.head('/', books.head));
app.use(route.post('/userinfo/', books.fetchUserInfo));



// Serve static files
app.use(serve(path.join(__dirname, 'public')));

// Compress
app.use(compress());

if (!module.parent) {
  app.listen(1337);
  console.log('listening on port 1337');
}
