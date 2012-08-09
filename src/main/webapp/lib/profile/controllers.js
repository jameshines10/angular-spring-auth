'use strict';

/* Controllers */

function ProfileCtrl($scope, $http, $routeParams, $location) {
    $scope.master = {};

    $scope.mode = 'view';

    $http.get('api/profiles/' + $routeParams.memberId).success(function(data){
        $scope.member = data;
    });

    $scope.edit = function(member){
        $scope.master = angular.copy(member);
        $scope.mode = 'edit';
    }

    $scope.update = function(member){
        $http.put('api/profiles/' + $scope.member.id, $scope.member).success(function(data){
            $scope.member;
            $scope.mode = 'view';
        });
    }

    $scope.cancel = function(){
        $scope.member = angular.copy($scope.master);
        $scope.mode = 'view';
    }

    $scope.create = function(){
        $scope.master = angular.copy($scope.member);

        $scope.member = {};
        $scope.mode = 'create';
    }

    $scope.save = function(){
        $http.post('api/profiles/', $scope.member).success(function(){
            $scope.member;
            $scope.mode = 'view';
        });
    }

    $scope.delete = function(){
        $http.get('api/profiles/delete/' + $scope.member.id).success(function(){
            $scope.mode = 'view';
            $location.path('/view/1');
            $scope.profileDeleted = 'true';
        });
    }

    $scope.isUnchanged = function(member){
        return angular.equals(member, $scope.master);
    }

    $scope.asyncEmail = function(email){
        $http.get('api/profiles/asyncEmail/' + email).success(function(data){
            console.log(data);
        }).error(function(data, status){
            console.log(status);
        });
    }


}