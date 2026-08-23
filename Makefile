# Thin delegation to the three steps — see README. `run` and `judge` spend
# tokens on your own CLI credentials; everything else is offline.

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
