package main

// func TestNewEthereumCrawler(t *testing.T) {
// 	var err error
// 	crawler, err := NewEthereumCrawler()

// 	if err != nil {
// 		t.Error(err)
// 	}

// 	_, err = crawler.Client.BlockNumber(context.Background())

// 	if err != nil {
// 		t.Error(err)
// 	}
// }

// func TestEthereumCrawler_Introspect(t *testing.T) {
// 	crawler, err := NewEthereumCrawler()

// 	if err != nil {
// 		t.Error(err)
// 	}

// 	err = crawler.Introspect()

// 	if err != nil {
// 		t.Error(err)
// 	}

// 	if crawler.txBucket == "" {
// 		t.Error("introspection returned no tables, expected events table")
// 	}

// 	if crawler.walletBucket == "" {
// 		t.Error("introspection returned no tables, expected wallets table")
// 	}

// 	if crawler.stakingBucket == "" {
// 		t.Error("introspection returned no tables, expected staking action table")
// 	}
// }
