var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app = express();

var port = process.env.PORT || 8080; // process.env.PORT lets the port be set by Heroku

// Allow CORS
var cors = require('cors');
app.use(cors());
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", '*');
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
    next();
});

app.get('/course/:courseNo', function (req, res) {
    url = 'https://mis.cmu.ac.th/tqf/coursepublic.aspx?courseno=' + req.params.courseNo + '&semester=2&year=2560';
    request(url, function(error, response, html){
        if(!error){
            var $ = cheerio.load(html);
            $('#lblCourseTitleEng').filter(function(){
                var data = $(this);
                var courseTitleEng = data.text();
                return res.json(courseTitleEng);
            })
        }
    })
});

app.listen(port, function() {
    console.log('Listening requests on port ' + port);
});
exports = module.exports = app;
