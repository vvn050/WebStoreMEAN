/**
 * Created by vvn050 on 22.08.16.
 */
var express = require('express'),
    bodyParser = require('body-parser'),
    path = require('path'),
    fileUpload = require('express-fileupload');
    
module.exports = function (app) {

    //Set path for all public resources
    app.use(express.static(__dirname + '/../../public/dist'));

    app.use(bodyParser.urlencoded({extended: false}));
    app.use(bodyParser.json());
    app.use(fileUpload());

    app.get('/api/about', function (req, res) {
        // var requestHost = req.get('host');
        res.send({proba: 'test'});
    });

    app
        .route('/about')
        .get(function (req, res) {
            res.send('Hello');
        })
        .post(function (req, res) {
            res.send('Post Hello')
        });

    app.use(function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
        next();

    });

    //User routes
    require('../controllers/user.controller')(app);

    //Category routes
    require('../controllers/category.controller')(app);

    //Products routes
    require('../controllers/product.controller')(app);

    app.get('/api/brands', require('../controllers/admin.controller'));

    app.get('*', function (req, res) {
        res.sendFile(path.join(__dirname + '/../../public/dist/index.html'));
    });

};