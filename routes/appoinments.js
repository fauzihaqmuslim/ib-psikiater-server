const express = require("express");
const Router = express.Router();
const AppointmentController = require("../controllers/appointments");
const authorization = require("../middlewares/authorization");
const { PATIENT, PSIKIATER } = require("../constants/role");

Router.get("/:id", AppointmentController.getOneAppointmentDataByAppointmentId);

Router.post(
  "/",
  authorization(PATIENT),
  AppointmentController.createAppointment
);

Router.patch(
  "/diagnose/:id",
  authorization(PSIKIATER),
  AppointmentController.updateDiagnose
);

Router.get("/patient", AppointmentController.getAppointmentDataByPatientId);

Router.get(
  "/psikiater",
  authorization(PSIKIATER),
  AppointmentController.getAppointmentDataByPsikiaterId
);

Router.patch(
  "/status/:id",
  authorization(PSIKIATER),
  AppointmentController.updateStatusAppointmentByIdPatient
);

module.exports = Router;