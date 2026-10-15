#!/bin/sh
# Writes .env.local from the running local Supabase stack (pnpm db:start first).
set -e
eval "$(pnpm exec supabase status -o env 2>/dev/null | grep -E '^(API_URL|PUBLISHABLE_KEY|SECRET_KEY)=')"
cat > .env.local <<EOF
NEXT_PUBLIC_SUPABASE_URL=$API_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$PUBLISHABLE_KEY
SUPABASE_SECRET_KEY=$SECRET_KEY
APP_URL=http://localhost:3100
EOF
echo "Wrote .env.local for $API_URL"
