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

			$scope.venta = {};
			$scope.detalles = [];
			$scope.detalleActual = {};
			$scope.usoActual = {
				cantidad: '',
				enfermedad: '',
				especie: ''							
			};					
			$scope.productos;
			$scope.enfermedades;
			$scope.especies;

			param = parseInt(param);			

			if(!isNaN(param)){
				$http.get('http://localhost:8000/ventas/'+param)
				.success(function (data) {
					$scope.venta = data;					
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
				$scope.venta.cliente = JSON.parse($scope.sessionStorage.getItem('cliente'));
				var nb = $scope.venta.cliente.nombre;
				var ap = $scope.venta.cliente.apellido;
				$scope.venta.cliente.nombreCompleto = nb + ' ' + ap;
			});		

			$scope.$watch("sessionStorage.getItem('producto')", function() {
				var p = JSON.parse($scope.sessionStorage.getItem('producto'));
				$scope.mensaje = '';
				$scope.detalles.some(function (element, indice, array) {					
					if(element.producto.nombre ===  p.nombre){						
						$scope.mensaje = 'El producto seleccionado ya se encuentra en la lista';						
					}
				});
				if(!$scope.mensaje){
					var i = $scope.detalles.indexOf($scope.detalleActual);
					$scope.detalles[i].producto = p;
					$scope.detalles[i].valorUnitario = p.precio_referencial;
					$scope.calcularTotal(i);
				}				
			});	

			$scope.guardarVenta = function () {
				console.log($scope.venta);
			}

			$scope.agregarDetalle = function () {
				var detalle = {
					cantidad: '1',
					producto: '',
					valorUnitario: '0',
					valorTotal: '',
					usos: [],
					esActual: true
				};

				if($scope.detalles.length>0){
					$scope.mensaje = '';					
					var prod = $scope.detalles[0].producto;
					var valt = $scope.detalles[0].valorTotal;
					if(!prod || !valt){
						$scope.mensaje = 'Debe llenar todos los campos necesarios';
						return;
					}
				}				

				$scope.detalles.forEach(function (element, index, array) {
					element.esActual = false;
				});

				$scope.detalles.unshift(detalle);
			}

			$scope.editarDetalle = function (indice) {
				var i = -1;
				$scope.mensaje = '';
				$scope.detalles.forEach(function (element, index, array) {
					element.esActual = false;
					if(!element.producto || !element.valorTotal){
						i = index;
					}
				});				

				$scope.detalles[indice].esActual = true;

				if(i>=0){
					$scope.detalles.splice(i,1);
				}
			}

			$scope.eliminarDetalle = function (indice) {				
				$scope.detalles.forEach(function (element, index, array) {
					element.esActual = false;					
				});	
				$scope.detalles.splice(indice, 1);
			}

			$scope.setDetalleActual = function (detalle) {
				$scope.detalleActual = detalle;
				$scope.usoActual.cantidad = detalle.cantidad;			
			}			

			$scope.calcularTotal = function (i) {				
				var p = $scope.detalles[i].valorUnitario;
				var c = $scope.detalles[i].cantidad;
				$scope.detalles[i].valorTotal = p * c;
				if(isNaN($scope.detalles[i].valorTotal)){
					$scope.detalles[i].valorTotal = "0.00";
				}	
			}


			$scope.agregarUso = function () {				
				var error = false;	

				$scope.detalleActual.usos.forEach(function (uso) {
					uso.esActual = false;					
				});				

				for(propiedad in $scope.usoActual){						
					if($scope.usoActual[propiedad]){
						$('#'+ propiedad +'Usos').removeClass('has-error');						
					}else{
						$('#'+ propiedad +'Usos').addClass('has-error');	
						error = true;				
					}
				}	

				$scope.usoActual.error = error;
				
				if(error){
					$scope.usoActual.mensajeError = 'Todos lo campos son necesarios.';
					return;
				} 				

				for (var i in $scope.detalleActual.usos) {
					var uso = $scope.detalleActual.usos[i];						
					if(uso.enfermedad.nombre===$scope.usoActual.enfermedad.nombre
						&& uso.especie.nombre===$scope.usoActual.especie.nombre){
						$scope.usoActual.error = true;
						$scope.usoActual.mensajeError = 'Los datos seleccionados ya se encuentran en la lista.';
						return;
					}
				}

				
				$scope.detalleActual.usos.push($scope.usoActual);				
				$scope.usoActual = {
					cantidad: '',
					enfermedad: '',
					especie: ''
				};
			}

			$scope.editarUso = function (indice) {
				$scope.detalleActual.usos.forEach(function (uso) {
					uso.esActual = false;
				});

				$scope.detalleActual.usos[indice].esActual = true;
			}

			$scope.eliminarUso = function (indice) {
				$scope.detalleActual.usos.forEach(function (uso) {
					uso.esActual = false;					
				});	
				$scope.detalleActual.usos.splice(indice, 1);
			}		
		}]);
})();