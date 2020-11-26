const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const config = require('../config/base')


function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}

exports.registerDevice = async (req, res) => {
    const assetDetails = {
        'deviceId': req.body.deviceId,
        'description': req.body.description,
        'dataDescription': req.body.dataDescription,
        'deviceSecret': req.body.deviceSecret
    }

    if (!(assetDetails.deviceId && assetDetails.description && assetDetails.dataDescription && assetDetails.deviceSecret)) {
        return res.status(400).send({"status":"invalid input", "required_fields":"deviceId, description, dataDescription, secret"})
    }
    console.log('\n--> Submit Transaction: RegisterDevice, Initialize Device Details');
    let createDeviceTxn = config.contract.createTransaction('CreateDevice')
    const transientMapData = Buffer.from(JSON.stringify(assetDetails));
    createDeviceTxn.setTransient({
        _Device: transientMapData
    });

    const result = await createDeviceTxn.submit();
    console.log('*** Result:');
    console.log(result.toString())

    console.log('\n--> Submit Transaction: GetDeviceDetails');
    const txResult = await config.contract.evaluateTransaction('GetDeviceDetails', assetDetails.deviceId);
    console.log(`*** Result: ${prettyJSONString(txResult.toString())}`);

    res.status(200).send({"status":"Device Registered", "data": JSON.parse(prettyJSONString(txResult.toString()))})
}

exports.updateDevice = async (req, res) => {
    const assetDetails = {
        'deviceId': req.body.deviceId,
        'description': req.body.description,
        'on_sale': req.body.on_sale
    }
    //
    if (!(assetDetails.deviceId !== undefined && assetDetails.description !== undefined && assetDetails.on_sale !== undefined)) {
        return res.status(400).send({"status":"invalid input", "required_fields":"deviceId, description, on_sale"})
    }
    console.log('\n--> Submit Transaction: UpdateDeviceDetails, ');
    let createDeviceTxn = config.contract.createTransaction('UpdateDeviceDetails')
    const transientMapData = Buffer.from(JSON.stringify(assetDetails));
    createDeviceTxn.setTransient({
        _Device: transientMapData
    });

    const result = await createDeviceTxn.submit();
    console.log('*** Result:');
    console.log(result)

    console.log('\n--> Submit Transaction: GetDeviceDetails');
    const txResult = await config.contract.evaluateTransaction('GetDeviceDetails', assetDetails.deviceId);
    console.log(`*** Result: ${prettyJSONString(txResult.toString())}`);

    res.status(200).send({"status":"Device Updated", "data": JSON.parse(prettyJSONString(txResult.toString()))})
}

exports.getDeviceDetails = async (req, res) => {

    const assetDetails = {
        'deviceId': req.body.deviceId
    }

    if (!(assetDetails.deviceId !== undefined)) {
        return res.status(400).send({"status":"invalid input", "required_fields":"deviceId"})
    }

    console.log('\n--> Submit Transaction: GetDeviceDetails');
    const txResult = await config.contract.evaluateTransaction('GetDeviceDetails', assetDetails.deviceId);
    console.log(txResult.toString())
    console.log(`*** Result: ${prettyJSONString(txResult.toString())}`);

    res.status(200).send({"status":"Details Fetched", "data": JSON.parse(prettyJSONString(txResult.toString()))})
}

exports.getDeviceLatestData = async (req, res) => {

    const assetDetails = {
        'deviceId': req.body.deviceId
    }

    if (!(assetDetails.deviceId !== undefined)) {
        return res.status(400).send({"status":"invalid input", "required_fields":"deviceId"})
    }

    console.log('\n--> Submit Transaction: GetDeviceLatestData');
    const txResult = await config.contract.evaluateTransaction('GetDeviceLatestData', assetDetails.deviceId);
    console.log(txResult.toString())
    console.log(`*** Result: ${prettyJSONString(txResult.toString())}`);

    res.status(200).send({"status":"Data Fetched", "data": JSON.parse(prettyJSONString(txResult.toString()))})
}

exports.getDeviceAllData = async (req, res) => {

    const assetDetails = {
        'deviceId': req.body.deviceId
    }

    if (!(assetDetails.deviceId !== undefined)) {
        return res.status(400).send({"status":"invalid input", "required_fields":"deviceId"})
    }

    console.log('\n--> Submit Transaction: GetDeviceAllData');
    const txResult = await config.contract.evaluateTransaction('GetDeviceAllData', assetDetails.deviceId);
    console.log(txResult.toString())
    console.log(`*** Result: ${prettyJSONString(txResult.toString())}`);

    res.status(200).send({"status":"Data Fetched", "data": JSON.parse(prettyJSONString(txResult.toString()))})
}


exports.newData = async (req, res) => {
    const dataDetails = {
        'deviceId': req.body.deviceId,
        'dataJSON': req.body.data
    }

    if (!(dataDetails.deviceId !== undefined && dataDetails.dataJSON !== undefined)) {
        return res.status(400).send({"status":"invalid input", "required_fields":"deviceId, dataJSON"})
    }

    console.log('\n--> Submit Transaction: AddDeviceData, ');
    let addDataTxn = config.contract.createTransaction('AddDeviceData')
    const transientMapData = Buffer.from(JSON.stringify(dataDetails));
    addDataTxn.setTransient({
        _Data: transientMapData
    });

    const result = await addDataTxn.submit();
    console.log('*** Result:');
    console.log(result)

    // Fetch Data

    console.log('\n--> Submit Transaction: GetDeviceLatestData');
    const txResult = await config.contract.evaluateTransaction('GetDeviceLatestData', dataDetails.deviceId);
    console.log(txResult.toString())
    console.log(`*** Result: ${prettyJSONString(txResult.toString())}`);

    res.status(200).send({"status":"Data Added", "data": JSON.parse(prettyJSONString(txResult.toString()))})

}

