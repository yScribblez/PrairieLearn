-- BLOCK select_user
SELECT
    to_jsonb(u.*) AS user,
    (adm.id IS NOT NULL) AS is_administrator
FROM
    users AS u
    LEFT JOIN administrators AS adm ON (adm.user_id = u.user_id)
WHERE
    u.user_id = $user_id;

-- BLOCK select_variant_details
SELECT
    v.id AS variant_id,
    iq.id AS instance_question_id,
    q.id AS question_id,
    ci.id AS course_instance_id,
    c.id AS course_id
FROM
    variants AS v
    LEFT JOIN instance_questions AS iq ON (iq.id = v.instance_question_id)
    LEFT JOIN assessment_instances AS ai ON (ai.id = iq.assessment_instance_id)
    LEFT JOIN assessments AS a ON (a.id = ai.assessment_id)
    LEFT JOIN course_instances AS ci ON (ci.id = a.course_instance_id)
    JOIN questions AS q ON (q.id = v.question_id)
    JOIN pl_courses AS c ON (c.id = q.course_id)
WHERE
    v.id = $variant_id;
