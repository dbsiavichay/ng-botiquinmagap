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
		.controller('VentaController', ['$scope', '$modal', '$routeParams','ventaService', 'asociacionService', function ($scope, $modal, $routeParams, ventaService, asociacionService) {
			var idVenta = parseInt($routeParams.id);							

			//Declaracion de variables
			$scope.error = false;
			$scope.mensajeError = '';
			$scope.asociaciones = [];
			$scope.venta = {};					
			$scope.detalles = [];

			//Acciones constructoras
			if(!isNaN(idVenta)){
				ventaService.get(idVenta)
					.then(function (data) {
						$scope.venta = data;					
					});
			}

			asociacionService.getPorTecnico(2)
				.then(function (data) {
					$scope.asociaciones = data;					
				});
			
			//Funciones
			$scope.buscarCliente = function () {				
				$modal.open({					
					templateUrl: 'partials/cliente-dialog.html',
					controller: 'ClienteController',
				}).result.then(function (data) {
					$scope.venta.cliente = data;
				});				
			}

			$scope.buscarProducto = function ($index) {
				$modal.open({
					templateUrl: 'partials/producto-dialog.html',
					controller: 'ProductoController',
					size: 'lg'
				}).result.then(function (data) {
					$scope.error = false;

					for(var i in $scope.detalles){
						if($scope.detalles[i].producto.id === data.id){
							$scope.error = true;
							$scope.mensajeError = 'El producto seleccionado ya se encuentra en la lista';	
							return;
						}
					}					

					$scope.detalles[$index].producto = data;
					$scope.detalles[$index].valorUnitario = data.precio_referencial;
					$scope.calcularTotal($index);
				});
			}		

			$scope.guardarVenta = function () {
				console.log($scope.venta);
			}

			$scope.agregarDetalle = function () {
				$scope.error = false;

				var detalle = {
					cantidad: '1',
					producto: '',
					valorUnitario: '0',
					valorTotal: '',
					usos: [],
					esActual: true
				};

				if($scope.detalles.length > 0){
					var prod = $scope.detalles[0].producto;
					var valt = $scope.detalles[0].valorTotal;
					if(!prod || !valt){
						$scope.error = true;
						$scope.mensajeError = 'Debe llenar todos los campos necesarios';
						return;
					}
				}

				$scope.detalles.forEach(function (element) {
					element.esActual = false;
				});

				$scope.detalles.unshift(detalle);
			}

			$scope.editarDetalle = function ($index) {				
				$scope.error = false;

				for(var i=0; i < $scope.detalles.length; i++){
					$scope.detalles[i].esActual = false;
					if((!$scope.detalles[i].producto || !$scope.detalles[i].valorTotal) && $index != i){
						$scope.detalles.splice(i,1);
						if(i < $index) $index = $index -1;
						i = i-1;
					}
				}
							
				$scope.detalles[$index].esActual = true;
			}

			$scope.eliminarDetalle = function ($index) {	
				$scope.error = false;

				for(var i=0; i < $scope.detalles.length; i++){
					$scope.detalles[i].esActual = false;
					if(!$scope.detalles[i].producto || !$scope.detalles[i].valorTotal){
						$scope.detalles.splice(i,1);
						if(i < $index) $index = $index -1;
						i = i-1;
					}
				}				
				$scope.detalles.splice($index, 1);
			}		

			$scope.calcularTotal = function ($index) {											
				var p = $scope.detalles[$index].valorUnitario;
				var c = $scope.detalles[$index].cantidad;
				$scope.detalles[$index].valorTotal = p * c;
				if(isNaN($scope.detalles[$index].valorTotal)){
					$scope.detalles[$index].valorTotal = "0.00";
				}	
			}

			$scope.buscarUsos = function ($index) {
				$modal.open({
					templateUrl: 'partials/uso-dialog.html',
					controller: 'UsoController',
					resolve: {
						data: function () {
							return $scope.detalles[$index];
						}
					}					
				}).result.then(function (data) {
					$scope.detalles[$index].usos = data;
				});
			}					
		}])
		.controller('ClienteController', ['$scope', '$modalInstance', 'clienteService', function ($scope, $modalInstance, clienteService) {
			var dataList = {};
			$scope.error = false;
			$scope.mensajeError = '';
			$scope.empty = true;	

			clienteService.getTodos()
				.then(function (data) {
					dataList = data;
					$scope.clientes = data;					
					if(data.length>0){
						$scope.empty = false;
					}
				});

			var contains = function (str, searchString) {
				return str.toLowerCase().indexOf(searchString.toLowerCase()) > -1;
			};

			var startsWith = function (str, searchString) {
				return str.toLowerCase().indexOf(searchString.toLowerCase()) === 0;
			};		

			var filter = function (){
				$scope.empty = true;				
				$scope.clientes = dataList.filter(function (obj) {
					if(startsWith(obj.cedula, $scope.keyword) || contains(obj.nombre, $scope.keyword) || contains(obj.apellido, $scope.keyword)) {
						return obj;
					}
				});

				if($scope.clientes.length > 0){
					$scope.empty = false;
				}
			}			
						
			$scope.filtrarClientes = function (event) {						
				if(!event){
					filter();							
				}else if(event.keyCode === 13){
					filter();
				}						
			};

			$scope.seleccionarCliente = function (cliente) {
				$scope.clienteSeleccionado = cliente;
			}

			$scope.ok = function () {
				if(!$scope.clienteSeleccionado){
					$scope.error = true;
					$scope.mensajeError = 'No ha seleccionado ningun item.';
					return;
				}
				$modalInstance.close($scope.clienteSeleccionado);
			}	

			$scope.cancelar = function () {			
				$modalInstance.dismiss('cancel');
			}		
		}])
		.controller('ProductoController', ['$scope', '$modalInstance', 'productoService', function ($scope, $modalInstance, productoService) {
			var dataList = {};
			$scope.productos = [];					
			$scope.error = false;
			$scope.mensajeError = '';
			$scope.empty = true;

			var contains = function (str, searchString) {
				return str.toLowerCase().indexOf(searchString.toLowerCase()) > -1;
			};

			var startsWith = function (str, searchString) {
				return str.toLowerCase().indexOf(searchString.toLowerCase()) === 0;
			};		

			var filter = function (){
				$scope.empty = true;
				$scope.productos = dataList.filter(function (obj) {
					if(contains(obj.nombre, $scope.keyword) || contains(obj.compuesto, $scope.keyword) 
						|| contains(obj.presentacion, $scope.keyword) || contains(obj.registro_sanitario, $scope.keyword)) {
						return obj;
					}
				});

				if($scope.productos.length > 0){
					$scope.empty = false;
				}
			}			
						

			productoService.getTodos()
				.then(function (data) {
					dataList = data;
					$scope.productos = data;
					if(data.length>0){
						$scope.empty = false;
					}
				});					


			$scope.filtrarProductos = function (event) {						
				if(!event){
					filter();							
				}else if(event.keyCode === 13){
					filter();
				}						
			};

			$scope.seleccionarProducto = function (producto) {
				$scope.productoSeleccionado = producto;
			}

			$scope.ok = function () {				
				if(!$scope.productoSeleccionado){
					$scope.error = true;
					$scope.mensajeError = 'No ha seleccionado ningun item.';
					return;
				}
				$modalInstance.close($scope.productoSeleccionado);
			}

			$scope.cancelar = function () {			
				$modalInstance.dismiss('cancel');
			}	
		}])
		.controller('UsoController', ['$scope', '$modalInstance', 'enfermedadService', 'especieService', 'data', function ($scope, $modalInstance, enfermedadService, especieService, data) {
			$scope.detalle = data;
			$scope.uso = {
				cantidad: $scope.detalle.cantidad,
				enfermedad: '',
				especie: ''
			};
			$scope.usos = [];
			$scope.enfermedades = [];
			$scope.especies = [];	
			$scope.error = false;
			$scope.mensajeError = '';

			enfermedadService.getTodos()
				.then(function (data) {
					$scope.enfermedades = data;
				});

			especieService.getTodos()
				.then(function (data) {
					$scope.especies = data;
				});

			$scope.agregarUso = function () {				
				$scope.error = false;	

				$scope.usos.forEach(function (uso) {
					uso.esActual = false;					
				});				

				for(propiedad in $scope.uso){						
					if($scope.uso[propiedad]){
						$('#'+ propiedad +'Usos').removeClass('has-error');						
					}else{
						$('#'+ propiedad +'Usos').addClass('has-error');	
						$scope.error = true;										
					}
				}					
				
				if($scope.error){
					$scope.mensajeError = 'Todos lo campos son necesarios.';
					return;
				} 				

				for (var i in $scope.usos) {
					var uso = $scope.usos[i];						
					if(uso.enfermedad.nombre===$scope.uso.enfermedad.nombre
						&& uso.especie.nombre===$scope.uso.especie.nombre){
						$scope.error = true;
						$scope.mensajeError = 'Los datos seleccionados ya se encuentran en la lista.';
						return;
					}
				}

				
				$scope.usos.push($scope.uso);				
				$scope.uso = {
					cantidad: '',
					enfermedad: '',
					especie: ''
				};
			}

			$scope.editarUso = function ($index) {
				$scope.usos.forEach(function (uso) {
					uso.esActual = false;
				});

				$scope.usos[$index].esActual = true;
			}

			$scope.eliminarUso = function ($index) {
				$scope.usos.forEach(function (uso) {
					uso.esActual = false;					
				});	
				$scope.usos.splice($index, 1);
			}

			$scope.ok = function () {				
				if($scope.usos.length <= 0){
					$scope.error = true;
					$scope.mensajeError = 'No ha ingresado items.';
					return;
				}
				$modalInstance.close($scope.usos);
			}

			$scope.cancelar = function () {			
				$modalInstance.dismiss('cancel');
			}
		}]);
})();