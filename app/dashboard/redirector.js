const Express = require("express");
const redirector = new Express.Router();

var config = require("config");
var type = require("helper/type");

var INDEX = "/";
var AUTH = "/auth";
var CONTACT = "/contact";
var TERMS = "/terms";
var DEVELOPERS = "/developers";
var UPDATES = "/updates";
var HELP = "/help";
// these routes should eventually be nested under help
// e.g. /help/formatting and /help/configuring...
var CONFIGURING = "/configuring";
var FORMATTING = "/formatting";
var PRIVACY = "/privacy";
var MAINTENANCE = "/maintenance";
var ACCOUNT = "/dashboard/account";
var DELETE_ACCOUNT = "/dashboard/account/subscription/delete";
var PAY_SUBSCRIPTION = "/dashboard/account/pay-subscription";
var PASSWORD = "/dashboard/account/password";
var LOGOUT = "/dashboard/account/log-out";

var STATIC = [
  CONTACT,
  HELP,
  CONFIGURING,
  FORMATTING,
  TERMS,
  PRIVACY,
  UPDATES,
  DEVELOPERS,
];

var internal = {
  "/settings/template/archived": "/settings/template/archive",
};

Object.keys(internal).forEach((from) => {
  redirector.use(from, function (req, res) {
    let to = internal[from];
    let redirect = req.originalUrl.replace(from, to);
    // By default, res.redirect returns a 302 status
    // code (temporary) rather than 301 (permanent)
    res.redirect(301, redirect);
  });
});

redirector.use(function (req, res, next) {
  var user = req.user;

  // Allows requests to static files...
  if (req.path.indexOf(".") > -1) return next();

  function pathIs(path) {
    // We use indexOf instead of a simple comparison since
    // somethings we have a redirect query...
    if (type(path, "string")) return req.originalUrl.indexOf(path) === 0;

    var paths = path;
    var match = false;

    paths.forEach(function (path) {
      if (req.originalUrl.indexOf(path) === 0) match = true;
    });

    return match;
  }

  function pathIsNot(path) {
    return !pathIs(path);
  }

  if (pathIs(STATIC)) return next();

  // Only let the user see routes under account
  // if they don't have a blog yet.
  // Auth is not under the account route
  // so add it. It probably should be though.
  // We need the auth route to make the switch
  // dropbox feature work for accounts without blogs.
  if (!req.blog && pathIsNot([ACCOUNT, AUTH, INDEX])) {
    return res.redirect(INDEX);
  }

  // Don't expose any features which modify the database
  if (config.maintenance && pathIsNot(MAINTENANCE)) {
    return res.redirect(MAINTENANCE);
  }

  // Only serve the maintenance page if we are doing maintenance
  if (!config.maintenance && pathIs(MAINTENANCE)) {
    return res.redirect(INDEX);
  }

  // Only allow the user to pay
  if (
    user.needsToPay &&
    pathIsNot([PAY_SUBSCRIPTION, LOGOUT, PASSWORD, CONTACT, DELETE_ACCOUNT])
  ) {
    return res.redirect(PAY_SUBSCRIPTION);
  }

  return next();
});

module.exports = redirector;
