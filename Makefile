TESTS = $(shell find test -name "*-test.js")

test:
	./node_modules/.bin/mocha --reporter list $(TESTS)

tdd:
	./node_modules/.bin/mocha -w $(TESTS)

.PHONY: test tdd