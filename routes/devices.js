var URL = require('url');
var express = require('express');
var sha1 = require('sha1');
var router = express.Router();

function Device() {
      this.serial;
      this.nonce;
      this.phash;
      this.sign;

      this.verify;
      this.plain;
      this.rsasign;
}

var pre_device = new Device();
var next_device = new Device();


router.post('/getNonce', function(req, res, next) {//for browser test
    var body = req.body;
    if(body.serial != null)
        pre_device.serial = body.serial;
    pre_device.nonce = Math.ceil( Math.random() * 1000000000000 );

    console.log("device serial:" + pre_device.serial + "\ndevice nonce:" + pre_device.nonce);
    res.send({follow: {result : pre_device.nonce}});
});

router.post('/send', function(req, res, next) {
    console.log("\nsend is going...\n");
    var body = req.body;
    pre_device.serial = body.serial;
    pre_device.phash = body.phash;
    pre_device.nonce = Math.ceil( Math.random() * 1000000000000 );
    pre_device.sign = sha1(pre_device.serial + pre_device.nonce + pre_device.phash);
    //pre_device.sign = 0;
    console.log("pre_device serial:" + pre_device.serial
                + "\npre_device nonce:" + pre_device.nonce
                + "\npre_device phash:" + pre_device.phash
                + "\npre_device sign:" + pre_device.sign);
                
    res.send({follow: {result : pre_device.nonce}});
});

router.post('/check', function(req, res, next) {
    console.log("\ncheck is going...\n");
    var ret = 1;
    var body = req.body;
    next_device.serial = body.serial;
    next_device.nonce = body.nonce;
    next_device.phash = body.phash;
    if(pre_device.serial != next_device.serial)
        ret = 0;
    if(pre_device.nonce != next_device.nonce)
        ret = 0;
    if(pre_device.phash != next_device.phash)
        ret = 0;

    next_device.sign = sha1(next_device.serial + next_device.nonce + next_device.phash);

    console.log("next_device serial:" + next_device.serial
                + "\nnext_device nonce:" + next_device.nonce
                + "\nnext_device phash:" + next_device.phash
                + "\nnext_device sign:" + next_device.sign);

    if(! pre_device.sign === next_device.sign)
        ret = 0;
console.log("\nret \n", ret);
        res.send({follow: {result : ret}});
});


//RSA 
var NodeRSA = require('node-rsa');
var CryptoJS = require("crypto-js");
var constants = require('constants');

var encryptSchemes = [
        "pkcs1-nopadding",
        {
            scheme:'pkcs1',
            padding: constants.RSA_NO_PADDING,
            toString: function() {
                return 'pkcs1-nopadding';
            }
        }
        ];

var DEFAULT_ENCRYPTION_SCHEME = 'pkcs1_nopadding';

/*
//PKCS#1
var key = new NodeRSA('-----BEGIN RSA PRIVATE KEY-----\n'+
                      'MIICXAIBAAKBgQDfbwIYXPcNfgEiq+papBfTTVaVjr8aWlXMJ38yre3TjVGZlC5P\n'+
                      'dC1ncEHZDvIP48REvgtYhrdUabrC8uObZgVTpsJE0FiNMjtQskbkGr85uxzzcOyU\n'+
                      'CerRAo4xrhqP17tOHjWgD7EG+XQ7ILdZip5Ttdu9onpk5lYoogs3wjpROwIDAQAB\n'+
                      'AoGAPK9h2kwlrbxzgn8+/69h6TowMh67OOUgOHrhyVoEJllTuGrOyTW8v0N2HwY4\n'+
                      'KKisPh9/5WNxl7O/zgM6XpKvDy9g1IS/ADc2zEoPqfRMVWIkur22aGsEwGEEIC+n\n'+
                      'PE7RvW8KRbuAw8fycAS86nUFmf40SYf90tvniAsKIgdiaYECQQD0kgg7n4/aicwQ\n'+
                      '7QojBCDLibJMoQaqxQiiUKd+M20UMNKpAiRNW88rnagN4wX0fw5tc71aNHX+/3fO\n'+
                      'P+CkGSXZAkEA6eAZ++Cc1goPmxTCjederom/5giAWYzwcpWn0ThO+S9pYf2u/bk2\n'+
                      'TE9/wYddkYThIRTvMUVul1cYHF0LKKafMwJAXv0w8WdhyfFnLtPB8iOyURtkAtsv\n'+
                      '6bepSNGmnB+BKCxmRXote1ZDOp97HBmmwHVwtxYS3ywtACNc9uBccZ/K0QJBAOg8\n'+
                      'xtCdLGBGwVRn+wHafOSomMweKQXDtIi0H17coV9EO0s5E+mTX13Lm7tbZgi4gK3P\n'+
                      'Ee5FWhoiPCj+I7SMMI0CQBb1tJZXRhhU6G+E9/4tCePI2Fkp2QlPiF78D3J8zh/o\n'+
                      'ktcJXiVSmsE25MAcLsfWkE/UqxLyvbFwNKwdTuLDZYw=\n'+
                      '-----END RSA PRIVATE KEY-----');
*/

