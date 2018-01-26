const ERR = require('async-stacktrace');
const router = require('express').Router();
const path = require('path');
const upload = require('multer')();
const Duplex = require('stream').Duplex;
const Parse = require('tar').Parse;

const error = require('../../lib/error');
const question = require('../../lib/question');
const sqldb = require('../../lib/sqldb');
const externalGradingSocket = require('../../lib/externalGradingSocket');

function bufferToStream(buffer) {
  let stream = new Duplex();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    let buffers = [];
    stream.on('error', reject);
    stream.on('data', (data) => buffers.push(data));
    stream.on('end', () => resolve(Buffer.concat(buffers)));
  });
}

// const sql = sqlLoader.loadSqlEquiv(__filename);

router.get('/*', function(req, res, _next) {
    var filename = req.params[0];
    var clientFilesDir = path.join(
        res.locals.course.path,
        'questions',
        res.locals.question.directory,
        'clientFilesQuestion'
    );
    res.sendFile(filename, {root: clientFilesDir});
});

function processSubmission(req, res, files, callback) {
    if (res.locals.is_instructor) {
        processSubmissionInstructor(req, res, files, callback);
    } else {
        processSubmissionStudent(req, res, files, callback);
    }
}

function processSubmissionStudent(req, res, files, callback) {
    if (!res.locals.assessment_instance.open) return callback(error.make(400, 'assessment_instance is closed'));
    if (!res.locals.instance_question.open) return callback(error.make(400, 'instance_question is closed'));
    if (res.locals.question.type !== 'Freeform') {
        // TODO Handle this sensibly?
        return callback(null);
    }
    sqldb.callOneRow('variants_ensure_instance_question', [res.locals.variant_id, res.locals.instance_question.id], (err, result) => {
        if (ERR(err, callback)) return;
        const variant = result.rows[0];

        // Filter out any unexpected files for this question
        const filteredFiles = files.filter((file) => {
            return variant.params._required_file_names.indexOf(file.name) !== -1;
        });

        const submittedAnswer = {
            _files: filteredFiles,
        };
        const submission = {
            variant_id: res.locals.variant_id,
            auth_user_id: res.locals.authn_user.user_id,
            submitted_answer: submittedAnswer,
            credit: res.locals.authz_result.credit,
            mode: res.locals.authz_data.mode,
        };

        question.saveAndGradeSubmission(submission, variant, res.locals.question, res.locals.course, (err) => {
            if (ERR(err, callback)) return;
            externalGradingSocket.variantUpdated(res.locals.variant_id);
            callback(null, submission.variant_id);
        });
    });
}

function processSubmissionInstructor(req, res, files, callback) {
    if (res.locals.question.type !== 'Freeform') {
        // TODO do something sensible?
        return callback(null);
    }
    sqldb.callOneRow('variants_ensure_question', [res.locals.variant_id, res.locals.question.id], (err, result) => {
        if (ERR(err, callback)) return;
        const variant = result.rows[0];

        // Filter out any unexpected files for this question
        const filteredFiles = files.filter((file) => {
            return variant.params._required_file_names.indexOf(file.name) !== -1;
        });

        const submittedAnswer = {
            _files: filteredFiles,
        };
        const submission = {
            variant_id: res.locals.variant_id,
            auth_user_id: res.locals.authn_user.user_id,
            submitted_answer: submittedAnswer,
        };

        question.saveAndGradeSubmission(submission, variant, res.locals.question, res.locals.course, (err) => {
            if (ERR(err, callback)) return;
            externalGradingSocket.variantUpdated(res.locals.variant_id);
            callback(null, submission.variant_id);
        });
    });
}

router.post('/', upload.single('files.tar.gz'), (req, res, next) => {
    const filePromises = [];
    const files = [];

    const parser = new Parse();
    parser.on('entry', (entry) => {
        const filePromise = streamToBuffer(entry).then((contents) => {
            return new Promise((resolve) => {
                const file = {
                    name: entry.path,
                    contents: contents.toString('base64'),
                };
                files.push(file);
                resolve();
            });
        });
        filePromises.push(filePromise);
    });

    // There's two possible failure conditions: a completely bad file, which
    // will just emit 'end' immediately, or a corrupted file that will emit
    // 'error' at some point. We need to handle both.
    parser.on('end', _ => {
        Promise.all(filePromises).then(() => {
            processSubmission(res, res, files, (err) => {
                if (ERR(err, next)) return;
                res.status(200).send();
            });
        });
    });
    parser.on('error', (err) => {
        next(err);
    });

    bufferToStream(req.file.buffer).pipe(parser);
});

module.exports = router;
