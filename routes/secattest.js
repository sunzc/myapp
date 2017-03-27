var express = require('express');   
var morgan = require('morgan');  
var fs = require('fs');  
var https = require('https');  
var app = express();

app.use(morgan('common'));  

app.get('/', function(req, res) {  
  res.json({status: 'My Api is alive!'});
});

var credentials = {  
  key: fs.readFileSync('my-api.key', 'utf8'),
  cert: fs.readFileSync('my-api.cert', 'utf8')
};

https.createServer(credentials, app)  
     .listen(3001, function() {
      console.log('My Api is running...');
     });



module.exports = app;  