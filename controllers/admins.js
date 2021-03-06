const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const AdminModel = require("../models/admin");
const VerifyModel = require("../models/verify");
const SECRET_KEY = process.env.SECRET_KEY;
const SERVER_IP_ADDRESS = process.env.SERVER_IP_ADDRESS;
const PORT = process.env.PORT;
const { PSIKIATER } = require("../constants/role");
const AppointmentModel = require("../models/appointments");
const PaymentModel = require("../models/payments");
const emailer = require("../utilities/emailer");
const chatroom = require("../utilities/chatroom");


class AdminController {
  static createAdmin = async (req, res, next) => {
    try {
      const { first_name, last_name, password, email } = req.body;

      const admin = await AdminModel.create({
        first_name,
        last_name,
        password: bcrypt.hashSync(password, 10),
        email,
      });

      if (!admin) {
        throw new Error("Failed creating admin");
      }

      res.status(202).json({
        status: "success",
        message: "Successfully created admin",
        data: admin,
      });
    } catch (error) {
      next(error);
    }
  };
  static approvalPsikiater = async (req, res, next) => {
    const { email, action } = req.body;
    try {
      if (action === "reject") {
        const emailSent = await emailer(
          email,
          "Reject",
          `<h3>Oops sorry! registration has been reject Admin</h3>`
        );
        res.sendStatus(204);
      }

      const verificationToken = jwt.sign(
        {
          email: email,
          role: PSIKIATER,
        },
        SECRET_KEY
      );

      const tokenVerify = await VerifyModel.create({
        email: email,
        activation_token: verificationToken,
      });

      if (!tokenVerify) {
        throw new Error("Failed storing verification token");
      }

      const emailSent = await emailer(
        email,
        "Verification Link",
        `<h3><strong>Clink this link to verify your account: </strong>http://${SERVER_IP_ADDRESS}:${PORT}/verify-user/verify/${verificationToken}</h3>`
      );
      res.sendStatus(204);    
    } catch (error) {
      next(error);
    }
  };


  static paymentApproval = async (req, res, next) => {
    try {
      const { admin_action, payment_id } = req.body;
      const payment = await PaymentModel.findById(payment_id).populate(
        "patient"
      );

      if (admin_action === "reject") {
        const rejectedPayment = await PaymentModel.findByIdAndUpdate(
          payment_id,
          { payment_status: "rejected" },
          { new: true }
        );

        if (!rejectedPayment) {
          throw new Error("Failed rejecting payment.");
        }

        const email = emailer(
          payment.patient.email,
          "Your payment is rejected.",
          `<h3>Payment with ID ${payment_id} is rejected by admin.</h3>`
        );

        if (!email) {
          throw new Error("Failed sending email to user.");
        }
      } else if (admin_action === "accept") {
        const acceptedPayment = await PaymentModel.findByIdAndUpdate(
          payment_id,
          { payment_status: "accepted" },
          { new: true }
        );

        if (!acceptedPayment) {
          throw new Error("Failed accepting payment.");
        }

        const appointmentData = {
          psikiater_id: acceptedPayment.product_detail.psikiater_id,
          patient_id: acceptedPayment.product_detail.patient_id,
          appointment_date: acceptedPayment.product_detail.appointment_date,
          appointment_time: acceptedPayment.product_detail.appointment_time,
          complaint: acceptedPayment.product_detail.complaint,
          allergy: acceptedPayment.product_detail.allergy,
          isOnline: acceptedPayment.product_detail.isOnline,
        };

        const appointment = await AppointmentModel.create(appointmentData);

        if (!appointment) {
          throw new Error("Failed create appointment from payment.");
        }

        const chatRoomData = {
          idPsikiater: appointment.psikiater_id,
          idPatient: appointment.patient_id,
          consultationDate: appointment.appointment_date,
          consultationTime: appointment.appointment_time,
        };

        const room = await chatroom.createChatroom(chatRoomData);

        const updatedAppointment = await AppointmentModel.findByIdAndUpdate(
          appointment._id,
          { roomChat_id: room.id },
          { new: true }
        );

        if (!updatedAppointment) {
          throw new Error("Failed storing room id inside appointment document");
        }

        const email = emailer(
          payment.patient.email,
          "Your payment is accepted.",
          `<h3>Payment with ID ${payment_id} is accepted by admin.</h3>`
        );

        if (!email) {
          throw new Error("Failed sending email to user.");
        }
      }

      res.status(204);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = AdminController;
