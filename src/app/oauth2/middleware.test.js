const proxyquire = require("proxyquire");
const axios = require("axios");

const configStub = {
  AUTH_PATH: "/subsubpath/auth",
  API_BASE_URL: "https://example.org/subpath",
};
const middleware = proxyquire("./middleware", {
  "../../lib/config": configStub,
});

describe("oauth middleware", () => {
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
  });

  describe("addAuthParamsToSession", () => {
    beforeEach(() => {
      req = {
        query: {
          response_type: "code",
          client_id: "s6BhdRkqt3",
          state: "xyz",
          redirect_uri: "https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb",
          unusedParam: "not used",
        },
        session: {},
      };
    });

    it("should save authParams to session", async function () {
      await middleware.addAuthParamsToSession(req, res, next);

      expect(req.session.authParams).to.deep.equal({
        response_type: req.query.response_type,
        client_id: req.query.client_id,
        state: req.query.state,
        redirect_uri: req.query.redirect_uri,
      });
    });

    it("should call next", async function () {
      await middleware.addAuthParamsToSession(req, res, next);

      expect(next).to.have.been.called;
    });
  });

  describe("addSharedAttributesToSession", () => {
    const data = {
      names : [
        {givenNames: ["Dan John"],    familyName: "Watson"},
        {givenNames: ["Daniel"], familyName: "Watson"},
        {givenNames: ["Danny, Dan"],  familyName: "Watson"},
      ],
      dateOfBirths:[
        "2021-03-01",
        "1991-03-01"
      ]
    };

    beforeEach(() => {
      req = {
        query: {
          response_type: "code",
          client_id: "s6BhdRkqt3",
          state: "xyz",
          redirect_uri: "https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb",
          unusedParam: "not used",
          request: "eyJuYW1lcyI6W3siZ2l2ZW5OYW1lcyI6WyJEYW4iXSwiZmFtaWx5TmFtZSI6IldhdHNvbiJ9LHsiZ2l2ZW5OYW1lcyI6WyJEYW5pZWwiXSwiZmFtaWx5TmFtZSI6IldhdHNvbiJ9LHsiZ2l2ZW5OYW1lcyI6WyJEYW5ueSwgRGFuIl0sImZhbWlseU5hbWUiOiJXYXRzb24ifV0sImRhdGVPZkJpcnRocyI6WyIyMDIxLTAzLTAxIiwiMTk5MS0wMy0wMSJdfQ=="
        },
        session: {},
        sessionModel: {
          set: sinon.fake(),
        }
      };
      const resolvedPromise = new Promise((resolve) => resolve({data}));
      sandbox.stub(axios, 'post').returns(resolvedPromise);
    });

    afterEach(() => sandbox.restore());

    it("should save sharedAttributes to session", async function () {
      await middleware.parseSharedAttributesJWT(req, res, next);

      expect(req.session.sharedAttributes).to.deep.equal(data);
    });

    it("should call next", async function () {
      await middleware.parseSharedAttributesJWT(req, res, next);

      expect(next).to.have.been.called;
    });
  });


  describe("redirectToPassportDetailsPage", () => {

    it("should successfully redirects when code is valid", async function () {
      await middleware.redirectToPassportDetailsPage(req, res);

      expect(res.redirect).to.have.been.calledWith(
        `/passport`
      );
    });
  });

  describe("redirectToCallback", () => {

    beforeEach(() => {
      req = {
        session: {
          authParams: {
            redirect_uri: "https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb?id=PassportIssuer",
          },
          "hmpo-wizard-cri-passport-front": {
            authorization_code: "1234",
          },
        },
      };
    });

    it("should successfully redirects when code is valid", async function () {
      await middleware.redirectToCallback(req, res);

      expect(res.redirect).to.have.been.calledWith(
        `https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb?id=PassportIssuer&code=1234`
      );
    });
  });

  describe("passClientIdToJwtVerifyPostHeader", () => {

    let postStub;
    const clientId = 's6BhdRkqt3'
    beforeEach(() => {
      req = {
        query: {
          response_type: "code",
          client_id: clientId,
          state: "xyz",
          redirect_uri: "https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb",
          unusedParam: "not used",
          request: "eyJuYW1lcyI6W3siZ2l2ZW5OYW1lcyI6WyJEYW4iXSwiZmFtaWx5TmFtZSI6IldhdHNvbiJ9LHsiZ2l2ZW5OYW1lcyI6WyJEYW5pZWwiXSwiZmFtaWx5TmFtZSI6IldhdHNvbiJ9LHsiZ2l2ZW5OYW1lcyI6WyJEYW5ueSwgRGFuIl0sImZhbWlseU5hbWUiOiJXYXRzb24ifV0sImRhdGVPZkJpcnRocyI6WyIyMDIxLTAzLTAxIiwiMTk5MS0wMy0wMSJdfQ=="
        },
        session: { authParams: { client_id: clientId }},
        sessionModel: {
          set: sinon.fake(),
        }
      };
      const resolvedPromise = new Promise((resolve) => resolve({}));
      postStub = sandbox.stub(axios, 'post').returns(resolvedPromise);
    });

    afterEach(() => sandbox.restore())

    it("should pass client_id in header", async function () {
      await middleware.parseSharedAttributesJWT(req, res, next);

      expect(postStub.firstCall.args[2]?.headers?.client_id).to.be.equal(clientId)
    });
  });
});
