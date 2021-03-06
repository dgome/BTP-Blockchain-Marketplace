// eslint-disable-next-line strict
const {Gateway, Wallets} = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const config = require('../config/base');
const {readUserIdentity} = require("../users/service");
const {getContractForUser} = require("../users/service");
const {createNewuser} = require("../users/service");
const {network, contract} = require('../config/base');
const {time} = require('console');


function prettyJSONString(inputString) {
    return JSON.stringify(JSON.parse(inputString), null, 2);
}

exports.registerDevice = async (req, res) => {
    const assetDetails = {
        deviceId: req.body.deviceId,
        description: req.body.description,
        dataDescription: req.body.dataDescription,
        deviceSecret: req.body.deviceSecret
    };

    if (!(assetDetails.deviceId && assetDetails.description && assetDetails.dataDescription && assetDetails.deviceSecret)) {
        return res.status(400).send({
            status: 'invalid input',
            required_fields: 'deviceId, description, dataDescription, secret'
        });
    }
    console.log('\n--> Submit Transaction: RegisterDevice, Initialize Device Details');
    let createDeviceTxn = config.contract.createTransaction('CreateDevice');
    const transientMapData = Buffer.from(JSON.stringify(assetDetails));
    createDeviceTxn.setTransient({
        _Device: transientMapData
    });

    const result = await createDeviceTxn.submit();
    console.log('*** Result:');
    console.log(result.toString());

    console.log('\n--> Submit Transaction: GetDeviceDetails');
    const txResult = await config.contract.evaluateTransaction('GetDeviceDetails', assetDetails.deviceId);
    console.log(`*** Result: ${prettyJSONString(txResult.toString())}`);

    await createNewuser(assetDetails.deviceId)
    const deviceCertificate = JSON.parse(await readUserIdentity(assetDetails.deviceId))
    let retData = JSON.parse(prettyJSONString(txResult.toString()))
    retData["certificate"] = deviceCertificate
    res.status(200).send({status: 'Device Registered', data: retData });
};

exports.updateDevice = async (req, res) => {
    const assetDetails = {
        deviceId: req.body.deviceId,
        description: req.body.description,
        on_sale: req.body.on_sale
    };

    if (!(assetDetails.deviceId !== undefined && assetDetails.description !== undefined && assetDetails.on_sale !== undefined)) {
        return res.status(400).send({status: 'invalid input', required_fields: 'deviceId, description, on_sale'});
    }
    console.log('\n--> Submit Transaction: UpdateDeviceDetails, ');
    let createDeviceTxn = config.contract.createTransaction('UpdateDeviceDetails');
    const transientMapData = Buffer.from(JSON.stringify(assetDetails));
    createDeviceTxn.setTransient({
        _Device: transientMapData
    });

    const result = await createDeviceTxn.submit();
    console.log('*** Result:');
    console.log(result);

    console.log('\n--> Submit Transaction: GetDeviceDetails');
    const txResult = await config.contract.evaluateTransaction('GetDeviceDetails', assetDetails.deviceId);
    console.log(`*** Result: ${prettyJSONString(txResult.toString())}`);

    res.status(200).send({status: 'Device Updated', data: JSON.parse(prettyJSONString(txResult.toString()))});
};

exports.getDeviceDetails = async (req, res) => {

    const assetDetails = {
        deviceId: req.body.deviceId
    };

    if (!(assetDetails.deviceId !== undefined)) {
        return res.status(400).send({status: 'invalid input', required_fields: 'deviceId'});
    }

    console.log('\n--> Submit Transaction: GetDeviceDetails');
    const txResult = await config.contract.evaluateTransaction('GetDeviceDetails', assetDetails.deviceId);
    console.log(txResult.toString());
    console.log(`*** Result: ${prettyJSONString(txResult.toString())}`);

    res.status(200).send({status: 'Details Fetched', data: JSON.parse(prettyJSONString(txResult.toString()))});
};

