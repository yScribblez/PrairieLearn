const ERR = require('async-stacktrace');
const express = require('express');
const router = express.Router({
    mergeParams: true,
});
const path = require('path');
const fs = require('fs-extra');

const sqldb = require('@prairielearn/prairielib/sql-db');
const sqlLoader = require('@prairielearn/prairielib/sql-loader');

const sql = sqlLoader.loadSqlEquiv(__filename);

const walkDirAsync = async (directory) => {
    let results = [];
    const dirEntries = await fs.readdir(directory);
    for (const entry of dirEntries) {
        const file = path.join(directory, entry);
        const stat = await fs.stat(file);
        if (stat && stat.isDirectory()) {
            const recursiveResults = await walkDirAsync(file);
            results = results.concat(recursiveResults);
        } else {
            results.push(file);
        }
    }
    return results;
};

const readAllFiles = async (fileList) => {
    const promises = fileList.map((file) => fs.readFile(file));
    const fileContents = await Promise.all(promises);
    return fileList.map((file, index) => ({
        file,
        contents: fileContents[index].toString('base64'),
    }));
}

router.get('/', (req, res, next) => {
    const params = {
        course_instance_id: req.params.course_instance_id,
    };
    sqldb.queryOneRow(sql.select_questions, params, (err, result) => {
        if (ERR(err, next)) return;
        res.send(result.rows[0].questions);
    });
});

router.get('/:question_id/files', (req, res, next) => {
    const { path: coursePath } = res.locals.course;
    const params = {
        course_instance_id: req.params.course_instance_id,
        question_id: req.params.question_id,
    };
    sqldb.queryOneRow(sql.select_question_directory, params, async (err, result) => {
        if (ERR(err, next)) return;
        const { directory: questionDirectory } = result.rows[0];
        const questionPath = path.join(coursePath, 'questions', questionDirectory);
        try {
            const files = await walkDirAsync(questionPath);
            const filesContents = await readAllFiles(files);
            res.send(filesContents);
        } catch (e) {
            next(e);
        }
    });
});

module.exports = router;
