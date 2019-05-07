-- BLOCK select_questions
SELECT
    json_agg(q) as questions
FROM
    questions as q,
    course_instances AS ci
WHERE
    ci.id = $course_instance_id
    AND q.course_id = ci.course_id
    AND q.deleted_at IS NULL;

-- BLOCK select_question_directory
SELECT
    directory
FROM
    questions as q,
    course_instances AS ci
WHERE
    q.id = $question_id
    AND ci.id = $course_instance_id
    AND q.course_id = ci.course_id
    AND q.deleted_at IS NULL;
