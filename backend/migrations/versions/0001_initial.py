"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-09-25 00:00:00
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _now() -> sa.DateTime:
    return sa.DateTime(timezone=True)


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("last_login_at", _now(), nullable=True),
        sa.Column("created_at", _now(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", _now(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "user_profiles",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("target_role", sa.String(255), nullable=True),
        sa.Column("target_location", sa.String(255), nullable=True),
        sa.Column("experience_level", sa.String(100), nullable=True),
        sa.Column("preferred_work_mode", sa.String(50), nullable=True),
        sa.Column("career_interests", sa.Text(), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("created_at", _now(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", _now(), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_user_profiles_user_id", "user_profiles", ["user_id"], unique=True)

    op.create_table(
        "resumes",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("file_name", sa.String(255), nullable=False),
        sa.Column("file_path", sa.String(500), nullable=True),
        sa.Column("raw_text", sa.Text(), nullable=True),
        sa.Column("parsed_data", sa.JSON(), nullable=True),
        sa.Column("created_at", _now(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", _now(), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_resumes_user_id", "resumes", ["user_id"])

    op.create_table(
        "analyses",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("resume_id", sa.BigInteger(), nullable=True),
        sa.Column("title", sa.String(255), nullable=True),
        sa.Column("target_role", sa.String(255), nullable=False),
        sa.Column("location", sa.String(255), nullable=True),
        sa.Column("experience_level", sa.String(100), nullable=True),
        sa.Column("employment_type", sa.String(50), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="queued"),
        sa.Column("current_stage", sa.String(50), nullable=True),
        sa.Column("completed_stages", sa.JSON(), nullable=True),
        sa.Column("progress", sa.Float(), nullable=False, server_default="0"),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("overall_match", sa.Float(), nullable=True),
        sa.Column("market_overview", sa.JSON(), nullable=True),
        sa.Column("insights", sa.JSON(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("completed_at", _now(), nullable=True),
        sa.Column("created_at", _now(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", _now(), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["resume_id"], ["resumes.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_analyses_user_id", "analyses", ["user_id"])
    op.create_index("ix_analyses_status", "analyses", ["status"])

    op.create_table(
        "jobs",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("analysis_id", sa.BigInteger(), nullable=False),
        sa.Column("external_job_id", sa.String(255), nullable=True),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("company", sa.String(255), nullable=True),
        sa.Column("location", sa.String(255), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("source", sa.String(100), nullable=True),
        sa.Column("salary", sa.String(255), nullable=True),
        sa.Column("employment_type", sa.String(100), nullable=True),
        sa.Column("experience", sa.String(100), nullable=True),
        sa.Column("url", sa.String(700), nullable=True),
        sa.Column("posted_at", _now(), nullable=True),
        sa.Column("posted_text", sa.String(120), nullable=True),
        sa.Column("remote_type", sa.String(50), nullable=True),
        sa.Column("raw_data", sa.JSON(), nullable=True),
        sa.Column("created_at", _now(), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["analysis_id"], ["analyses.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_jobs_analysis_id", "jobs", ["analysis_id"])
    op.create_index("ix_jobs_analysis_id_company", "jobs", ["analysis_id", "company"])

    op.create_table(
        "skills",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("category", sa.String(100), nullable=True),
    )
    op.create_index("ix_skills_name", "skills", ["name"], unique=True)

    op.create_table(
        "analysis_skills",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("analysis_id", sa.BigInteger(), nullable=False),
        sa.Column("skill_id", sa.BigInteger(), nullable=True),
        sa.Column("skill_name", sa.String(255), nullable=False),
        sa.Column("category", sa.String(100), nullable=True),
        sa.Column("market_frequency", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("market_percentage", sa.Float(), nullable=False, server_default="0"),
        sa.Column("market_rank", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("user_has_skill", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("skill_gap_level", sa.String(20), nullable=False, server_default="missing"),
        sa.Column("priority", sa.String(20), nullable=False, server_default="low"),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("created_at", _now(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", _now(), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["analysis_id"], ["analyses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["skill_id"], ["skills.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_analysis_skills_analysis_id", "analysis_skills", ["analysis_id"])

    op.create_table(
        "roadmaps",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("analysis_id", sa.BigInteger(), nullable=False),
        sa.Column("title", sa.String(255), nullable=True),
        sa.Column("duration", sa.Integer(), nullable=False, server_default="30"),
        sa.Column("content", sa.JSON(), nullable=True),
        sa.Column("created_at", _now(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", _now(), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["analysis_id"], ["analyses.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_roadmaps_analysis_id", "roadmaps", ["analysis_id"], unique=True)

    op.create_table(
        "roadmap_items",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("roadmap_id", sa.BigInteger(), nullable=False),
        sa.Column("week_number", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("learning_objective", sa.Text(), nullable=True),
        sa.Column("why_it_matters", sa.Text(), nullable=True),
        sa.Column("what_to_learn", sa.Text(), nullable=True),
        sa.Column("practice", sa.Text(), nullable=True),
        sa.Column("project_task", sa.Text(), nullable=True),
        sa.Column("interview_prep", sa.Text(), nullable=True),
        sa.Column("skills", sa.JSON(), nullable=True),
        sa.Column("resources", sa.JSON(), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("created_at", _now(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", _now(), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["roadmap_id"], ["roadmaps.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_roadmap_items_roadmap_id", "roadmap_items", ["roadmap_id"])

    op.create_table(
        "saved_jobs",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("job_id", sa.BigInteger(), nullable=False),
        sa.Column("created_at", _now(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", _now(), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["job_id"], ["jobs.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id", "job_id", name="uq_saved_jobs_user_job"),
    )
    op.create_index("ix_saved_jobs_user_id", "saved_jobs", ["user_id"])
    op.create_index("ix_saved_jobs_job_id", "saved_jobs", ["job_id"])

    op.create_table(
        "searches",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("query", sa.String(500), nullable=False),
        sa.Column("location", sa.String(255), nullable=True),
        sa.Column("search_type", sa.String(50), nullable=False),
        sa.Column("created_at", _now(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", _now(), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_searches_user_id", "searches", ["user_id"])

    op.create_table(
        "activity_logs",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("activity_type", sa.String(100), nullable=False),
        sa.Column("metadata", sa.JSON(), nullable=True),
        sa.Column("created_at", _now(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", _now(), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_activity_logs_user_id", "activity_logs", ["user_id"])
    op.create_index("ix_activity_logs_activity_type", "activity_logs", ["activity_type"])

    op.create_table(
        "token_blacklist",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("jti", sa.String(255), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=True),
        sa.Column("expires_at", _now(), nullable=True),
        sa.Column("created_at", _now(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", _now(), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_token_blacklist_jti", "token_blacklist", ["jti"], unique=True)


def downgrade() -> None:
    for table in [
        "activity_logs",
        "searches",
        "saved_jobs",
        "roadmap_items",
        "roadmaps",
        "analysis_skills",
        "skills",
        "jobs",
        "analyses",
        "resumes",
        "user_profiles",
        "token_blacklist",
        "users",
    ]:
        op.drop_table(table)