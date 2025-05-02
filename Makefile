.PHONY: network deploy dapp test

all: help

help:
	@echo "Available targets:"
	@echo "  network   - Start local blockchain network (Anvil) in current terminal"
	@echo "  deploy    - Deploy smart contract to the local blockchain"
	@echo "  dapp      - Start frontend development server"
	@echo "  test      - Run smart contract tests"

# Start local blockchain network (Anvil), save keys, and keep running
network:
	@echo "Starting local blockchain network in the background..."
	@cd smart-contracts && \
		forge install && \
		anvil --mnemonic "test test test test test test test test test test test junk" \

# Deploy smart contract to local network
deploy:
	@echo "Deploying smart contract to local network..."
	cd smart-contracts && \
		forge script script/DeployBDAERC20.s.sol --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://127.0.0.1:8545 --broadcast | tee ./deploy.log && \
		grep -A 1 '== Logs ==' ./deploy.log | tail -n 1 | awk '{print "VITE_CONTRACT_ADDRESS="$$1}' > ../frontend/.env

# Start frontend development server
dapp:
	@echo "Starting frontend development server..."
	cd frontend && npm i && npm run dev

# Run smart contract tests
test:
	@echo "Running smart contract tests..."
	cd smart-contracts && forge test