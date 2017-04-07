module.exports = function (passport) {
    var express = require('express');
    var router = express.Router();
    var http = require('http');
    var fs = require('fs');
    var path = require('path');
    var q = require('q');
    var config = require('../config.json');
    var storedToken = null;
    var storedOauth = null;

    // Simple route middleware to ensure user is authenticated.
    //   Use this route middleware on any resource that needs to be protected.  If
    //   the request is authenticated (typically via a persistent login session),
    //   the request will proceed.  Otherwise, the user will be redirected to the
    //   login page.
    function ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) { return next(); }
        res.redirect('/login')
    }

    function upload(imageData, albumUri) {
        var defer = q.defer(),
            OAuth = require('oauth'),
            customHeaders = {
                'X-Smug-ResponseType': 'JSON',
                'X-Smug-Version': 'v2',
                'X-Smug-AlbumUri': albumUri,
                'Content-Type': 'image/jpeg'
            },
            req,
            oauth;

        //function(requestUrl, accessUrl, consumerKey, consumerSecret, version, authorize_callback, signatureMethod, nonceSize, customHeaders) {
        oauth = new OAuth.OAuth(
            'http://api.smugmug.com/services/oauth/getRequestToken.mg', // requestUrl,
            'http://api.smugmug.com/services/oauth/getAccessToken.mg', // accessUrl,
            storedOauth._consumerKey, // consumerKey
            storedOauth._consumerSecret, // consumerSecret
            '1.0', // version
            'http://localhost:3000/smugmug/auth/callback', //authorize_callback
            'HMAC-SHA1', // signatureMethod
            32, // nonceSize
            customHeaders
        );

        oauth.put(
            'http://upload.smugmug.com', // url
            storedToken.id, // oauth_token
            storedToken.Secret, //oauth_token_secret
            imageData, // body data
            'image/jpeg', // content type
            function (err, data, response) {
                if (err) {
                    defer.reject(err);
                } else {
                    defer.resolve({data: data, response: response});
                }
            });

        return defer.promise;
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
            var util = require('util');
            //TODO: find the *RIGHT* way to get this info
            var oauth = req._passport.instance._strategies.smugmug._oauth;
            var token = req.user._json.Auth.Token; //id, Secret
            //console.log(util.inspect(req._passport.instance._strategies, false, null));
            //console.log(util.inspect(req.user._json.Auth, false, null));
            storedOauth = oauth;
            storedToken = token;
            res.redirect('/');
        });

    // testing uploads
    function uploadImage() {
        var p = path.resolve('picture.jpg');
        console.log('p:', p);
        fs.readFile(p, function(err1, data) {
            if (err1) {
                console.log('nope:', err1);
                return;
            } else {
                console.log('uploading ...', data)
            }

            upload(data, config.SMUGMUG_ALBUM_URI)
                .then(function (res) {
                    console.log('success', res);
                }, function (err) {
                    conosle.log('err', err);
                });
        });
        }

    return {
        router: router,
        upload: upload
    };
}