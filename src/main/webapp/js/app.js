'use strict';


// Declare app level module which depends on filters, and services
var app = angular.module('bgc-profile', []).
    config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/view/:memberId', {templateUrl:'lib/profile/profile.html', controller:ProfileCtrl});
    $routeProvider.otherwise({redirectTo:'/view/1'});
}]);

app.directive('emailValidator', ['$http', function($http){
    return {
        require: 'ngModel',
        link: function(scope, elm, attrs, ctrl){

            ctrl.$parsers.unshift(function(viewValue){
                $http.get('api/profiles/asyncEmail/' + viewValue).success(function(data){
                    console.log(data);
                    if(data === 'true'){
                        ctrl.$setValidity('emailValidator', true);
                        return viewValue;
                    }else{
                        ctrl.$setValidity('emailValidator', false);
                        return undefined;
                    }
                }).error(function(data, status){
                        console.log(status);
                    });
            });
        }
    }
}]);

app.directive('fileUpload', function(){
    return{
        link: function(scope, elm, attrs){
            var opts = {};
            var config = {
                //runtimes : 'gears,html5,flash,silverlight,browserplus',
                runtimes: 'html5',
                browse_button : 'pickfiles',
                container: 'container',
                max_file_size : '10mb',
                url : '/gc/api/profiles/pics/1',
                resize : {width : 320, height : 240, quality : 90},
                flash_swf_url : '../js/plupload.flash.swf',
                silverlight_xap_url : '../js/plupload.silverlight.xap',
                filters : [
                    {title : "Image files", extensions : "jpg,gif,png"},
                    {title : "Zip files", extensions : "zip"}
                ]
            };

            if(attrs.fileUpload){
                opts = scope.$eval(attrs.fileUpload);
                if(opts.dropTarget){
                    config.drop_element = opts.dropTarget;
                }
            }

            function $(id) {
                return document.getElementById(id);
            }

            var uploader = new plupload.Uploader(config);

            /*uploader.bind('Init', function(up, params) {
             $('filelist').innerHTML = "<div>Current runtime: " + params.runtime + "</div>";
             });*/

            uploader.bind('FilesAdded', function(up, files) {
                for (var i in files) {
                    $('filelist').innerHTML += '<div id="' + files[i].id + '">' + files[i].name + ' (' + plupload.formatSize(files[i].size) + ') <b></b></div>';
                }

                setTimeout(function(){
                    uploader.start();
                }, 500);
            });

            uploader.bind('UploadProgress', function(up, file) {
                $(file.id).getElementsByTagName('b')[0].innerHTML = '<span>' + file.percent + "%</span>";
            });

            uploader.bind('FileUploaded', function(uploader, file, response){
                console.log(uploader, file, response);
                $(config.drop_element).src = response.response;
            })

            /*$('uploadfiles').onclick = function() {
             uploader.start();
             return false;
             };*/

            uploader.init();
        }
    }
});
