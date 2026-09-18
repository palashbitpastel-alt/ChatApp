#!/bin/sh
# Container entrypoint: sync DB schema, seed, then run the Next.js + Socket.io server.
# Kept as a script so it works whether the platform runs the start command
# through a shell or not (Railway runs custom start commands in exec form).
set -e

# --skip-generate: the Prisma client was generated at build time and node_modules isn't writable here.
./node_modules/.bin/prisma db push --skip-generate
./node_modules/.bin/tsx prisma/seed.ts

# exec so the server receives SIGTERM directly on redeploy.
exec ./node_modules/.bin/tsx server.ts
