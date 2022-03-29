const BaseController = require("hmpo-form-wizard").Controller;
const DoneController = require("./done");

describe("done controller", () => {
  const done = new DoneController({ route: "/test" });

  let req;
  let res;
  let next;
  let sandbox;

  const sessionModelJson = {
    passportNumber: "12345678",
    surname: "Smith",
    givenNames: ["John", "Paul"],
    dateOfBirth: "12-03-1990",
    expiryDate: "24-01-2025",
    "csrf-secret": "secret"
  }

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    const setup = setupDefaultMocks();
    req = setup.req;
    res = setup.res;
    next = setup.next;

    req.query = {
      response_type: "code",
      client_id: "s6BhdRkqt3",
      state: "xyz",
      redirect_uri: "https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb",
      unusedParam: "not used",
    };
    req.sessionModel.set("authorization_code", "test-auth-code-12345");
    req.sessionModel.set("passportNumber", sessionModelJson.passportNumber);
    req.sessionModel.set("surname", sessionModelJson.surname);
    req.sessionModel.set("givenNames", sessionModelJson.givenNames);
    req.sessionModel.set("dateOfBirth", sessionModelJson.dateOfBirth);
    req.sessionModel.set("expiryDate", sessionModelJson.expiryDate);
    req.sessionModel.set("csrf-secret", sessionModelJson["csrf-secret"]);
  });
  afterEach(() => sandbox.restoreContext());

  it("should be an instance of BaseController", () => {
    expect(done).to.be.an.instanceof(BaseController);
  });

  it("should set all the sent details to the locals object", () => {
    done.locals(req, res, next);

    expect(next.calledOnce).to.be.true;

    expect(next.firstCall.args[1].sentValuesSummaryList[0].key.text).to.eq("passportNumber");
    expect(next.firstCall.args[1].sentValuesSummaryList[0].value.text).to.eq(sessionModelJson.passportNumber);

    expect(next.firstCall.args[1].sentValuesSummaryList[1].key.text).to.eq("surname");
    expect(next.firstCall.args[1].sentValuesSummaryList[1].value.text).to.eq(sessionModelJson.surname);

    expect(next.firstCall.args[1].sentValuesSummaryList[2].key.text).to.eq("givenNames");
    expect(next.firstCall.args[1].sentValuesSummaryList[2].value.text).to.eq(sessionModelJson.givenNames);

    expect(next.firstCall.args[1].sentValuesSummaryList[3].key.text).to.eq("dateOfBirth");
    expect(next.firstCall.args[1].sentValuesSummaryList[3].value.text).to.eq(sessionModelJson.dateOfBirth);

    expect(next.firstCall.args[1].sentValuesSummaryList[4].key.text).to.eq("expiryDate");
    expect(next.firstCall.args[1].sentValuesSummaryList[4].value.text).to.eq(sessionModelJson.expiryDate);
  });

  it("should set all the response details to the locals object", () => {
    done.locals(req, res, next);

    expect(next.calledOnce).to.be.true;

    expect(next.firstCall.args[1].responseValuesSummaryList[0].key.text).to.eq("code");
    expect(next.firstCall.args[1].responseValuesSummaryList[0].value.text).to.eq("test-auth-code-12345");
  });

  it("should display empty details if missing auth code response", () => {
    req.sessionModel.unset("authorization_code");

    done.locals(req, res, next);

    expect(next.calledOnce).to.be.true;

    expect(next.firstCall.args[1].responseValuesSummaryList.length).to.eq(0);
  });

  it("should display error details if CRI returned an error response", () => {
    req.sessionModel.unset("authorization_code");
    req.sessionModel.set("error", {
      code: "permission_denied",
      description: "User is now allowed",
    });

    done.locals(req, res, next);

    expect(next.calledOnce).to.be.true;

    expect(next.firstCall.args[1].responseValuesSummaryList[0].key.text).to.eq("error_code");
    expect(next.firstCall.args[1].responseValuesSummaryList[0].value.text).to.eq("permission_denied");

    expect(next.firstCall.args[1].responseValuesSummaryList[1].key.text).to.eq("error_description");
    expect(next.firstCall.args[1].responseValuesSummaryList[1].value.text).to.eq("User is now allowed");
  });

  it("should display both auth code and error details if CRI returned both", () => {
    req.sessionModel.set("error", {
      code: "permission_denied",
      description: "User is now allowed",
    });

    done.locals(req, res, next);

    expect(next.calledOnce).to.be.true;

    expect(next.firstCall.args[1].responseValuesSummaryList[0].key.text).to.eq("code");
    expect(next.firstCall.args[1].responseValuesSummaryList[0].value.text).to.eq("test-auth-code-12345");

    expect(next.firstCall.args[1].responseValuesSummaryList[1].key.text).to.eq("error_code");
    expect(next.firstCall.args[1].responseValuesSummaryList[1].value.text).to.eq("permission_denied");

    expect(next.firstCall.args[1].responseValuesSummaryList[2].key.text).to.eq("error_description");
    expect(next.firstCall.args[1].responseValuesSummaryList[2].value.text).to.eq("User is now allowed");
  });
});
