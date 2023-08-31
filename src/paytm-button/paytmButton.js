import React, { useEffect, useState } from "react"
const PaytmChecksum = require('./paytmChecksum');
const https = require('https');

export function PaytmButton () {

    const [paymentData, setPaymentData] = useState({
        token: "", 
        order: "", 
        mid: "",
        amount: ""
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        initialize();
    }, []);

    const initialize = () => {
        let orderId = 'Order_'+new Date().getTime();

        // Sandbox Credentials
        let mid = "hVlFKQ64327462900849"; // Merchant ID
        let mkey = "YL#1ksEGBZdr#cCH"; // Merhcant Key
        var paytmParams = {};

        paytmParams.body = {
          "requestType"  : "Payment",
          "mid"      : mid,
          "websiteName"  : "WEBSTAGING",
          "orderId"    : orderId,
          "callbackUrl"  : "http://localhost:3001/",
          "txnAmount"   : {
            "value"   : 100,
            "currency" : "INR",
          },
          "userInfo"   : {
            "custId"  : '1001',
          }
        };

        PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), mkey).then(function(checksum){
            console.log(checksum + " checksum ");
            paytmParams.head = {
              "signature" : checksum
            };
            
            var post_data = JSON.stringify(paytmParams);
            console.log(post_data + "----> post_data ");

          var options = {
            /* for Staging */
            hostname: 'securegw-stage.paytm.in',

            /* for Production */
                // hostname: 'securegw.paytm.in',

            port: 443,
            path: `/theia/api/v1/initiateTransaction?mid=${mid}&orderId=${orderId}`,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': post_data.length
            }
          };

          var response = "";
          var post_req = https.request(options, function(post_res) {
            post_res.on('data', function (chunk) {
              response += chunk;
            });
                post_res.on('end', function(){
              console.log('Response: ', response);
                    setPaymentData({
                        ...paymentData,
                        token: JSON.parse(response).body.txnToken, 
                        order: orderId, 
                        mid: mid,
                        amount: 100
                    })
            });
          });

          post_req.write(post_data);
          post_req.end();
        });
    }

    const makePayment = () => {
      console.log("makePayment function called");
        setLoading(true);
        var config = {
            "root":"",
            "style": {
              "bodyBackgroundColor": "#fafafb",
              "bodyColor": "",
              "themeBackgroundColor": "#0FB8C9",
              "themeColor": "#ffffff",
              "headerBackgroundColor": "#284055",
              "headerColor": "#ffffff",
              "errorColor": "",
              "successColor": "",
              "card": {
                "padding": "",
                "backgroundColor": ""
              }
            },
            "data": {
              "orderId": paymentData.order,
              "token": paymentData.token,
              "tokenType": "TXN_TOKEN",
              "amount": paymentData.amount /* update amount */
            },
            "payMode": {
              "labels": {},
              "filter": {
                "exclude": []
              },
              "order": [
                  "CC",
                  "DC",
                  "NB",
                  "UPI",
                  "PPBL",
                  "PPI",
                  "BALANCE"
              ]
            },
            "website": "WEBSTAGING",
            "flow": "DEFAULT",
            "merchant": {
              "mid": paymentData.mid,
              "redirect": false
            },
            "handler": {
              "transactionStatus":function transactionStatus(paymentStatus){
                console.log("paymentStatus => ",paymentStatus);
                setLoading(false);
              },
              "notifyMerchant":function notifyMerchant(eventName,data){
                console.log("Closed");
                setLoading(false);
              }
            }
        };
        // console.log(makePayment + "--makePayment--")
      
        if (window.Paytm && window.Paytm.CheckoutJS) {
        // initialze configuration using init method
        window.Paytm.CheckoutJS.init(config).then(function onSuccess() {
            console.log('Before JS Checkout invoke');
            // after successfully update configuration invoke checkoutjs
            window.Paytm.CheckoutJS.invoke();
        }).catch(function onError(error) {
            console.log("Error => ", error);
        });
        }
        console.log(JSON.stringify(config)+ "config--------------")
    }

    return (
        <div>
            {
                loading ? (
                    <img src="https://c.tenor.com/I6kN-6X7nhAAAAAj/loading-buffering.gif" />
                ) : (
                    <button onClick={makePayment}>Pay Now</button>
                )
            }
        </div>
    )
}