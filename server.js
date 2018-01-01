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
    request(url, function (error, response, html) {
        if (!error) {
            var $ = cheerio.load(html);
            var responseJson = {
                courseName: '',
                courseCredit: ''
            };
            $('#lblCourseTitleEng').filter(function () {
                responseJson.courseName = $(this).text();
            });
            $('#lblCredit').filter(function () {
                responseJson.courseCredit = $(this).text().charAt(0);
            });

            return res.json(responseJson);
        }
    });
});

app.get('/student', function (req, res) {
    url = 'https://www3.reg.cmu.ac.th/regist' + req.query.semester + req.query.year.substring(req.query.year.length - 2) + '/public/result.php?id=' + req.query.id;
    console.log(url);
    request(url, function (error, response, html) {
        if (!error) {
            var $ = cheerio.load(html);

            var courses = [];

            $('tr.msan8').slice(2).each(function () {
                let courseInformation = [];
                $('td', this).each(function () {
                    var value = $(this).text().trim();
                    courseInformation.push(value);
                });
                courses.push(courseInformation);
            });

            var coursesJson = {
                courseList: []
            };

            courses.forEach((course, index) => {
                const courseInformation = {
                    no: course[0],
                    courseNo: course[1],
                    title: course[2],
                    sectionLec: course[3],
                    sectionLab: course[4],
                    creditLec: course[5],
                    creditLab: course[6],
                    day: course[7],
                    time: course[8],
                    type: course[9],
                    grade: course[10]
                };
                coursesJson.courseList.push(courseInformation);
            });
            return res.json(coursesJson);
        }
    });
});

app.get('/cgpa-calculator', function (req, res) {
    url = 'https://www3.reg.cmu.ac.th/regist' + req.query.semester + req.query.year.substring(req.query.year.length - 2) + '/public/result.php?id=' + req.query.id;
    console.log(url);
    request(url, function (error, response, html) {
        if (!error) {
            var $ = cheerio.load(html);

            var courses = [];

            $('tr.msan8').slice(2).each(function () {
                let courseInformation = [];
                $('td', this).each(function () {
                    var value = $(this).text().trim();
                    courseInformation.push(value);
                });
                courses.push(courseInformation);
            });

            var coursesJson = {
                courseList: []
            };

            courses.forEach((course, index) => {
                const creditLec = course[5].charAt(0),
                    creditLab = course[6].charAt(0),
                    type = course[9];
                const courseInformation = {
                    no: course[0],
                    courseNo: course[1],
                    title: course[2],
                    credit: (creditLec == "0" ? creditLab : creditLec)
                };
                coursesJson.courseList.push(courseInformation);
            });
            return res.json(coursesJson);
        }
    });
});

app.listen(port, function () {
    console.log('Listening requests on port ' + port);
});
exports = module.exports = app;
