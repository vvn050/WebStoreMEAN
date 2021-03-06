var mongoose = require('mongoose');

var Product = require('../models/product')(mongoose);

var Category = require('../models/category')();

var ProductDTO = require('../models/productDTO');

var authorizeAdmin = require('../services/authorization.service');

var validateProduct = require('../services/validators/productValidator');

var tokenService = require('../services/token.service');

var tokenFromRequest = require('../services/getTokenFromRequest');

var jwt = require('jsonwebtoken');

const mainImageAssetsPath = 'public/src/app/assets/productImagesMain/';
const otherImagesAssetsPath = 'public/src/app/assets/productImagesOthers/';

function addProducts(products, token) {
    var allProductsDTO = [];
    var productsDTO = [];
    for (let product of products) {
        var prodDTO = new ProductDTO(product, token);
        allProductsDTO.push(prodDTO);
    }

    return allProductsDTO;
}

function returnProductsFromDbQuery(err, products, req, res) {
    if (err) {
        res.status(400);
        res.send(err + ' An error occured while retrieving products!');
    } else {
        var productsToReturn = products;
        tokenFromRequest(req).then(function (response) {
            var productsDTO = addProducts(products, response)

            res.send(productsDTO);
            res.status(200);
        }, function (err) {
            var productsDTO = addProducts(products, err)

            res.send(productsDTO);
            res.status(200);
        })
    }
}

