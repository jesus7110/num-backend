const router = require('express').Router();
const pushNotificationController = require("../controller/pushNotificationController");

router.get("/SendNotification",pushNotificationController.SendNotification);
router.post("/SendNotificationToDevice",pushNotificationController.SendNotificationToDevice);

module.exports = router;