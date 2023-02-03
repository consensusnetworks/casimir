#!/bin/bash

start=0
end=1000000
interval=500000
bpr=2000

while [ $start -lt $end ]; do
  command="go run . --start $start --end $(($start + $interval)) --bpr $bpr --verbose"
  eval $command
  start=$(($start + $interval))
done