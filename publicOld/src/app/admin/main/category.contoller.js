(function () {
    'use strict';

    angular
        .module('spaStore')
        .controller('CategoryController', function (dashboardService, categoriesServices, toastr, $window, categoriesHelperServices, Upload) {
            var vm = this;

            vm.getCategories = function () {
                dashboardService
                    .getCategories()
                    .then(function (res) {
                        vm.mainCategories = res;
                    }, function (err) {
                        console.log(err)
                    })
            }

            vm.getCategories();

            vm.getSubCategories = function (category) {
                vm.subSubCategories = [];
                if (category.subCategories) {
                    vm.subCategories = category.subCategories;
                } else {
                    vm.subCategories = [];
                }

            }

            vm.getSubSubCategories = function (category) {
                if (category.subCategories) {
                    vm.subSubCategories = category.subCategories;
                } else {
                    vm.subSubCategories = [];
                }

            }

            vm.setActiveMainCategory = function (index) {
                vm.indexOfCurrentActiveCategory = index;
            }

            vm.setActiveSubCategory = function (index) {
                vm.indexOfCurrentActiveSubCategory = index;
            }

            vm.setActiveSubSubCategory = function (index) {
                vm.indexOfCurrentActiveSubSubCategory = index;
            }

            vm.deselectCategories = function (category, collection, compareBy) {
                for (var categ in collection) {
                    if (category[compareBy] == collection[categ][compareBy]) {
                        continue;
                    }
                    collection[categ].isSelected = false;
                }

                //End process of deletion
                vm.confirmDelete = false;
            }

            vm.deleteMainCategory = function () {
                vm.confirmDelete = !vm.confirmDelete;
                for (var categ in vm.mainCategories) {
                    if (vm.mainCategories[categ].isSelected) {
                        vm.indexOfCategoryToDelete = categ;
                    }
                }
            }

            vm.confirmDeleteMainCategory = function () {
                categoriesServices
                    .deleteCategory(vm.mainCategories[vm.indexOfCategoryToDelete]._id)
                    .then(function (res) {
                        console.log('deleted');
                        toastr.success('Category deleted!');

                        vm.subCategories = [];
                        vm.subSubCategories = [];
                        vm.getCategories();
                    }, function (err) {
                        toastr.error('An error occured!Try again later!');
                        console.log(err)
                    })
            }

            vm.addMainCategory = function () {
                vm.confirmAdd = !vm.confirmAdd;
            }

            vm.confirmAddMainCategory = function () {
                var categoryToAdd = {
                    Name: vm.newMainCategory
                };
                categoriesServices
                    .addCategory(categoryToAdd)
                    .then(function (res) {
                        toastr.success('Category added!');
                        vm.subCategories = [];
                        vm.subSubCategories = [];
                        vm.getCategories();
                    }, function (err) {
                        toastr.error('An error occured!Try again later!');
                    })
            }
            vm.addSubCategory = function () {
                vm.confirmAddSub = !vm.confirmAddSub;
            }

            vm.addSubSubCategory = function () {
                vm.confirmAddSubSub = !vm.confirmAddSubSub;
            }

            vm.deleteSubCategory = function () {
                vm.confirmDeleteSub = !vm.confirmDeleteSub;
            }

            vm.deleteSubSubCategory = function () {
                vm.confirmDeleteSubSub = !vm.confirmDeleteSubSub;
            }

            vm.editMainCategory = function (level, action, nameOfNewCategory) {

                if (vm.indexOfCurrentActiveCategory === undefined) {
                    toastr.error('Select main category first!');
                    return;
                }

                vm.mainCategories = categoriesHelperServices.editMainCategory(vm.indexOfCurrentActiveCategory, action, level, vm.mainCategories, nameOfNewCategory, vm.indexOfCurrentActiveSubCategory);

                categoriesServices
                    .replace(vm.mainCategories[vm.indexOfCurrentActiveCategory])
                    .then(function (res) {
                        console.log('sucessfully replaced');
                        vm.subCategories = [];
                        vm.subSubCategories = [];
                        vm.getCategories();
                    }, function (err) {
                        console.log(err);
                        console.log('error')
                    })

            }

            //Products

            vm.addNewProduct = false;
            vm.toggleAddNewProduct = function () {
                vm.addNewProduct = !vm.addNewProduct;
                console.log(vm.newProduct);
            }

            vm.upload = function (file, fileType) {
                if (!vm.newProduct.mainImage) {
                    toastr.error('No image uploaded');
                    return;
                }
                if (vm.newProduct.mainImage) {
                    vm.newProduct.fileType = 'productImagesMain';
                }

                if (vm.newProduct.secondImage) {
                    vm.newProduct.additionalImage = true;
                }

                if (vm.newProduct.thirdImage) {
                    vm.newProduct.additionalImageSecond = true;
                }

                if (vm.newProduct.forthImage) {
                    vm.newProduct.additionalImageThird = true;
                }

                vm.newProduct.category = vm.mainCategories[vm.indexOfCurrentActiveCategory].name;

                if (vm.indexOfCurrentActiveSubCategory != undefined) {
                    vm.newProduct.subCategory = [];
                    vm.newProduct.subCategory.push(vm.mainCategories[vm.indexOfCurrentActiveCategory].subCategories[vm.indexOfCurrentActiveSubCategory].name);

                    if (vm.indexOfCurrentActiveSubSubCategory!=undefined) {
                        vm.newProduct.subCategory.push( vm.mainCategories[vm.indexOfCurrentActiveCategory].subCategories[vm.indexOfCurrentActiveSubCategory].subCategories[vm.indexOfCurrentActiveSubSubCategory].name);
                    }
                }

                // categoriesServices     .uploadProduct(vm.newProduct)     .then(function (res)
                // {         ;         console.log('succeeded')     }, function
                // (err) {         console.log(err);     })

                Upload.upload({
                    url: 'http://localhost:3030/api/products/add',
                    headers: {
                        "Content-Type": 'multipart/form-data'
                    },
                        data: {
                            product: vm.newProduct
                        }
                    })
                    .then(function (resp) {
                        toastr.success('File uploaded succesfully ');
                    }, function (resp) {
                        toastr.error(' File is not uploaded ');
                    }, function (evt) {
                        var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                        // console.log(progressPercentage) // console.log('progress: ' +
                        // progressPercentage + '% ' + //         evt.config.data.file.name);
                    });
            };

        })
})();
