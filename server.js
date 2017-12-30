var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app = express();

app.get('/course', function (req, res) {
    url = 'https://mis.cmu.ac.th/tqf/coursepublic.aspx?courseno=' + req.param.courseNo + '&semester=2&year=2560';
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

app.listen('8081');
console.log('Listening requests on port 8081');
exports = module.exports = app;
