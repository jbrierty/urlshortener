var express = require('express'),
    app = express(),
    engines = require('consolidate'),
    bodyParser = require('body-parser'),
    MongoClient = require('mongodb').MongoClient,
    assert = require('assert');

app.engine('html', engines.nunjucks);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.use(bodyParser.urlencoded({ extended: true }));

//       https://www.google.com/

//MongoClient.connect('mongodb://localhost:27017/exampledb', function(err, db) {
//MongoClient.connect('mongodb://jbrierty:B39g^A$8pQ@ds035776.mlab.com:35776/urlstuff', function(err, db) {
MongoClient.connect('mongodb://jbrierty:B39g^A$8pQ@ds035776.mlab.com:35776/urlstuff', function(err, db){
    // assert.equal(null, err);
    console.log("Successfully connected to MongoDB.");

    app.get('/', function(req, res, next) {
        res.render('instructions', {});
    });

    app.get('/new/*', function(req,res){
        var entryArray = req.originalUrl.split("");
        var entryLength = entryArray.length;
        console.log('entry length = ' + entryLength)
        var urlArray = entryArray.splice(-(entryLength-5),entryLength-5);
        var url = urlArray.join("");
        console.log(url);
        var sightPattern = /https?:\/\/www\..+\.com/;
        var legal = sightPattern.test(url);
        console.log('new :url rout')
        if(legal){
            newSight(db, url, res, function(){
            });
        }else{
            console.log('bad url format')
            res.render('badformat',{badurl:  url});
        }
    });

    app.get('/*',function(req,res){
        console.log('linknumber rout');
        console.log(req.originalUrl);
        var entryArray = req.originalUrl.split("");
        var entryLength = entryArray.length;
        console.log('entry length = ' + entryLength)
        var codeArray = entryArray.splice(-(entryLength-1),entryLength-1);
        var code = codeArray.join("");
        console.log('recieved an entry code of ' + code);
        var linkNumber = parseInt(code,10);
        console.log(linkNumber);
        findLink(db, res, linkNumber, function(){
        });
        
    });
    

    var port = Number(process.env.PORT || 3000);
    var server = app.listen(port, function() {
        var port = server.address().port;
        console.log('Express server listening on port %s.', port);
    });    
});

var newSight = function(db, url,res, callback) {
    // Get the list collection 
    var collection = db.collection('list');
    // find some documents
    countall(db, function(count){
        //console.log('the count value in newsight is ' + count); 
        collection.find({url:url}).count(function(err,there){
            console.log('looked for url in db');
            if(there >= 1){
                //db find the corisponding {_id: url:} document
                getold(db, url, res, function(){
                });
            }else{
                //todo db make a new {_id: url:} document and return it
                getnew(db, url, res, count, function(){
                });
            }
            callback();
        });
    });
    
}

var countall = function(db, callback){
    var collection = db.collection('list');
    var count;
    collection.find({}).count(function(err,count){
        //console.log('the count value in countall is ' + (typeof count));
        callback(count);
    });
}

var getold = function(db, url, res, callback) {
    // Get the list collection 
    var collection = db.collection('list');
    // find some documents 
    console.log('finding an old entry');
    collection.find({url:url}).toArray(function(err, array){
        console.log(array);
        var urlInfoCode = array[0].code;
        var urlInfourl = array[0].url;
        console.log(urlInfoCode);
        console.log(urlInfourl);

        res.render('shorturl',{urlInfoCode: urlInfoCode, urlInfourl: urlInfourl});
        callback(); 
    });
}

var getnew = function(db, url, res, count, callback) {
    // Get the list collection 
    var collection = db.collection('list');
    // find some documents
    console.log('creating a new entry');
    console.log("value of count in getnew " + (typeof count));
    var code = count+1;
    collection.insert({url:url, code:code});
    collection.find({url:url}).toArray(function(err, array){
        console.log(array);
        var urlInfoCode = array[0].code;
        var urlInfourl = array[0].url;
        console.log(urlInfoCode);
        console.log(urlInfourl);
        callback();

        res.render('shorturl',{urlInfoCode: urlInfoCode, urlInfourl: urlInfourl});
        callback();
    });
}

var findLink = function(db, res, linkNumber, callback){

    var collection = db.collection('list');
    var url = null;
    collection.find({code:linkNumber}).toArray(function(err, array){
        console.log('array length =' + array.length)
        if (array.length >=1){
            url = array[0].url;
            console.log('url value in findlink is ' + url)
            res.render('redirect',{url,url});
        }else{
            res.render('nolink',{linkNumber:linkNumber});
        };
        callback();
    });
};