exports.getDeviceLatestData = async (req, res) => {

    const assetDetails = {
        deviceId: req.body.deviceId
    };

    if (!(assetDetails.deviceId !== undefined)) {
        return res.status(400).send({status: 'invalid input', required_fields: 'deviceId'});
    }

    console.log('\n--> Submit Transaction: GetDeviceLatestData');
    const txResult = await config.contract.evaluateTransaction('GetDeviceLatestData', assetDetails.deviceId);
    console.log(txResult.toString());
    console.log(`*** Result: ${prettyJSONString(txResult.toString())}`);

    res.status(200).send({status: 'Data Fetched', data: JSON.parse(prettyJSONString(txResult.toString()))});
};

exports.getDeviceAllData = async (req, res) => {

    const assetDetails = {
        deviceId: req.body.deviceId
    };

    if (!(assetDetails.deviceId !== undefined)) {
        return res.status(400).send({status: 'invalid input', required_fields: 'deviceId'});
    }

    console.log('\n--> Submit Transaction: GetDeviceAllData');
    let txResult;
    try {
        txResult = await config.contract.evaluateTransaction('GetDeviceAllData', assetDetails.deviceId);
    }catch (error){
        console.log(error)
        return res.status(400).send({status:'Request Failed', data:error.toString()})
    }
    console.log(txResult.toString());
    console.log(`*** Result: ${prettyJSONString(txResult.toString())}`);

    return res.status(200).send({status: 'Data Fetched', data: JSON.parse(prettyJSONString(txResult.toString()))});
};

exports.getDeviceTradeAgreementDetails = async (req, res) => {

    const assetDetails = {
        tradeId: req.body.tradeId
    };

    if (!(assetDetails.tradeId !== undefined)) {
        return res.status(400).send({status: 'invalid input', required_fields: 'tradeId'});
    }

    console.log('\n--> Submit Transaction: GetDeviceDetails');
    const txResult = await config.contract.evaluateTransaction('GetTradeAgreement', assetDetails.tradeId);
    console.log(txResult.toString());
    console.log(`*** Result: ${prettyJSONString(txResult.toString())}`);

    res.status(200).send({status: 'Details Fetched', data: JSON.parse(prettyJSONString(txResult.toString()))});
};

exports.newData = async (req, res) => {
    const userCertificate = JSON.stringify(req.body.certificate)
    const dataDetails = {
        deviceId: req.body.deviceId,
        dataJSON: req.body.data
    };
    if (!(dataDetails.deviceId !== undefined && dataDetails.dataJSON !== undefined && userCertificate !== undefined)) {
        return res.status(400).send({status: 'invalid input', required_fields: 'deviceId, dataJSON, certificate'});
    }

    const deviceContract = await getContractForUser(dataDetails.deviceId, userCertificate)


    console.log('\n--> Submit Transaction: AddDeviceData, ');
    let addDataTxn = deviceContract.createTransaction('AddDeviceData');
    const transientMapData = Buffer.from(JSON.stringify(dataDetails));
    addDataTxn.setTransient({
        _Data: transientMapData
    });

    const result = await addDataTxn.submit();
    console.log('*** Result:');
    console.log(result);

    // Fetch Data

    console.log('\n--> Submit Transaction: GetDeviceLatestData');
    const txResult = await deviceContract.evaluateTransaction('GetDeviceLatestData', dataDetails.deviceId);
    console.log(txResult.toString());
    console.log(`*** Result: ${prettyJSONString(txResult.toString())}`);

    res.status(200).send({status: 'Data Added', data: JSON.parse(prettyJSONString(txResult.toString()))});

};

exports.deleteDevice = async (req, res) => {

    const assetDetails = {
        deviceId: req.body.deviceId
    };

    if (!(assetDetails.deviceId !== undefined)) {
        return res.status(400).send({status: 'invalid input', required_fields: 'deviceId'});
    }

    console.log('\n--> Submit Transaction: DeleteDevice');
    const txResult = await config.contract.evaluateTransaction('DeleteDevice', assetDetails.deviceId);
    console.log(txResult.toString());
    console.log(`*** Result: ${prettyJSONString(txResult.toString())}`);

    res.status(200).send({status: 'Device Deleted', data: JSON.parse(prettyJSONString(txResult.toString()))});
};

