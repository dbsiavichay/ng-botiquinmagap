(function(){
	var app = angular.module('botiquin', []);

	app.controller('AsociacionController',['$scope', '$http',function($scope, $http){
		$http.get('http://localhost:8000/asociaciones/?tecnico=2')
			.success(function(data){
				$scope.asociaciones = data;
				$scope.asociaciones.every(function(element, index, array){
					element.tecnico = JSON.parse(element.tecnico);
					element.ubicacion = JSON.parse(element.ubicacion);
				})				
			});
	}]);
})();