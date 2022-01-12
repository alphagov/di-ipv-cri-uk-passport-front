require("dotenv").config();
const { setup } = require("hmpo-app");

const { PORT, SESSION_SECRET } = require("./lib/config");

const loggerConfig = {
  console: true,
  consoleJSON: true,
  app: false,
};

const sessionConfig = {
  cookieName: "cri_passport_service_session",
  secret: SESSION_SECRET,
};

const { router } = setup({
  config: { APP_ROOT: __dirname },
  port: PORT,
  logs: loggerConfig,
  session: sessionConfig,
  urls: {
    public: "/public",
  },
  publicDirs: ["../dist/public"],
  dev: true,
});

router.use("/oauth2", require("./app/oauth2/router"));
router.use("/passport", require("./app/passport/router"));
