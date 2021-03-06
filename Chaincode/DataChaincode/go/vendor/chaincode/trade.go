package chaincode

import (
    "encoding/json"
    "fmt"
    "github.com/hyperledger/fabric-contract-api-go/contractapi"
    "errors"
    "time"
)

// to be called by seller (only owner can sell their asset)
// creates a trade agreement if seller is owner
func (s *SmartContract) AgreeToSell(ctx contractapi.TransactionContextInterface, deviceId string) error {
    marketplaceCollection, err := getMarketplaceCollection()
    if err != nil {}

    deviceKey := generateKeyForDevice(deviceId)

    deviceAsBytes, err := ctx.GetStub().GetPrivateData(marketplaceCollection, deviceKey)
    if err != nil {
        return fmt.Errorf(err.Error())
    }

    var device DevicePublicDetails
    err = json.Unmarshal(deviceAsBytes, &device)
    if err != nil {return fmt.Errorf(err.Error())}

    ownerOrgId := device.Owner
    peerOrgId, err := ctx.GetClientIdentity().GetMSPID()
    if err != nil {return fmt.Errorf(err.Error())}

    if ownerOrgId != peerOrgId {
        return fmt.Errorf("Operation not permitted. Cannot sell someone else's asset")
    }
    return s.CreateTradeAgreement(ctx, deviceId)
}

// to be called by buyer
// creates a trade agreement
func (s *SmartContract) AgreeToBuy(ctx contractapi.TransactionContextInterface, deviceId string) error {
    return s.CreateTradeAgreement(ctx, deviceId)
}

// not to be called directly
func (s *SmartContract) CreateTradeAgreement(ctx contractapi.TransactionContextInterface, deviceId string) error {
    // 1. get transient map
    transientMap, err := ctx.GetStub().GetTransient()
    if err != nil { }

    // 2.1 get Trade agreement from transientMap
    tradeAgreementAsBytes := transientMap["_TradeAgreement"]
    if tradeAgreementAsBytes == nil {}

    // 2.2 unmarshal json to an object
    type TradeAgreementInputTransient struct {
        ID          string `json:"tradeId"`
        Price       int    `json:"tradePrice"`
        RevokeTime  time.Time   `json:"revoke_time"`
    }

    var tradeAgreementInput TradeAgreementInputTransient
    err = json.Unmarshal(tradeAgreementAsBytes, &tradeAgreementInput)
    if err != nil {}

    // 2.3 validate non empty fields

    //3. verify if clientMSP = peerMSP
    err = verifyClientOrgMatchesPeerOrg(ctx)
    if err != nil {}


    // ----------------- TradeAgreement ---------------
    tradeAgreementCollection, err := getTradeAgreementCollection(ctx)
    if err != nil {}

    // check if tradeAgreement is present in ORG's TradeAgreements collection
    tradeAgreementAsBytes, err = ctx.GetStub().GetPrivateData(tradeAgreementCollection, tradeAgreementInput.ID)
    if err != nil {}
    if tradeAgreementAsBytes != nil {}

    // create trade agreement
    tradeAgreement := TradeAgreement{
        ID: tradeAgreementInput.ID,
        DeviceId: deviceId, Price:
        tradeAgreementInput.Price,
        RevokeTime: tradeAgreementInput.RevokeTime,
    }

    // marshal the trade input
    tradeAgreementAsBytes, err = json.Marshal(tradeAgreement)

    if err!=nil {
        return err
    }
    // save trade agreement

    err = ctx.GetStub().PutPrivateData(tradeAgreementCollection, tradeAgreementInput.ID, tradeAgreementAsBytes)
    if err!=nil {
        return err
    }

    return nil
}

