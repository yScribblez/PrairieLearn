DROP FUNCTION IF EXISTS group_contribution(bigint);

CREATE OR REPLACE FUNCTION
    group_contribution ( 
        ai_id bigint
    ) 
    RETURNS TABLE(
        event_name text,
        time_since double precision,
        user_id bigint,
        user_y bigint
    )
AS $$
BEGIN
    RETURN query
        WITH
        event_log AS (
            (
                SELECT
                    'Submission'::TEXT AS event_name,
                    v.date as date,
                    u.user_id as user_id
                FROM
                    submissions AS s
                    JOIN variants AS v ON (v.id = s.variant_id)
                    JOIN instance_questions AS iq ON (iq.id = v.instance_question_id)
                    LEFT JOIN users AS u ON (u.user_id = s.user_id)
                WHERE
                    iq.assessment_instance_id = ai_id
            )
            UNION
            (
                SELECT
                    'View variant'::TEXT AS event_name,
                    pvl.date as date,
                    u.user_id AS user_id
                FROM
                    page_view_logs AS pvl
                    JOIN variants AS v ON (v.id = pvl.variant_id)
                    JOIN instance_questions AS iq ON (iq.id = v.instance_question_id)
                    JOIN questions AS q ON (q.id = pvl.question_id)
                    JOIN users AS u ON (u.user_id = pvl.user_id)
                WHERE
                    pvl.assessment_instance_id = ai_id
                    AND pvl.page_type = 'studentInstanceQuestion'
            )
        ),
        group_members AS (
            SELECT
                gu.user_id AS user_id,
                row_number() over () + 1 as user_y
            FROM
                assessment_instances AS ai
                LEFT JOIN group_users AS gu ON (gu.group_id = ai.group_id)
            WHERE
                ai.id = ai_id
        )
        SELECT
            el.event_name AS event_name,
            10 - extract(epoch FROM NOW() - el.date) / 60 as time_since,
            el.user_id as user_id,
            gm.user_y as user_y
        FROM
            event_log AS el
            JOIN group_members AS gm ON (gm.user_id = el.user_id)
        WHERE
            extract(epoch FROM NOW() - el.date) / 60 < 10;

END;
$$ LANGUAGE plpgsql STABLE;