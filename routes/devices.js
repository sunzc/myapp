var URL = require('url');
var express = require('express');
var sha1 = require('sha1');
var router = express.Router();

function Device() {
      this.serial;
      this.nonce;
      this.phash;
      this.sign;
}

var pre_device = new Device();
var next_device = new Device();


router.post('/getNonce', function(req, res, next) {
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

module.exports = router;