exports.agreeToSell = async (req, res) => {

    const tradeDetails = {
        deviceId: req.body.deviceId,
        tradeId: req.body.tradeId,
        tradePrice: req.body.tradePrice,
        revoke_time: new Date(req.body.revoke_time * 1000)
    };

    console.log(tradeDetails)
    if (!(tradeDetails.tradeId && tradeDetails.tradePrice && tradeDetails.deviceId)) {
        return res.status(400).send({
            status: 'invalid input',
            required_fields: 'deviceId, description, dataDescription, onSale'
        });
    }

    // console.log(config.curUser, config.gateway)
    console.log('\n--> Submit Transaction: AgreeToSell, ');
    let tradeTx = config.contract.createTransaction('AgreeToSell');
    const transientMapData = Buffer.from(JSON.stringify(tradeDetails));
    tradeTx.setTransient({
        _TradeAgreement: transientMapData
    });

    const result = await tradeTx.submit(tradeDetails.deviceId);
    console.log('*** Result:');
    console.log(result);


    console.log('\n--> Submit Transaction: GetTradeAgreement');
    const txResult = await config.contract.evaluateTransaction('GetTradeAgreement', tradeDetails.tradeId);
    console.log(`*** Result: ${prettyJSONString(txResult.toString())}`);
    res.status(200).send({status: 'Trade Agreement Created', data: JSON.parse(prettyJSONString(txResult.toString()))});
    // res.status(200).send()
};

exports.testEvent = async (req, res) => {


    const txResult = await config.contract.submitTransaction('Test', 'XYZ');
    console.log('test');
    console.log(txResult.toString());
    const listener = async (event) => {
        console.log('event');
        if (event.eventName === 'EVENT') {
            console.log('> INCOMING EVENT: ' + event.payload.toString());
        }
    };
    await config.contract.addContractListener(listener);

    res.status(200).send({data: 'TEST'});
};

exports.confirmSell = async (req, res) => {
    const tradeDetails = {
        deviceId: req.body.deviceId,
        tradeId: req.body.tradeId,
        bidderId: req.body.bidderId,
    };

    if (!(tradeDetails.tradeId && tradeDetails.bidderId && tradeDetails.deviceId)) {
        console.log("Invalid Input", tradeDetails)
        return res.status(400).send({status: 'invalid input', required_fields: 'deviceId, tradeId, bidderId'});
    }
    let receipt = null;
    const listener = async (event) => {
        if (event.eventName === 'RECEIPT-EVENT') {
            console.log('> INCOMING EVENT: ' + event.payload.toString());
            receipt = event.payload.toString();
        }
    };
    await config.contract.addContractListener(listener);

    console.log('\n --> VerifyingTradeAgreements, \n');
    const agreementDetails = await config.contract.evaluateTransaction('GetAndVerifyTradeAgreements', tradeDetails.tradeId);
    console.log('\nagreementDetails : ', agreementDetails.toString());


    if (agreementDetails) {
        await config.contract.submitTransaction('GenerateReceipt', agreementDetails);
        console.log('\nReceipt Tx submitted');

            let aclTx = config.contract.createTransaction('AddToACL');
            const resultACLTx = await aclTx.submit(tradeDetails.bidderId, tradeDetails.tradeId, tradeDetails.deviceId);
            console.log('*** Result:');
            console.log(resultACLTx.toString());

            // delete tradeagreement
            const delTx = await config.contract.submitTransaction('DeleteInterestToken', tradeDetails.tradeId)
            console.log("--> Deleted Interest Token \n")
            console.log(delTx)
        }


    res.status(200).send({
        status: 'Transaction Confirmed',
        result: 'Data will now be shared with bidder',
        receipt: receipt
    });
};


exports.getDeviceTradeStatus = async (req, res) => {
    const deviceId = req.body.deviceId
    var its = []; var acl = [];
    try {
        console.log("\nQuerying Interest Tokens for Device, ", deviceId)
        its = await config.contract.evaluateTransaction("QueryInterestTokensForDevice", deviceId)
        console.log(`\n*** Result: ${prettyJSONString(its.toString())}`);
    }
    catch (err) {
        console.error("ERROR>> No pending trades")
    }
    try {

        console.log("\nQuerying Interest Tokens for Device, ", deviceId)
        acl = await config.contract.evaluateTransaction("QueryACLForDevice", deviceId)

        console.log(`\n*** Result: ${prettyJSONString(acl.toString())}`);
    }
    catch (err) {
        console.error("ERROR>> No approved trades")
    }

    res.status(200).send({status: 'Trade status fetched', "pending" : its.toString(), "shared": acl.toString()})
}


