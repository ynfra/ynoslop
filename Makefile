.PHONY: run judge collect results typecheck

results:
	bin/results $(ARGS)

run:
	bin/run $(ARGS)

judge:
	bin/judge $(ARGS)

collect:
	bin/collect $(ARGS)

typecheck:
	bunx tsc --noEmit