// to be called by buyer
// creates a bidder interest token on marketplace
func (s *SmartContract) CreateInterestToken (ctx contractapi.TransactionContextInterface) error {
    // 1. get transient map
    transientMap, err := ctx.GetStub().GetTransient()
    if err != nil { }

    // 2.1 get Device from transientMap
    interestTokenAsBytes := transientMap["_InterestToken"]
    if interestTokenAsBytes == nil {}

    // 2.2 unmarshal json to an object
    type interestTokenInputTransient struct {
        ID              string `json:"tradeId"`
        DeviceId string `json:"deviceId"`
        SellerId string `json:"seller_id"`
    }


    var interestTokenInput interestTokenInputTransient
    err = json.Unmarshal(interestTokenAsBytes, &interestTokenInput)
    if err != nil {}

    fmt.Println("interestTokenInput")
    fmt.Println(interestTokenInput)
    // 2.3 validate non empty fields

    //3. verify if clientMSP = peerMSP
    err = verifyClientOrgMatchesPeerOrg(ctx)
    if err != nil {}

    // --------------------------- create interest token ---------------------------------------------

    // bidderId = clientId
    bidderOrgId, err := ctx.GetClientIdentity().GetMSPID()
    if err != nil {}

    // DealsCollection -> where all the deals are stored
    tradeAgreementCollection, err := getTradeAgreementCollection(ctx) // required to generate private-data hash for the bidder's agreement collection:tradeID

    // create Interest token
    interestToken := InterestToken{
        ID: interestTokenInput.ID,
        DeviceId: interestTokenInput.DeviceId,
        BidderID: bidderOrgId,
        SellerId: interestTokenInput.SellerId,
        TradeAgreementCollection: tradeAgreementCollection,
    }

    // marshal interest token obj to bytes[] and store in Marketplace with Key
    interestTokenAsBytes, err = json.Marshal(interestToken)
    if err != nil {}

    key:= generateKeyForInterestToken(interestToken.ID)

    marketplaceCollection, err := getMarketplaceCollection()
    if err != nil {}

    err = ctx.GetStub().PutPrivateData(marketplaceCollection,  key, interestTokenAsBytes)
    if err != nil {}

    return nil
}

func (s *SmartContract) GetTradeAgreement(ctx contractapi.TransactionContextInterface, tradeId string) (TradeAgreement, error) {
    tradeAgreementCollection, err := getTradeAgreementCollection(ctx)
    if err != nil {}

    var tradeAgreementObject TradeAgreement;
    // check if tradeAgreement is present in ORG's TradeAgreements collection
    tradeAgreementAsBytes, err := ctx.GetStub().GetPrivateData(tradeAgreementCollection, tradeId)
    if err != nil {
        return tradeAgreementObject, errors.New("Trade does not exist")
    }

    err = json.Unmarshal(tradeAgreementAsBytes,&tradeAgreementObject)
    if err != nil {}

    return tradeAgreementObject, nil
}

func (s *SmartContract) GetInterestToken(ctx contractapi.TransactionContextInterface, tradeId string) (InterestToken, error) {
    marketplaceCollection, err := getMarketplaceCollection()
    if err != nil {}

    var interestTokenObject InterestToken;
    // check if tradeAgreement is present in ORG's TradeAgreements collection
    tradekey := generateKeyForInterestToken(tradeId)
    interestTokenAsBytes, errd := ctx.GetStub().GetPrivateData(marketplaceCollection, tradekey)
    if errd != nil {
        return interestTokenObject, errors.New("This Interest Token does not exist")
    }

    err = json.Unmarshal(interestTokenAsBytes,&interestTokenObject)
    if err != nil {}

    return interestTokenObject, nil
}


func (s *SmartContract) DeleteInterestToken(ctx contractapi.TransactionContextInterface, tradeId string) error {
    interestToken, err := s.GetInterestToken(ctx, tradeId)
    if err != nil {
        return err
    }
    marketplaceCollection, _ := getMarketplaceCollection()
    tradeKey := generateKeyForInterestToken(tradeId)

    clientId, _ := ctx.GetClientIdentity().GetMSPID()
    if  clientId == interestToken.SellerId || clientId == interestToken.BidderID {
        err = ctx.GetStub().DelPrivateData(marketplaceCollection, tradeKey)
    } else {
        return fmt.Errorf("Not allowed to delete this token")
    }
    return nil
}
