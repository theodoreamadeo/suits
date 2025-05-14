from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'a2b3c4d5e6f7'
down_revision = '444284a03da7'
branch_labels = None
depends_on = None

def upgrade():
    # 1. Create a new enum type with the correct values (all caps)
    op.execute("CREATE TYPE occasion_new AS ENUM ('CASUAL', 'ETHNIC', 'FORMAL', 'SPORTS', 'SMART_CASUAL', 'PARTY', 'TRAVEL');")
    # 2. Alter the column to use the new type
    op.execute("ALTER TABLE user_preferences ALTER COLUMN occasion TYPE occasion_new USING occasion::text::occasion_new;")
    # 3. Drop the old enum type
    op.execute("DROP TYPE occasion;")
    # 4. Rename the new type to the old name
    op.execute("ALTER TYPE occasion_new RENAME TO occasion;")

def downgrade():
    # If you want to support downgrade, you would need to recreate the old enum and convert back.
    op.execute("""
        CREATE TYPE occasion_old AS ENUM ('CASUAL', 'ETHNIC', 'FORMAL', 'SPORTS', 'SMART_CASUAL', 'PARTY', 'TRAVEL');
        ALTER TABLE user_preferences ALTER COLUMN occasion TYPE occasion_old USING occasion::text::occasion_old;
        DROP TYPE occasion;
        ALTER TYPE occasion_old RENAME TO occasion;
    """)