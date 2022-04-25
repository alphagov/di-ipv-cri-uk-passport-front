const axios = require("axios");
const BaseController = require("hmpo-form-wizard").Controller;
const ValidateController = require("./validate");

describe("validate controller", () => {
  const validate = new ValidateController({ route: "/test" });

  let req;
  let res;
  let next;
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    const setup = setupDefaultMocks();
    req = setup.req;
    res = setup.res;
    next = setup.next;

    req.session.JWTData = {authParams: {}}

  });
  afterEach(() => sandbox.restore());

  it("should be an instance of BaseController", () => {
    expect(validate).to.be.an.instanceof(BaseController);
  });

  it("should retrieve auth code from cri-passport-back and store in session", async () => {
    req.sessionModel.set("passportNumber", "123456789");
    req.sessionModel.set("surname", "Jones Smith");
    req.sessionModel.set("firstName", "Dan");
    req.sessionModel.set("middleNames", "Joe");
    req.sessionModel.set("dateOfBirth", "10/02/1975");
    req.sessionModel.set("expiryDate", "15/01/2035");

    const data = {
      code: {
        value: "test-auth-code-12345"
      }
    };

    const resolvedPromise = new Promise((resolve) => resolve({ data }))
    sandbox.stub(axios, 'post').returns(resolvedPromise)

    await validate.saveValues(req, res, next);

    expect(req.session.test.authorization_code).to.eq(data.code.value);
  });

  it("should set an error object in the session if auth code is missing", async () => {
    req.sessionModel.set("passportNumber", "123456789");
    req.sessionModel.set("surname", "Jones Smith");
    req.sessionModel.set("firstName", "Dan");
    req.sessionModel.set("middleNames", "Joe");
    req.sessionModel.set("dateOfBirth", "10/02/1975");
    req.sessionModel.set("expiryDate", "15/01/2035");

    const data = {
      invalidData: {
        value: "test invalid data"
      }
    };
    const resolvedPromise = new Promise((resolve) => resolve({ data }))
    sandbox.stub(axios, 'post').returns(resolvedPromise)

    await validate.saveValues(req, res, next);

    const sessionError = req.sessionModel.get("error");
    expect(sessionError.code).to.eq("server_error");
    expect(sessionError.error_description).to.eq("Failed to retrieve authorization code");
  });

  it("should save error in session when error caught from cri-back", async () => {
    req.sessionModel.set("passportNumber", "123456789");
    req.sessionModel.set("surname", "Jones Smith");
    req.sessionModel.set("firstName", "Dan");
    req.sessionModel.set("middleNames", "Joe");
    req.sessionModel.set("dateOfBirth", "10/02/1975");
    req.sessionModel.set("expiryDate", "15/01/2035");

    const testError = {
      name: "Test error name",
      response: {
        data: {
          code: "access_denied",
          error_description: "Permission denied to token endpoint"
        }
      }
    };
    const resolvedPromise = new Promise((resolve, error) => error(testError))
    sandbox.stub(axios, 'post').returns(resolvedPromise)

    await validate.saveValues(req, res, next);

    const sessionError = req.sessionModel.get("error");
    expect(sessionError.code).to.eq(testError.response.data.code);
    expect(sessionError.error_description).to.eq(testError.response.data.error_description);
  });
});
