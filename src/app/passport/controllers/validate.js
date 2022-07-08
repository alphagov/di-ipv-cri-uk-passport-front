const axios = require("axios");
const BaseController = require("hmpo-form-wizard").Controller;

const { API_BASE_URL, API_AUTHORIZE_PATH } = require("../../../lib/config");
const logger = require("hmpo-logger").get();

class ValidateController extends BaseController {
  async saveValues(req, res, callback) {
    const firstName = req.sessionModel.get("firstName");
    const middleNames = req.sessionModel.get("middleNames");
    const forenames =
      middleNames === ""
        ? firstName.split(" ")
        : firstName.split(" ").concat(middleNames.split(" "));
    const attributes = {
      passportNumber: req.sessionModel.get("passportNumber"),
      surname: req.sessionModel.get("surname"),
      forenames: forenames,
      dateOfBirth: req.sessionModel.get("dateOfBirth"),
      expiryDate: req.sessionModel.get("expiryDate"),
    };

    try {
      const oauthParams = {
        ...req.session.JWTData.authParams,
        scope: "openid",
      };

      const queryParams = this.getQueryStringParams(oauthParams);

      const headers = {
        user_id: req.session.JWTData?.user_id,
        passport_session_id: req.session.passportSessionId,
      };

      logger.info("calling authorize lambda", { req, res });
      const apiResponse = await axios.post(
        `${API_BASE_URL}${API_AUTHORIZE_PATH}${queryParams}`,
        attributes,
        { headers: headers }
      );

      const code = apiResponse?.data?.code?.value;

      super.saveValues(req, res, () => {

        const isValid = apiResponse.data.isValidPassport;

        if (!isValid) {
          req.session.isValidPassport = false;
          const retryCount = req.session.retryCount ?? 0;
          logger.info("retryCount : " + retryCount);
          req.session.retryCount = retryCount + 1;

          req.sessionModel.set("authorization_code", code);

          callback();
        } else {
          req.session.isValidPassport = true;
          req.sessionModel.set("authorization_code", code);
        }

        const error = {
          error: "server_error",
          error_description: "Failed to retrieve authorization code",
        };
        req.sessionModel.set("error", error);
        callback();

      });
    } catch (error) {
      logger.error("error thrown in validate controller", { req, res, error });
      super.saveValues(req, res, () => {
        req.sessionModel.set("error", error.response.data);
        callback();
      });
    }
  }

  getQueryStringParams(authParams) {
    return (
      "?" +
      Object.keys(authParams)
        .map((key) => key + "=" + authParams[key])
        .join("&")
    );
  }

  next(req) {
    const isValidPassport = req.session.isValidPassport;
    const retryCount = req.session.retryCount;

    if (!isValidPassport && retryCount <= 2) {
      logger.info("Next is retry");
      return "retry"
    } else {
      logger.info("Next is callback");
      return "/oauth2/callback"
    }
  }
}

module.exports = ValidateController;
