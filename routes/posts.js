var router = require("express").Router();
var follow_res = 1;
router.post("/post/follow", function(req, res, next) {
	var body = req.body;
	var follow_id = body.follow;

	follow_res += 1;

	console.log("route: /follow, receive follow request! follow_id:" + follow_id.toString());
	res.send({follow: {result : follow_res}});
});

module.exports = router;
