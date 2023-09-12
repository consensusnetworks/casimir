
Install dependencies

```bash
go mod tidy
```

Build

```bash
make build
```

Run the crawler

Stream

```bash
./build/crawler stream
```


Crawl

```bash
./build/crawler crawl
```


## Notes: 

events | actions | wallets

events -> wallet
		-> action 


block -> 1 block event
	  -> n # of tx events
	  -> logs
	  	contract event deposit -> events
	  		get user stake  - agg 
	  	rewards_all_time = getUserStake() -  total deposited (all time; aggregate of StakeDeposited for that user across all blocks  


type Action struct {
	<!-- Chain          Chain      `json:"chain"` -->
	<!-- Network        Network    `json:"network"` -->
	<!-- Type           EventType  `json:"type"` -->
	<!-- Action         ActionType `json:"action"` -->
	<!-- Address        string     `json:"address"` -->
	Amount         string     `json:"amount"` # deduce based on ActionType (e.g. for StakeDepoisted get deposited amount)
	Balance        string     `json:"balance"`# call getUserStake()
	Gas            string     `json:"gas"`
	Hash           string     `json:"hash"`
	Price          string     `json:"price"`
	ReceivedAt     uint64     `json:"received_at"`
	RewardsAllTime string     `json:"rewards_all_time"` # getUserStake(addr: string) - (sum of stake deposited) - (sum of withdrawal)
	StakingFees    string     `json:"staking_fees"` ``
}

### Gas:

Contract events: 
	- StakeDeposit
	- StakeWithdrawal
	- StakeRebalance

- Gas (Action event) comes from regular tx where the contract event belongs


### RewardsAllTime:

- RewardsAllTime = getUserStake(addr) - [(sum of stake deposited - (fee * # of events)] - (sum of withdrawal)
- stake deposited value comes from staking action event
select * from actions where action = 'staking_action' and address = <addr>;

### StakingFees

event -> type
action -> StakeDeposited
select * from table where type = 'contract' and action = 'StakeDeposited'


### Events

chain: string
network: string
provider: string
event: string (block, tx, contract)
action: string (StakeDeposited, etc)
height: string 
block_hash: string 
transaction_hash: string
received_at: timestamp
sender: string
recipient: string
sender_balance: string
amount: string
price: string
gas_fee: string
+ count: int
+ pool_id: int
+ new_owner: string
+ operator_id: string


### Actions
chain: string
network: string
provider: string
height: string 
event: string (wallet, contract)
action: string (StakeDeposited, etc)
address :string
amount: string
balance: string
Gas
Hash
Price
ReceivedAt
RewardsAllTime
StakingFees









