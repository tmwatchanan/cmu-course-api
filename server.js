var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app = express();

var port = process.env.PORT || 8080; // process.env.PORT lets the port be set by Heroku


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
