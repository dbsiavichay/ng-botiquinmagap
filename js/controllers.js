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
			var index;
			$scope.sessionStorage = $window.sessionStorage;

			$scope.ventaActual = {};
			$scope.detallesVenta = [];			
			$scope.productos;
			$scope.enfermedades;
			$scope.especies;

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

			$http.get('http://localhost:8000/enfermedades/')
				.success(function (data) {
					$scope.enfermedades = data;
				});

			$http.get('http://localhost:8000/especies/')
				.success(function (data) {
					$scope.especies = data;
				});
			

			$scope.$watch("sessionStorage.getItem('cliente')", function() {
				$scope.ventaActual.cliente = JSON.parse($scope.sessionStorage.getItem('cliente'));
				var nb = $scope.ventaActual.cliente.nombre;
				var ap = $scope.ventaActual.cliente.apellido;
				$scope.ventaActual.cliente.nombreCompleto = nb + ' ' + ap;
			});		

			$scope.$watch("sessionStorage.getItem('producto')", function() {
				var p = JSON.parse($scope.sessionStorage.getItem('producto'));
				$scope.detallesVenta[index].producto = p;
				$scope.detallesVenta[index].valorUnitario = p.precio_referencial;
				$scope.calcularTotal(index);
			});	

			$scope.agregarDetalle = function () {
				var detalle = {
					cantidad: '1.0',
					producto: '',
					valorUnitario: '0.0',
					valorTotal: '0.0'
				};
				$scope.detallesVenta.unshift(detalle);
			}


			$scope.setIndex = function (i) {
				index = i;
			}			

			$scope.calcularTotal = function (i) {				
				var p = $scope.detallesVenta[i].valorUnitario;
				var c = $scope.detallesVenta[i].cantidad;
				$scope.detallesVenta[i].valorTotal = p * c;
				if(isNaN($scope.detallesVenta[i].valorTotal)){
					$scope.detallesVenta[i].valorTotal = "0.00";
				}	
			}
		}]);
})();