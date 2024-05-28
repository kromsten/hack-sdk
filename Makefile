NODE ?= "neutron-node"
COMPOSE ?= docker-compose

ARCH = $(shell uname -m)

# if archictecture is "arm64" is "cosmwasm/workspace-optimizer-arm64:0.14.0" else "cosmwasm/workspace-optimizer:0.14.0"
OPTIMIZER := $(if $(filter arm64,$(ARCH)),cosmwasm/workspace-optimizer-arm64:0.14.0,cosmwasm/workspace-optimizer:0.14.0)


compile:
	@docker run --rm -v "$(pwd)":/code \
  	--mount type=volume,source="$(basename "$(pwd)")_cache",target=/target \
	--mount type=volume,source="$(BASE_DIR)_cache",target=/target \
	--mount type=volume,source=registry_cache,target=/usr/local/cargo/registry  "$(OPTIMIZER)" 


updest:
	RUSTFLAGS='-C link-arg=-s' cargo build --release --target wasm32-unknown-unknown --lib
	mkdir -p ./artifacts
	cp ./target/wasm32-unknown-unknown/release/*.wasm ./artifacts
	bun test



build-neutron-node:
	git clone git@github.com:neutron-org/neutron.git
	cd neutron && make build-docker-image
	cd .. & rm -rf neutron


build-and-run:
	@$(COMPOSE) up --build

build-and-run-detached:
	@$(COMPOSE) up --build -d

run:
	@$(COMPOSE) up

run-detached:
	@$(COMPOSE) up -d


start:
	@if [ -z "$$(docker images -q $(NODE) 2>/dev/null)" ]; then \
		echo "Neutron node hasn't been built. Building:"; \
		make build-neutron-node; \
	fi
	make build-and-run;


start-detached:
	@if [ -z "$$(docker images -q $(NODE) 2>/dev/null)" ]; then \
		echo "Neutron node hasn't been built. Building:"; \
		make build-neutron-node; \
	else \
		make build-and-run-detached; \
	fi


start-nobuild:
	@if [ -z "$$(docker images -q $(NODE) 2>/dev/null)" ]; then \
		echo "Neutron node must be built first. Run 'make build-neutron-node' "; \
	else \
		make run; \
	fi


start-nobuild-detached:
	@if [ -z "$$(docker images -q $(NODE) 2>/dev/null)" ]; then \
		echo "Neutron node must be built first. Run 'make build-neutron-node' "; \
	else \
		make run-detached; \
	fi


stop: 
	@$(COMPOSE) down -t0 --remove-orphans --volumes
	rm configs/contract_config.json
	rm configs/ibc_config.json


stop-keep-volumes:
	@$(COMPOSE) down -t0 --remove-orphans
