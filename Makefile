# Thin delegation to bun scripts — see package.json. `make eval ARGS="..."`
# forwards flags to src/eval.ts (--suite, --runner, --eval, --variant, --judge,
# --dry-run, --all-models, --stats, --compose).
#
# There is no app server: `make eval` records, `make assemble` publishes
# public/data.json, and public/ is a static site any file server can host.

.PHONY: eval plan stats compose assemble serve check typecheck

# Anything under eval:* spends tokens on your own CLI credentials. Nothing
# else here does. `plan:<suite>` is the same matrix, printed and not run —
# type it first. Suite names come from suites.json, so a new suite is a
# `make eval:<name>` with no Makefile edit (escaped colons work on make 3.81).
eval\:%:
	bun src/eval.ts --suite $* $(ARGS)
	bun src/assemble.ts

plan\:%:
	bun src/eval.ts --suite $* --dry-run $(ARGS)

eval:
	bun src/eval.ts $(ARGS)
	bun src/assemble.ts

plan:
	bun src/eval.ts --dry-run $(ARGS)

# Both read what is on disk and spawn nothing. `stats` tabulates recorded
# metrics; `compose` prints the exact prompt a runner would be handed.
stats:
	bun src/eval.ts --stats $(ARGS)

compose:
	bun src/eval.ts --compose $(ARGS)

assemble:
	bun src/assemble.ts

# Any static file server works; this one needs nothing installed.
serve:
	python3 -m http.server --directory public 4321

# Fails if public/data.json is out of date with the recordings on disk.
check:
	bun src/assemble.ts
	git diff --exit-code -- public/data.json

typecheck:
	bunx tsc --noEmit