exports.getSharedDeviceLatestData = async (req, res) => {

    const assetDetails = {
        deviceId: req.body.deviceId,
        ownerOrg: req.body.ownerId
    };

    if (!(assetDetails.deviceId !== undefined && assetDetails.ownerOrg !== undefined)) {
        return res.status(400).send({status: 'invalid input', required_fields: 'deviceId, ownerId'});
    }

    console.log('\n--> Submit Transaction: GetDeviceSharedLatestData');
    const txResult = await config.contract.evaluateTransaction('GetDeviceSharedLatestData', assetDetails.ownerOrg, assetDetails.deviceId);
    console.log(txResult.toString());
    console.log(`*** Result: ${prettyJSONString(txResult.toString())}`);

    res.status(200).send({status: 'Data Fetched', data: JSON.parse(prettyJSONString(txResult.toString()))});
};

exports.getSharedDeviceAllData = async (req, res) => {

    const assetDetails = {
        deviceId: req.body.deviceId,
        ownerOrg: req.body.ownerId
    };

    if (!(assetDetails.deviceId !== undefined && assetDetails.ownerOrg !== undefined)) {
        return res.status(400).send({status: 'invalid input', required_fields: 'deviceId, ownerId'});
    }


    console.log('\n--> Submit Transaction: GetDeviceSharedAllData');
    const txResult = await config.contract.evaluateTransaction('GetDeviceSharedAllData', assetDetails.ownerOrg, assetDetails.deviceId);
    console.log(txResult.toString());
    console.log(`*** Result: ${prettyJSONString(txResult.toString())}`);

    res.status(200).send({status: 'Data Fetched', data: JSON.parse(prettyJSONString(txResult.toString()))});
};

const getSharedDevicesListByOwnerHelperFunc = async (ownerId) => {
    if (!(ownerId !== undefined)) {
        return console.log({status: 'invalid input', required_fields: 'ownerId'});
    }

    console.log(`\n--> Submit Transaction: QuerySharedDevices ${ownerId}`);
    const txResult = await config.contract.evaluateTransaction('QuerySharedDevices', ownerId);
    console.log(txResult.toString());
    console.log(`*** Result: ${prettyJSONString(txResult.toString())}`);

    return JSON.parse(prettyJSONString(txResult.toString()));
};

exports.getSharedDevicesList = async (req, res) => {

    const ownersList = ['Org1MSP', 'Org2MSP'];

    const devicesList = [];
    for (let owner of ownersList) {
        if (owner === config.msp) {
            continue;
        }
        const orgDevices = await getSharedDevicesListByOwnerHelperFunc(owner);
        console.log('org devic es', orgDevices);
        for (let d of orgDevices) {
            devicesList.push(d);
        }
    }

    return res.status(200).send({status: 'Query Successful', data: devicesList});

};

exports.getOwnedDevices = async (req, res) => {

    console.log('\n--> Submit Transaction: QueryDevices');

    const txResult = await config.contract.evaluateTransaction('QueryDevices', `{"selector":{"owner":"${config.msp}", "_id":{"$regex":"DEVICE*"}}}`);
    console.log(txResult.toString());
    console.log(`*** Result: ${prettyJSONString(txResult.toString())}`);

    const devicesList = JSON.parse(txResult.toString());
    return res.status(200).send({status: 'Query Successful', data: devicesList});

};

exports.getTradeAgreementsForDevice = async (req, res) => {

    const assetDetails = {
        deviceId: req.body.deviceId,
    };

    if (!(assetDetails.deviceId !== undefined)) {
        return res.status(400).send({status: 'invalid input', required_fields: 'deviceId'});
    }


    console.log('\n--> Submit Transaction: QueryTradeAgreementsForDevice');
    const txResult = await config.contract.evaluateTransaction('QueryTradeAgreementsForDevice', assetDetails.deviceId);
    console.log(txResult.toString());
    if (!txResult.toString()) {
        res.status(200).send({status: 'Trade Agreements Fetched', data: []});
    }
    console.log(`*** Result: ${prettyJSONString(txResult.toString())}`);

    res.status(200).send({status: 'Trade Agreements Fetched', data: JSON.parse(prettyJSONString(txResult.toString()))});
};


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
