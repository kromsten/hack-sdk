ARCH = $(shell uname -m)

# if archictecture is "arm64" is "cosmwasm/workspace-optimizer-arm64:0.14.0" else "cosmwasm/workspace-optimizer:0.14.0"
OPTIMIZER := $(if $(filter arm64,$(ARCH)),cosmwasm/workspace-optimizer-arm64:0.14.0,cosmwasm/workspace-optimizer:0.14.0)


compile:
	@echo "Compiling Contract $(COMMIT)..."	
	@docker run --rm -v "$(CURRENT_DIR)":/code \
	--mount type=volume,source="$(BASE_DIR)_cache",target=/target \
	--mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
	cosmwasm/workspace-optimizer-arm64:0.14.0

