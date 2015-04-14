(function() {	
	angular.module('botiquin.controllers', [])

		.controller('AsociacionController',['$scope', '$http',function ($scope, $http){
			$http.get('http://localhost:8000/asociaciones/?tecnico=2')
				.success(function (data) {
					$scope.asociaciones = data;
					$scope.asociaciones.every(function(element, index, array){
						element.tecnico = JSON.parse(element.tecnico);
						element.ubicacion = JSON.parse(element.ubicacion);
						element.map = new Image();
						element.map.src = 'http://maps.googleapis.com/maps/api/staticmap?center='
							+element.latitud+','+element.longitud+'&zoom=17&size=300x200&maptype=hybrid&'
							+'&markers=size:mid|color:blue|label:A|'+element.latitud+','+element.longitud
							+'&sensor=false';
					});
				});
		}])
		.controller('VentasController', ['$scope', '$http', function ($scope, $http) {						
			$http.get('http://localhost:8000/ventas/?tecnico=2')
				.success(function (data) {
					$scope.ventas = data;										
				});
		}])
		.controller('VentaController', ['$scope', '$http', '$routeParams', '$window', function ($scope, $http, $routeParams, $window) {
			var param = $routeParams.id;
			$scope.sessionStorage = $window.sessionStorage;

			$scope.ventaActual = {};		
			$scope.nombretest	

			param = parseInt(param);			

			if(!isNaN(param)){
				$http.get('http://localhost:8000/ventas/'+param)
				.success(function (data) {
					$scope.ventaActual = data;					
				});
			}			


			$http.get('http://localhost:8000/asociaciones/?tecnico=2')
				.success(function (data) {
					$scope.asociaciones = data;
					$scope.asociaciones.every(function(element, index, array){
						element.tecnico = JSON.parse(element.tecnico);
						element.ubicacion = JSON.parse(element.ubicacion);						
					});
				});		

			$scope.$watch("sessionStorage.getItem('cliente')", function() {
				$scope.ventaActual.cliente = JSON.parse($scope.sessionStorage.getItem('cliente'));
				var nb = $scope.ventaActual.cliente.nombre;
				var ap = $scope.ventaActual.cliente.apellido;
				$scope.ventaActual.cliente.nombreCompleto = nb + ' ' + ap;
			});		


			$scope.abrirDialog = function () {
				console.log("Enter")
			}	

		}]);
})();