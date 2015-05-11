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
				$scope.mensaje = '';
				$scope.detallesVenta.some(function (element, indice, array) {					
					if(element.producto.nombre ===  p.nombre){						
						$scope.mensaje = 'El producto seleccionado ya se encuentra en la lista';						
					}
				});
				if(!$scope.mensaje){
					$scope.detallesVenta[index].producto = p;
					$scope.detallesVenta[index].valorUnitario = p.precio_referencial;
					$scope.calcularTotal(index);
				}				
			});	

			$scope.agregarDetalle = function () {
				var detalle = {
					cantidad: '1.0',
					producto: '',
					valorUnitario: '0.0',
					valorTotal: '',
					actual: true
				};

				if($scope.detallesVenta.length>0){
					$scope.mensaje = '';					
					var prod = $scope.detallesVenta[0].producto;
					var valt = $scope.detallesVenta[0].valorTotal;
					if(!prod || !valt){
						$scope.mensaje = 'Debe llenar todos los campos necesarios';
						return;
					}
				}				

				$scope.detallesVenta.forEach(function (element, index, array) {
					element.actual = false;
				});

				$scope.detallesVenta.unshift(detalle);
			}

			$scope.editarDetalle = function (indice) {
				var i = -1;
				$scope.mensaje = '';
				$scope.detallesVenta.forEach(function (element, index, array) {
					element.actual = false;
					if(!element.producto || !element.valorTotal){
						i = index;
					}
				});				

				$scope.detallesVenta[indice].actual = true;

				if(i>=0){
					$scope.detallesVenta.splice(i,1);
				}
			}

			$scope.eliminarDetalle = function (indice) {				
				$scope.detallesVenta.forEach(function (element, index, array) {
					element.actual = false;					
				});	
				$scope.detallesVenta.splice(indice, 1);
			}

			$scope.setIndex = function (indice) {
				index = indice;
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