#!/bin/zsh
# Fresh scratch DB from snapshot + restart dev server (scratchpad only, fake data)
source ~/.nvm/nvm.sh >/dev/null; nvm use system >/dev/null 2>&1
SP=${SCRATCH:?set SCRATCH to a scratch folder holding "pristine" (migrated + seeded with --persist-to)}
pkill -9 -f '[w]orkerd' 2>/dev/null; pkill -9 -f '[w]rangler' 2>/dev/null; sleep 2
rm -rf $SP/d3 && cp -R $SP/pristine $SP/d3
cd /Users/shubham.kumar/dental-clinic/apps/worker
nohup pnpm wr dev --env='' --ip 127.0.0.1 --port 8787 --persist-to $SP/d3 --test-scheduled > $SP/dev3.log 2>&1 < /dev/null &
disown
for i in {1..40}; do sleep 1; curl -s -o /dev/null http://localhost:8787/api/staff/health && break; done
curl -s -o /dev/null -w "ready %{http_code}\n" http://localhost:8787/api/staff/health
