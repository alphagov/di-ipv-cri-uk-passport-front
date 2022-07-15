const { Controller: BaseController } = require("hmpo-form-wizard");

class RootController extends BaseController {
  async saveValues(req, res, next) {
    const sharedClaims = req.session?.shared_claims;

    if (sharedClaims) {
      if (sharedClaims?.names?.length > 0) {
        req.journeyModel.set("surname", sharedClaims.names[0]?.familyName);
        req.journeyModel.set("givenNames", sharedClaims.names[0]?.givenNames);
      }

      if (sharedClaims?.dateOfBirths?.length > 0) {
        req.journeyModel.set("dateOfBirth", sharedClaims.dateOfBirths[0]);
      }
    }
    super.saveValues(req, res, next);
  }
}

module.exports = RootController;
