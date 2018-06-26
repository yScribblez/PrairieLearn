const ERR = require('async-stacktrace');
const express = require('express');
const moment = require('moment');
const router = express.Router();
const { sqlDb, sqlLoader } = require('@prairielearn/prairielib');

const sql = sqlLoader.loadSqlEquiv(__filename);

router.get('/:issueId', (req, res, next) => {
    const params = {
        issue_id: req.params.issueId,
    };
    sqlDb.queryOneRow(sql.select_issue, params, (err, result) => {
        if (ERR(err, next)) return;
        res.locals.issue = result.rows[0];
        sqlDb.query(sql.select_comments, params, (err, result) => {
            if (ERR(err, next)) return;
            res.locals.comments = result.rows;

            // Add human-readable relative dates to each row
            res.locals.comments.forEach((row) => {
                row.relative_date = moment(row.formatted_date).from(row.now_date);
            });

            res.render(__filename.replace(/\.js$/, '.ejs'), res.locals);
        });
    });
});

router.post('/:issueId', (req, res, next) => {
    if (req.body.__action === 'comment') {
        console.log(`Comment: [${req.params.issueId}] ${req.body.comment}`);
        const params = {
            user_id: res.locals.authn_user.user_id,
            issue_id: req.params.issueId,
            comment: req.body.comment,
        };
        sqlDb.queryOneRow(sql.insert_comment, params, (err) => {
            if (ERR(err, next)) return;
            res.redirect(req.originalUrl);
        });
    } else if (req.body.__action === 'close_and_comment') {
        console.log(`Close and comment: [${req.params.issueId}] ${req.body.comment}`);
        res.redirect(req.originalUrl);
    } else {
        next(new Error('unknown __action: ' + req.body.__action));
    }
});

module.exports = router;