module.exports = function (app) {
    //Get by product ID - receives number
    app
        .route('/api/products/:inventoryId')
        .get(function (req, res) {

            let inventoryId = Number.parseInt(req.params.inventoryId);

            Product.find({
                'inventoryId': inventoryId
            }, function (err, products) {
                if (err) {
                    res.status(400);
                    res.send(err + ' An error occured while retrieving products!');
                } else {
                    if (products.length == 0) {
                        res.send('No products found, matching the criteria');
                        return;
                    }
                    returnProductsFromDbQuery(err, products, req, res);
                }
            })
        });

    app
        .route('/api/products')
        .get(function (req, res) {
            Product
                .find({})
                .sort({updated: 'desc'})
                .exec(function (err, products) {
                    returnProductsFromDbQuery(err, products, req, res);

                })

        });

    app
        .route('/api/products/:categoryId/:subCategoryIndex/:subSubCategoryIndex')
        .get(function (req, res) {
            let categoryId = Number.parseInt(req.params.categoryId);
            var objectToFilter = {};

            Category.find({
                '_id': categoryId
            }, function (err, category) {
                if (err || category.length == 0) {
                    res.status(400);
                    res.send(err + ' An error occured while retrieving products!');
                    return;
                } else {
                    var categoryFromId = req.params.categoryId.name,
                        subCategoryName = req.params.subCategoryIndex == -1
                            ? 'noSubCategory'
                            : category[0].subCategories[req.params.subCategoryIndex].name,
                        subSubCategoryName = (req.params.subSubCategoryIndex == -1 || subCategoryName == 'noSubCategory' || !category[0].subCategories[req.params.subCategoryIndex].subCategories || !category[0].subCategories[req.params.subCategoryIndex].subCategories.length < req.params.subSubCategoryIndex)
                            ? 'noSubSubCategory'
                            : category[0].subCategories[req.params.subCategoryIndex].subCategories[req.params.subSubCategoryIndex].name;

                    objectToFilter = {
                        $and: [
                            {
                                'category': category[0].name
                            }, {
                                "subCategory": {
                                    $elemMatch: {
                                        $eq: subCategoryName
                                    }
                                }
                            }, {
                                "subCategory": {
                                    $elemMatch: {
                                        $eq: subSubCategoryName
                                    }
                                }
                            }
                        ]
                    };

                    if (req.headers.productsbypage && req.headers.pagenumber) {
                        var productsByPage = Number.parseInt(req.headers.productsbypage),
                            pageNumber = Number.parseInt(req.headers.pagenumber);
                    } else {
                        var productsByPage = 20,
                            pageNumber = 1;
                    }

                    if (subCategoryName == 'noSubCategory') {
                        objectToFilter['$and'].splice(1, 2);
                    } else if (subSubCategoryName == 'noSubSubCategory') {
                        objectToFilter['$and'].splice(2, 1);
                    }

                    Product
                        .find(objectToFilter)
                        .sort({updated: 'desc'})
                        .skip(productsByPage * (pageNumber - 1))
                        .limit(productsByPage)
                        .exec(function (err, products) {
                            returnProductsFromDbQuery(err, products, req, res);
                        })
                }
            })
        });

    //Paging for products
    app
        .route('/api/products/:productsByPage/:pageNumber')
        .get(function (req, res) {
            let productsByPage = Number.parseInt(req.params.productsByPage),
                pageNumber = Number.parseInt(req.params.pageNumber);

            Product
                .find({})
                .sort({updated: 'desc'})
                .skip(productsByPage * (pageNumber - 1))
                .limit(productsByPage)
                .exec(function (err, products) {
                    returnProductsFromDbQuery(err, products, req, res);
                })

        });

    //authorize!
    app
        .route('/api/products/add')
        .post(authorizeAdmin, function (req, res) {
            // var productIsValid = validateProduct(req.body); if (typeof productIsValid ==
            // 'string') {     res.status(400);     res.json(productIsValid);     return; }

            if (!req.files) 
                return res.status(400).send('No files were uploaded.');
            
            var product = new Product({
                name: req.body['product[name]'],
                brand: req.body['product[brand]'],
                heading: req.body['product[heading]'],
                quantity: req.body['product[quantity]'],
                description: req.body['product[description]'],
                category: req.body['product[category]'],
                inventoryId: req.body['product[inventoryId]'],
                inPromotion: req.body['product[inPromotion]'],
                priceProfessional: req.body['product[priceProfessional]'],
                priceHome: req.body['product[priceHome]']
            })

            product.picturesOthers = [];
            product.subCategory = [];

            if (req.body['product[subCategory][0]']) {
                product
                    .subCategory
                    .push(req.body['product[subCategory][0]']);
            }

            if (req.body['product[subCategory][1]']) {
                product
                    .subCategory
                    .push(req.body['product[subCategory][1]']);
            }

            async function addProduct() {
                var errorOccured = false;
                var errorMessage = '';

                function writeFileToFileSystem(mainImage, imagePath) {
                    return new Promise(function (resolve, reject) {
                        mainImage
                            .mv(imagePath, function (err) {
                                if (err) {
                                    errorOccured = true;
                                    errMessage = err;
                                    reject('err');
                                } else {
                                    resolve('ok');
                                }

                            });
                    })
                }

                if (req.body['product[fileType]'] == 'productImagesMain') {
                    product.picturePreview = req.files['product[mainImage]'].name;
                    await writeFileToFileSystem(req.files['product[mainImage]'], mainImageAssetsPath + req.files['product[mainImage]'].name)
                }

                if (req.body['product[additionalImage]']) {
                    product.picturesOthers[0] = req.files['product[secondImage]'].name;
                    await writeFileToFileSystem(req.files['product[secondImage]'], otherImagesAssetsPath + req.files['product[secondImage]'].name)
                }

                if (req.body['product[additionalImageSecond]']) {
                    product.picturesOthers[1] = req.files['product[thirdImage]'].name;
                    await writeFileToFileSystem(req.files['product[thirdImage]'], otherImagesAssetsPath + req.files['product[thirdImage]'].name)
                }

                if (req.body['product[additionalImageThird]']) {
                    product.picturesOthers[2] = req.files['product[forthImage]'].name;
                    await writeFileToFileSystem(req.files['product[forthImage]'], otherImagesAssetsPath + req.files['product[forthImage]'].name)
                }

                function addProductToDb() {
                    product
                        .save()
                        .then(function (response) {
                            res.status(200);
                            res.json('Product saved successfully!');
                        }, function (err) {
                            res.status(400);
                            res.json(err);
                        });
                }

                if (!errorOccured) {
                    addProductToDb();
                } else {
                    res.status(400);
                    res.json(errorMessage);
                }

            }
            addProduct();

        });

    app.post('/api/upload/images', function (req, res) {
        console.log(req.headers.imagetype)
        if (!req.files) 
            return res.status(400).send('No files were uploaded.');
        
        if (req.body.fileType == 'productImagesMain') {
            let mainImage = req.files.mainImage;
            mainImage.mv('public/src/app/assets/' + req.body.fileType + '/' + req.files.mainImage.name + '.jpg', function (err) {
                if (err) 
                    return res.status(500).send(err);
                
                res.send('File uploaded!');
            });
        }
    })

    // The name of the input field (i.e. "sampleFile") is used to retrieve the
    // uploaded file Use the mv() method to place the file somewhere on your server

    app
        .route('/api/products/edit/:id')
        .post(function (req, res) {
            var productIsValid = validateProduct(req.body);
            if (typeof categoryIsValid == 'string') {
                res.status(400);
                res.json(productIsValid);
                return;
            }
            let dbId = req.params.id;

            var product = new Product({
                name: req.body.Name,
                heading: req.body.Heading,
                description: req.body.Description,
                category: req.body.Category,
                subCategory: req.body.SubCategory,
                inventoryId: req.body.InventoryId,
                picturePreview: req.body.PicturePreview,
                priceProfessionals: req.body.PriceProfessionals,
                priceHome: req.body.PriceHome
            })

            product.save(function (err) {
                if (err) {
                    res.status(400);
                    res.json(err);
                } else {
                    res.status(200);
                    res.json('Product saved successfully!');
                }
            });
        });

    //authorize
    app
        .route('/api/products/delete/:id')
        .put(function (req, res) {
            let dbId = req.params.id;

            Product
                .findOneAndRemove({'_id': dbId})
                .exec(function (err, doc) {
                    if (err) {
                        res.status(400);
                        res.send(err.message);
                        return;
                    }
                    res.send(doc);
                })
        });

    app
        .route('/api/products/seed')
        .post(function (req, res) {

            var products = [
                {
                    name: 'Нагреввател',
                    heading: 'Професионален нагревател',
                    description: '<span>НАГРЕВАТЕЛ - Професионален нагревател за кола.Професионален крем за бръчки' +
                            ' описание.Професионален крем за бръчки описание.</span>',
                    category: 'За Козметици',
                    brand: 'Depileve',
                    subCategory: [
                        'Епилация', 'Нагреватели'
                    ],
                    inventoryId: 6,
                    picturePreview: 'pic.png',
                    picturesOthers: ['picOthers'],
                    priceProfessional: 200,
                    priceHome: 300,
                    quantity: '1бр.'
                }, {
                    name: 'Крем за бръчки',
                    heading: 'Професионален крем за бръчки',
                    description: '<span>Професионален крем за бръчки описание.Професионален крем за бръчки описани' +
                            'е.Професионален крем за бръчки описание. </span>',
                    category: 'Козметика за лице',
                    brand: 'ANESI',
                    subCategory: ['Нормална кожа'],
                    inventoryId: 7,
                    picturePreview: 'pic1.png',
                    picturesOthers: ['picOthers1'],
                    priceProfessional: 30,
                    priceHome: 40,
                    quantity: '50ml.'
                }
            ];

            for (let product of products) {
                let proudctToSave = new Product({
                    name: product.name,
                    heading: product.heading,
                    description: product.description,
                    category: product.category,
                    brand: product.brand,
                    subCategory: product.subCategory,
                    inventoryId: product.inventoryId,
                    picturePreview: product.picturePreview,
                    pictureOthers: product.picturesOthers,
                    priceProfessional: product.priceProfessional,
                    priceHome: product.priceHome,
                    quantity: product.quantity

                })

                proudctToSave.save(function (err) {
                    if (err) {} else {}
                });

            }

            res.status(200);
            res.send('Added');

        });
}