//PKCS#8
var key = new NodeRSA('-----BEGIN PRIVATE KEY-----\n'+
                      'MIICdQIBADANBgkqhkiG9w0BAQEFAASCAl8wggJbAgEAAoGBAKEPNyPD+taAXCfG\n'+
                      '6dsqnv/h7zD9SZfHaOTqoQSfr23o3ZHWL8uZzINPXGv9PYAcY6Jc1DlXxbiIJpp4\n'+
                      '1rCLtolpGG1XHW44f/ZTfvx+xwQRIQbxcOqWXQYJ8HX9OMojZqK1VLNc61GzyRiA\n'+
                      'ZTvx/tWYM2BciWTeB2GfOH66gRDLAgMBAAECgYBp4qTvoJKynuT3SbDJY/XwaEtm\n'+
                      'u768SF9P0GlXrtwYuDWjAVue0VhBI9WxMWZTaVafkcP8hxX4QZqPh84td0zjcq3j\n'+
                      'DLOegAFJkIorGzq5FyK7ydBoU1TLjFV459c8dTZMTu+LgsOTD11/V/Jr4NJxIudo\n'+
                      'MBQ3c4cHmOoYv4uzkQJBANR+7Fc3e6oZgqTOesqPSPqljbsdF9E4x4eDFuOecCkJ\n'+
                      'DvVLOOoAzvtHfAiUp+H3fk4hXRpALiNBEHiIdhIuX2UCQQDCCHiPHFd4gC58yyCM\n'+
                      '6Leqkmoa+6YpfRb3oxykLBXcWx7DtbX+ayKy5OQmnkEG+MW8XB8wAdiUl0/tb6cQ\n'+
                      'FaRvAkBhvP94Hk0DMDinFVHlWYJ3xy4pongSA8vCyMj+aSGtvjzjFnZXK4gIjBjA\n'+
                      '2Z9ekDfIOBBawqp2DLdGuX2VXz8BAkByMuIh+KBSv76cnEDwLhfLQJlKgEnvqTvX\n'+
                      'TB0TUw8avlaBAXW34/5sI+NUB1hmbgyTK/T/IFcEPXpBWLGO+e3pAkAGWLpnH0Zh\n'+
                      'Fae7oAqkMAd3xCNY6ec180tAe57hZ6kS+SYLKwb4gGzYaCxc22vMtYksXHtUeamo\n'+
                      '1NMLzI2ZfUoX\n'+
                      '-----END PRIVATE KEY-----');

/*
key.importKey({
    n: new Buffer('0086fa9ba066685845fc03833a9699c8baefb53cfbf19052a7f10f1eaa30488cec1ceb752bdff2df9fad6c64b3498956e7dbab4035b4823c99a44cc57088a23783', 'hex'),
    e: 65537,
    d: new Buffer('5d2f0dd982596ef781affb1cab73a77c46985c6da2aafc252cea3f4546e80f40c0e247d7d9467750ea1321cc5aa638871b3ed96d19dcc124916b0bcb296f35e1', 'hex'),
    p: new Buffer('00c59419db615e56b9805cc45673a32d278917534804171edcf925ab1df203927f', 'hex'),
    q: new Buffer('00aee3f86b66087abc069b8b1736e38ad6af624f7ea80e70b95f4ff2bf77cd90fd', 'hex'),
    dmp1: new Buffer('008112f5a969fcb56f4e3a4c51a60dcdebec157ee4a7376b843487b53844e8ac85', 'hex'),
    dmq1: new Buffer('1a7370470e0f8a4095df40922a430fe498720e03e1f70d257c3ce34202249d21', 'hex'),
    coeff: new Buffer('00b399675e5e81506b729a777cc03026f0b2119853dfc5eb124610c0ab82999e45', 'hex')
}, 'components');

*/

router.get('/getRSA', function(req, res, next) {//for browser test

    console.log("\ncheck RSA is going...\n");

    var ret = 1;
    //var input = next_device.serial + next_device.nonce + next_device.phash;
    var input = "9a1dbecd10000000847372483";
    console.log("\ninput: " + input);

    var rsa="SfevO7X7J6hbrkAJyYICzFpYp7mD4hnQ9fYRs5XsOgagLpdXeBOJk2amB/7cxLQGs19rsoonw0IK43HYcmD5NzC0Yqrftm3dGgGf60ZGbgQwz7lQ1sBtvzc992u38OfMiB9qKoVztX8pq47Ivs28EISpT1qCMAb78vnYp9vYuQM=";

    var cipher = key.decrypt(rsa,'binary','base64');
    console.log("\ncipher: " + cipher);

    res.send({follow: {result : cipher}});
});



router.post('/getRSA', function(req, res, next) {
    console.log("\ncheck RSA is going...\n");

    var ret = 1;
    var body = req.body;
    next_device.serial = body.serial;
    next_device.nonce = body.nonce;
    next_device.phash = body.phash;
    //next_device.plain = body.plain;
    //next_device.rsasign = body.rsasign;

    var hash = sha1(next_device.serial + next_device.nonce + next_device.phash);

    //console.log("\ninput: " + input);
    //console.log("\nrsasign: " + body.rsasign);

    var plain = key.decryptPublic(body.rsasign,'binary','base64');
    console.log("\nsign: " + pre_device.sign);
    console.log("\nplain: " + plain);
    if(hash != plain)
        ret = 0;
    if(pre_device.serial != next_device.serial)
        ret = 0;
    if(pre_device.nonce != next_device.nonce)
        ret = 0;
    if(pre_device.phash != next_device.phash)
        ret = 0;

    res.send({follow: {result : ret}});
});

function strToHexCharCode(str) {
　　if(str === "")
　　　　return "";
　　var hexCharCode = [];
　　hexCharCode.push("0x"); 
　　for(var i = 0; i < str.length; i++) {
　　　　hexCharCode.push((str.charCodeAt(i)).toString(16));
　　}
　　return hexCharCode.join("");
}

module.exports = router;
