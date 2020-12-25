const Router = require("express").Router();
const reviewRouter = require("./review");
const patientRouter = require("./patient");
const psikiaterRouter = require("./psikiater");
const authRoutes = require("./auth");
const scheduleRouter = require("./schedules");
const prescriptionRouter = require("./prescriptions");
const path = require("path");

const authentication = require("../middlewares/authentication");

Router.use("/auth", authRoutes);

Router.use(authentication);

Router.use("/reviews", reviewRouter);

Router.use("/patients", patientRouter);

Router.use("/psikiater", psikiaterRouter);

Router.use("/schedule", scheduleRouter);

Router.use("/prescriptions", prescriptionRouter);

module.exports = Router;