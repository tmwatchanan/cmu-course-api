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
                facultyName: '',
                courseName: '',
                courseNameThai: '',
                courseDescription: '',
                courseDescriptionThai: '',
                courseCredit: ''
            };
            $('#lblFacultyName').filter(function () {
                responseJson.facultyName = $(this).text();
            });
            $('#lblCourseTitleEng').filter(function () {
                responseJson.courseName = $(this).text();
            });
            $('#lblCourseTitleTha').filter(function () {
                responseJson.courseNameThai = $(this).text();
            });
            $('#lblCourseDescriptionEng').filter(function () {
                responseJson.courseDescription = $(this).text();
            });
            $('#lblCourseDescriptionTha').filter(function () {
                responseJson.courseDescriptionThai = $(this).text();
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
    // console.log(url);
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

app.get('/enrolled-course', function (req, res) {
    // https://www3.reg.cmu.ac.th/regist260/public/stdtotal.php?var=maxregist&COURSENO=261102&SECLEC=001&SECLAB=000
    url = 'https://www3.reg.cmu.ac.th/regist' + req.query.semester + req.query.year.substring(req.query.year.length - 2) + '/public/stdtotal.php?var=maxregist&COURSENO=' + req.query.courseno + '&SECLEC=' + req.query.seclec + '&SECLAB=' + req.query.seclab;
    // console.log(url);
    request(url, function (error, response, html) {
        if (!error) {
            var $ = cheerio.load(html, { decodeEntities: false });

            var students = [];

            $('html > body > center > div > table > tbody > tr.msan').each(function () {
                let studentInformation = [];
                let col_count = 0;
                $('td', this).each(function () {
                    var value = $(this).text().trim();
                    studentInformation.push(value);
                    col_count++;
                    if (col_count >= 2) return;
                });
                students.push(studentInformation);
            });

            var studentsJson = {
                studentList: []
            };

            students.forEach((course, index) => {
                const studentInformation = {
                    no: course[0],
                    studentId: course[1],
                    // name: course[2],
                };
                studentsJson.studentList.push(studentInformation);
            });
            return res.json(studentsJson);
        }
    });
});

app.get('/class-info', function (req, res) {
    url = 'https://www3.reg.cmu.ac.th/regist' + req.query.semester + req.query.year.substring(req.query.year.length - 2) + '/public/search.php?act=search';
    request.post({ url: url, form: { op: 'bycourse', s_course1: req.query.courseno, s_lec1: req.query.seclec, s_lab1: req.query.seclab } }, function (error, response, html) {
        if (!error) {
            var $ = cheerio.load(html);

            var courses = [];

            $('html > body > div > div > div > details > table > tbody').each(function () {
                let courseInformation = [];
                $('tr', this).each(function () {
                    let col_count = 0;
                    $('td', this).each(function () {
                        var value = $(this).text();
                        let columnValue = value;
                        if (col_count == 9 || col_count == 10) {
                            let html_content = $(this).html();
                            html_content = html_content.replace('<red>', '')
                            html_content = html_content.replace('</red>', '')
                            html_content = html_content.replace('<gray>', '')
                            html_content = html_content.replace('</gray>', '')
                            let lecturerList = html_content.split('<br>');
                            const index = lecturerList.indexOf('<b>co-instructor</b>');
                            lecturerList = lecturerList.filter(function (e) { return e });
                            lecturerList.forEach(lecturer => {
                                lecturer = lecturer.replace(/<[\\d\\D]*?>/, '')
                            });
                            if (index !== -1) {
                                lecturerList.splice(index, 1);
                            }
                            columnValue = lecturerList;
                        }
                        courseInformation.push(columnValue);
                        col_count++;
                    });
                    courses.push(courseInformation);
                });
            });

            var coursesJson = {};

            courses.forEach((course, index) => {
                coursesJson = {
                    roomList: course[9],
                    lecturerList: course[10],
                    examDate: course[11],
                    examTime: course[12]
                };
                return;
            });
            return res.json(coursesJson);
        }
    });
});

app.get('/cgpa-calculator', function (req, res) {
    url = 'https://www3.reg.cmu.ac.th/regist' + req.query.semester + req.query.year.substring(req.query.year.length - 2) + '/public/result.php?id=' + req.query.id;
    // console.log(url);
    request(url, function (error, response, html) {
        if (!error && response.statusCode == 200) {
            var $ = cheerio.load(html);

            var courses = [];

            $('tr.msan8').slice(2).each(function () {
                let courseInformation = [];
                $('td', this).each(function () {
                    var value = $(this).text().trim();
                    courseInformation.push(value);
                });
                if (courseInformation[0] == "NO." || courseInformation[0] == "LEC") {
                    return true;
                }
                courses.push(courseInformation);
            });

            var coursesJson = {
                status: true,
                courseList: []
            };

            courses.forEach((course, index) => {
                let creditLec, creditLab, type;
                try {
                    if (course[5] != "") {
                        creditLec = course[5].charAt(0);
                    }
                    if (course[6] != "") {
                        creditLab = course[6].charAt(0);
                    }
                    type = course[9];
                }
                catch (err) {
                    console.log("err", err);
                    console.log("error url ->", url);
                    console.log("error course ->", course);
                }
                const courseInformation = {
                    no: course[0],
                    courseNo: course[1],
                    title: course[2],
                    credit: creditLab + creditLec
                };
                coursesJson.courseList.push(courseInformation);
            });
            if (coursesJson.courseList.length > 0) {
                return res.json(coursesJson);
            } else {
                return res.json();
            }
        } else {
            // console.log("404 Not Found");
            return res.status(200).json({ status: false, statusCode: 404, statusMessage: "Not Found" });
        }
    });
});

app.listen(port, function () {
    console.log('Listening requests on port ' + port);
});
exports = module.exports = app;
