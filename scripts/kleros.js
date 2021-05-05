const IpfsHttpClient = require('ipfs-http-client')
const ipfs = IpfsHttpClient('http://127.0.0.1:5002')
const { globSource } = IpfsHttpClient
const fs = require('fs');

//https://etherscan.io/address/0x0d67440946949FE293B45c52eFD8A9b3d51e2522#code
const contract_ABI = [{"constant":true,"inputs":[],"name":"arbitratorExtraData","outputs":[{"name":"","type":"bytes"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"disputeIDtoTransactionID","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_disputeID","type":"uint256"},{"name":"_ruling","type":"uint256"}],"name":"rule","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_transactionID","type":"uint256"}],"name":"timeOutByReceiver","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"arbitrator","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_transactionID","type":"uint256"}],"name":"payArbitrationFeeByReceiver","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"_transactionID","type":"uint256"}],"name":"payArbitrationFeeBySender","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"_transactionID","type":"uint256"}],"name":"appeal","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"transactions","outputs":[{"name":"sender","type":"address"},{"name":"receiver","type":"address"},{"name":"amount","type":"uint256"},{"name":"timeoutPayment","type":"uint256"},{"name":"disputeId","type":"uint256"},{"name":"senderFee","type":"uint256"},{"name":"receiverFee","type":"uint256"},{"name":"lastInteraction","type":"uint256"},{"name":"status","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getCountTransactions","outputs":[{"name":"countTransactions","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_transactionID","type":"uint256"},{"name":"_evidence","type":"string"}],"name":"submitEvidence","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"feeTimeout","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_timeoutPayment","type":"uint256"},{"name":"_receiver","type":"address"},{"name":"_metaEvidence","type":"string"}],"name":"createTransaction","outputs":[{"name":"transactionID","type":"uint256"}],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"_transactionID","type":"uint256"}],"name":"executeTransaction","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_transactionID","type":"uint256"},{"name":"_amount","type":"uint256"}],"name":"pay","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_transactionID","type":"uint256"}],"name":"timeOutBySender","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_address","type":"address"}],"name":"getTransactionIDsByAddress","outputs":[{"name":"transactionIDs","type":"uint256[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_transactionID","type":"uint256"},{"name":"_amountReimbursed","type":"uint256"}],"name":"reimburse","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_arbitrator","type":"address"},{"name":"_arbitratorExtraData","type":"bytes"},{"name":"_feeTimeout","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_metaEvidenceID","type":"uint256"},{"indexed":false,"name":"_evidence","type":"string"}],"name":"MetaEvidence","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_transactionID","type":"uint256"},{"indexed":false,"name":"_amount","type":"uint256"},{"indexed":false,"name":"_party","type":"address"}],"name":"Payment","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_transactionID","type":"uint256"},{"indexed":false,"name":"_party","type":"uint8"}],"name":"HasToPayFee","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_arbitrator","type":"address"},{"indexed":true,"name":"_evidenceGroupID","type":"uint256"},{"indexed":true,"name":"_party","type":"address"},{"indexed":false,"name":"_evidence","type":"string"}],"name":"Evidence","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_arbitrator","type":"address"},{"indexed":true,"name":"_disputeID","type":"uint256"},{"indexed":false,"name":"_metaEvidenceID","type":"uint256"},{"indexed":false,"name":"_evidenceGroupID","type":"uint256"}],"name":"Dispute","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_arbitrator","type":"address"},{"indexed":true,"name":"_disputeID","type":"uint256"},{"indexed":false,"name":"_ruling","type":"uint256"}],"name":"Ruling","type":"event"}]
const contract_address = "0x0d67440946949FE293B45c52eFD8A9b3d51e2522"
const contract = new web3.eth.Contract(contract_ABI, contract_address)

module.exports = async function(callback) {
  try {
    const [sender, receiver] = await web3.eth.getAccounts()

    console.log('Sender: Uploading deal terms on IPFS...')
    let upload = await ipfs.add(globSource(`${__dirname}/evidences/deal_terms.txt`))
    const termsExtractedHash = upload.cid.toString()
    const termsEvidenceLink = 'https://ipfs.io/ipfs/' + termsExtractedHash

    console.log('Sender: Securing the deal...')
    let result = await contract.methods.createTransaction(
      '0', //deal realization time = 0 for testing purposes
      receiver, //e.g. Freelancer
      termsEvidenceLink
    ).send({
      from: sender, //e.g. Principal
      gasLimit: '5000000',
      value: web3.utils.toWei('1') //Salary
    })

    const dealId = result.events.MetaEvidence.returnValues[0].toString()

    console.log('Sender: Initiating dispute...')
    await contract.methods.payArbitrationFeeBySender(
      dealId
    ).send({
      from: sender,
      gasLimit: '5000000',
      value: web3.utils.toWei('.1') //arbitration fee, goes back to winner
    })

    console.log('Sender: Uploading evidence to IPFS...')
    upload = await ipfs.add(globSource(`${__dirname}/evidences/sender_evidence.txt`))
    const senderEvidenceHash = upload.cid.toString()
    const senderEvidenceLink = 'https://ipfs.io/ipfs/' + senderEvidenceHash

    console.log('Sender: Submitting evidence...')
    await contract.methods.submitEvidence(
      dealId,
      senderEvidenceLink
    ).send({
      from: sender,
      gasLimit: '5000000'
    })

    console.log('\nReceiver: Accepting&Creating dispute...')
    result = await contract.methods.payArbitrationFeeByReceiver(
      dealId
    ).send({
      from: receiver,
      gasLimit: '5000000',
      value: web3.utils.toWei('.1') //arbitration fee, goes back to winner
    })

    const disputeContract = result.events.Dispute.returnValues[0]
    const disputeId = result.events.Dispute.returnValues[1]

    console.log('Receiver: Uploading evidence to IPFS by receiver...')
    upload = await ipfs.add(globSource(`${__dirname}/evidences/receiver_evidence.txt`))
    const receiverEvidenceHash = upload.cid.toString()
    const receiverEvidenceLink = 'https://ipfs.io/ipfs/' + receiverEvidenceHash

    console.log('Receiver: Submitting evidence by receiver...')
    await contract.methods.submitEvidence(
      dealId,
      receiverEvidenceLink
    ).send({
      from: receiver,
      gasLimit: '5000000'
    })
    
    console.log('\nSummarize:')
    console.log(' * Deal ID: ', dealId)
    console.log(' * Dispute ID: ', disputeId)
    console.log(' * Dispute contract: ', disputeContract)
  } catch(error) {
    console.log(error)
  }
  callback()
}