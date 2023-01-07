# Hardhat Multisig Wallet

This project demonstrates a full stack implementation of a multisig wallet using HardHat 

Build
==================

```
$ yarn install
```

Run 
==================
Run hardhat locally
```
$ yarn hardhat node
```

Deploy contract

```
$ yarn hardhat run scripts/01_deploy_multisig.js --network localhost
```

Run frontend

```
$ cd frontend && yarn dev
```

Use faucet to send eth to your testing address
```
$ npx hardhat --network localhost faucet 0x254e20ff2307fb065d95d3fd44d5b3720d8ae7f
```




"# multi-signature-wallet-task" 
