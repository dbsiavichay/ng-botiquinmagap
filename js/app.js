(function(){
	var app = angular.module('botiquin', []);

	app.controller('Controlador',['$scope', function($scope){
		$scope.resultado = 3+1;
	}]);
})();