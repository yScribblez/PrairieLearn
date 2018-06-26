-- BLOCK select_issue
SELECT
    i.*,
    format_date_full(i.date, coalesce(ci.display_timezone, c.display_timezone)) AS formatted_date,
    u.uid AS user_uid,
    u.name AS user_name
FROM
    issues AS i
    LEFT JOIN course_instances AS ci ON (ci.id = i.course_instance_id)
    JOIN pl_courses AS c ON (c.id = i.course_id)
    LEFT JOIN users AS u ON (u.user_id = i.user_id)
WHERE
    i.id = $issue_id;

-- BLOCK select_comments
SELECT
    ic.*,
    format_date_iso8601(NOW(), coalesce(ci.display_timezone, c.display_timezone)) AS now_date,
    format_date_iso8601(ic.date, coalesce(ci.display_timezone, c.display_timezone)) AS formatted_date,
    u.uid AS user_uid,
    u.name AS user_name
FROM
    issue_comments AS ic
    JOIN issues as i ON (i.id = ic.issue_id)
    LEFT JOIN course_instances AS ci ON (ci.id = i.course_instance_id)
    JOIN pl_courses AS c ON (c.id = i.course_id)
    LEFT JOIN users AS u ON (u.user_id = ic.user_id)
WHERE
    ic.issue_id = $issue_id;

-- BLOCK insert_comment
INSERT INTO issue_comments
    (issue_id, user_id, comment)
VALUES
    ($issue_id, $user_id, $comment);
