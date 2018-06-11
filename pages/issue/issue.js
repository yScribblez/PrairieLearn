const ERR = require('async-stacktrace');
const express = require('express');
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
        res.render(__filename.replace(/\.js$/, '.ejs'), res.locals);
    });
});

router.post('/:issueId', (req, res, next) => {
    if (req.body.__action === 'comment') {
        console.log(`Comment: [${req.params.issueId}] ${req.body.comment}`);
        res.redirect(`${res.locals.urlPrefix}/issue/${req.params.issueId}`);
    } else if (req.body.__action === 'close_and_comment') {
        console.log(`Close and comment: [${req.params.issueId}] ${req.body.comment}`);
        res.redirect(`${res.locals.urlPrefix}/issue/${req.params.issueId}`);
    } else {
        next(new Error('unknown __action: ' + req.body.__action));
    }
});

module.exports = router;
