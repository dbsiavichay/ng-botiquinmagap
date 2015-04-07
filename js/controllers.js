(function() {
	angular.module('botiquin.controllers', [])

		.controller('AsociacionController',['$scope', '$http',function($scope, $http){
			$http.get('http://localhost:8000/asociaciones/?tecnico=2')
				.success(function(data){
					$scope.asociaciones = data;
					$scope.asociaciones.every(function(element, index, array){
						element.tecnico = JSON.parse(element.tecnico);
						element.ubicacion = JSON.parse(element.ubicacion);
						element.map = new Image();
						element.map.src = 'http://maps.googleapis.com/maps/api/staticmap?center='
							+element.latitud+','+element.longitud+'&zoom=17&size=300x200&maptype=hybrid&'
							+'&markers=size:mid|color:blue|label:A|'+element.latitud+','+element.longitud
							+'&sensor=false';
					})				
				});
		}]);
})();