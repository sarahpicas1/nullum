# Nullum — Design Decisions


## Why the Name

Nullum comes from "nullum crimen sine lege" : the legal principle that there 
can be no crime without a law defining it. I flipped the logic: there should 
be no AI decision without a record defining it. That became the product in 
one sentence. It also sounds like a real company name, which matters for 
enterprise credibility.

## Why HCS Over Other Storage

I considered IPFS and Arweave. Both are fine for static files but neither 
gives you the ordered, timestamped, consensus-finalized sequence that HCS 
gives you. HCS sequence numbers are immutable : record #7 will always be 
record #7. That ordering matters for audit trails. 

## The AuditPulse Decision

The original design had a chat interface on the right panel. I removed it 
because the agent was just narrating data that was already 
on-chain. The AuditPulse pulls directly from the Hedera mirror node and shows 
the raw truth: these are the actual records, in sequence, with their real 
timestamps. That felt more true to what 
Nullum is supposed to be.

## The Verify Page

This was added late but it might be the most important feature. If Nullum 
is about making AI decisions verifiable, then anyone : a regulator, a lawyer, 
a customer, should be able to verify a specific audit record without needing 
an account, a wallet, or any special access. You type in an ID or a sequence 
number and get the full on-chain proof back. That is the product promise made 
real.

