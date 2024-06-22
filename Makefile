.PHONY: update-version build-docker

# Increment the npm package version by a minor
update-version:
	npm version minor

# Build the Docker image with the current version tag
build-docker:
	docker build -t energy:$(shell cat package.json | grep version | cut -d '"' -f 4) .

# Build the entire pipeline
pipeline: update-version build-docker

