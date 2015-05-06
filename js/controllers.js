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
			$scope.detallesVenta = [];
			$scope.detalleVentaActual = {};
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

			$scope.agregarDetalle = function () {
				var detalle = {
					cantidad: '1.0',
					producto: '',
					valorUnitario: '0.0',
					valorTotal: '0.0'
				};
				$scope.detallesVenta.unshift(detalle);
			}

			$scope.buscarProductos = function (producto) {
				if(!producto){
					$scope.productos = {};
					return;
				}

				$http.get('http://localhost:8000/productos/?nombre='+producto)
					.success(function (data) {
						$scope.productos = data;						
					});
			}

			$scope.seleccionarProducto = function (producto) {
				if(producto){
					$scope.detalleVentaActual.nombreProducto = producto.nombre;
					$scope.detalleVentaActual.valorUnitario = producto.precio_referencial;					
					var p = $scope.detalleVentaActual.valorUnitario;
					var c = $scope.detalleVentaActual.cantidad;
					$scope.detalleVentaActual.valorTotal = p * c;
					if(isNaN($scope.detalleVentaActual.valorTotal)){
						$scope.detalleVentaActual.valorTotal = "0.00";
					}									
					$scope.productos = {};
				}
			}	


			$scope.calcularTotal = function () {				
				var p = $scope.detalleVentaActual.valorUnitario;
				var c = $scope.detalleVentaActual.cantidad;
				$scope.detalleVentaActual.valorTotal = p * c;
				if(isNaN($scope.detalleVentaActual.valorTotal)){
					$scope.detalleVentaActual.valorTotal = "0.00";
				}	
			}
		}]);
})();