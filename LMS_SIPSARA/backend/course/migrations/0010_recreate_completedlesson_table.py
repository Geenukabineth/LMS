from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("course", "0009_alter_assignment_options_and_more"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            CREATE TABLE IF NOT EXISTS course_completedlesson (
                id BIGSERIAL PRIMARY KEY,
                user_id BIGINT NOT NULL,
                lesson_id BIGINT NOT NULL,
                completed BOOLEAN NOT NULL DEFAULT FALSE,
                date TIMESTAMPTZ NOT NULL
            );

            -- unique_together(user, lesson)
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint
                    WHERE conname = 'course_completedlesson_user_lesson_uniq'
                ) THEN
                    ALTER TABLE course_completedlesson
                    ADD CONSTRAINT course_completedlesson_user_lesson_uniq UNIQUE (user_id, lesson_id);
                END IF;
            END
            $$;

            CREATE INDEX IF NOT EXISTS course_completedlesson_user_id_idx
                ON course_completedlesson(user_id);

            CREATE INDEX IF NOT EXISTS course_completedlesson_lesson_id_idx
                ON course_completedlesson(lesson_id);
            """,
            reverse_sql="""
            DROP TABLE IF EXISTS course_completedlesson;
            """,
        )
    ]
