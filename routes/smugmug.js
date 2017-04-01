module.exports = function (passport) {
    var express = require('express');
    var router = express.Router();

    // Simple route middleware to ensure user is authenticated.
    //   Use this route middleware on any resource that needs to be protected.  If
    //   the request is authenticated (typically via a persistent login session),
    //   the request will proceed.  Otherwise, the user will be redirected to the
    //   login page.
    function ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) { return next(); }
        res.redirect('/login')
    }

    router.get('/account', ensureAuthenticated, function (req, res) {
        res.render('account', { user: req.user });
    });

    router.get('/login', function (req, res) {
        res.render('login', { user: req.user });
    });

    // GET /smugmug/auth
    //   Use passport.authenticate() as route middleware to authenticate the
    //   request.  The first step in SmugMug authentication will involve redirecting
    //   the user to smugmug.com.  After authorization, SmugMug will redirect the user
    //   back to this application at /smugmug/auth/callback
    router.get('/auth',
        passport.authenticate('smugmug'),
        function (req, res) {
            // The request will be redirected to SmugMug for authentication, so this
            // function will not be called.
        });

    // GET /smugmug/auth/callback
    //   Use passport.authenticate() as route middleware to authenticate the
    //   request.  If authentication fails, the user will be redirected back to the
    //   login page.  Otherwise, the primary route function function will be called,
    //   which, in this example, will redirect the user to the home page.
    router.get('/auth/callback',
        passport.authenticate('smugmug', { failureRedirect: '/login' }),
        function (req, res) {
            res.redirect('/');
        });

    return router;
}