exports.deleteDevice = async (req, res) => {

    const assetDetails = {
        'deviceId': req.body.deviceId
    }

    if (!(assetDetails.deviceId !== undefined)) {
        return res.status(400).send({"status":"invalid input", "required_fields":"deviceId"})
    }

    console.log('\n--> Submit Transaction: DeleteDevice');
    const txResult = await config.contract.evaluateTransaction('DeleteDevice', assetDetails.deviceId);
    console.log(txResult.toString())
    console.log(`*** Result: ${prettyJSONString(txResult.toString())}`);

    res.status(200).send({"status":"Device Deleted", "data": JSON.parse(prettyJSONString(txResult.toString()))})
}

exports.agreeToSell = async (req, res) => {
    const tradeDetails = {
        'deviceId': req.body.deviceId,
        'tradeId': req.body.tradeId,
        'tradePrice': req.body.tradePrice,
    }

    if (!(tradeDetails.tradeId && tradeDetails.tradePrice && tradeDetails.deviceId)) {
        return res.status(400).send({"status":"invalid input", "required_fields":"deviceId, description, dataDescription, onSale"})
    }

    // console.log(config.curUser, config.gateway)
    console.log('\n--> Submit Transaction: AgreeToSell, ');
    let tradeTx = config.contract.createTransaction('AgreeToSell')
    const transientMapData = Buffer.from(JSON.stringify(tradeDetails));
    tradeTx.setTransient({
        _TradeAgreement: transientMapData
    });

    const result = await tradeTx.submit(tradeDetails.deviceId);
    console.log('*** Result:');
    console.log(result)


    console.log('\n--> Submit Transaction: GetTradeAgreement');
    const txResult = await config.contract.evaluateTransaction('GetTradeAgreement', tradeDetails.tradeId);
    console.log(`*** Result: ${prettyJSONString(txResult.toString())}`);

    res.status(200).send({"status":"Trade Agreement Created", "data": JSON.parse(prettyJSONString(txResult.toString()))})


}

exports.confirmSell = async (req, res) => {
    const tradeDetails = {
        'deviceId': req.body.deviceId,
        'tradeId': req.body.tradeId,
        'bidderId': req.body.bidderId,
    }

    if (!(tradeDetails.tradeId && tradeDetails.bidderId && tradeDetails.deviceId)) {
        return res.status(400).send({"status":"invalid input", "required_fields":"deviceId, tradeId, bidderId"})
    }

    console.log('\n--> Submit Transaction: InvokeDataDistribution, ');
    const tx1Result = await config.contract.evaluateTransaction('InvokeDataDistribution', tradeDetails.tradeId);
    console.log(`*** Verify Trade Result: ${tx1Result.toString()}`);

    
    let aclTx = config.contract.createTransaction('AddToACL')
    const resultACLTx = await aclTx.submit(tradeDetails.bidderId, tradeDetails.tradeId, tradeDetails.deviceId);
    console.log('*** Result:');
    console.log(resultACLTx)

    res.status(200).send({"status":"Transaction Confirmed", "result":"Data will now be shared with bidder"})
}

/*
exports.updateDeviceData = async (req, res) => {
    const data = req.body.data
    const deviceID = req.body.deviceID

    console.log('\n--> Submit Transaction: Update Data');
    await config.contract.submitTransaction('UpdateData', data, deviceID);
    console.log('*** Result: committed');
    
    result = await config.contract.evaluateTransaction('GetDeviceData', deviceID);
    console.log(`*** Result: ${prettyJSONString(result.toString())}`);

    res.status(200).send({"status":"Data Updated", "data": JSON.parse(prettyJSONString(result.toString()))})
}

exports.deleteDeviceData = async (req, res) => {
    const deviceID = req.body.deviceID
    console.log('\n--> Submit Transaction: DeleteDevice');
    await config.contract.submitTransaction('DeleteDevice', deviceID);
    console.log('*** Result: committed');
    res.status(200).send({"status":"Device Deleted"})
}

exports.getDeviceData = async (req, res) => {
    
    const deviceID = req.body.deviceID
    console.log('\n--> Submit Transaction: Get Data');
    result = await config.contract.evaluateTransaction('GetDeviceData', deviceID);
    console.log(`*** Result: ${prettyJSONString(result.toString())}`);
            
    res.status(200).send({"status":"Device Registered", "data": JSON.parse(prettyJSONString(result.toString()))})
}

exports.getAllDevices = async (req, res) => {
    console.log('\n--> Submit Transaction: GetAllDevices');
    result = await config.contract.evaluateTransaction('GetAllDevices');
    console.log(`*** Result: ${prettyJSONString(result.toString())}`);
    res.status(200).send({"status":"All Devices", "data": JSON.parse(prettyJSONString(result.toString()))})
}


exports.getHistoricalValues = async (req, res) => {
    const deviceID = req.body.deviceID
    console.log('\n--> Submit Transaction: GetHistoricalValues');
    result = await config.contract.evaluateTransaction('GetHistory', deviceID);
    console.log(result)
    res.status(200).send({"status":"History", "data": JSON.parse(prettyJSONString(result.toString()))})
}

*/
