const details = require("./controllers/details");
const root = require("./controllers/root");

const validate = require("./controllers/validate");

module.exports = {
  "/": {
    resetJourney: true,
    entryPoint: true,
    skip: true,
    controller: root,
    next: "details",
  },
  "/details": {
    fields: [
      "passportNumber",
      "surname",
      "firstName",
      "middleNames",
      "dateOfBirth",
      "expiryDate",
    ],
    controller: details,
    next: "validate",
  },
  "/validate": {
    controller: validate,
    skip: true,
    next: validate.prototype.next,
  },
  "/retry": {
    next: "details",
  }
};
