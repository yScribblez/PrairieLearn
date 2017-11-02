var ERR = require('async-stacktrace');
var express = require('express');
var router = express.Router();
var _ = require('lodash');

var sqldb = require('../../lib/sqldb');
var sqlLoader = require('../../lib/sql-loader');

var sql = sqlLoader.loadSqlEquiv(__filename);

router.get('/', function(req, res, next) {
    var params = {
        user_id: res.locals.authn_user.user_id,
        is_administrator: res.locals.is_administrator,
        req_date: res.locals.req_date,
    };
    sqldb.queryOneRow(sql.select_home, params, function(err, result) {
        if (ERR(err, next)) return;
        res.locals.courses = result.rows[0].courses;
        res.locals.course_instances = result.rows[0].course_instances;

        c_by_c_shortname = _.groupBy(res.locals.courses, 'short_name');
        ci_by_c_shortname = _.groupBy(res.locals.course_instances, 'c_short_name');
        //console.log(c_by_c_shortname, ci_by_c_shortname);

        master = {};
        _.each(c_by_c_shortname, function(course, short_name) {
          master[short_name] = { course_info: course[0] };
        });

        _.each(ci_by_c_shortname, function(ciarray, short_name) {
          if (!(short_name in master)) master[short_name] = {};
          master[short_name].course_instances = ciarray;
        });

        res.locals.master = master;

        //console.log(res.locals);
        res.render(__filename.replace(/\.js$/, '.ejs'), res.locals);
    });
});

module.exports = router;
